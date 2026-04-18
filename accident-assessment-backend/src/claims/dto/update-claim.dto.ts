import {
  IsString,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsNumber,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccidentType, ClaimStatus } from '../entities/claim.entity';

export class UpdateClaimDto {
  // ── Status ────────────────────────────────────────────────────
  @ApiPropertyOptional({
    enum: ClaimStatus,
    example: ClaimStatus.SUBMITTED,
    description: 'Claim-ийн статус (draft → submitted → under_review...)',
  })
  @IsOptional()
  @IsEnum(ClaimStatus)
  status?: ClaimStatus;

  // ── Accident Details ──────────────────────────────────────────
  @ApiPropertyOptional({
    example: '2026-04-18T10:30:00.000Z',
    description: 'Ослын огноо, цаг',
  })
  @IsOptional()
  @IsDateString()
  accidentDate?: string;

  @ApiPropertyOptional({
    example: 'Улаанбаатар хот, Сүхбаатар дүүрэг',
    description: 'Ослын болсон газар',
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  accidentLocation?: string;

  @ApiPropertyOptional({
    enum: AccidentType,
    example: AccidentType.REAR_END,
    description: 'Ослын төрөл',
  })
  @IsOptional()
  @IsEnum(AccidentType)
  accidentType?: AccidentType;

  @ApiPropertyOptional({
    example: 'Ослын нөхцөл байдлыг нарийвчлан тодорхойлсон тайлбар.',
    description: 'Ослын дэлгэрэнгүй тайлбар',
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description?: string;

  // ── GPS ───────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 47.9077 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 106.8832 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  // ── Third Party ───────────────────────────────────────────────
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  thirdPartyInvolved?: boolean;

  @ApiPropertyOptional({ example: 'Болд Гантулга' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  thirdPartyName?: string;

  @ApiPropertyOptional({ example: '9999УБА' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  thirdPartyLicensePlate?: string;

  @ApiPropertyOptional({ example: 'АРД Даатгал' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  thirdPartyInsurance?: string;

  @ApiPropertyOptional({ example: 'АРД-2025-000123' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  thirdPartyPolicyNumber?: string;

  // ── Police Report ─────────────────────────────────────────────
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  policeReportFiled?: boolean;

  @ApiPropertyOptional({ example: 'ЦТ-2026-009999' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  policeReportNumber?: string;
}