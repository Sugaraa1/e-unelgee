import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Claim } from '../claims/entities/claim.entity';
import { Image } from '../images/entities/image.entity';
import { DamageAssessment } from '../damage-assessment/entities/damage-assessment.entity';

export const databaseConfig = (c: ConfigService): TypeOrmModuleOptions => {
  const isProduction = c.get<string>('NODE_ENV') === 'production';

  return {
    type: 'postgres',
    host: c.get<string>('DB_HOST', 'localhost'),
    port: c.get<number>('DB_PORT', 5432),
    username: c.get<string>('DB_USERNAME'),
    password: c.get<string>('DB_PASSWORD'),
    database: c.get<string>('DB_NAME'),
    entities: [User, Vehicle, Claim, Image, DamageAssessment],
    // CRITICAL: Never sync in production — data loss risk
    synchronize: isProduction ? false : c.get<string>('DB_SYNC', 'false') === 'true',
    logging: c.get<string>('DB_LOGGING', 'false') === 'true',
    // Enable migrations in production
    migrations: isProduction ? ['dist/migrations/*.js'] : [],
    migrationsRun: isProduction,
    // Connection pool
    extra: {
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    },
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  };
};