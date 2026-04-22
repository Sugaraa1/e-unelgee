import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, RefreshTokenDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
async register(@Body() dto: RegisterDto) {
  const { user, tokens } = await this.authService.register(dto);
  // ✅ Бүтэн user буцаана — sensitive field-үүдийг л хасна
  const {
    password, refreshToken, emailVerificationToken,
    passwordResetToken, passwordResetExpires,
    ...safeUser
  } = user as any;
  return {
    message: 'Registration successful',
    user: safeUser,
    ...tokens,
  };
}

@Post('login')
@HttpCode(HttpStatus.OK)
async login(@Body() dto: LoginDto) {
  const { user, tokens } = await this.authService.login(dto);
  // ✅ Бүтэн user буцаана
  const {
    password, refreshToken, emailVerificationToken,
    passwordResetToken, passwordResetExpires,
    ...safeUser
  } = user as any;
  return {
    message: 'Login successful',
    user: safeUser,
    ...tokens,
  };
}

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const tokens = await this.authService.refreshTokens(
      dto.userId,
      dto.refreshToken,
    );
    return tokens;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current user' })
  async logout(@CurrentUser() user: User) {
    await this.authService.logout(user.id);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current authenticated user' })
  getMe(@CurrentUser() user: User) {
    return user;
  }
}