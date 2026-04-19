import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Claim, ClaimStatus } from '../claims/entities/claim.entity';
import { User } from '../users/entities/user.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Image } from '../images/entities/image.entity';
import { DamageAssessment } from '../damage-assessment/entities/damage-assessment.entity';

export interface DashboardStats {
  totalUsers: number;
  totalClaims: number;
  totalVehicles: number;
  totalImages: number;
  pendingClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  totalPayoutAmount: number;
  avgClaimAmount: number;
}

export interface ClaimsByStatus {
  status: string;
  count: number;
}

export interface ClaimsByDay {
  date: string;
  count: number;
}

export interface DamageTypeStats {
  damageType: string;
  count: number;
  percentage: number;
}

export interface HighRiskClaimSummary {
  id: string;
  claimNumber: string;
  riskLevel: 'low' | 'medium' | 'high';
  suggestedPayout: number;
  status: string;
  createdAt: Date;
  vehicleInfo: string;
}

export interface FraudAlert {
  id: string;
  claimNumber: string;
  flags: string[];
  suspiciousLevel: 'medium' | 'high';
  createdAt: Date;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Claim)
    private readonly claimRepository: Repository<Claim>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,

    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,

    @InjectRepository(DamageAssessment)
    private readonly damageAssessmentRepository: Repository<DamageAssessment>,
  ) {}

  /**
   * Get overall dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    this.logger.log('Fetching dashboard statistics');

    const [
      totalUsers,
      totalClaims,
      totalVehicles,
      totalImages,
      pendingClaims,
      approvedClaims,
      rejectedClaims,
    ] = await Promise.all([
      this.userRepository.count(),
      this.claimRepository.count(),
      this.vehicleRepository.count(),
      this.imageRepository.count(),
      this.claimRepository.count({
        where: { status: ClaimStatus.PENDING_INSPECTION },
      }),
      this.claimRepository.count({
        where: { status: ClaimStatus.APPROVED },
      }),
      this.claimRepository.count({
        where: { status: ClaimStatus.REJECTED },
      }),
    ]);

    // ✅ suggestedPayout → approvedAmount (entity-д байгаа field)
    const payoutStats = await this.claimRepository
      .createQueryBuilder('claim')
      .select('SUM(claim.approvedAmount)', 'totalPayout')
      .addSelect('AVG(claim.estimatedRepairCost)', 'avgCost')
      .where('claim.status = :status', { status: ClaimStatus.APPROVED })
      .getRawOne();

    const totalPayoutAmount = payoutStats?.totalPayout
      ? parseFloat(payoutStats.totalPayout)
      : 0;
    const avgClaimAmount = payoutStats?.avgCost
      ? parseFloat(payoutStats.avgCost)
      : 0;

    return {
      totalUsers,
      totalClaims,
      totalVehicles,
      totalImages,
      pendingClaims,
      approvedClaims,
      rejectedClaims,
      totalPayoutAmount,
      avgClaimAmount,
    };
  }

  /**
   * Get claims grouped by status
   */
  async getClaimsByStatus(): Promise<ClaimsByStatus[]> {
    this.logger.log('Fetching claims by status');

    const results = await this.claimRepository
      .createQueryBuilder('claim')
      .select('claim.status', 'status')
      .addSelect('COUNT(claim.id)', 'count')
      .groupBy('claim.status')
      .orderBy('count', 'DESC')
      .getRawMany();

    return results.map((r) => ({
      status: r.status,
      count: parseInt(r.count, 10),
    }));
  }

  /**
   * Get claims per day for last N days
   */
  async getClaimsByDay(days: number = 7): Promise<ClaimsByDay[]> {
    this.logger.log(`Fetching claims by day (last ${days} days)`);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await this.claimRepository
      .createQueryBuilder('claim')
      .select('DATE(claim.createdAt)', 'date')
      .addSelect('COUNT(claim.id)', 'count')
      .where('claim.createdAt >= :startDate', { startDate })
      .groupBy('DATE(claim.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return results.map((r) => ({
      date: r.date,
      count: parseInt(r.count, 10),
    }));
  }

  /**
   * Get top damage types from AI assessments
   */
  async getTopDamageTypes(limit: number = 10): Promise<DamageTypeStats[]> {
    this.logger.log('Fetching top damage types');

    const assessments = await this.damageAssessmentRepository
      .createQueryBuilder('da')
      .select('da.id', 'id')
      .addSelect('da.aiAnalysisResult', 'result')
      .getRawMany();

    const damageTypeMap = new Map<string, number>();

    assessments.forEach((assessment) => {
      try {
        const result =
          typeof assessment.result === 'string'
            ? JSON.parse(assessment.result)
            : assessment.result;

        if (result?.damagedParts && Array.isArray(result.damagedParts)) {
          result.damagedParts.forEach((part: any) => {
            const type = part.damageType || 'unknown';
            damageTypeMap.set(type, (damageTypeMap.get(type) || 0) + 1);
          });
        }
      } catch {
        // Skip invalid JSON
      }
    });

    const total = Array.from(damageTypeMap.values()).reduce(
      (sum, count) => sum + count,
      0,
    );
    const stats = Array.from(damageTypeMap.entries())
      .map(([type, count]) => ({
        damageType: type,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return stats;
  }

  /**
   * Get high-risk claims
   */
  async getHighRiskClaims(limit: number = 20): Promise<HighRiskClaimSummary[]> {
    this.logger.log('Fetching high-risk claims');

    const claims = await this.claimRepository
      .createQueryBuilder('claim')
      .leftJoinAndSelect('claim.vehicle', 'vehicle')
      .where('claim.riskLevel = :riskLevel', { riskLevel: 'high' })
      .orderBy('claim.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return claims.map((claim) => ({
      id: claim.id,
      claimNumber: claim.claimNumber,
      riskLevel: claim.riskLevel as 'low' | 'medium' | 'high',
      // ✅ suggestedPayout field entity-д байгаа тул OK
      suggestedPayout: claim.suggestedPayout
        ? Number(claim.suggestedPayout)
        : 0,
      status: claim.status,
      createdAt: claim.createdAt,
      vehicleInfo: claim.vehicle
        ? `${claim.vehicle.make} ${claim.vehicle.model} (${claim.vehicle.year})`
        : 'Мэдээлэл байхгүй',
    }));
  }

  /**
   * Get fraud alerts
   */
  async getFraudAlerts(limit: number = 20): Promise<FraudAlert[]> {
    this.logger.log('Fetching fraud alerts');

    const claims = await this.claimRepository
      .createQueryBuilder('claim')
      .where('claim.requiresManualReview = :review', { review: true })
      .orderBy('claim.createdAt', 'DESC')
      .take(limit)
      .getMany();

    const alerts: FraudAlert[] = [];

    for (const claim of claims) {
      const fraudResult = await this.checkFraudIndicators(claim.id);

      if (fraudResult.flags && fraudResult.flags.length > 0) {
        alerts.push({
          id: claim.id,
          claimNumber: claim.claimNumber,
          flags: fraudResult.flags,
          suspiciousLevel: fraudResult.flags.length > 2 ? 'high' : 'medium',
          createdAt: claim.createdAt,
        });
      }
    }

    return alerts.slice(0, limit);
  }

  /**
   * Check fraud indicators for a specific claim
   */
  private async checkFraudIndicators(
    claimId: string,
  ): Promise<{ flags: string[] }> {
    const claim = await this.claimRepository.findOne({
      where: { id: claimId },
      relations: ['vehicle'],
    });

    if (!claim) {
      return { flags: [] };
    }

    const flags: string[] = [];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    // 1. ✅ MoreThan() ашиглан TypeORM-ийн зөв хэлбэрээр шүүлт хийнэ
    const recentClaims = await this.claimRepository.count({
      where: {
        submittedById: claim.submittedById,
        createdAt: MoreThan(thirtyDaysAgo),
      },
    });

    if (recentClaims > 2) {
      flags.push(`30 хоногт ${recentClaims} claim`);
    }

    // 2. High repair cost ratio
    if (claim.estimatedRepairCost && claim.vehicle) {
      const vehicleValue = this.calculateVehicleValue(claim.vehicle);
      const ratio = Number(claim.estimatedRepairCost) / vehicleValue;

      if (ratio > 0.95) {
        flags.push('Засварын зардал үнэ цэнийг давсан');
      }
    }

    // 3. ✅ MoreThan() ашиглан ижил тээврийн олон claim шалгана
    const vehicleClaims = await this.claimRepository.count({
      where: {
        vehicleId: claim.vehicleId,
        createdAt: MoreThan(sixtyDaysAgo),
      },
    });

    if (vehicleClaims > 1) {
      flags.push(`60 хоногт ижил тээвэрт ${vehicleClaims} claim`);
    }

    // 4. Low confidence AI assessment
    const assessment = await this.damageAssessmentRepository.findOne({
      where: { claimId },
    });

    if (
      assessment &&
      assessment.aiOverallConfidence &&
      assessment.aiOverallConfidence < 0.5
    ) {
      flags.push('AI итгэл сул байна');
    }

    return { flags };
  }

  /**
   * Get summary statistics for widgets
   */
  async getQuickStats() {
    this.logger.log('Fetching quick stats');

    const [todayClaims, weekClaims, monthClaims, todayPayout] =
      await Promise.all([
        this.getClaimsInPeriod(1),
        this.getClaimsInPeriod(7),
        this.getClaimsInPeriod(30),
        this.getPayoutInPeriod(1),
      ]);

    return {
      todayClaims,
      weekClaims,
      monthClaims,
      todayPayout,
    };
  }

  /**
   * Helper: Get claims count for a period (days)
   */
  private async getClaimsInPeriod(days: number): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // ✅ MoreThan() ашиглах
    return this.claimRepository.count({
      where: {
        createdAt: MoreThan(startDate),
      },
    });
  }

  /**
   * Helper: Get payout amount for a period (days)
   */
  private async getPayoutInPeriod(days: number): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // ✅ approvedAmount ашиглах, where-г нэг удаа дуудах
    const result = await this.claimRepository
      .createQueryBuilder('claim')
      .select('SUM(claim.approvedAmount)', 'total')
      .where('claim.createdAt >= :startDate', { startDate })
      .andWhere('claim.status = :status', { status: ClaimStatus.APPROVED })
      .getRawOne();

    return result?.total ? parseFloat(result.total) : 0;
  }

  /**
   * Helper: Calculate vehicle market value
   */
  private calculateVehicleValue(vehicle: any): number {
    const baseValue = 5_000_000;
    const currentYear = new Date().getFullYear();
    const age = currentYear - Number(vehicle.year);
    const depreciation = Math.min(age * 0.15, 0.7);
    return baseValue * (1 - depreciation);
  }
}