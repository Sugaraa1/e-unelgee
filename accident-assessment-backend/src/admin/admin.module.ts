import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Claim } from '../claims/entities/claim.entity';
import { User } from '../users/entities/user.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Image } from '../images/entities/image.entity';
import { DamageAssessment } from '../damage-assessment/entities/damage-assessment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Claim, User, Vehicle, Image, DamageAssessment]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
