// src/images/images.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { ImagesService } from './images.service';
import { multerOptions, MAX_FILE_SIZE } from './config/multer.config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Images')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  // ── POST /images/upload ───────────────────────────────────────
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Зураг upload хийх',
    description: `
      Ослын зургийг claim-д хавсаргаж upload хийнэ.
      - Зөвхөн JPEG, PNG зөвшөөрнө
      - Дээд хэмжээ: 5MB
      - multipart/form-data ашигладаг
    `,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Зураг upload хийх',
    schema: {
      type: 'object',
      required: ['file', 'claimId'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Зураг (JPEG эсвэл PNG, дээд тал нь 5MB)',
        },
        claimId: {
          type: 'string',
          format: 'uuid',
          description: 'Claim-ийн UUID',
          example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Зураг амжилттай upload хийгдлээ',
    schema: {
      example: {
        success: true,
        data: {
          id:           'img-uuid-here',
          fileUrl:      'http://localhost:3000/uploads/a3f8c2d1-4b5e.jpg',
          fileName:     'a3f8c2d1-4b5e.jpg',
          originalName: 'car_damage_front.jpg',
          fileSize:     204800,
          mimeType:     'image/jpeg',
          claimId:      'claim-uuid-here',
          status:       'pending',
          createdAt:    '2026-04-18T10:35:00.000Z',
        },
        timestamp: '2026-04-18T10:35:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Буруу файлын төрөл эсвэл хэмжээ хэтэрсэн' })
  @ApiResponse({ status: 403, description: 'Өөрийн claim биш' })
  @ApiResponse({ status: 404, description: 'Claim олдсонгүй' })
  @UseInterceptors(
    FileInterceptor('file', multerOptions),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('claimId') claimId: string,
    @CurrentUser() user: User,
  ) {
    // claimId validation
    if (!claimId || !claimId.trim()) {
      throw new BadRequestException('claimId талбар шаардлагатай');
    }

    // UUID format шалгах (энгийн regex)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(claimId)) {
      throw new BadRequestException('claimId буруу UUID формат байна');
    }

    return this.imagesService.uploadImage(file, claimId, user);
  }

  // ── GET /images?claimId=xxx ───────────────────────────────────
  @Get()
  @ApiOperation({
    summary: 'Claim-ийн зургуудыг авах',
    description: `Тухайн claim-д хамаарах бүх зургийг буцаана.
    
    🤖 AI Analysis статус:
    - pending: зургийн удаа байна
    - processing: AI анализ явж байна
    - analyzed: ✅ AI analysis дууссан, aiAnalysisResult буцаана
    - failed: ❌ AI анализ бүтэлгүй болсон`,
  })
  @ApiQuery({
    name: 'claimId',
    description: 'Claim-ийн UUID',
    required: true,
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Зургуудын жагсаалт (AI result орсон)' })
  @ApiResponse({ status: 403, description: 'Хандах эрх байхгүй' })
  @ApiResponse({ status: 404, description: 'Claim олдсонгүй' })
  async getImagesByClaim(
    @Query('claimId') claimId: string,
    @CurrentUser() user: User,
  ) {
    if (!claimId) {
      throw new BadRequestException('claimId query parameter шаардлагатай');
    }
    return this.imagesService.getImagesByClaim(claimId, user);
  }

  // ── GET /images/:id ───────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Нэг зургийн дэлгэрэнгүй мэдээлэл' })
  @ApiResponse({ status: 200, description: 'Зургийн мэдээлэл' })
  @ApiResponse({ status: 404, description: 'Зураг олдсонгүй' })
  async getImage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.imagesService.getImageById(id, user);
  }

  // ── DELETE /images/:id ────────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Зураг устгах' })
  @ApiResponse({ status: 200, description: 'Зураг устгагдлаа' })
  @ApiResponse({ status: 404, description: 'Зураг олдсонгүй' })
  async deleteImage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.imagesService.deleteImage(id, user);
  }
}