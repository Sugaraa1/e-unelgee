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
      'Ослын мэдэгдэл үүсгэнэ. claimNumber автоматаар CLM-{year}-{seq} форматаар үүснэ.',
  })
  @ApiResponse({ status: 201, description: 'Claim амжилттай үүслээ' })
  @ApiResponse({ status: 403, description: 'Тээвэр хэрэгсэл таных биш байна' })
  @ApiResponse({ status: 404, description: 'Тээвэр хэрэгсэл олдсонгүй' })
  async create(
    @Body() dto: CreateClaimDto,
    @CurrentUser() user: User,
  ) {
    return this.claimsService.create(dto, user);
  }

  // ── GET /claims ───────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'Миний claim жагсаалт' })
  async findAll(@CurrentUser() user: User) {
    return this.claimsService.findAll(user);
  }

  // ── GET /claims/:id ───────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Claim дэлгэрэнгүй' })
  @ApiParam({ name: 'id', description: 'Claim UUID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.claimsService.findOne(id, user);
  }

  // ── PATCH /claims/:id ─────────────────────────────────────────
  @Patch(':id')
  @ApiOperation({ summary: 'Claim шинэчлэх' })
  @ApiParam({ name: 'id', description: 'Claim UUID' })
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
  @ApiOperation({ summary: 'Claim устгах (soft delete)' })
  @ApiParam({ name: 'id', description: 'Claim UUID' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.claimsService.remove(id, user);
  }

  // ── PATCH /claims/:id/self-approve ────────────────────────────
  @Patch(':id/self-approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'AI үнэлгээг хэрэглэгч өөрөө зөвшөөрөх',
    description:
      'Хэрэглэгч AI-ын санал болгосон үнэлгээг зөвшөөрч claim-г баталгаажуулна. ' +
      'estimatedRepairCost → approvedAmount болно. Status → approved.',
  })
  @ApiParam({ name: 'id', description: 'Claim UUID' })
  @ApiResponse({ status: 200, description: 'Claim зөвшөөрөгдлөө' })
  @ApiResponse({ status: 400, description: 'AI үнэлгээ дуусаагүй эсвэл буруу статус' })
  @ApiResponse({ status: 403, description: 'Хандах эрх байхгүй' })
  async selfApprove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.claimsService.selfApprove(id, user);
  }

  // ── PATCH /claims/:id/dispute ─────────────────────────────────
  @Patch(':id/dispute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'AI үнэлгээтэй санал нийлэхгүй байх',
    description:
      'Хэрэглэгч AI үнэлгээтэй санал нийлэхгүй бол шалтгааныг тайлбарлан хүсэлт гаргана. ' +
      'Status → pending_inspection болж мэргэжилтэн шалгана.',
  })
  @ApiParam({ name: 'id', description: 'Claim UUID' })
  @ApiResponse({ status: 200, description: 'Хүсэлт бүртгэгдлээ' })
  @ApiResponse({ status: 400, description: 'Шалтгаан хэт богино эсвэл буруу статус' })
  @ApiResponse({ status: 403, description: 'Хандах эрх байхгүй' })
  async dispute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: User,
  ) {
    return this.claimsService.dispute(id, reason, user);
  }
}