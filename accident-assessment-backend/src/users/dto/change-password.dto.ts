import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldP@ssword123', description: 'Current password' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NewP@ssword123', description: 'New password' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'New password must contain uppercase, lowercase and numbers',
  })
  newPassword: string;
}