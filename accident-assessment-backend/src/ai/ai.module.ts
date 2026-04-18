// src/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIService } from './ai.service';
import { ImageAnalysisQueueService } from './image-analysis-queue.service';
import { Image } from '../images/entities/image.entity';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Image]), PricingModule],
  providers: [AIService, ImageAnalysisQueueService],
  exports: [AIService, ImageAnalysisQueueService],
})
export class AIModule {}
