import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ClaimsModule } from './claims/claims.module';
import { ImagesModule } from './images/images.module';
import { AIModule } from './ai/ai.module';
import { DamageAssessmentModule } from './damage-assessment/damage-assessment.module';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env', cache: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),
    AuthModule,
    UsersModule,
    VehiclesModule,
    ClaimsModule,
    ImagesModule,
    AIModule,
    DamageAssessmentModule,
  ],
})
export class AppModule {}
