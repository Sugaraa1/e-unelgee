import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { ClaimsService } from './claims.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Claims')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  // ── POST /claims ──────────────────────────────────────────────
  @Post()
  @ApiOperation({
    summary: 'Шинэ claim үүсгэх',
    description:
      'Ослын мэдэгдэл үүсгэнэ. claimNumber автоматаар CLM-{year}-{seq} форматаар үүснэ. vehicleId нь таны бүртгэлтэй машин байх ёстой.',
  })
  @ApiResponse({
    status: 201,
    description: 'Claim амжилттай үүслээ',
    schema: {
      example: {
        success: true,
        data: {
          id: 'uuid-here',
          claimNumber: 'CLM-2026-00001',
          status: 'draft',
          accidentDate: '2026-04-18T10:30:00.000Z',
          accidentLocation: 'Улаанбаатар хот, Чингэлтэй дүүрэг',
          accidentType: 'collision',
          description: 'Уулзварт мөргөлдсөн...',
          vehicleId: 'vehicle-uuid',
          submittedById: 'user-uuid',
          thirdPartyInvolved: false,
          policeReportFiled: false,
          createdAt: '2026-04-18T10:35:00.000Z',
        },
        timestamp: '2026-04-18T10:35:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Тээвэр хэрэгсэл таных биш байна' })
  @ApiResponse({ status: 404, description: 'Тээвэр хэрэгсэл олдсонгүй' })
  @ApiResponse({ status: 400, description: 'Validation алдаа' })
  async create(
    @Body() dto: CreateClaimDto,
    @CurrentUser() user: User,
  ) {
    return this.claimsService.create(dto, user);
  }

  // ── GET /claims ───────────────────────────────────────────────
  @Get()
  @ApiOperation({
    summary: 'Миний claim жагсаалт',
    description: 'Зөвхөн нэвтэрсэн хэрэглэгчийн claim-үүдийг буцаана. Vehicle мэдээлэл багтаасан.',
  })
  @ApiResponse({
    status: 200,
    description: 'Claim жагсаалт',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 'uuid-1',
            claimNumber: 'CLM-2026-00001',
            status: 'submitted',
            accidentDate: '2026-04-18T10:30:00.000Z',
            accidentType: 'collision',
            vehicle: {
              id: 'vehicle-uuid',
              make: 'Toyota',
              model: 'Camry',
              licensePlate: '1234УБА',
            },
          },
        ],
        timestamp: '2026-04-18T10:40:00.000Z',
      },
    },
  })
  async findAll(@CurrentUser() user: User) {
    return this.claimsService.findAll(user);
  }

  // ── GET /claims/:id ───────────────────────────────────────────
  @Get(':id')
  @ApiOperation({
    summary: 'Claim дэлгэрэнгүй',
    description: 'Claim-ийн бүх мэдээлэл: vehicle, зурагнууд, AI үнэлгээ багтсан.',
  })
  @ApiParam({ name: 'id', description: 'Claim UUID' })
  @ApiResponse({ status: 200, description: 'Claim дэлгэрэнгүй мэдээлэл' })
  @ApiResponse({ status: 403, description: 'Хандах эрх байхгүй' })
  @ApiResponse({ status: 404, description: 'Claim олдсонгүй' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.claimsService.findOne(id, user);
  }

  // ── PATCH /claims/:id ─────────────────────────────────────────
  @Patch(':id')
  @ApiOperation({
    summary: 'Claim шинэчлэх',
    description:
      'Зөвхөн draft/submitted статустай claim шинэчлэгдэнэ. Хэрэглэгч draft↔submitted хоорондоо шилжүүлж чадна.',
  })
  @ApiParam({ name: 'id', description: 'Claim UUID' })
  @ApiResponse({ status: 200, description: 'Claim амжилттай шинэчлэгдлээ' })
  @ApiResponse({ status: 400, description: 'Засах боломжгүй статус' })
  @ApiResponse({ status: 403, description: 'Хандах эрх байхгүй эсвэл статус зөвшөөрөгдөөгүй' })
  @ApiResponse({ status: 404, description: 'Claim олдсонгүй' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClaimDto,
    @CurrentUser() user: User,
  ) {
    return this.claimsService.update(id, dto, user);
  }

  // ── DELETE /claims/:id ────────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Claim устгах (soft delete)',
    description: 'Зөвхөн draft/submitted статустай claim устгах боломжтой.',
  })
  @ApiParam({ name: 'id', description: 'Claim UUID' })
  @ApiResponse({
    status: 200,
    description: 'Claim устгагдлаа',
    schema: {
      example: {
        success: true,
        data: { message: 'Claim "CLM-2026-00001" амжилттай устгагдлаа' },
        timestamp: '2026-04-18T11:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Устгах боломжгүй статус' })
  @ApiResponse({ status: 403, description: 'Хандах эрх байхгүй' })
  @ApiResponse({ status: 404, description: 'Claim олдсонгүй' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.claimsService.remove(id, user);
  }
}