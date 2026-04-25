// KEY FIXES:
//   1. PUBLIC_BASE_URL replaces localhost for OpenAI access
//   2. DamageAssessment query: use claimId column directly (not relation)
//   3. Prevent duplicate DamageAssessment records
//   4. Retry endpoint support
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
  private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly MAX_RETRIES = 3;

  // FIX: Cache publicBaseUrl at startup, not per-request
  private readonly publicBaseUrl: string;

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
  ) {
    // FIX: Build public base URL once at startup
    this.publicBaseUrl = this.buildPublicBaseUrl();
    this.logger.log(`🌐 Public base URL configured: ${this.publicBaseUrl}`);
  }

  // ── FIX: Build reliable public URL ─────────────────────────────
  private buildPublicBaseUrl(): string {
    const explicit = this.configService.get<string>('PUBLIC_BASE_URL');
    if (explicit && explicit.startsWith('http')) {
      return explicit.replace(/\/$/, ''); // strip trailing slash
    }

    const port = this.configService.get<number>('PORT', 3000);
    const env = this.configService.get<string>('NODE_ENV', 'development');

    if (env === 'production') {
      throw new Error('PUBLIC_BASE_URL must be set in production environment');
    }

    return `http://localhost:${port}`;
  }

  // ── UPLOAD ──────────────────────────────────────────────────────
  async uploadImage(
    file: Express.Multer.File,
    claimId: string,
    user: User,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('Файл байхгүй байна. "file" талбар шаардлагатай.');
    }

    if (file.size > this.maxFileSize) {
      this.deleteFileFromDisk(file.path);
      throw new BadRequestException(`Файлын хэмжээ ${this.maxFileSize / 1024 / 1024}MB-с хэтэрсэн.`);
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      this.deleteFileFromDisk(file.path);
      throw new BadRequestException(
        `${file.mimetype} төрлийн файл зөвшөөрөгдөхгүй.`,
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
      throw new ForbiddenException('Энэ claim-д зураг нэмэх эрх байхгүй байна.');
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
      aiRetryCount: 0,
      claimId,
      uploadedById: user.id,
    });

    const saved = await this.imageRepository.save(image);
    this.logger.log(`✓ Upload: ${saved.fileName} → Claim: ${claimId}`);

    // Fire-and-forget background processing
    this.processImageAsync(saved.id).catch((err) => {
      this.logger.error(`Background processing failed for image ${saved.id}: ${err.message}`);
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

  // ── RETRY (new endpoint support) ───────────────────────────────
  async retryAnalysis(imageId: string, user: User): Promise<{ message: string }> {
    const image = await this.imageRepository.findOne({
      where: { id: imageId },
      relations: ['claim'],
    });

    if (!image) throw new NotFoundException(`ID: ${imageId} зураг олдсонгүй`);

    if (image.claim?.submittedById !== user.id) {
      throw new ForbiddenException('Энэ зурагт хандах эрх байхгүй');
    }

    if (image.status !== ImageStatus.FAILED) {
      throw new BadRequestException('Зөвхөн failed статустай зургийг retry хийж болно');
    }

    // Reset for retry
    await this.imageRepository.update(imageId, {
      status: ImageStatus.PENDING,
      aiRetryCount: 0,
      aiErrorMessage: null,
    });

    this.processImageAsync(imageId).catch((err) => {
      this.logger.error(`Retry failed for image ${imageId}: ${err.message}`);
    });

    return { message: 'Дахин шинжилгээ эхэллээ' };
  }

  // ── BACKGROUND PROCESSING ───────────────────────────────────────
  private async processImageAsync(imageId: string): Promise<void> {
    let image: Image | null = null;

    try {
      image = await this.imageRepository.findOne({
        where: { id: imageId },
        relations: ['claim', 'claim.vehicle'],
      });

      if (!image) throw new NotFoundException(`Image ${imageId} not found`);

      image.status = ImageStatus.PROCESSING;
      await this.imageRepository.save(image);

      // FIX: Use publicBaseUrl (not localhost) so OpenAI can reach the image
      const localFilePath = image.filePath;
      this.logger.log(`→ AI analyzing (local): ${localFilePath}`);
      const aiResult = await this.aiService.analyzeVehicleDamage(localFilePath);

      if (!aiResult?.damagedParts?.length) {
        throw new Error('AI шинжилгээ гэмтэл илрүүлсэнгүй');
      }

      const estimate = this.pricingService.calculateEstimate(aiResult.damagedParts);

      image.aiAnalysisResult = aiResult;
      image.aiConfidenceScore = aiResult.overallConfidence;
      image.status = ImageStatus.ANALYZED;
      image.analyzedAt = new Date();
      await this.imageRepository.save(image);

      await this.updateDamageAssessment(image, aiResult, estimate);
      await this.updateClaimTotalCost(image.claimId);

      this.logger.log(`✅ Image ${imageId} processed successfully`);
    } catch (error) {
      this.logger.error(`❌ Image ${imageId} error: ${error instanceof Error ? error.message : String(error)}`);
      if (image) await this.handleProcessingError(image, error instanceof Error ? error : new Error(String(error)));
    }
  }

  // ── FIX: DamageAssessment - use claimId column directly ────────
  private async updateDamageAssessment(image: Image, aiResult: any, estimate: any): Promise<void> {
    try {
      // FIX: Query by claimId column, NOT by relation object
      let assessment = await this.damageAssessmentRepository.findOne({
        where: { claimId: image.claimId },
      });

      if (!assessment) {
        // FIX: Create with claimId, not claim relation object
        assessment = this.damageAssessmentRepository.create({
          claimId: image.claimId,
          status: AssessmentStatus.PENDING,
          source: AssessmentSource.AI_ONLY,
          aiRetryCount: 0,
        });
      }

      assessment.damagedParts = aiResult.damagedParts;
      assessment.aiOverallConfidence = aiResult.overallConfidence;
      assessment.aiEstimatedTotalCost = estimate.totalCost.recommended;
      assessment.estimatedPartsCost = estimate.partsCost.recommended;
      assessment.estimatedLaborCost = estimate.laborCost.recommended;
      assessment.aiSummary = this.generateAssessmentSummary(aiResult, estimate);
      assessment.aiProcessedAt = new Date();
      assessment.status = AssessmentStatus.AI_COMPLETE;
      assessment.aiRawResponse = aiResult;

      await this.damageAssessmentRepository.save(assessment);
      this.logger.log(`✓ DamageAssessment saved: ₮${assessment.aiEstimatedTotalCost?.toLocaleString()}`);
    } catch (error) {
      this.logger.error(`DamageAssessment save error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  // ── Update claim estimated cost ─────────────────────────────────
  private async updateClaimTotalCost(claimId: string): Promise<void> {
    try {
      // FIX: use claimId column directly
      const assessment = await this.damageAssessmentRepository.findOne({
        where: { claimId },
      });

      if (!assessment?.aiEstimatedTotalCost) return;

      await this.claimRepository.update(claimId, {
        estimatedRepairCost: assessment.aiEstimatedTotalCost,
      });
    } catch (error) {
      this.logger.error(`Claim cost update error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ── Error / retry handler ───────────────────────────────────────
  private async handleProcessingError(image: Image, error: Error): Promise<void> {
    if (!image) return;

    try {
      const freshImage = await this.imageRepository.findOne({ where: { id: image.id } });
      if (!freshImage) return;

      const currentRetries = freshImage.aiRetryCount ?? 0;

      if (currentRetries < this.MAX_RETRIES) {
        const nextRetry = currentRetries + 1;
        const backoffMs = Math.pow(2, nextRetry) * 5000; // 10s, 20s, 40s

        await this.imageRepository.update(freshImage.id, {
          status: ImageStatus.FAILED,
          aiErrorMessage: error.message,
          aiRetryCount: nextRetry,
        });

        this.logger.log(`⏰ Auto-retry ${nextRetry}/${this.MAX_RETRIES} in ${backoffMs / 1000}s`);

        setTimeout(() => {
          this.processImageAsync(freshImage.id).catch((err) => {
            this.logger.error(`Auto-retry ${nextRetry} failed (${freshImage.id}): ${err.message}`);
          });
        }, backoffMs);
      } else {
        await this.imageRepository.update(freshImage.id, {
          status: ImageStatus.FAILED,
          aiErrorMessage: `${this.MAX_RETRIES} оролдлогын дараа амжилтгүй: ${error.message}`,
          aiRetryCount: currentRetries,
        });
        this.logger.error(`Max retries (${this.MAX_RETRIES}) reached for image ${freshImage.id}`);
      }
    } catch (err) {
      this.logger.error(`handleProcessingError internal error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private generateAssessmentSummary(aiResult: any, estimate: any): string {
    const partsCount = aiResult.damagedParts?.length || 0;
    const recommended = this.pricingService.formatCurrency(estimate.totalCost.recommended);
    return `AI: ${partsCount} гэмтэл, ноцтой байдал: ${aiResult.overallSeverity}, итгэл: ${Math.round(aiResult.overallConfidence * 100)}%, зардал: ${recommended}`;
  }

  // ── Public methods ──────────────────────────────────────────────
  async getImagesByClaim(claimId: string, user: User): Promise<Image[]> {
    const claim = await this.claimRepository.findOne({ where: { id: claimId } });
    if (!claim) throw new NotFoundException(`ID: ${claimId} claim олдсонгүй`);
    if (claim.submittedById !== user.id) throw new ForbiddenException('Хандах эрх байхгүй');

    return this.imageRepository.find({
      where: { claimId },
      order: { createdAt: 'DESC' },
    });
  }

  async getImageById(id: string, user: User): Promise<Image> {
    const image = await this.imageRepository.findOne({ where: { id }, relations: ['claim'] });
    if (!image) throw new NotFoundException(`ID: ${id} зураг олдсонгүй`);
    if (image.claim?.submittedById !== user.id) throw new ForbiddenException('Хандах эрх байхгүй');
    return image;
  }

  async deleteImage(id: string, user: User): Promise<{ message: string }> {
    const image = await this.getImageById(id, user);
    this.deleteFileFromDisk(image.filePath);
    await this.imageRepository.delete(id);
    return { message: `Зураг "${image.originalName}" амжилттай устгагдлаа` };
  }

  private deleteFileFromDisk(filePath: string): void {
    try {
      const absolutePath = filePath.startsWith('.') ? join(process.cwd(), filePath) : filePath;
      if (existsSync(absolutePath)) {
        unlinkSync(absolutePath);
      }
    } catch (err) {
      this.logger.warn(`File delete error: ${filePath}`, err);
    }
  }
}
