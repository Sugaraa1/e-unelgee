// src/images/images.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Image, ImageType, ImageStatus } from './entities/image.entity';
import { Claim } from '../claims/entities/claim.entity';
import { User } from '../users/entities/user.entity';

export interface UploadResult {
  id: string;
  fileUrl: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  claimId: string;
  status: string;
  createdAt: Date;
}

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,

    @InjectRepository(Claim)
    private readonly claimRepository: Repository<Claim>,

    private readonly configService: ConfigService,
  ) {}

  // ── Upload ────────────────────────────────────────────────────
  async uploadImage(
    file: Express.Multer.File,
    claimId: string,
    user: User,
  ): Promise<UploadResult> {
    // 1. File байгаа эсэх шалгах
    if (!file) {
      throw new BadRequestException('Файл байхгүй байна. "file" талбар шаардлагатай.');
    }

    // 2. Claim байгаа эсэх шалгах
    const claim = await this.claimRepository.findOne({
      where: { id: claimId },
    });

    if (!claim) {
      // Disk дээр хадгалагдсан файлыг устгана
      this.deleteFileFromDisk(file.path);
      throw new NotFoundException(`ID: ${claimId} claim олдсонгүй`);
    }

    // 3. Claim нь энэ хэрэглэгчийнх эсэх шалгах
    if (claim.submittedById !== user.id) {
      this.deleteFileFromDisk(file.path);
      throw new ForbiddenException(
        'Энэ claim-д зураг нэмэх эрх байхгүй байна. Зөвхөн өөрийн claim-д зураг оруулна уу.',
      );
    }

    // 4. File URL үүсгэх (relative path ашиглана)
    // Development: /uploads/uuid.jpg (frontend-ээс өөрөө full URL үүсгэнэ)
    // Production: CDN эсвэл S3 URL ашиглана
    const fileUrl = `/uploads/${file.filename}`;

    // 5. Image entity үүсгэж database-д хадгалах
    const image = this.imageRepository.create({
      originalName: file.originalname,
      fileName:     file.filename,
      filePath:     file.path,        // ./uploads/uuid.jpg
      fileUrl:      fileUrl,
      mimeType:     file.mimetype,
      fileSize:     file.size,
      imageType:    ImageType.OTHER,  // Default → DAMAGE_CLOSEUP болгож өөрчилж болно
      status:       ImageStatus.PENDING,
      claimId:      claimId,
      uploadedById: user.id,
    });

    const saved = await this.imageRepository.save(image);

    this.logger.log(
      `Image uploaded: ${saved.fileName} → Claim: ${claimId} → User: ${user.email}`,
    );

    return {
      id:           saved.id,
      fileUrl:      saved.fileUrl,
      fileName:     saved.fileName,
      originalName: saved.originalName,
      fileSize:     saved.fileSize,
      mimeType:     saved.mimeType,
      claimId:      saved.claimId,
      status:       saved.status,
      createdAt:    saved.createdAt,
    };
  }

  // ── Claim-ийн зургуудыг авах ──────────────────────────────────
  async getImagesByClaim(claimId: string, user: User): Promise<Image[]> {
    // Claim ownership шалгах
    const claim = await this.claimRepository.findOne({
      where: { id: claimId },
    });

    if (!claim) {
      throw new NotFoundException(`ID: ${claimId} claim олдсонгүй`);
    }

    if (claim.submittedById !== user.id) {
      throw new ForbiddenException('Энэ claim-д хандах эрх байхгүй байна');
    }

    return this.imageRepository.find({
      where: { claimId },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Нэг зургийг авах ─────────────────────────────────────────
  async getImageById(id: string, user: User): Promise<Image> {
    const image = await this.imageRepository.findOne({
      where: { id },
      relations: ['claim'],
    });

    if (!image) {
      throw new NotFoundException(`ID: ${id} зураг олдсонгүй`);
    }

    // Claim ownership шалгах
    if (image.claim?.submittedById !== user.id) {
      throw new ForbiddenException('Энэ зурагт хандах эрх байхгүй байна');
    }

    return image;
  }

  // ── Зураг устгах ─────────────────────────────────────────────
  async deleteImage(id: string, user: User): Promise<{ message: string }> {
    const image = await this.getImageById(id, user);

    // Disk дээрх файл устгах
    this.deleteFileFromDisk(image.filePath);

    // Database-с устгах
    await this.imageRepository.delete(id);

    this.logger.log(`Image deleted: ${image.fileName}`);

    return { message: `Зураг "${image.originalName}" амжилттай устгагдлаа` };
  }

  // ── Private helpers ───────────────────────────────────────────
  private deleteFileFromDisk(filePath: string): void {
    try {
      const absolutePath = filePath.startsWith('.')
        ? join(process.cwd(), filePath)
        : filePath;

      if (existsSync(absolutePath)) {
        unlinkSync(absolutePath);
        this.logger.debug(`Deleted file from disk: ${absolutePath}`);
      }
    } catch (err) {
      // File устгахад алдаа гарсан ч log-д бичиж үргэлжлүүлнэ
      this.logger.warn(`Failed to delete file: ${filePath}`, err);
    }
  }

  private getBaseUrl(): string {
    const port = this.configService.get<number>('PORT', 3000);
    const env  = this.configService.get<string>('NODE_ENV', 'development');

    if (env === 'production') {
      // Production-д BACKEND_URL env variable ашиглана
      return this.configService.get<string>('BACKEND_URL', `http://localhost:${port}`);
    }

    return `http://localhost:${port}`;
  }
}