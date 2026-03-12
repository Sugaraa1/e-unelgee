import {
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  MaxLength,
  MinLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FuelType, VehicleCondition } from '../entities/vehicle.entity';

export class CreateVehicleDto {
  @ApiProperty({ example: 'Toyota', description: 'Машины марк' })
  @IsString()
  @MaxLength(100)
  make: string;

  @ApiProperty({ example: 'Camry', description: 'Машины загвар' })
  @IsString()
  @MaxLength(100)
  model: string;

  @ApiProperty({ example: 2020, description: 'Үйлдвэрлэсэн он' })
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @ApiProperty({ example: 'Цагаан', description: 'Машины өнгө' })
  @IsString()
  @MaxLength(20)
  color: string;

  @ApiProperty({ example: '1234УБА', description: 'Улсын дугаар' })
  @IsString()
  @MaxLength(20)
  licensePlate: string;

  @ApiPropertyOptional({ example: 'JT2BF22K1W0123456', description: 'VIN дугаар (17 тэмдэгт)' })
  @IsOptional()
  @IsString()
  @MinLength(17)
  @MaxLength(17)
  vin?: string;

  @ApiProperty({ enum: FuelType, example: FuelType.PETROL, description: 'Түлшний төрөл' })
  @IsEnum(FuelType)
  fuelType: FuelType;

  @ApiPropertyOptional({ example: '2.5L', description: 'Хөдөлгүүрийн багтаамж' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  engineSize?: string;

  @ApiPropertyOptional({ example: 85000, description: 'Явсан км' })
  @IsOptional()
  @IsInt()
  @Min(0)
  mileage?: number;

  @ApiPropertyOptional({ example: 25000000, description: 'Тооцоолсон үнэ (₮)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedValue?: number;

  @ApiPropertyOptional({ enum: VehicleCondition, example: VehicleCondition.GOOD })
  @IsOptional()
  @IsEnum(VehicleCondition)
  condition?: VehicleCondition;

  @ApiPropertyOptional({ example: 'Монгол Даатгал', description: 'Даатгалын компани' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  insuranceProvider?: string;

  @ApiPropertyOptional({ example: 'МД-2024-001234', description: 'Даатгалын гэрээний дугаар' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  insurancePolicyNumber?: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'Даатгал дуусах огноо' })
  @IsOptional()
  @IsDateString()
  insuranceExpiryDate?: string;
}