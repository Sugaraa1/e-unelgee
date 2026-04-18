// src/ai/image-analysis-queue.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Image, ImageStatus } from '../images/entities/image.entity';
import { AIService } from './ai.service';

interface AnalysisTask {
  imageId: string;
  fileUrl: string;
  retries: number;
  maxRetries: number;
}

@Injectable()
export class ImageAnalysisQueueService {
  private readonly logger = new Logger(ImageAnalysisQueueService.name);
  private queue: AnalysisTask[] = [];
  private processing = false;
  private publicBaseUrl: string;

  constructor(
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
    private readonly aiService: AIService,
    private readonly configService: ConfigService,
  ) {
    // 🌐 ngrok эсвэл production URL авах
    // Development: https://abc123.ngrok.io (ngrok-оос авах)
    // Production: https://api.example.com
    this.publicBaseUrl =
      this.configService.get<string>('PUBLIC_BASE_URL') ||
      this.configService.get<string>('BACKEND_BASE_URL') ||
      'http://localhost:3000';

    this.logger.log(`🌐 Public Base URL: ${this.publicBaseUrl}`);
    this.startQueueProcessor();
  }

  /**
   * Add image to analysis queue
   */
  async enqueueImageAnalysis(imageId: string, fileUrl: string): Promise<void> {
    this.queue.push({
      imageId,
      fileUrl,
      retries: 0,
      maxRetries: 3,
    });

    this.logger.log(
      `📝 Image ${imageId} added to queue. Queue size: ${this.queue.length}`,
    );
  }

  /**
   * Process queue in background
   */
  private startQueueProcessor(): void {
    setInterval(async () => {
      if (this.queue.length === 0 || this.processing) {
        return;
      }

      this.processing = true;

      try {
        const task = this.queue.shift();
        if (!task) return;

        this.logger.log(
          `⏳ Processing: ${task.imageId} (Attempt ${task.retries + 1}/${task.maxRetries})`,
        );

        await this.processImageAnalysis(task);
      } catch (error) {
        this.logger.error('Queue processor error:', error);
      } finally {
        this.processing = false;
      }
    }, 5000); // 5 сек бүрт шалгах
  }

  /**
   * Process single image analysis
   */
  private async processImageAnalysis(task: AnalysisTask): Promise<void> {
    try {
      const image = await this.imageRepository.findOne({
        where: { id: task.imageId },
      });

      if (!image) {
        this.logger.warn(`Image not found: ${task.imageId}`);
        return;
      }

      // 🌐 Relative → PUBLIC URL болгох
      const publicImageUrl = task.fileUrl.startsWith('http')
        ? task.fileUrl
        : `${this.publicBaseUrl}${task.fileUrl}`;

      this.logger.log(
        `🔍 Analyzing with public URL: ${publicImageUrl}`,
      );

      // AI анализ ажиллуулах
      const analysisResult = await this.aiService.analyzeVehicleDamage(
        publicImageUrl,
      );

      // Repair cost тооцоолох
      const estimatedCost = this.aiService.estimateRepairCost(
        analysisResult.damagedParts,
      );

      // Image-г update хийх
      image.aiAnalysisResult = analysisResult;
      image.aiConfidenceScore = analysisResult.overallConfidence;
      image.status = ImageStatus.ANALYZED;
      image.analyzedAt = new Date();

      await this.imageRepository.save(image);

      this.logger.log(
        `✅ Image ${task.imageId} analyzed. Severity: ${analysisResult.overallSeverity}, Confidence: ${analysisResult.overallConfidence}`,
      );
    } catch (error) {
      task.retries++;
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (task.retries >= task.maxRetries) {
        // Max retries дээр хүрсэн бол failed болгох
        const image = await this.imageRepository.findOne({
          where: { id: task.imageId },
        });

        if (image) {
          image.status = ImageStatus.FAILED;
          image.aiErrorMessage = `Analysis failed after ${task.maxRetries} attempts: ${errorMessage}`;
          await this.imageRepository.save(image);
        }

        this.logger.error(
          `❌ Image ${task.imageId} analysis failed permanently: ${errorMessage}`,
        );
      } else {
        // Retry өмнөх байхадлыг буцаах
        this.queue.push(task);
        this.logger.warn(
          `⚠️  Image ${task.imageId} analysis failed. Retrying... (${task.retries}/${task.maxRetries})`,
        );
      }
    }
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { size: number; processing: boolean } {
    return {
      size: this.queue.length,
      processing: this.processing,
    };
  }

  /**
   * Retry failed image analysis
   */
  async retryImageAnalysis(imageId: string): Promise<void> {
    const image = await this.imageRepository.findOne({
      where: { id: imageId },
    });

    if (!image) {
      throw new Error(`Image not found: ${imageId}`);
    }

    image.status = ImageStatus.PROCESSING;
    await this.imageRepository.save(image);

    await this.enqueueImageAnalysis(imageId, image.fileUrl);

    this.logger.log(`🔄 Retrying analysis for image: ${imageId}`);
  }
}
