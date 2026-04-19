import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Claim, ClaimStatus } from '../entities/claim.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { User, UserRole } from '../../users/entities/user.entity';

export type DecisionType = 'auto_approve' | 'needs_review' | 'total_loss';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface ClaimDecision {
  claimId: string;
  decision: DecisionType;
  suggestedPayout: number;
  riskLevel: RiskLevel;
  requiresManualReview: boolean;
  reason: string;
  confidence: number;
  createdAt: Date;
}

export interface AdjustedDecision {
  claimId: string;
  newPayout: number;
  adjustmentReason: string;
  adjustedBy: string;
  adjustmentPercentage: number;
}

@Injectable()
export class ClaimDecisionService {
  private readonly logger = new Logger(ClaimDecisionService.name);

  private readonly LOW_COST_THRESHOLD = 0.3;
  private readonly HIGH_COST_THRESHOLD = 0.7;
  private readonly MIN_CONFIDENCE = 0.6;
  private readonly HIGH_RISK_MULTIPLIER = 1.15;
  private readonly MEDIUM_RISK_MULTIPLIER = 1.08;

  constructor(
    @InjectRepository(Claim)
    private readonly claimRepository: Repository<Claim>,

    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  /**
   * Claim-г AI үнэлгээнээс автоматаар үнэлэх
   */
  async evaluateClaim(claimId: string): Promise<ClaimDecision> {
    const claim = await this.claimRepository.findOne({
      where: { id: claimId },
      relations: ['vehicle', 'damageAssessment'],
    });

    if (!claim) {
      throw new BadRequestException(`Claim ${claimId} олдсонгүй`);
    }

    if (!claim.estimatedRepairCost) {
      throw new BadRequestException(
        'AI үнэлгээ дуусаагүй байна. Дуустал хүлээнэ үү.',
      );
    }

    const vehicle = claim.vehicle;
    if (!vehicle) {
      throw new BadRequestException('Тээврийн хэрэгслийн мэдээлэл байхгүй');
    }

    const vehicleMarketValue = this.calculateMarketValue(vehicle);
    const avgConfidence = this.getAverageConfidence(claim);
    const costRatio =
      Number(claim.estimatedRepairCost) / vehicleMarketValue;

    let decision: DecisionType;
    let riskLevel: RiskLevel;
    let requiresManualReview = false;
    let reason = '';

    if (costRatio > this.HIGH_COST_THRESHOLD) {
      decision = 'total_loss';
      riskLevel = 'high';
      reason = `Засварын зардал (${Math.round(costRatio * 100)}%) нь тээврийн хэрэгслийн үнэ цэнийг давсан`;
    } else if (costRatio > this.LOW_COST_THRESHOLD) {
      decision = 'needs_review';
      riskLevel = costRatio > 0.5 ? 'high' : 'medium';
      reason = `Засварын зардал (${Math.round(costRatio * 100)}%) шалгалт шаардлагатай`;
    } else {
      decision = 'auto_approve';
      riskLevel = 'low';
      reason = `Засварын зардал (${Math.round(costRatio * 100)}%) сул. Автоматаар зөвшөөрөх`;
    }

    if (avgConfidence < this.MIN_CONFIDENCE) {
      requiresManualReview = true;
      reason += ` | AI итгэл (${Math.round(avgConfidence * 100)}%) бага`;
      if (decision === 'auto_approve') {
        decision = 'needs_review';
      }
    }

    const suggestedPayout = this.calculatePayout(
      Number(claim.estimatedRepairCost),
      riskLevel,
      costRatio,
    );

    const claimDecision: ClaimDecision = {
      claimId,
      decision,
      suggestedPayout,
      riskLevel,
      requiresManualReview,
      reason,
      confidence: avgConfidence,
      createdAt: new Date(),
    };

    await this.claimRepository.update(claimId, {
      aiDecision: decision,
      suggestedPayout,
      riskLevel,
      requiresManualReview,
    });

    this.logger.log(`Claim ${claimId} үнэлгээ: ${decision} (${riskLevel})`);

    return claimDecision;
  }

  /**
   * Adjuster-ийн төлбөрийн дүн өөрчлөх
   */
  async adjustClaimPayout(
    claimId: string,
    newPayout: number,
    adjustmentReason: string,
    user: User,
  ): Promise<AdjustedDecision> {
    if (![UserRole.ADMIN, UserRole.ADJUSTER].includes(user.role as UserRole)) {
      throw new ForbiddenException(
        'Зөвхөн adjuster эсвэл admin л шинэчилж болно',
      );
    }

    const claim = await this.claimRepository.findOne({
      where: { id: claimId },
    });

    if (!claim) {
      throw new BadRequestException(`Claim ${claimId} олдсонгүй`);
    }

    if (!claim.suggestedPayout) {
      throw new BadRequestException('Анхны төлбөрийн дүн байхгүй');
    }

    if (newPayout <= 0) {
      throw new BadRequestException('Төлбөрийн дүн 0-ээс их байх ёстой');
    }

    if (newPayout > Number(claim.suggestedPayout) * 2) {
      throw new BadRequestException(
        'Шинэ дүн анхны дүнээс 2 дахин их байж болохгүй',
      );
    }

    const adjustmentPercentage =
      ((newPayout - Number(claim.suggestedPayout)) /
        Number(claim.suggestedPayout)) *
      100;

    await this.claimRepository.update(claimId, {
      suggestedPayout: newPayout,
      status: ClaimStatus.PENDING_INSPECTION,
      notes: `Adjuster нэмэлт оценка: ${adjustmentReason} (${adjustmentPercentage > 0 ? '+' : ''}${adjustmentPercentage.toFixed(1)}%)`,
    });

    this.logger.log(
      `Claim ${claimId}: ${claim.suggestedPayout} → ${newPayout}`,
    );

    return {
      claimId,
      newPayout,
      adjustmentReason,
      adjustedBy: user.id,
      adjustmentPercentage,
    };
  }

  /**
   * Claim зөвшөөрөх
   */
  async approveClaim(claimId: string, user: User): Promise<Claim> {
    this.validateAdjusterRole(user);

    const claim = await this.claimRepository.findOne({
      where: { id: claimId },
    });

    if (!claim) {
      throw new BadRequestException(`Claim ${claimId} олдсонгүй`);
    }

    if (claim.status === ClaimStatus.APPROVED) {
      throw new BadRequestException('Энэ claim аль хэдийн зөвшөөрөгдсөн');
    }

    await this.claimRepository.update(claimId, {
      status: ClaimStatus.APPROVED,
      approvedAt: new Date(),
      approvedById: user.id,
    });

    this.logger.log(`Claim ${claimId} зөвшөөрөгдлөө`);

    return this.claimRepository.findOneBy({ id: claimId });
  }

  /**
   * Claim татгалзах
   */
  async rejectClaim(
    claimId: string,
    rejectionReason: string,
    user: User,
  ): Promise<Claim> {
    this.validateAdjusterRole(user);

    const claim = await this.claimRepository.findOne({
      where: { id: claimId },
    });

    if (!claim) {
      throw new BadRequestException(`Claim ${claimId} олдсонгүй`);
    }

    if ([ClaimStatus.REJECTED, ClaimStatus.CLOSED].includes(claim.status)) {
      throw new BadRequestException('Энэ claim аль хэдийн дууссан');
    }

    await this.claimRepository.update(claimId, {
      status: ClaimStatus.REJECTED,
      rejectedAt: new Date(),
      rejectedById: user.id,
      notes: `Татгалзсан шалтгаан: ${rejectionReason}`,
    });

    this.logger.log(`Claim ${claimId} татгалзагдлаа`);

    return this.claimRepository.findOneBy({ id: claimId });
  }

  /**
   * Fraud detection
   */
  async checkFraudIndicators(
    claimId: string,
  ): Promise<{ isSuspicious: boolean; flags: string[] }> {
    // ✅ relations: ['submittedBy'] — 'user' биш зөв relation нэр
    const claim = await this.claimRepository.findOne({
      where: { id: claimId },
      relations: ['submittedBy'],
    });

    if (!claim) {
      throw new BadRequestException(`Claim ${claimId} олдсонгүй`);
    }

    const flags: string[] = [];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    // 1. ✅ MoreThan() ашиглах
    const recentClaims = await this.claimRepository.count({
      where: {
        submittedById: claim.submittedById,
        createdAt: MoreThan(thirtyDaysAgo),
      },
    });

    if (recentClaims > 2) {
      flags.push(`30 хоногт ${recentClaims} claim үргүүлсэн`);
    }

    // 2. Very high repair cost
    const vehicle = await this.vehicleRepository.findOneBy({
      id: claim.vehicleId,
    });

    if (vehicle && claim.estimatedRepairCost) {
      const marketValue = this.calculateMarketValue(vehicle);
      const costRatio = Number(claim.estimatedRepairCost) / marketValue;

      if (costRatio > 0.95) {
        flags.push('Засварын зардал тээврийн үнэ цэнийг бараг давсан');
      }
    }

    // 3. ✅ MoreThan() ашиглах
    const vehicleClaims = await this.claimRepository.count({
      where: {
        vehicleId: claim.vehicleId,
        createdAt: MoreThan(sixtyDaysAgo),
      },
    });

    if (vehicleClaims > 1) {
      flags.push(`60 хоногт ижил тээвэрт ${vehicleClaims} claim`);
    }

    return {
      isSuspicious: flags.length > 0,
      flags,
    };
  }

  /**
   * Шалгалт хэрэгтэй claim-ийн жагсаалт
   */
  async getClaimsRequiringReview(): Promise<Claim[]> {
    return this.claimRepository.find({
      where: {
        requiresManualReview: true,
        status: ClaimStatus.PENDING_INSPECTION,
      },
      // ✅ relations: ['submittedBy'] — 'user' биш зөв нэр
      relations: ['vehicle', 'submittedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  // ── Private helpers ────────────────────────────────────────

  private calculateMarketValue(vehicle: Vehicle): number {
    const baseValue = 5_000_000;
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - Number(vehicle.year);
    const depreciation = Math.min(vehicleAge * 0.15, 0.7);
    return baseValue * (1 - depreciation);
  }

  private getAverageConfidence(claim: Claim): number {
    if (
      !claim.damageAssessment ||
      !claim.damageAssessment.aiOverallConfidence
    ) {
      return 0.5;
    }
    return Number(claim.damageAssessment.aiOverallConfidence);
  }

  private calculatePayout(
    estimatedCost: number,
    riskLevel: RiskLevel,
    costRatio: number,
  ): number {
    if (costRatio > this.HIGH_COST_THRESHOLD) {
      return estimatedCost;
    }

    const multiplier =
      riskLevel === 'high'
        ? this.HIGH_RISK_MULTIPLIER
        : riskLevel === 'medium'
          ? this.MEDIUM_RISK_MULTIPLIER
          : 1;

    return Math.round(estimatedCost * multiplier);
  }

  private validateAdjusterRole(user: User): void {
    if (
      ![UserRole.ADMIN, UserRole.ADJUSTER].includes(user.role as UserRole)
    ) {
      throw new ForbiddenException(
        'Зөвхөн adjuster эсвэл admin л энэ үйлдлийг гүйцэтгэж болно',
      );
    }
  }
}