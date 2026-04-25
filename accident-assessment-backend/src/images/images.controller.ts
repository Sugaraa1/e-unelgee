// Added: POST /images/:id/retry endpoint
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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ImagesService } from './images.service';
import { multerOptions } from './config/multer.config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Images')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Зураг upload хийх' })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('claimId') claimId: string,
    @CurrentUser() user: User,
  ) {
    if (!claimId?.trim()) {
      throw new BadRequestException('claimId талбар шаардлагатай');
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(claimId)) {
      throw new BadRequestException('claimId буруу UUID формат байна');
    }

    return this.imagesService.uploadImage(file, claimId, user);
  }

  // FIX: New retry endpoint — frontend retry button calls this
  @Post(':id/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AI шинжилгээ дахин оролдох' })
  async retryAnalysis(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.imagesService.retryAnalysis(id, user);
  }

  @Get()
  @ApiOperation({ summary: 'Claim-ийн зургуудыг авах' })
  async getImagesByClaim(
    @Query('claimId') claimId: string,
    @CurrentUser() user: User,
  ) {
    if (!claimId) {
      throw new BadRequestException('claimId query parameter шаардлагатай');
    }
    return this.imagesService.getImagesByClaim(claimId, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Нэг зургийн дэлгэрэнгүй мэдээлэл' })
  async getImage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.imagesService.getImageById(id, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Зураг устгах' })
  async deleteImage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.imagesService.deleteImage(id, user);
  }
}