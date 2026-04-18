import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Claim } from '../../claims/entities/claim.entity';

export enum ImageType {
  FRONT = 'front',
  REAR = 'rear',
  LEFT_SIDE = 'left_side',
  RIGHT_SIDE = 'right_side',
  FRONT_LEFT = 'front_left',
  FRONT_RIGHT = 'front_right',
  REAR_LEFT = 'rear_left',
  REAR_RIGHT = 'rear_right',
  INTERIOR = 'interior',
  ENGINE = 'engine',
  DAMAGE_CLOSEUP = 'damage_closeup',
  POLICE_REPORT = 'police_report',
  OTHER = 'other',
}

export enum ImageStatus {
  PENDING = 'pending',         // uploaded, awaiting AI analysis
  PROCESSING = 'processing',   // AI is analyzing
  ANALYZED = 'analyzed',       // AI analysis complete
  FAILED = 'failed',           // AI analysis failed
  REJECTED = 'rejected',       // not valid (blurry, wrong content etc.)
}

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── File Info ─────────────────────────────────────────────────
  @Column({ length: 255 })
  originalName: string;

  @Column({ length: 255 })
  fileName: string;       // stored filename (uuid-based)

  @Column({ length: 500 })
  filePath: string;       // local path or S3 key

  @Column({ nullable: true, length: 500 })
  fileUrl: string;        // public URL (CDN or S3 presigned)

  @Column({ length: 50 })
  mimeType: string;       // image/jpeg, image/png, etc.

  @Column({ type: 'int' })
  fileSize: number;       // bytes

  // ── Image Metadata ────────────────────────────────────────────
  @Column({ type: 'enum', enum: ImageType, default: ImageType.OTHER })
  imageType: ImageType;

  @Column({ type: 'enum', enum: ImageStatus, default: ImageStatus.PENDING })
  status: ImageStatus;

  @Column({ type: 'int', nullable: true })
  width: number;

  @Column({ type: 'int', nullable: true })
  height: number;

  // ── AI Analysis Results ───────────────────────────────────────
  @Column({ type: 'jsonb', nullable: true })
  aiAnalysisResult: {
    damagedParts: Array<{
      partName: string;
      damageType: 'scratch' | 'dent' | 'crack' | 'broken' | 'paint_damage' | 'glass_damage';
      severity: 'minor' | 'moderate' | 'severe';
      confidence: number;
    }>;
    overallSeverity: 'none' | 'minor' | 'moderate' | 'severe';
    overallConfidence: number;
    analysisDetails: string;
    recommendations: string[];
  };

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  aiConfidenceScore: number;   // 0.0000 – 1.0000

  @Column({ type: 'text', nullable: true })
  aiErrorMessage: string;

  @Column({ type: 'int', default: 0 })
  aiRetryCount: number;   // retry count for failed AI analysis

  @Column({ type: 'timestamp', nullable: true })
  analyzedAt: Date;

  // ── GPS / EXIF ────────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ type: 'timestamp', nullable: true })
  takenAt: Date;             // from EXIF data

  @Column({ nullable: true, length: 100 })
  deviceModel: string;       // camera/phone model from EXIF

  // ── Relation ──────────────────────────────────────────────────
  @ManyToOne(() => Claim, (claim) => claim.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'claimId' })
  claim: Claim;

  @Column()
  claimId: string;

  @Column({ nullable: true })
  uploadedById: string;

  // ── Timestamps ────────────────────────────────────────────────
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}