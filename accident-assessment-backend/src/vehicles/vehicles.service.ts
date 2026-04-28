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

  // ── Find All (өөрийн машинууд) — зөвхөн устгаагүй машинуудыг буцаана ──
  async findAll(owner: User): Promise<Vehicle[]> {
    return this.vehicleRepository.find({
      where: { ownerId: owner.id },
      order: { createdAt: 'DESC' },
      withDeleted: false, // FIX: softDelete-д орсон машинуудыг харуулахгүй
    });
  }

  // ── Find One ──────────────────────────────────────────────────
  async findOne(id: string, owner: User): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['claims'],
      withDeleted: false, // FIX: устгасан машиныг дахин олохоос сэргийлнэ
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
  // FIX: relations ашиглахгүйгээр шууд ownership шалгаж softDelete хийнэ.
  // findOne + relations ашиглах нь TypeORM-д WHERE deletedAt IS NULL
  // нөхцлийг алдуулж болзошгүй тул тусдаа query ашиглана.
  async remove(id: string, owner: User): Promise<{ message: string }> {
    // Эхлээд машины үндсэн мэдээллийг авна (relations ашиглахгүй)
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      withDeleted: false, // устгагдсан машиныг олохгүй
    });

    if (!vehicle) {
      throw new NotFoundException(`ID: ${id} машин олдсонгүй`);
    }

    // Ownership шалгах
    if (vehicle.ownerId !== owner.id) {
      throw new ForbiddenException('Энэ машинд хандах эрх байхгүй байна');
    }

    // FIX: softDelete — id болон ownerId хоёуланг нь нөхцөлд оруулна
    // Ингэснээр өөр хэрэглэгчийн машиныг санамсаргүйгаар устгахаас хамгаална
    const result = await this.vehicleRepository.softDelete({
      id: vehicle.id,
      ownerId: owner.id,
    });

    // softDelete хийгдсэн мөрийн тоог шалгана
    if (!result.affected || result.affected === 0) {
      throw new NotFoundException(
        `ID: ${id} машин устгахад алдаа гарлаа. Дахин оролдоно уу.`,
      );
    }

    return {
      message: `"${vehicle.make} ${vehicle.model}" машин амжилттай устгагдлаа`,
    };
  }

  // ── Private: Ownership шалгах ─────────────────────────────────
  private checkOwnership(vehicle: Vehicle, owner: User): void {
    if (vehicle.ownerId !== owner.id) {
      throw new ForbiddenException('Энэ машинд хандах эрх байхгүй байна');
    }
  }
}