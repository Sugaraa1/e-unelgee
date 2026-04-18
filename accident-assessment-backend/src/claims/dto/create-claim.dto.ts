import {
  IsString,
  IsEnum,
  IsUUID,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsNumber,
  MaxLength,
  MinLength,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccidentType } from '../entities/claim.entity';

export class CreateClaimDto {
  // ── Accident Details ──────────────────────────────────────────
  @ApiProperty({
    example: '2026-04-18T10:30:00.000Z',
    description: 'Ослын огноо, цаг',
  })
  @IsDateString()
  accidentDate: string;

  @ApiProperty({
    example: 'Улаанбаатар хот, Чингэлтэй дүүрэг, Энхтайваны өргөн чөлөө',
    description: 'Ослын болсон газар',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  accidentLocation: string;

  @ApiProperty({
    enum: AccidentType,
    example: AccidentType.COLLISION,
    description: 'Ослын төрөл',
  })
  @IsEnum(AccidentType)
  accidentType: AccidentType;

  @ApiProperty({
    example: 'Уулзварт гэрлэн дохио улаан байхад урдаас ирсэн машинтай мөргөлдсөн. Урд бамперт хүнд гэмтэл гарсан.',
    description: 'Ослын дэлгэрэнгүй тайлбар',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Тээвэр хэрэгслийн UUID',
  })
  @IsUUID()
  vehicleId: string;

  // ── GPS (optional) ────────────────────────────────────────────
  @ApiPropertyOptional({ example: 47.9077, description: 'Өргөрөг (latitude)' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 106.8832, description: 'Уртраг (longitude)' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  // ── Third Party ───────────────────────────────────────────────
  @ApiPropertyOptional({ example: false, description: 'Гуравдагч тал оролцсон эсэх' })
  @IsOptional()
  @IsBoolean()
  thirdPartyInvolved?: boolean;

  @ApiPropertyOptional({ example: 'Дорж Батаа', description: 'Гуравдагч талын нэр' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  thirdPartyName?: string;

  @ApiPropertyOptional({ example: '5678УБА', description: 'Гуравдагч талын улсын дугаар' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  thirdPartyLicensePlate?: string;

  @ApiPropertyOptional({ example: 'Монгол Даатгал', description: 'Гуравдагч талын даатгалын компани' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  thirdPartyInsurance?: string;

  @ApiPropertyOptional({ example: 'МД-2025-009876', description: 'Гуравдагч талын даатгалын гэрээний дугаар' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  thirdPartyPolicyNumber?: string;

  // ── Police Report ─────────────────────────────────────────────
  @ApiPropertyOptional({ example: false, description: 'Цагдаагийн тайлан бичигдсэн эсэх' })
  @IsOptional()
  @IsBoolean()
  policeReportFiled?: boolean;

  @ApiPropertyOptional({ example: 'ЦТ-2026-001234', description: 'Цагдаагийн тайлангийн дугаар' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  policeReportNumber?: string;
}