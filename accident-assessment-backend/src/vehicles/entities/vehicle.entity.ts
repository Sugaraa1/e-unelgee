import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Claim } from '../../claims/entities/claim.entity';

export enum FuelType {
  PETROL = 'petrol',
  DIESEL = 'diesel',
  ELECTRIC = 'electric',
  HYBRID = 'hybrid',
  LPG = 'lpg',
}

export enum VehicleCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Basic Info ────────────────────────────────────────────────
  @Column({ length: 100 })
  make: string;         // Toyota, BMW, etc.

  @Column({ length: 100 })
  model: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ length: 20 })
  color: string;

  // ── Identification ────────────────────────────────────────────
  @Index({ unique: true })
  @Column({ length: 20 })
  licensePlate: string;

  @Index({ unique: true })
  @Column({ length: 17, nullable: true })
  vin: string;           // Vehicle Identification Number (17 chars)

  // ── Technical Details ─────────────────────────────────────────
  @Column({ type: 'enum', enum: FuelType, default: FuelType.PETROL })
  fuelType: FuelType;

  @Column({ nullable: true, length: 50 })
  engineSize: string;

  @Column({ type: 'int', nullable: true })
  mileage: number;       // in km

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  estimatedValue: number;

  @Column({
    type: 'enum',
    enum: VehicleCondition,
    default: VehicleCondition.GOOD,
  })
  condition: VehicleCondition;

  // ── Insurance ─────────────────────────────────────────────────
  @Column({ nullable: true, length: 100 })
  insuranceProvider: string;

  @Column({ nullable: true, length: 50 })
  insurancePolicyNumber: string;

  @Column({ type: 'date', nullable: true })
  insuranceExpiryDate: Date;

  // ── Relations ─────────────────────────────────────────────────
  @ManyToOne(() => User, (user) => user.vehicles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  @OneToMany(() => Claim, (claim) => claim.vehicle)
  claims: Claim[];

  // ── Timestamps ────────────────────────────────────────────────
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}