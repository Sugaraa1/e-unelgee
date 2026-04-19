import {
  Controller,
  Get,
  UseGuards,
  Logger,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  /**
   * GET /admin/stats
   * Get overall dashboard statistics
   */
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getStats() {
    this.logger.log('Admin: fetching dashboard stats');
    const stats = await this.adminService.getDashboardStats();
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * GET /admin/quick-stats
   * Get quick summary statistics
   */
  @Get('quick-stats')
  @HttpCode(HttpStatus.OK)
  async getQuickStats() {
    this.logger.log('Admin: fetching quick stats');
    const stats = await this.adminService.getQuickStats();
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * GET /admin/claims-by-status
   * Get claims grouped by status
   */
  @Get('claims-by-status')
  @HttpCode(HttpStatus.OK)
  async getClaimsByStatus() {
    this.logger.log('Admin: fetching claims by status');
    const data = await this.adminService.getClaimsByStatus();
    return {
      success: true,
      data,
    };
  }

  /**
   * GET /admin/claims-by-day
   * Get claims per day (default: last 7 days)
   */
  @Get('claims-by-day')
  @HttpCode(HttpStatus.OK)
  async getClaimsByDay(@Query('days') days?: string) {
    this.logger.log('Admin: fetching claims by day');
    const daysCount = days ? parseInt(days, 10) : 7;
    const data = await this.adminService.getClaimsByDay(daysCount);
    return {
      success: true,
      data,
    };
  }

  /**
   * GET /admin/top-damage-types
   * Get most common damage types from AI analysis
   */
  @Get('top-damage-types')
  @HttpCode(HttpStatus.OK)
  async getTopDamageTypes(@Query('limit') limit?: string) {
    this.logger.log('Admin: fetching top damage types');
    const limitCount = limit ? parseInt(limit, 10) : 10;
    const data = await this.adminService.getTopDamageTypes(limitCount);
    return {
      success: true,
      data,
    };
  }

  /**
   * GET /admin/high-risk-claims
   * Get high-risk claims list
   */
  @Get('high-risk-claims')
  @HttpCode(HttpStatus.OK)
  async getHighRiskClaims(@Query('limit') limit?: string) {
    this.logger.log('Admin: fetching high-risk claims');
    const limitCount = limit ? parseInt(limit, 10) : 20;
    const data = await this.adminService.getHighRiskClaims(limitCount);
    return {
      success: true,
      data,
    };
  }

  /**
   * GET /admin/fraud-alerts
   * Get fraud alerts
   */
  @Get('fraud-alerts')
  @HttpCode(HttpStatus.OK)
  async getFraudAlerts(@Query('limit') limit?: string) {
    this.logger.log('Admin: fetching fraud alerts');
    const limitCount = limit ? parseInt(limit, 10) : 20;
    const data = await this.adminService.getFraudAlerts(limitCount);
    return {
      success: true,
      data,
    };
  }
}
