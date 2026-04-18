import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { Image } from './entities/image.entity';
import { Claim } from '../claims/entities/claim.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Image, Claim]),
    MulterModule.register({ dest: './uploads' }),
    ConfigModule,
  ],
  controllers: [ImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}