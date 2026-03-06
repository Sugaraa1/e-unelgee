import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Claim } from '../claims/entities/claim.entity';
import { Image } from '../images/entities/image.entity';
import { DamageAssessment } from '../damage-assessment/entities/damage-assessment.entity';

export const databaseConfig = (c: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: c.get('DB_HOST', 'localhost'),
  port: c.get<number>('DB_PORT', 5432),
  username: c.get('DB_USERNAME'),
  password: c.get('DB_PASSWORD'),
  database: c.get('DB_NAME'),
  entities: [User, Vehicle, Claim, Image, DamageAssessment],
  synchronize: c.get('DB_SYNC', 'true') === 'true',
  logging: c.get('DB_LOGGING', 'false') === 'true',
});
