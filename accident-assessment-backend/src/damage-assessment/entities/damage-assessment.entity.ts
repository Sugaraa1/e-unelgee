import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Claim } from '../../claims/entities/claim.entity';
import { User } from '../../users/entities/user.entity';

export enum AssessmentStatus {
  PENDING = 'pending',
  AI_COMPLETE = 'ai_complete',          // AI finished, awaiting human review
  HUMAN_REVIEWED = 'human_reviewed',    // adjuster has reviewed
  FINALIZED = 'finalized',
  DISPUTED = 'disputed',
}

export enum AssessmentSource {
  AI_ONLY = 'ai_only',
  HUMAN_ONLY = 'human_only',
  AI_HUMAN_COMBINED = 'ai_human_combined',
}

// Represents a single damaged part
export interface DamagedPart {
  partName: string;              // e.g. "Front bumper", "Hood"
  damageLevel: 'scratch' | 'dent' | 'crack' | 'broken' | 'missing';
  severity: 'minor' | 'moderate' | 'severe';
  repairType: 'repair' | 'replace';
  estimatedPartCost: number;
  estimatedLaborCost: number;
  totalCost: number;
  aiDetected: boolean;
  humanVerified: boolean;
  notes?: string;
}

@Entity('damage_assessments')
export class DamageAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Status ────────────────────────────────────────────────────
  @Column({
    type: 'enum',
    enum: AssessmentStatus,
    default: AssessmentStatus.PENDING,
  })
  status: AssessmentStatus;

  @Column({
    type: 'enum',
    enum: AssessmentSource,
    default: AssessmentSource.AI_ONLY,
  })
  source: AssessmentSource;

  // ── AI Assessment ─────────────────────────────────────────────
  @Column({ type: 'jsonb', nullable: true })
  damagedParts: DamagedPart[];

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  aiEstimatedTotalCost: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  aiOverallConfidence: number;   // 0.0000 – 1.0000

  @Column({ type: 'jsonb', nullable: true })
  aiRawResponse: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  aiSummary: string;             // AI-generated human-readable summary

  @Column({ type: 'timestamp', nullable: true })
  aiProcessedAt: Date;

  @Column({ type: 'int', default: 0 })
  aiRetryCount: number;

  @Column({ type: 'text', nullable: true })
  aiErrorMessage: string;

  // ── Repair Breakdown ──────────────────────────────────────────
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  estimatedPartsCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  estimatedLaborCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  estimatedPaintCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalEstimatedCost: number;    // sum of all above

  @Column({ default: false })
  isTotalLoss: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  vehicleMarketValue: number;    // for total-loss calculation

  // ── Human Review ──────────────────────────────────────────────
  @Column({ nullable: true })
  reviewedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  humanAdjustedCost: number;     // adjuster's final figure (overrides AI)

  @Column({ type: 'text', nullable: true })
  humanReviewNotes: string;

  @Column({ type: 'jsonb', nullable: true })
  humanAdjustedParts: DamagedPart[];   // adjuster can add/remove/edit parts

  // ── Final Figures ─────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  finalApprovedCost: number;

  @Column({ type: 'text', nullable: true })
  finalNotes: string;

  // ── Relation ──────────────────────────────────────────────────
  @OneToOne(() => Claim, (claim) => claim.damageAssessment, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'claimId' })
  claim: Claim;

  @Column()
  claimId: string;

  // ── Timestamps ────────────────────────────────────────────────
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ── Helper ────────────────────────────────────────────────────
  get effectiveCost(): number {
    return (
      this.finalApprovedCost ??
      this.humanAdjustedCost ??
      this.totalEstimatedCost ??
      0
    );
  }
}