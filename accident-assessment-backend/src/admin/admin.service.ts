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

export interface DisputedClaim {
  id: string;
  claimNumber: string;
  status: string;
  disputeReason: string;
  estimatedRepairCost: number | null;
  accidentType: string;
  accidentLocation: string;
  accidentDate: Date;
  submittedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  } | null;
  vehicleInfo: string;
  createdAt: Date;
  updatedAt: Date;
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

  // ── Dashboard Stats ────────────────────────────────────────
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

    const payoutStats = await this.claimRepository
      .createQueryBuilder('claim')
      .select('SUM(claim.approvedAmount)', 'totalPayout')
      .addSelect('AVG(claim.estimatedRepairCost)', 'avgCost')
      .where('claim.status = :status', { status: ClaimStatus.APPROVED })
      .getRawOne();

    return {
      totalUsers,
      totalClaims,
      totalVehicles,
      totalImages,
      pendingClaims,
      approvedClaims,
      rejectedClaims,
      totalPayoutAmount: payoutStats?.totalPayout ? parseFloat(payoutStats.totalPayout) : 0,
      avgClaimAmount: payoutStats?.avgCost ? parseFloat(payoutStats.avgCost) : 0,
    };
  }

  // ── Claims by status ───────────────────────────────────────
  async getClaimsByStatus(): Promise<ClaimsByStatus[]> {
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

  // ── Claims by day ──────────────────────────────────────────
  async getClaimsByDay(days: number = 7): Promise<ClaimsByDay[]> {
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

  // ── Top damage types ───────────────────────────────────────
  async getTopDamageTypes(limit: number = 10): Promise<DamageTypeStats[]> {
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
        // skip invalid
      }
    });

    const total = Array.from(damageTypeMap.values()).reduce(
      (sum, count) => sum + count,
      0,
    );

    return Array.from(damageTypeMap.entries())
      .map(([type, count]) => ({
        damageType: type,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // ── High risk claims ───────────────────────────────────────
  async getHighRiskClaims(limit: number = 20): Promise<HighRiskClaimSummary[]> {
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
      suggestedPayout: claim.suggestedPayout ? Number(claim.suggestedPayout) : 0,
      status: claim.status,
      createdAt: claim.createdAt,
      vehicleInfo: claim.vehicle
        ? `${claim.vehicle.make} ${claim.vehicle.model} (${claim.vehicle.year})`
        : 'Мэдээлэл байхгүй',
    }));
  }

  // ── Fraud alerts ───────────────────────────────────────────
  async getFraudAlerts(limit: number = 20): Promise<FraudAlert[]> {
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

  // ── Disputed claims ────────────────────────────────────────
  // FIX: try-catch + LIKE query-г аюулгүй болгосон
  // FIX: leftJoin ашиглаж null relation-ийг зөвшөөрсөн
  async getDisputedClaims(limit: number = 50): Promise<DisputedClaim[]> {
    this.logger.log('Fetching disputed claims');

    try {
      // FIX: LIKE query-г тусдаа andWhere болгон аюулгүй ажиллуулна
      // Хэрэв notes талбар null бол LIKE амжилтгүй болно тул OR нөхцөл нэмнэ
      const claims = await this.claimRepository
        .createQueryBuilder('claim')
        .leftJoinAndSelect('claim.vehicle', 'vehicle')
        .leftJoinAndSelect('claim.submittedBy', 'submittedBy')
        .where('claim.status = :status', {
          status: ClaimStatus.PENDING_INSPECTION,
        })
        .andWhere('claim.requiresManualReview = :review', { review: true })
        // FIX: notes эсвэл rejectionReason талбараас аль нэгнийг шалгана
        .andWhere(
          '(claim.notes IS NOT NULL OR claim.rejectionReason IS NOT NULL)',
        )
        .orderBy('claim.updatedAt', 'DESC')
        .take(limit)
        .getMany();

      return claims.map((claim) => {
        // Хэрэглэгчийн тайлбарыг notes эсвэл rejectionReason-с авна
        let disputeReason = 'Тайлбар байхгүй';

        if (claim.rejectionReason) {
          // dispute() функц rejectionReason-д хадгалдаг
          disputeReason = claim.rejectionReason;
        } else if (claim.notes) {
          // notes-с "Хэрэглэгч санал нийлэхгүй: ..." хэсгийг гаргана
          const match = claim.notes.match(/Хэрэглэгч санал нийлэхгүй:\s*(.+)/);
          disputeReason = match ? match[1].trim() : claim.notes;
        }

        return {
          id: claim.id,
          claimNumber: claim.claimNumber,
          status: claim.status,
          disputeReason,
          estimatedRepairCost: claim.estimatedRepairCost
            ? Number(claim.estimatedRepairCost)
            : null,
          accidentType: claim.accidentType,
          accidentLocation: claim.accidentLocation,
          accidentDate: claim.accidentDate,
          submittedBy: claim.submittedBy
            ? {
                id: claim.submittedBy.id,
                firstName: claim.submittedBy.firstName,
                lastName: claim.submittedBy.lastName,
                email: claim.submittedBy.email,
                phoneNumber: claim.submittedBy.phoneNumber,
              }
            : null,
          vehicleInfo: claim.vehicle
            ? `${claim.vehicle.make} ${claim.vehicle.model} (${claim.vehicle.year}) — ${claim.vehicle.licensePlate}`
            : 'Мэдээлэл байхгүй',
          createdAt: claim.createdAt,
          updatedAt: claim.updatedAt,
        };
      });
    } catch (error) {
      // FIX: 500 алдаа гарвал хоосон массив буцааж frontend-г хамгаална
      this.logger.error('getDisputedClaims error:', error);
      return [];
    }
  }

  // ── Quick stats ────────────────────────────────────────────
  async getQuickStats() {
    this.logger.log('Fetching quick stats');

    const [todayClaims, weekClaims, monthClaims, todayPayout] =
      await Promise.all([
        this.getClaimsInPeriod(1),
        this.getClaimsInPeriod(7),
        this.getClaimsInPeriod(30),
        this.getPayoutInPeriod(1),
      ]);

    return { todayClaims, weekClaims, monthClaims, todayPayout };
  }

  // ── Private helpers ────────────────────────────────────────
  private async getClaimsInPeriod(days: number): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return this.claimRepository.count({
      where: { createdAt: MoreThan(startDate) },
    });
  }

  private async getPayoutInPeriod(days: number): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const result = await this.claimRepository
      .createQueryBuilder('claim')
      .select('SUM(claim.approvedAmount)', 'total')
      .where('claim.createdAt >= :startDate', { startDate })
      .andWhere('claim.status = :status', { status: ClaimStatus.APPROVED })
      .getRawOne();
    return result?.total ? parseFloat(result.total) : 0;
  }

  private async checkFraudIndicators(
    claimId: string,
  ): Promise<{ flags: string[] }> {
    try {
      const claim = await this.claimRepository.findOne({
        where: { id: claimId },
        relations: ['vehicle'],
      });

      if (!claim) return { flags: [] };

      const flags: string[] = [];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

      const recentClaims = await this.claimRepository.count({
        where: {
          submittedById: claim.submittedById,
          createdAt: MoreThan(thirtyDaysAgo),
        },
      });
      if (recentClaims > 2) flags.push(`30 хоногт ${recentClaims} claim`);

      if (claim.estimatedRepairCost && claim.vehicle) {
        const vehicleValue = this.calculateVehicleValue(claim.vehicle);
        const ratio = Number(claim.estimatedRepairCost) / vehicleValue;
        if (ratio > 0.95) flags.push('Засварын зардал үнэ цэнийг давсан');
      }

      const vehicleClaims = await this.claimRepository.count({
        where: {
          vehicleId: claim.vehicleId,
          createdAt: MoreThan(sixtyDaysAgo),
        },
      });
      if (vehicleClaims > 1) {
        flags.push(`60 хоногт ижил тээвэрт ${vehicleClaims} claim`);
      }

      const assessment = await this.damageAssessmentRepository.findOne({
        where: { claimId },
      });
      if (
        assessment?.aiOverallConfidence &&
        assessment.aiOverallConfidence < 0.5
      ) {
        flags.push('AI итгэл сул байна');
      }

      return { flags };
    } catch {
      return { flags: [] };
    }
  }

  private calculateVehicleValue(vehicle: any): number {
    const baseValue = 5_000_000;
    const currentYear = new Date().getFullYear();
    const age = currentYear - Number(vehicle.year);
    const depreciation = Math.min(age * 0.15, 0.7);
    return baseValue * (1 - depreciation);
  }
}