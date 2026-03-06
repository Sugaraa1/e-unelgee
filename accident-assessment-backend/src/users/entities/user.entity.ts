import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Claim } from '../../claims/entities/claim.entity';

export enum UserRole {
  USER = 'user',
  ADJUSTER = 'adjuster',   // insurance adjuster
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Personal Info ─────────────────────────────────────────────
  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ unique: true, length: 20, nullable: true })
  phoneNumber: string;

  // ── Auth ──────────────────────────────────────────────────────
  @Column({ length: 255 })
  @Exclude()                    // never expose in API responses
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  @Exclude()
  emailVerificationToken: string;

  @Column({ nullable: true })
  @Exclude()
  passwordResetToken: string;

  @Column({ type: 'timestamp', nullable: true })
  @Exclude()
  passwordResetExpires: Date;

  @Column({ nullable: true })
  avatarUrl: string;

  // ── Insurance Info ────────────────────────────────────────────
  @Column({ nullable: true, length: 50 })
  insurancePolicyNumber: string;

  @Column({ nullable: true, length: 100 })
  insuranceProvider: string;

  // ── Relations ─────────────────────────────────────────────────
  @OneToMany(() => Vehicle, (vehicle) => vehicle.owner, { cascade: true })
  vehicles: Vehicle[];

  @OneToMany(() => Claim, (claim) => claim.submittedBy)
  claims: Claim[];

  // ── Timestamps ────────────────────────────────────────────────
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()   // soft delete
  deletedAt: Date;

  // ── Hooks ─────────────────────────────────────────────────────
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────
  async comparePassword(plainText: string): Promise<boolean> {
    return bcrypt.compare(plainText, this.password);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}