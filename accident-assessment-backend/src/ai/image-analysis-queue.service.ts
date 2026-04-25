// FIX: Use PUBLIC_BASE_URL from config, validate it at startup
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
  private readonly publicBaseUrl: string;

  constructor(
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
    private readonly aiService: AIService,
    private readonly configService: ConfigService,
  ) {
    // FIX: Resolve PUBLIC_BASE_URL once at startup; warn loudly if missing
    const explicit = this.configService.get<string>('PUBLIC_BASE_URL');
    const port = this.configService.get<number>('PORT', 3000);

    if (!explicit || explicit === 'http://localhost:3000') {
      this.logger.warn(
        '⚠️  PUBLIC_BASE_URL is not set or uses localhost. OpenAI CANNOT access local files. ' +
        'Use ngrok in development: ngrok http 3000, then set PUBLIC_BASE_URL=https://YOUR_NGROK_URL',
      );
    }

    this.publicBaseUrl = (explicit ?? `http://localhost:${port}`).replace(/\/$/, '');
    this.logger.log(`🌐 Queue processor using public URL: ${this.publicBaseUrl}`);
    this.startQueueProcessor();
  }

  async enqueueImageAnalysis(imageId: string, fileUrl: string): Promise<void> {
    this.queue.push({ imageId, fileUrl, retries: 0, maxRetries: 3 });
    this.logger.log(`📝 Enqueued image ${imageId}. Queue size: ${this.queue.length}`);
  }

  private startQueueProcessor(): void {
    setInterval(async () => {
      if (this.queue.length === 0 || this.processing) return;

      this.processing = true;
      try {
        const task = this.queue.shift();
        if (!task) return;
        await this.processImageAnalysis(task);
      } catch (error) {
        this.logger.error('Queue processor error:', error);
      } finally {
        this.processing = false;
      }
    }, 5000);
  }

  private async processImageAnalysis(task: AnalysisTask): Promise<void> {
    try {
      const image = await this.imageRepository.findOne({ where: { id: task.imageId } });
      if (!image) {
        this.logger.warn(`Image not found: ${task.imageId}`);
        return;
      }

      // FIX: Always use publicBaseUrl for relative paths
      const publicImageUrl = task.fileUrl.startsWith('http')
        ? task.fileUrl
        : `${this.publicBaseUrl}${task.fileUrl}`;

      this.logger.log(`🔍 Analyzing: ${publicImageUrl}`);
      const analysisResult = await this.aiService.analyzeVehicleDamage(publicImageUrl);

      image.aiAnalysisResult = analysisResult;
      image.aiConfidenceScore = analysisResult.overallConfidence;
      image.status = ImageStatus.ANALYZED;
      image.analyzedAt = new Date();

      await this.imageRepository.save(image);
      this.logger.log(`✅ Image ${task.imageId} analyzed. Severity: ${analysisResult.overallSeverity}`);
    } catch (error) {
      task.retries++;
      const msg = error instanceof Error ? error.message : String(error);

      if (task.retries >= task.maxRetries) {
        const image = await this.imageRepository.findOne({ where: { id: task.imageId } });
        if (image) {
          image.status = ImageStatus.FAILED;
          image.aiErrorMessage = `Failed after ${task.maxRetries} attempts: ${msg}`;
          await this.imageRepository.save(image);
        }
        this.logger.error(`❌ Image ${task.imageId} permanently failed: ${msg}`);
      } else {
        this.queue.push(task);
        this.logger.warn(`⚠️  Image ${task.imageId} retry ${task.retries}/${task.maxRetries}`);
      }
    }
  }

  getQueueStatus(): { size: number; processing: boolean } {
    return { size: this.queue.length, processing: this.processing };
  }
}