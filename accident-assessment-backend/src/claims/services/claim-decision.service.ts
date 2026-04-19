import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  // Configuration constants
  private readonly LOW_COST_THRESHOLD = 0.3; // 30% of vehicle value
  private readonly HIGH_COST_THRESHOLD = 0.7; // 70% of vehicle value
  private readonly MIN_CONFIDENCE = 0.6; // 60% AI confidence
  private readonly HIGH_RISK_MULTIPLIER = 1.15; // 15% buffer for high risk
  private readonly MEDIUM_RISK_MULTIPLIER = 1.08; // 8% buffer for medium risk

  constructor(
    @InjectRepository(Claim)
    private readonly claimRepository: Repository<Claim>,

    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  /**
   * Оценить требование автоматически на основе AI анализа
   * Возвращает рекомендацию по принятию решения
   */
  async evaluateClaim(claimId: string): Promise<ClaimDecision> {
    // 1. Load claim with related data
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

    // 2. Get vehicle market value
    const vehicle = claim.vehicle;
    if (!vehicle) {
      throw new BadRequestException('Тээврийн хэрэгслийн мэдээлэл байхгүй');
    }

    const vehicleMarketValue = this.calculateMarketValue(vehicle);

    // 3. Get AI confidence from damage assessment
    const avgConfidence = this.getAverageConfidence(claim);

    // 4. Calculate cost ratio
    const costRatio = claim.estimatedRepairCost / vehicleMarketValue;

    // 5. Determine initial decision
    let decision: DecisionType;
    let riskLevel: RiskLevel;
    let requiresManualReview = false;
    let reason = '';

    // Decision logic
    if (costRatio > this.HIGH_COST_THRESHOLD) {
      decision = 'total_loss';
      riskLevel = 'high';
      reason = `Засварын зардал (${Math.round(costRatio * 100)}%) нь тээврийн хэрэгслийн үнэ цэнийг давсан`;
    } else if (costRatio > this.LOW_COST_THRESHOLD) {
      decision = 'needs_review';
      riskLevel = costRatio > 0.5 ? 'high' : 'medium';
      reason = `Засварын зардал (${Math.round(costRatio * 100)}%) дүнгийн хэмжээ шалгалт шаардлагатай`;
    } else {
      decision = 'auto_approve';
      riskLevel = 'low';
      reason = `Засварын зардал (${Math.round(costRatio * 100)}%) сул байна. Автоматаар зөвшөөрөх`;
    }

    // Check confidence
    if (avgConfidence < this.MIN_CONFIDENCE) {
      requiresManualReview = true;
      reason += ` | AI итгэл (${Math.round(avgConfidence * 100)}%) бага байна`;
      if (decision === 'auto_approve') {
        decision = 'needs_review';
      }
    }

    // 6. Calculate suggested payout with risk buffer
    const suggestedPayout = this.calculatePayout(
      claim.estimatedRepairCost,
      riskLevel,
      costRatio,
    );

    // 7. Create decision record
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

    // 8. Update claim with decision
    await this.claimRepository.update(claimId, {
      aiDecision: decision,
      suggestedPayout,
      riskLevel,
      requiresManualReview,
    });

    this.logger.log(
      `Claim ${claimId} үнэлгээ дуусав: ${decision} (${riskLevel})`,
    );

    return claimDecision;
  }

  /**
   * Adjuster-ийн шинэ төлбөрийн дүнгээр нэмэлт оценка хийх
   */
  async adjustClaimPayout(
    claimId: string,
    newPayout: number,
    adjustmentReason: string,
    user: User,
  ): Promise<AdjustedDecision> {
    // Permission check
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

    // Validate new payout (не может быть 0 или отрицательным)
    if (newPayout <= 0) {
      throw new BadRequestException('Төлбөрийн дүн 0-ээс их байх ёстой');
    }

    // Validate adjustment (не может быть больше чем в 2 раза от исходного)
    if (newPayout > claim.suggestedPayout * 2) {
      throw new BadRequestException(
        'Шинэ дүн анхны дүнээс 2 дахин их байж болохгүй',
      );
    }

    const adjustmentPercentage =
      ((newPayout - claim.suggestedPayout) / claim.suggestedPayout) * 100;

    // Update claim
    await this.claimRepository.update(claimId, {
      suggestedPayout: newPayout,
      status: ClaimStatus.PENDING_INSPECTION, // Move to manual inspection
      notes: `Adjuster нэмэлт оценка: ${adjustmentReason} (${adjustmentPercentage > 0 ? '+' : ''}${adjustmentPercentage.toFixed(1)}%)`,
    });

    this.logger.log(
      `Claim ${claimId} adjuster нэмэлт оценка: ${claim.suggestedPayout} → ${newPayout}`,
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
   * Adjuster-ийн claim-г зөвшөөрөх
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

    this.logger.log(`Claim ${claimId} adjuster-ээр зөвшөөрөгдөв`);

    return this.claimRepository.findOneBy({ id: claimId });
  }

  /**
   * Adjuster-ийн claim-г татгалзах
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
      throw new BadRequestException('Энэ claim аль хэдийн төлөвлөгдсөн');
    }

    await this.claimRepository.update(claimId, {
      status: ClaimStatus.REJECTED,
      rejectedAt: new Date(),
      rejectedById: user.id,
      notes: `Татгалзсан шалтгаан: ${rejectionReason}`,
    });

    this.logger.log(`Claim ${claimId} adjuster-ээр татгалзагдсан`);

    return this.claimRepository.findOneBy({ id: claimId });
  }

  /**
   * Fraud detection - олон давхцаж буй claim шалгах
   */
  async checkFraudIndicators(
    claimId: string,
  ): Promise<{ isSuspicious: boolean; flags: string[] }> {
    const claim = await this.claimRepository.findOne({
      where: { id: claimId },
      relations: ['user'],
    });

    if (!claim) {
      throw new BadRequestException(`Claim ${claimId} олдсонгүй`);
    }

    const flags: string[] = [];

    // 1. Multiple claims within short period
    const recentClaims = await this.claimRepository.count({
      where: {
        submittedById: claim.submittedById,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    });

    if (recentClaims > 2) {
      flags.push(`30 хоногт ${recentClaims} claim үргүүлсэн`);
    }

    // 2. Very high repair cost vs vehicle value
    const vehicle = await this.vehicleRepository.findOneBy({
      id: claim.vehicleId,
    });

    if (vehicle && claim.estimatedRepairCost) {
      const marketValue = this.calculateMarketValue(vehicle);
      const costRatio = claim.estimatedRepairCost / marketValue;

      if (costRatio > 0.95) {
        flags.push('Засварын зардал тээврийн үнэ цэнийг бараг давсан');
      }
    }

    // 3. Inconsistent damage description vs AI assessment
    // This would require comparing claim description with AI findings
    // Placeholder for future enhancement

    // 4. Multiple claims for same vehicle
    const vehicleClaims = await this.claimRepository.count({
      where: {
        vehicleId: claim.vehicleId,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Last 60 days
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
   * Get all claims requiring review
   */
  async getClaimsRequiringReview(): Promise<Claim[]> {
    return this.claimRepository.find({
      where: {
        requiresManualReview: true,
        status: ClaimStatus.PENDING_INSPECTION,
      },
      relations: ['vehicle', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Helper: Calculate vehicle market value
   * In production, this could call an external API (KBB, NADA, etc.)
   */
  private calculateMarketValue(vehicle: Vehicle): number {
    // Simple formula: base value - depreciation based on year
    const baseValue = 5000000; // Default base value (₮)
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - Number(vehicle.year);
    const depreciation = Math.min(vehicleAge * 0.15, 0.7); // Max 70% depreciation

    return baseValue * (1 - depreciation);
  }

  /**
   * Helper: Get average confidence from all images
   */
  private getAverageConfidence(claim: Claim): number {
    if (!claim.damageAssessment || !claim.damageAssessment.aiOverallConfidence) {
      return 0.5; // Default conservative estimate
    }

    return claim.damageAssessment.aiOverallConfidence;
  }

  /**
   * Helper: Calculate final payout with risk adjustments
   */
  private calculatePayout(
    estimatedCost: number,
    riskLevel: RiskLevel,
    costRatio: number,
  ): number {
    let multiplier = 1;

    // Risk-based adjustment
    if (riskLevel === 'high') {
      multiplier = this.HIGH_RISK_MULTIPLIER;
    } else if (riskLevel === 'medium') {
      multiplier = this.MEDIUM_RISK_MULTIPLIER;
    }

    // Total loss cap
    if (costRatio > this.HIGH_COST_THRESHOLD) {
      return estimatedCost; // Full payment for total loss (no adjustment)
    }

    return Math.round(estimatedCost * multiplier);
  }

  /**
   * Helper: Validate adjuster role
   */
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
