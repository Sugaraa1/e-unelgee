import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty() @IsString() @MaxLength(100) firstName: string;
  @ApiProperty() @IsString() @MaxLength(100) lastName: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @Matches(/^\+?[1-9]\d{7,14}$/) phoneNumber: string;
  @ApiProperty() @IsString() @MinLength(8) @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { message: 'Password too weak' })
  password: string;
  @ApiPropertyOptional() @IsOptional() @IsString() insurancePolicyNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() insuranceProvider?: string;
}

export class RefreshTokenDto {
  @ApiProperty() @IsString() refreshToken: string;
  @ApiProperty() @IsString() userId: string;
}
