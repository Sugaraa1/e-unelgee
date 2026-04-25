// KEY FIX: claimNumber generation with SELECT ... FOR UPDATE to prevent race conditions
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Claim, ClaimStatus } from './entities/claim.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { User } from '../users/entities/user.entity';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';

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

    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  // ── CREATE (with race-condition-safe claimNumber) ──────────────
  async create(dto: CreateClaimDto, user: User): Promise<Claim> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: dto.vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`ID: ${dto.vehicleId} тээвэр хэрэгсэл олдсонгүй`);
    }

    if (vehicle.ownerId !== user.id) {
      throw new ForbiddenException(
        'Энэ тээвэр хэрэгсэл таных биш тул claim үүсгэх боломжгүй',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const year = new Date().getFullYear();
      await manager.query(`SELECT pg_advisory_xact_lock($1)`, [year]);

      const prefix = `CLM-${year}-`;
      const last = await manager
        .createQueryBuilder(Claim, 'claim')
        .where('claim.claimNumber LIKE :prefix', { prefix: `${prefix}%` })
        .orderBy('claim.claimNumber', 'DESC')
        .getOne();

      let sequence = 1;
      if (last) {
        const parts = last.claimNumber.split('-');
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) sequence = lastSeq + 1;
      }

      const claimNumber = `${prefix}${String(sequence).padStart(5, '0')}`;

      const claim = manager.create(Claim, {
        ...dto,
        accidentDate: new Date(dto.accidentDate),
        claimNumber,
        status: ClaimStatus.DRAFT,
        submittedById: user.id,
      });

      return manager.save(Claim, claim);
    });
  }

  // ── FIND ALL ───────────────────────────────────────────────────
  async findAll(user: User): Promise<Claim[]> {
    return this.claimRepository.find({
      where: { submittedById: user.id },
      relations: ['vehicle'],
      order: { createdAt: 'DESC' },
    });
  }

  // ── FIND ONE ───────────────────────────────────────────────────
  async findOne(id: string, user: User): Promise<Claim> {
    const claim = await this.claimRepository.findOne({
      where: { id },
      relations: ['vehicle', 'submittedBy', 'images', 'damageAssessment'],
    });

    if (!claim) throw new NotFoundException(`ID: ${id} claim олдсонгүй`);
    this.checkOwnership(claim, user);
    return claim;
  }

  // ── UPDATE ─────────────────────────────────────────────────────
  async update(id: string, dto: UpdateClaimDto, user: User): Promise<Claim> {
    const claim = await this.findOne(id, user);

    if (!claim.isEditable) {
      throw new BadRequestException(
        `"${claim.status}" статустай claim засах боломжгүй.`,
      );
    }

    if (dto.status && !USER_ALLOWED_STATUSES.includes(dto.status)) {
      throw new ForbiddenException(
        `Статусыг "${dto.status}" болгож чадахгүй. Зөвшөөрөгдсөн: ${USER_ALLOWED_STATUSES.join(', ')}`,
      );
    }

    const updateData: Partial<Claim> = {
      ...dto,
      ...(dto.accidentDate && { accidentDate: new Date(dto.accidentDate) }),
    };

    Object.assign(claim, updateData);
    return this.claimRepository.save(claim);
  }

  // ── REMOVE ─────────────────────────────────────────────────────
  async remove(id: string, user: User): Promise<{ message: string }> {
    const claim = await this.findOne(id, user);

    if (!claim.isEditable) {
      throw new BadRequestException(`"${claim.status}" статустай claim устгах боломжгүй`);
    }

    await this.claimRepository.softDelete(claim.id);
    return { message: `Claim "${claim.claimNumber}" амжилттай устгагдлаа` };
  }

  // ── SELF APPROVE ───────────────────────────────────────────────
  // Хэрэглэгч AI үнэлгээг зөвшөөрч claim-г өөрөө баталгаажуулна
  async selfApprove(id: string, user: User): Promise<Claim> {
    const claim = await this.findOne(id, user);

    if (!claim.estimatedRepairCost) {
      throw new BadRequestException(
        'AI үнэлгээ дуусаагүй байна. Зураг upload хийж хүлээнэ үү.',
      );
    }

    const allowedStatuses = [ClaimStatus.DRAFT, ClaimStatus.SUBMITTED];
    if (!allowedStatuses.includes(claim.status)) {
      throw new BadRequestException(
        `"${claim.status}" статустай claim зөвшөөрөх боломжгүй.`,
      );
    }

    await this.claimRepository.update(id, {
      status: ClaimStatus.APPROVED,
      approvedAmount: claim.estimatedRepairCost,
      approvedAt: new Date(),
      approvedById: user.id,
      notes: 'Хэрэглэгч AI үнэлгээг зөвшөөрсөн.',
    });

    return this.claimRepository.findOne({
      where: { id },
      relations: ['vehicle'],
    });
  }

  // ── DISPUTE ────────────────────────────────────────────────────
  // Хэрэглэгч AI үнэлгээтэй санал нийлэхгүй бол шалтгаан бичиж мэргэжилтэнд илгээнэ
  async dispute(id: string, reason: string, user: User): Promise<Claim> {
    const claim = await this.findOne(id, user);

    if (!reason || reason.trim().length < 5) {
      throw new BadRequestException(
        'Санал нийлэхгүй шалтгааныг дор хаяж 5 тэмдэгтээр тайлбарлана уу.',
      );
    }

    const allowedStatuses = [ClaimStatus.DRAFT, ClaimStatus.SUBMITTED];
    if (!allowedStatuses.includes(claim.status)) {
      throw new BadRequestException(
        `"${claim.status}" статустай claim-д хүсэлт гаргах боломжгүй.`,
      );
    }

    if (!claim.estimatedRepairCost) {
      throw new BadRequestException(
        'AI үнэлгээ дуусаагүй байна.',
      );
    }

    await this.claimRepository.update(id, {
      status: ClaimStatus.PENDING_INSPECTION,
      rejectionReason: reason.trim(),
      requiresManualReview: true,
      notes: `Хэрэглэгч санал нийлэхгүй: ${reason.trim()}`,
    });

    return this.claimRepository.findOne({
      where: { id },
      relations: ['vehicle'],
    });
  }

  private checkOwnership(claim: Claim, user: User): void {
    if (claim.submittedById !== user.id) {
      throw new ForbiddenException('Энэ claim-д хандах эрх байхгүй байна');
    }
  }
}