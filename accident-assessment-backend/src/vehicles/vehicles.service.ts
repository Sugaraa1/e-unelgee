import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { User } from '../users/entities/user.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  // ── Create ────────────────────────────────────────────────────
  async create(dto: CreateVehicleDto, owner: User): Promise<Vehicle> {
    // Улсын дугаар давхардсан эсэх шалгах
    const existingPlate = await this.vehicleRepository.findOne({
      where: { licensePlate: dto.licensePlate },
      withDeleted: false,
    });
    if (existingPlate) {
      throw new ConflictException(
        `"${dto.licensePlate}" улсын дугаартай машин аль хэдийн бүртгэлтэй байна`,
      );
    }

    // VIN давхардсан эсэх шалгах
    if (dto.vin) {
      const existingVin = await this.vehicleRepository.findOne({
        where: { vin: dto.vin },
        withDeleted: false,
      });
      if (existingVin) {
        throw new ConflictException(
          `"${dto.vin}" VIN дугаартай машин аль хэдийн бүртгэлтэй байна`,
        );
      }
    }

    const vehicle = this.vehicleRepository.create({
      ...dto,
      ownerId: owner.id,
    });

    return this.vehicleRepository.save(vehicle);
  }

  // ── Find All (өөрийн машинууд) ────────────────────────────────
  async findAll(owner: User): Promise<Vehicle[]> {
    return this.vehicleRepository.find({
      where: { ownerId: owner.id },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Find One ──────────────────────────────────────────────────
  async findOne(id: string, owner: User): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['claims'],
    });

    if (!vehicle) {
      throw new NotFoundException(`ID: ${id} машин олдсонгүй`);
    }

    this.checkOwnership(vehicle, owner);

    return vehicle;
  }

  // ── Update ────────────────────────────────────────────────────
  async update(id: string, dto: UpdateVehicleDto, owner: User): Promise<Vehicle> {
    const vehicle = await this.findOne(id, owner);

    // Шинэ улсын дугаар давхардсан эсэх шалгах
    if (dto.licensePlate && dto.licensePlate !== vehicle.licensePlate) {
      const existing = await this.vehicleRepository.findOne({
        where: { licensePlate: dto.licensePlate },
        withDeleted: false,
      });
      if (existing) {
        throw new ConflictException(
          `"${dto.licensePlate}" улсын дугаартай машин аль хэдийн бүртгэлтэй байна`,
        );
      }
    }

    // Шинэ VIN давхардсан эсэх шалгах
    if (dto.vin && dto.vin !== vehicle.vin) {
      const existing = await this.vehicleRepository.findOne({
        where: { vin: dto.vin },
        withDeleted: false,
      });
      if (existing) {
        throw new ConflictException(
          `"${dto.vin}" VIN дугаартай машин аль хэдийн бүртгэлтэй байна`,
        );
      }
    }

    Object.assign(vehicle, dto);
    return this.vehicleRepository.save(vehicle);
  }

  // ── Soft Delete ───────────────────────────────────────────────
  async remove(id: string, owner: User): Promise<{ message: string }> {
    const vehicle = await this.findOne(id, owner);
    await this.vehicleRepository.softDelete(vehicle.id);
    return { message: `"${vehicle.make} ${vehicle.model}" машин амжилттай устгагдлаа` };
  }

  // ── Private: Ownership шалгах ─────────────────────────────────
  private checkOwnership(vehicle: Vehicle, owner: User): void {
    if (vehicle.ownerId !== owner.id) {
      throw new ForbiddenException('Энэ машинд хандах эрх байхгүй байна');
    }
  }
}