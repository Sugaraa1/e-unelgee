import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ── Register ──────────────────────────────────────────────────
  async register(dto: RegisterDto): Promise<{ user: User; tokens: AuthTokens }> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const user = this.userRepository.create({
      ...dto,
      email: dto.email.toLowerCase(),
      role: UserRole.USER,   // default role; admins are created separately
    });

    await this.userRepository.save(user);

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { user, tokens };
  }

  // ── Login ─────────────────────────────────────────────────────
  async login(dto: LoginDto): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !(await user.comparePassword(dto.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { user, tokens };
  }

  // ── Refresh Tokens ────────────────────────────────────────────
  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<AuthTokens> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user?.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const matches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!matches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  // ── Logout ────────────────────────────────────────────────────
  async logout(userId: string): Promise<void> {
    await this.userRepository.update(userId, { refreshToken: null });
  }

  // ── Private Helpers ───────────────────────────────────────────
  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '30d',
        ),
      }),
    ]);

    return { accessToken, refreshToken, expiresIn };
  }

  private async saveRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(userId, { refreshToken: hashed });
  }
}