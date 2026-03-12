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
  ApiTags,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Vehicles')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  // ── POST /vehicles ────────────────────────────────────────────
  @Post()
  @ApiOperation({ summary: 'Шинэ машин бүртгэх' })
  @ApiResponse({ status: 201, description: 'Машин амжилттай бүртгэгдлээ' })
  @ApiResponse({ status: 409, description: 'Улсын дугаар эсвэл VIN давхардсан байна' })
  async create(
    @Body() dto: CreateVehicleDto,
    @CurrentUser() user: User,
  ) {
    return this.vehiclesService.create(dto, user);
  }

  // ── GET /vehicles ─────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'Өөрийн бүх машины жагсаалт' })
  @ApiResponse({ status: 200, description: 'Машинуудын жагсаалт' })
  async findAll(@CurrentUser() user: User) {
    return this.vehiclesService.findAll(user);
  }

  // ── GET /vehicles/:id ─────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Машины дэлгэрэнгүй мэдээлэл' })
  @ApiParam({ name: 'id', description: 'Машины UUID' })
  @ApiResponse({ status: 200, description: 'Машины мэдээлэл' })
  @ApiResponse({ status: 404, description: 'Машин олдсонгүй' })
  @ApiResponse({ status: 403, description: 'Хандах эрх байхгүй' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.vehiclesService.findOne(id, user);
  }

  // ── PATCH /vehicles/:id ───────────────────────────────────────
  @Patch(':id')
  @ApiOperation({ summary: 'Машины мэдээлэл шинэчлэх' })
  @ApiParam({ name: 'id', description: 'Машины UUID' })
  @ApiResponse({ status: 200, description: 'Амжилттай шинэчлэгдлээ' })
  @ApiResponse({ status: 404, description: 'Машин олдсонгүй' })
  @ApiResponse({ status: 403, description: 'Хандах эрх байхгүй' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
    @CurrentUser() user: User,
  ) {
    return this.vehiclesService.update(id, dto, user);
  }

  // ── DELETE /vehicles/:id ──────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Машин устгах (soft delete)' })
  @ApiParam({ name: 'id', description: 'Машины UUID' })
  @ApiResponse({ status: 200, description: 'Амжилттай устгагдлаа' })
  @ApiResponse({ status: 404, description: 'Машин олдсонгүй' })
  @ApiResponse({ status: 403, description: 'Хандах эрх байхгүй' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.vehiclesService.remove(id, user);
  }
}