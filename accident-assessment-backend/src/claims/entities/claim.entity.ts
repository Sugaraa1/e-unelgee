import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Image } from '../../images/entities/image.entity';
import { DamageAssessment } from '../../damage-assessment/entities/damage-assessment.entity';

export enum ClaimStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  AI_PROCESSING = 'ai_processing',
  PENDING_INSPECTION = 'pending_inspection',
  APPROVED = 'approved',
  PARTIALLY_APPROVED = 'partially_approved',
  REJECTED = 'rejected',
  CLOSED = 'closed',
}

export enum AccidentSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  TOTAL_LOSS = 'total_loss',
}

export enum AccidentType {
  COLLISION = 'collision',
  REAR_END = 'rear_end',
  SIDE_IMPACT = 'side_impact',
  ROLLOVER = 'rollover',
  HIT_AND_RUN = 'hit_and_run',
  WEATHER = 'weather',
  VANDALISM = 'vandalism',
  THEFT = 'theft',
  FIRE = 'fire',
  FLOOD = 'flood',
  OTHER = 'other',
}

@Entity('claims')
export class Claim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Claim Reference ───────────────────────────────────────────
  @Index({ unique: true })
  @Column({ length: 20 })
  claimNumber: string;   // e.g. CLM-2024-001234

  @Column({ type: 'enum', enum: ClaimStatus, default: ClaimStatus.DRAFT })
  status: ClaimStatus;

  // ── Accident Details ──────────────────────────────────────────
  @Column({ type: 'timestamp' })
  accidentDate: Date;

  @Column({ length: 500 })
  accidentLocation: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ type: 'enum', enum: AccidentType })
  accidentType: AccidentType;

  @Column({
    type: 'enum',
    enum: AccidentSeverity,
    nullable: true,          // set after AI assessment
  })
  severity: AccidentSeverity;

  @Column({ type: 'text' })
  description: string;

  // ── Third Party Info ──────────────────────────────────────────
  @Column({ default: false })
  thirdPartyInvolved: boolean;

  @Column({ nullable: true, length: 100 })
  thirdPartyName: string;

  @Column({ nullable: true, length: 20 })
  thirdPartyLicensePlate: string;

  @Column({ nullable: true, length: 100 })
  thirdPartyInsurance: string;

  @Column({ nullable: true, length: 50 })
  thirdPartyPolicyNumber: string;

  // ── Police Report ─────────────────────────────────────────────
  @Column({ default: false })
  policeReportFiled: boolean;

  @Column({ nullable: true, length: 50 })
  policeReportNumber: string;

  // ── Financial ─────────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  estimatedRepairCost: number;   // from AI assessment

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  suggestedPayout: number;       // AI decision suggested amount

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  approvedAmount: number;        // set by adjuster

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  deductibleAmount: number;

  // ── AI Decision ────────────────────────────────────────────────
  @Column({
    type: 'enum',
    enum: ['auto_approve', 'needs_review', 'total_loss'],
    nullable: true,
  })
  aiDecision: 'auto_approve' | 'needs_review' | 'total_loss';

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high'],
    nullable: true,
  })
  riskLevel: 'low' | 'medium' | 'high';

  @Column({ default: false })
  requiresManualReview: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // ── Review Info ───────────────────────────────────────────────
  @Column({ nullable: true })
  reviewedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  // ── Adjuster Approval ──────────────────────────────────────────
  @Column({ nullable: true })
  approvedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  rejectedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'rejectedById' })
  rejectedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  // ── Relations ─────────────────────────────────────────────────
  @ManyToOne(() => User, (user) => user.claims, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submittedById' })
  submittedBy: User;

  @Column()
  submittedById: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.claims)
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Column()
  vehicleId: string;

  @OneToMany(() => Image, (image) => image.claim, { cascade: true })
  images: Image[];

  @OneToOne(() => DamageAssessment, (da) => da.claim, { cascade: true })
  damageAssessment: DamageAssessment;

  // ── Timestamps ────────────────────────────────────────────────
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  // ── Hooks ─────────────────────────────────────────────────────
  // Auto-generate claim number before insert
  // (In real app, use a database sequence or service method)
  get isEditable(): boolean {
    return [ClaimStatus.DRAFT, ClaimStatus.SUBMITTED].includes(this.status);
  }
}