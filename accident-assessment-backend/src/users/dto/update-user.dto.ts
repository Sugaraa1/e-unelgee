import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Бат' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Эрдэнэ' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: '+97699001122' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'Утасны дугаар буруу байна' })
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'Монгол Даатгал' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  insuranceProvider?: string;

  @ApiPropertyOptional({ example: 'МД-2025-001234' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  insurancePolicyNumber?: string;
}