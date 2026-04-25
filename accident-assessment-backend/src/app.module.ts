import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ClaimsModule } from './claims/claims.module';
import { ImagesModule } from './images/images.module';
import { AIModule } from './ai/ai.module';
import { DamageAssessmentModule } from './damage-assessment/damage-assessment.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),

    // FIX: Rate limiting — 100 requests per minute per IP
    ThrottlerModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    throttlers: [
      {
        ttl: config.get<number>('THROTTLE_TTL', 60),
        limit: config.get<number>('THROTTLE_LIMIT', 100),
      },
    ],
  }),
}),

    AuthModule,
    UsersModule,
    VehiclesModule,
    ClaimsModule,
    ImagesModule,
    AIModule,
    DamageAssessmentModule,
    AdminModule,
    HealthModule, // FIX: Add health check
  ],
  providers: [
    // FIX: Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

// ─── IMPORTANT: Remove all .js files from src/ directory ────────
// Run this from backend root: find src -name "*.js" -delete
// These compiled files shadow the TypeScript sources and cause confusion.
// Add to .gitignore: src/**/*.js
