import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Claim, ClaimStatus } from './entities/claim.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { User } from '../users/entities/user.entity';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';

// ── Claim number generator ─────────────────────────────────────
//   Формат: CLM-{year}-{5 оронтой тоо} → жишэ: CLM-2026-00001
async function generateClaimNumber(
  claimRepository: Repository<Claim>,
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CLM-${year}-`;

  // Тухайн жилийн сүүлийн claim-г олно
  const last = await claimRepository
    .createQueryBuilder('claim')
    .where('claim.claimNumber LIKE :prefix', { prefix: `${prefix}%` })
    .orderBy('claim.claimNumber', 'DESC')
    .getOne();

  let sequence = 1;

  if (last) {
    // "CLM-2026-00042" → "00042" → 42 → +1 → 43
    const parts = last.claimNumber.split('-');
    const lastSeq = parseInt(parts[2], 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  // 5 оронтой тоо болгоно: 1 → "00001"
  const paddedSeq = String(sequence).padStart(5, '0');
  return `${prefix}${paddedSeq}`;
}

// ── Status transition дүрэм ────────────────────────────────────
//   Хэрэглэгч зөвхөн draft → submitted шилжүүлж чадна.
//   Бусад шилжилтийг adjuster/admin хийнэ (энэ файлд хялбаршуулсан).
const USER_ALLOWED_STATUSES: ClaimStatus[] = [
  ClaimStatus.DRAFT,
  ClaimStatus.SUBMITTED,
];

@Injectable()
export class ClaimsService {
  constructor(
    @InjectRepository(Claim)
    private readonly claimRepository: Repository<Claim>,

    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  // ────────────────────────────────────────────────────────────
  // CREATE
  // ────────────────────────────────────────────────────────────
  async create(dto: CreateClaimDto, user: User): Promise<Claim> {
    // 1. Vehicle ownership шалгах
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: dto.vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(
        `ID: ${dto.vehicleId} тээвэр хэрэгсэл олдсонгүй`,
      );
    }

    if (vehicle.ownerId !== user.id) {
      throw new ForbiddenException(
        'Энэ тээвэр хэрэгсэл таных биш тул claim үүсгэх боломжгүй',
      );
    }

    // 2. Claim number автоматаар үүсгэх
    const claimNumber = await generateClaimNumber(this.claimRepository);

    // 3. Claim үүсгэж хадгалах
    const claim = this.claimRepository.create({
      ...dto,
      accidentDate: new Date(dto.accidentDate),
      claimNumber,
      status: ClaimStatus.DRAFT,
      submittedById: user.id,
    });

    return this.claimRepository.save(claim);
  }

  // ────────────────────────────────────────────────────────────
  // FIND ALL — тухайн хэрэглэгчийн claim-үүд
  // ────────────────────────────────────────────────────────────
  async findAll(user: User): Promise<Claim[]> {
    return this.claimRepository.find({
      where: { submittedById: user.id },
      relations: ['vehicle'],
      order: { createdAt: 'DESC' },
    });
  }

  // ────────────────────────────────────────────────────────────
  // FIND ONE
  // ────────────────────────────────────────────────────────────
  async findOne(id: string, user: User): Promise<Claim> {
    const claim = await this.claimRepository.findOne({
      where: { id },
      relations: ['vehicle', 'submittedBy', 'images', 'damageAssessment'],
    });

    if (!claim) {
      throw new NotFoundException(`ID: ${id} claim олдсонгүй`);
    }

    this.checkOwnership(claim, user);

    return claim;
  }

  // ────────────────────────────────────────────────────────────
  // UPDATE
  // ────────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateClaimDto, user: User): Promise<Claim> {
    const claim = await this.findOne(id, user);

    // Зөвхөн draft/submitted статустай claim-г засах боломжтой
    if (!claim.isEditable) {
      throw new BadRequestException(
        `"${claim.status}" статустай claim засах боломжгүй. Зөвхөн draft/submitted claim засагдана.`,
      );
    }

    // Хэрэглэгч зөвшөөрөгдсөн статус руу л шилжүүлж чадна
    if (dto.status && !USER_ALLOWED_STATUSES.includes(dto.status)) {
      throw new ForbiddenException(
        `Та статусыг "${dto.status}" болгож чадахгүй. Зөвшөөрөгдсөн: ${USER_ALLOWED_STATUSES.join(', ')}`,
      );
    }

    // accidentDate string → Date хөрвүүлэлт
    const updateData: Partial<Claim> = {
      ...dto,
      ...(dto.accidentDate && { accidentDate: new Date(dto.accidentDate) }),
    };

    Object.assign(claim, updateData);
    return this.claimRepository.save(claim);
  }

  // ────────────────────────────────────────────────────────────
  // SOFT DELETE
  // ────────────────────────────────────────────────────────────
  async remove(id: string, user: User): Promise<{ message: string }> {
    const claim = await this.findOne(id, user);

    if (!claim.isEditable) {
      throw new BadRequestException(
        `"${claim.status}" статустай claim устгах боломжгүй`,
      );
    }

    await this.claimRepository.softDelete(claim.id);

    return {
      message: `Claim "${claim.claimNumber}" амжилттай устгагдлаа`,
    };
  }

  // ────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ────────────────────────────────────────────────────────────
  private checkOwnership(claim: Claim, user: User): void {
    if (claim.submittedById !== user.id) {
      throw new ForbiddenException('Энэ claim-д хандах эрх байхгүй байна');
    }
  }
}