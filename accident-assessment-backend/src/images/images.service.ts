// src/images/images.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

import { Image, ImageType, ImageStatus } from './entities/image.entity';
import { Claim } from '../claims/entities/claim.entity';
import {
  DamageAssessment,
  AssessmentStatus,
  AssessmentSource,
} from '../damage-assessment/entities/damage-assessment.entity';
import { User } from '../users/entities/user.entity';

import { AIService } from '../ai/ai.service';
import { PricingService } from '../pricing/pricing.service';

export interface UploadResult {
  id: string;
  fileUrl: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  claimId: string;
  status: string;
  createdAt: Date;
}

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];
  // ✅ Retry-г const болгон нэг газарт тодорхойлно
  private readonly MAX_RETRIES = 3;

  constructor(
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,

    @InjectRepository(Claim)
    private readonly claimRepository: Repository<Claim>,

    @InjectRepository(DamageAssessment)
    private readonly damageAssessmentRepository: Repository<DamageAssessment>,

    private readonly configService: ConfigService,
    private readonly aiService: AIService,
    private readonly pricingService: PricingService,
  ) {}

  /**
   * Upload image — шууд хариулна, background-д AI ажиллуулна
   */
  async uploadImage(
    file: Express.Multer.File,
    claimId: string,
    user: User,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException(
        'Файл байхгүй байна. "file" талбар шаардлагатай.',
      );
    }

    if (file.size > this.maxFileSize) {
      this.deleteFileFromDisk(file.path);
      throw new BadRequestException(
        `Файлын хэмжээ ${this.maxFileSize / 1024 / 1024}MB-с хэтэрсэн.`,
      );
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      this.deleteFileFromDisk(file.path);
      throw new BadRequestException(
        `${file.mimetype} төрлийн файл зөвшөөрөгдөхгүй. Зөвшөөрөгдсөн: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    const claim = await this.claimRepository.findOne({
      where: { id: claimId },
      relations: ['vehicle'],
    });

    if (!claim) {
      this.deleteFileFromDisk(file.path);
      throw new NotFoundException(`ID: ${claimId} claim олдсонгүй`);
    }

    if (claim.submittedById !== user.id) {
      this.deleteFileFromDisk(file.path);
      throw new ForbiddenException(
        'Энэ claim-д зураг нэмэх эрх байхгүй байна.',
      );
    }

    const fileUrl = `/uploads/${file.filename}`;
    const image = this.imageRepository.create({
      originalName: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      fileUrl,
      mimeType: file.mimetype,
      fileSize: file.size,
      imageType: ImageType.OTHER,
      status: ImageStatus.PENDING,
      // ✅ aiRetryCount-г тодорхой 0-ээс эхлүүлнэ
      aiRetryCount: 0,
      claimId,
      uploadedById: user.id,
    });

    const saved = await this.imageRepository.save(image);
    this.logger.log(
      `✓ Upload: ${saved.fileName} → Claim: ${claimId} → User: ${user.email}`,
    );

    // Fire and forget
    this.processImageAsync(saved.id).catch((err) => {
      this.logger.error(
        `Background processing failed for image ${saved.id}: ${err.message}`,
      );
    });

    return {
      id: saved.id,
      fileUrl: saved.fileUrl,
      fileName: saved.fileName,
      originalName: saved.originalName,
      fileSize: saved.fileSize,
      mimeType: saved.mimeType,
      claimId: saved.claimId,
      status: saved.status,
      createdAt: saved.createdAt,
    };
  }

  /**
   * Background processing pipeline
   */
  private async processImageAsync(imageId: string): Promise<void> {
    let image: Image | null = null;

    try {
      image = await this.imageRepository.findOne({
        where: { id: imageId },
        relations: ['claim', 'claim.vehicle'],
      });

      if (!image) {
        throw new NotFoundException(`Image ${imageId} not found`);
      }

      image.status = ImageStatus.PROCESSING;
      await this.imageRepository.save(image);
      this.logger.log(`→ Image ${imageId}: PROCESSING`);

      const publicImageUrl = this.constructFullImageUrl(image.fileUrl);

      this.logger.log(`→ AI шинжилгээ эхэлж байна: ${imageId}`);
      const aiResult = await this.aiService.analyzeVehicleDamage(
        publicImageUrl,
      );

      if (
        !aiResult ||
        !aiResult.damagedParts ||
        aiResult.damagedParts.length === 0
      ) {
        throw new Error('AI шинжилгээ гэмтэл илрүүлсэнгүй');
      }

      this.logger.log(
        `✓ AI дууслаа: ${aiResult.damagedParts.length} гэмтэл илэрлээ`,
      );

      const estimate = this.pricingService.calculateEstimate(
        aiResult.damagedParts,
      );

      // ✅ Бүх өөрчлөлтийг нэг save-д хийнэ
      image.aiAnalysisResult = aiResult;
      image.aiConfidenceScore = aiResult.overallConfidence;
      image.status = ImageStatus.ANALYZED;
      image.analyzedAt = new Date();
      await this.imageRepository.save(image);
      this.logger.log(`✓ Image ${imageId} хадгалагдлаа`);

      await this.updateDamageAssessment(image, aiResult, estimate);
      await this.updateClaimTotalCost(image.claimId);

      this.logger.log(`✅ Image ${imageId} бүрэн боловсруулагдлаа`);
    } catch (error) {
      this.logger.error(
        `❌ Image ${imageId} алдаа: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (image) {
        await this.handleProcessingError(
          image,
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }
  }

  /**
   * DamageAssessment үүсгэх / шинэчлэх
   */
  private async updateDamageAssessment(
    image: Image,
    aiResult: any,
    estimate: any,
  ): Promise<void> {
    try {
      let assessment = await this.damageAssessmentRepository.findOne({
        where: { claim: { id: image.claimId } },
      });

      if (!assessment) {
        assessment = this.damageAssessmentRepository.create({
          claim: { id: image.claimId } as any,
          status: AssessmentStatus.PENDING,
          source: AssessmentSource.AI_ONLY,
          aiRetryCount: 0,
        });
        this.logger.log(
          `→ Шинэ DamageAssessment үүслээ: claim ${image.claimId}`,
        );
      }

      assessment.damagedParts = aiResult.damagedParts;
      assessment.aiOverallConfidence = aiResult.overallConfidence;
      assessment.aiEstimatedTotalCost = estimate.totalCost.recommended;
      assessment.estimatedPartsCost = estimate.partsCost.recommended;
      assessment.estimatedLaborCost = estimate.laborCost.recommended;
      assessment.aiSummary = this.generateAssessmentSummary(
        aiResult,
        estimate,
      );
      assessment.aiProcessedAt = new Date();
      assessment.status = AssessmentStatus.AI_COMPLETE;

      await this.damageAssessmentRepository.save(assessment);
      this.logger.log(
        `✓ DamageAssessment хадгалагдлаа: ₮${assessment.aiEstimatedTotalCost?.toLocaleString()}`,
      );
    } catch (error) {
      this.logger.error(
        `DamageAssessment хадгалахад алдаа: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Claim-ийн нийт засварын зардал шинэчлэх
   */
  private async updateClaimTotalCost(claimId: string): Promise<void> {
    try {
      const assessment = await this.damageAssessmentRepository.findOne({
        where: { claim: { id: claimId } },
      });

      if (!assessment?.aiEstimatedTotalCost) {
        this.logger.warn(
          `Claim ${claimId}-д DamageAssessment зардал олдсонгүй`,
        );
        return;
      }

      const claim = await this.claimRepository.findOne({
        where: { id: claimId },
      });

      if (claim) {
        claim.estimatedRepairCost = assessment.aiEstimatedTotalCost;
        await this.claimRepository.save(claim);
        this.logger.log(
          `✓ Claim ${claimId} зардал: ₮${assessment.aiEstimatedTotalCost.toLocaleString()}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Claim зардал шинэчлэхэд алдаа: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Алдаа гарсан үед retry логик
   * ✅ aiRetryCount-г зөв хадгална
   */
  private async handleProcessingError(
    image: Image,
    error: Error,
  ): Promise<void> {
    if (!image) return;

    try {
      // ✅ DB-с шинэчилсэн утгыг уншина — stalе data-аас зайлсхийнэ
      const freshImage = await this.imageRepository.findOne({
        where: { id: image.id },
      });

      if (!freshImage) return;

      const currentRetries = freshImage.aiRetryCount ?? 0;

      if (currentRetries < this.MAX_RETRIES) {
        // ✅ Нэмэгдсэн retry тоог болон статусыг хамт хадгална
        const nextRetry = currentRetries + 1;
        const backoffMs = Math.pow(2, nextRetry) * 5000; // 10s, 20s, 40s

        await this.imageRepository.update(freshImage.id, {
          status: ImageStatus.FAILED,
          aiErrorMessage: error.message,
          aiRetryCount: nextRetry,
        });

        this.logger.log(
          `⏰ Retry ${nextRetry}/${this.MAX_RETRIES} — ${backoffMs / 1000}с-д дахин оролдоно`,
        );

        setTimeout(() => {
          this.processImageAsync(freshImage.id).catch((err) => {
            this.logger.error(
              `Retry ${nextRetry} алдаа (${freshImage.id}): ${err instanceof Error ? err.message : String(err)}`,
            );
          });
        }, backoffMs);
      } else {
        // Max retry хүрсэн — бүрмөсөн FAILED болгоно
        await this.imageRepository.update(freshImage.id, {
          status: ImageStatus.FAILED,
          aiErrorMessage: `${this.MAX_RETRIES} оролдлогын дараа амжилтгүй: ${error.message}`,
          aiRetryCount: currentRetries,
        });

        this.logger.error(
          `Max retry (${this.MAX_RETRIES}) хүрсэн — image ${freshImage.id} FAILED`,
        );
      }
    } catch (err) {
      this.logger.error(
        `handleProcessingError дотор алдаа (${image?.id}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * AI үнэлгээний хураангуй текст үүсгэх
   */
  private generateAssessmentSummary(aiResult: any, estimate: any): string {
    const partsCount = aiResult.damagedParts?.length || 0;
    const severity = aiResult.overallSeverity || 'unknown';
    const confidence = (aiResult.overallConfidence * 100).toFixed(0);
    const recommended = this.pricingService.formatCurrency(
      estimate.totalCost.recommended,
    );

    return `
AI Assessment:
- Гэмтсэн хэсэг: ${partsCount}
- Ноцтой байдал: ${severity}
- AI итгэл: ${confidence}%
- Санал болгосон зардал: ${recommended}
- Огноо: ${new Date().toISOString()}

Гэмтсэн хэсгүүд:
${
  aiResult.damagedParts
    ?.map(
      (part: any) =>
        `• ${part.partName} (${part.severity}): ${part.damageType}`,
    )
    .join('\n') || 'N/A'
}
    `.trim();
  }

  /**
   * Зургийн нийтийн URL үүсгэх
   */
  private constructFullImageUrl(relativePath: string): string {
    if (relativePath.startsWith('http')) {
      return relativePath;
    }

    const port = this.configService.get<number>('PORT', 3000);
    const env = this.configService.get<string>('NODE_ENV', 'development');

    if (env === 'production') {
      const backendUrl = this.configService.get<string>('BACKEND_URL', '');
      return `${backendUrl}${relativePath}`;
    }

    return `http://localhost:${port}${relativePath}`;
  }

  // ── Public methods ─────────────────────────────────────────

  async getImagesByClaim(claimId: string, user: User): Promise<Image[]> {
    const claim = await this.claimRepository.findOne({
      where: { id: claimId },
    });

    if (!claim) {
      throw new NotFoundException(`ID: ${claimId} claim олдсонгүй`);
    }

    if (claim.submittedById !== user.id) {
      throw new ForbiddenException('Энэ claim-д хандах эрх байхгүй');
    }

    return this.imageRepository.find({
      where: { claimId },
      order: { createdAt: 'DESC' },
    });
  }

  async getImageById(id: string, user: User): Promise<Image> {
    const image = await this.imageRepository.findOne({
      where: { id },
      relations: ['claim'],
    });

    if (!image) {
      throw new NotFoundException(`ID: ${id} зураг олдсонгүй`);
    }

    if (image.claim?.submittedById !== user.id) {
      throw new ForbiddenException('Энэ зурагт хандах эрх байхгүй');
    }

    return image;
  }

  async deleteImage(
    id: string,
    user: User,
  ): Promise<{ message: string }> {
    const image = await this.getImageById(id, user);

    this.deleteFileFromDisk(image.filePath);
    await this.imageRepository.delete(id);

    this.logger.log(`Зураг устгагдлаа: ${image.fileName}`);

    return { message: `Зураг "${image.originalName}" амжилттай устгагдлаа` };
  }

  private deleteFileFromDisk(filePath: string): void {
    try {
      const absolutePath = filePath.startsWith('.')
        ? join(process.cwd(), filePath)
        : filePath;

      if (existsSync(absolutePath)) {
        unlinkSync(absolutePath);
        this.logger.debug(`Файл устгагдлаа: ${absolutePath}`);
      }
    } catch (err) {
      this.logger.warn(`Файл устгахад алдаа: ${filePath}`, err);
    }
  }
}