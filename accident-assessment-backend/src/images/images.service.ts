// src/images/images.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

// Entities
import { Image, ImageType, ImageStatus } from './entities/image.entity';
import { Claim, ClaimStatus } from '../claims/entities/claim.entity';
import { DamageAssessment, AssessmentStatus, AssessmentSource } from '../damage-assessment/entities/damage-assessment.entity';
import { User } from '../users/entities/user.entity';

// Services
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
   * PRODUCTION FLOW: Upload image and queue async analysis
   * Returns immediately without blocking API response
   */
  async uploadImage(
    file: Express.Multer.File,
    claimId: string,
    user: User,
  ): Promise<UploadResult> {
    // 1. Validate file exists
    if (!file) {
      throw new BadRequestException('Файл байхгүй байна. "file" талбар шаардлагатай.');
    }

    // 2. Validate file size and type
    if (file.size > this.maxFileSize) {
      this.deleteFileFromDisk(file.path);
      throw new BadRequestException(
        `File size exceeds ${this.maxFileSize / 1024 / 1024}MB limit.`,
      );
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      this.deleteFileFromDisk(file.path);
      throw new BadRequestException(
        `File type ${file.mimetype} not allowed. Allowed: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // 3. Validate claim exists and belongs to user
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
        'Энэ claim-д зураг нэмэх эрх байхгүй байна. Зөвхөн өөрийн claim-д зураг оруулна уу.',
      );
    }

    // 4. Create image record with PENDING status
    const fileUrl = `/uploads/${file.filename}`;
    const image = this.imageRepository.create({
      originalName: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      fileUrl: fileUrl,
      mimeType: file.mimetype,
      fileSize: file.size,
      imageType: ImageType.OTHER,
      status: ImageStatus.PENDING,
      claimId: claimId,
      uploadedById: user.id,
    });

    const saved = await this.imageRepository.save(image);
    this.logger.log(
      `✓ Image uploaded: ${saved.fileName} → Claim: ${claimId} → User: ${user.email}`,
    );

    // 5. Queue async processing (fire and forget)
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
      fileSize:     saved.fileSize,
      mimeType:     saved.mimeType,
      claimId:      saved.claimId,
      status:       saved.status,
      createdAt:    saved.createdAt,
    };
  }

  /**
   * PRODUCTION FLOW: Complete async pipeline
   * Image → AI Analysis → Pricing → DamageAssessment → Claim Update
   * Runs in background without blocking API response
   */
  private async processImageAsync(imageId: string): Promise<void> {
    let image: Image;

    try {
      // 1. Fetch image record
      image = await this.imageRepository.findOne({
        where: { id: imageId },
        relations: ['claim', 'claim.vehicle'],
      });

      if (!image) {
        throw new NotFoundException(`Image ${imageId} not found`);
      }

      // 2. Update status to PROCESSING
      image.status = ImageStatus.PROCESSING;
      await this.imageRepository.save(image);
      this.logger.log(`→ Image ${imageId} status: PROCESSING`);

      // 3. Build public URL for AI service
      const publicImageUrl = this.constructFullImageUrl(image.fileUrl);

      // 4. Call AI service for damage analysis
      this.logger.log(`→ Calling AI service for image ${imageId}`);
      const aiResult = await this.aiService.analyzeVehicleDamage(publicImageUrl);

      if (!aiResult || !aiResult.damagedParts || aiResult.damagedParts.length === 0) {
        throw new Error('AI analysis returned no damage parts');
      }

      this.logger.log(
        `✓ AI analysis complete: ${aiResult.damagedParts.length} damaged parts detected`,
      );

      // 5. Calculate pricing estimate (convert AI damaged parts to price structure)
      const estimate = this.pricingService.calculateEstimate(
        aiResult.damagedParts,
      );

      this.logger.log(
        `✓ Pricing calculated: ₮${estimate.totalCost.recommended.toLocaleString()} (confidence: ${(aiResult.overallConfidence * 100).toFixed(0)}%)`,
      );

      // 6. Update Image with analysis results
      image.aiAnalysisResult = aiResult;
      image.aiConfidenceScore = aiResult.overallConfidence;
      image.status = ImageStatus.ANALYZED;
      image.analyzedAt = new Date();
      await this.imageRepository.save(image);
      this.logger.log(`✓ Image ${imageId} saved with analysis results`);

      // 7. Create or update DamageAssessment
      await this.updateDamageAssessment(image, aiResult, estimate);

      // 8. Update Claim total repair cost
      await this.updateClaimTotalCost(image.claimId);

      this.logger.log(`✅ Complete processing pipeline SUCCESS for image ${imageId}`);
    } catch (error) {
      this.logger.error(
        `❌ Processing failed for image ${imageId}: ${error instanceof Error ? error.message : String(error)}`,
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
   * Update or create DamageAssessment from AI analysis results and pricing estimate
   */
  private async updateDamageAssessment(
    image: Image,
    aiResult: any,
    estimate: any,
  ): Promise<void> {
    try {
      // Check if assessment exists for this claim
      let assessment = await this.damageAssessmentRepository.findOne({
        where: { claim: { id: image.claimId } },
      });

      if (!assessment) {
        assessment = this.damageAssessmentRepository.create({
          claim: { id: image.claimId } as any,
          status: AssessmentStatus.PENDING,
          source: AssessmentSource.AI_ONLY,
        });
        this.logger.log(`→ Created new DamageAssessment for claim ${image.claimId}`);
      } else {
        this.logger.log(`→ Updating existing DamageAssessment for claim ${image.claimId}`);
      }

      // Update with AI results
      assessment.damagedParts = aiResult.damagedParts;
      assessment.aiOverallConfidence = aiResult.overallConfidence;
      assessment.aiEstimatedTotalCost = estimate.totalCost.recommended;
      assessment.estimatedPartsCost = estimate.partsCost.recommended;
      assessment.estimatedLaborCost = estimate.laborCost.recommended;
      assessment.aiSummary = this.generateAssessmentSummary(aiResult, estimate);

      if (!assessment.aiRetryCount) {
        assessment.aiRetryCount = 0;
      }

      assessment.aiProcessedAt = new Date();
      assessment.status = AssessmentStatus.AI_COMPLETE;

      await this.damageAssessmentRepository.save(assessment);
      this.logger.log(
        `✓ DamageAssessment saved with ${assessment.damagedParts.length} parts, cost: ₮${assessment.aiEstimatedTotalCost.toLocaleString()}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update DamageAssessment: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Calculate and update Claim total repair cost by summing all DamageAssessments
   */
  private async updateClaimTotalCost(claimId: string): Promise<void> {
    try {
      // Fetch DamageAssessment for this claim
      const assessment = await this.damageAssessmentRepository.findOne({
        where: { claim: { id: claimId } },
      });

      if (!assessment || !assessment.aiEstimatedTotalCost) {
        this.logger.warn(
          `No DamageAssessment or cost found for claim ${claimId} when updating total cost`,
        );
        return;
      }

      // Update Claim with assessment cost
      const claim = await this.claimRepository.findOne({ where: { id: claimId } });
      if (claim) {
        claim.estimatedRepairCost = assessment.aiEstimatedTotalCost;
        claim.updatedAt = new Date();
        await this.claimRepository.save(claim);
        this.logger.log(
          `✓ Claim ${claimId} total repair cost updated: ₮${assessment.aiEstimatedTotalCost.toLocaleString()}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to update claim total cost: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Handle processing errors with retry logic and status tracking
   */
  private async handleProcessingError(image: Image, error: Error): Promise<void> {
    if (!image) return;

    try {
      image.status = ImageStatus.FAILED;
      image.aiErrorMessage = error.message;

      if (!image.aiRetryCount) {
        image.aiRetryCount = 0;
      }

      const maxRetries = 3;
      if (image.aiRetryCount < maxRetries) {
        // Schedule retry after exponential backoff
        image.aiRetryCount++;
        const backoffMs = Math.pow(2, image.aiRetryCount) * 5000; // 10s, 20s, 40s
        this.logger.log(
          `⏰ Scheduling retry ${image.aiRetryCount}/${maxRetries} in ${backoffMs / 1000}s`,
        );

        await this.imageRepository.save(image);

        setTimeout(() => {
          this.processImageAsync(image.id).catch((err) => {
            this.logger.error(
              `Retry ${image.aiRetryCount} failed for image ${image.id}: ${err instanceof Error ? err.message : String(err)}`,
            );
          });
        }, backoffMs);
      } else {
        this.logger.error(
          `Max retries (${maxRetries}) exceeded for image ${image.id}. Giving up.`,
        );
        await this.imageRepository.save(image);
      }
    } catch (err) {
      this.logger.error(
        `Failed to handle processing error for image ${image?.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Generate human-readable assessment summary from AI results
   */
  private generateAssessmentSummary(aiResult: any, estimate: any): string {
    const partsCount = aiResult.damagedParts?.length || 0;
    const severity = aiResult.overallSeverity || 'unknown';
    const confidence = (aiResult.overallConfidence * 100).toFixed(0);
    const minCost = this.pricingService.formatCurrency(estimate.partsCost.min);
    const maxCost = this.pricingService.formatCurrency(estimate.partsCost.max);
    const recommended = this.pricingService.formatCurrency(estimate.totalCost.recommended);

    return `
AI Assessment Summary:
- Damaged Parts: ${partsCount}
- Overall Severity: ${severity}
- AI Confidence: ${confidence}%
- Estimated Repair Cost: ${minCost} - ${maxCost}
- Recommended Estimate: ${recommended}
- Assessment Date: ${new Date().toISOString()}

Damaged Parts:
${aiResult.damagedParts?.map((part) => `• ${part.partName} (${part.severity}): ${part.damageType}`).join('\n') || 'N/A'}
    `.trim();
  }

  /**
   * Construct full image URL for AI analysis
   */
  private constructFullImageUrl(relativePath: string): string {
    if (relativePath.startsWith('http')) {
      return relativePath; // Already absolute
    }

    const port = this.configService.get<number>('PORT', 3000);
    const env = this.configService.get<string>('NODE_ENV', 'development');

    if (env === 'production') {
      const backendUrl = this.configService.get<string>('BACKEND_URL');
      return `${backendUrl}${relativePath}`;
    }

    return `http://localhost:${port}${relativePath}`;
  }

  // ── Claim-ийн зургуудыг авах ──────────────────────────────────
  async getImagesByClaim(claimId: string, user: User): Promise<Image[]> {
    // Claim ownership шалгах
    const claim = await this.claimRepository.findOne({
      where: { id: claimId },
    });

    if (!claim) {
      throw new NotFoundException(`ID: ${claimId} claim олдсонгүй`);
    }

    if (claim.submittedById !== user.id) {
      throw new ForbiddenException('Энэ claim-д хандах эрх байхгүй байна');
    }

    return this.imageRepository.find({
      where: { claimId },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Нэг зургийг авах ─────────────────────────────────────────
  async getImageById(id: string, user: User): Promise<Image> {
    const image = await this.imageRepository.findOne({
      where: { id },
      relations: ['claim'],
    });

    if (!image) {
      throw new NotFoundException(`ID: ${id} зураг олдсонгүй`);
    }

    // Claim ownership шалгах
    if (image.claim?.submittedById !== user.id) {
      throw new ForbiddenException('Энэ зурагт хандах эрх байхгүй байна');
    }

    return image;
  }

  // ── Зураг устгах ─────────────────────────────────────────────
  async deleteImage(id: string, user: User): Promise<{ message: string }> {
    const image = await this.getImageById(id, user);

    // Disk дээрх файл устгах
    this.deleteFileFromDisk(image.filePath);

    // Database-с устгах
    await this.imageRepository.delete(id);

    this.logger.log(`Image deleted: ${image.fileName}`);

    return { message: `Зураг "${image.originalName}" амжилттай устгагдлаа` };
  }

  // ── Private helpers ───────────────────────────────────────────
  private deleteFileFromDisk(filePath: string): void {
    try {
      const absolutePath = filePath.startsWith('.')
        ? join(process.cwd(), filePath)
        : filePath;

      if (existsSync(absolutePath)) {
        unlinkSync(absolutePath);
        this.logger.debug(`Deleted file from disk: ${absolutePath}`);
      }
    } catch (err) {
      // File устгахад алдаа гарсан ч log-д бичиж үргэлжлүүлнэ
      this.logger.warn(`Failed to delete file: ${filePath}`, err);
    }
  }

  private getBaseUrl(): string {
    const port = this.configService.get<number>('PORT', 3000);
    const env  = this.configService.get<string>('NODE_ENV', 'development');

    if (env === 'production') {
      // Production-д BACKEND_URL env variable ашиглана
      return this.configService.get<string>('BACKEND_URL', `http://localhost:${port}`);
    }

    return `http://localhost:${port}`;
  }
}