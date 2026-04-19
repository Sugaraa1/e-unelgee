import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { Image } from './entities/image.entity';
import { Claim } from '../claims/entities/claim.entity';
import { DamageAssessment } from '../damage-assessment/entities/damage-assessment.entity';
import { AIModule } from '../ai/ai.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Image, Claim, DamageAssessment]), 
    MulterModule.register({ dest: './uploads' }),
    ConfigModule,
    AIModule,
    PricingModule, 
  ],
  controllers: [ImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}