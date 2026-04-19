import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { ClaimDecisionService } from '../services/claim-decision.service';

@Controller('claims')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClaimDecisionController {
  private readonly logger = new Logger(ClaimDecisionController.name);

  constructor(private readonly decisionService: ClaimDecisionService) {}

  /**
   * POST /claims/:id/evaluate
   * AI үнэлгээнээс claim-г автоматаар үнэлэх
   * Role: admin, adjuster
   */
  @Post(':id/evaluate')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.ADJUSTER)
  async evaluateClaim(@Param('id') claimId: string) {
    this.logger.log(`Evaluating claim ${claimId}`);
    const decision = await this.decisionService.evaluateClaim(claimId);
    return {
      success: true,
      data: decision,
      message: 'Claim үнэлгээ дүүргэв',
    };
  }

  /**
   * GET /claims/review
   * Шалгалт хэрэгтэй claim-ийн жагсаалт
   * Role: adjuster, admin
   */
  @Get('review')
  @Roles(UserRole.ADMIN, UserRole.ADJUSTER)
  async getClaimsRequiringReview() {
    this.logger.log('Fetching claims requiring review');
    const claims = await this.decisionService.getClaimsRequiringReview();
    return {
      success: true,
      data: claims,
      count: claims.length,
    };
  }

  /**
   * POST /claims/:id/approve
   * Adjuster-ийн claim-г зөвшөөрөх
   * Role: adjuster, admin
   */
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.ADJUSTER)
  async approveClaim(@Param('id') claimId: string, @Request() req) {
    this.logger.log(`Approving claim ${claimId} by user ${req.user.id}`);
    const claim = await this.decisionService.approveClaim(
      claimId,
      req.user,
    );
    return {
      success: true,
      data: claim,
      message: 'Claim зөвшөөрөгдлөө',
    };
  }

  /**
   * POST /claims/:id/reject
   * Adjuster-ийн claim-г татгалзах
   * Role: adjuster, admin
   */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.ADJUSTER)
  async rejectClaim(
    @Param('id') claimId: string,
    @Body('reason') rejectionReason: string,
    @Request() req,
  ) {
    if (!rejectionReason) {
      throw new ForbiddenException(
        'Татгалзсан шалтгаан өгөх шаардлагатай',
      );
    }

    this.logger.log(`Rejecting claim ${claimId} by user ${req.user.id}`);
    const claim = await this.decisionService.rejectClaim(
      claimId,
      rejectionReason,
      req.user,
    );
    return {
      success: true,
      data: claim,
      message: 'Claim татгалзагдлаа',
    };
  }

  /**
   * PATCH /claims/:id/adjust
   * Adjuster-ийн төлбөрийн дүнг өөрчлөх
   * Role: adjuster, admin
   */
  @Patch(':id/adjust')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.ADJUSTER)
  async adjustClaimPayout(
    @Param('id') claimId: string,
    @Body() body: { newPayout: number; reason: string },
    @Request() req,
  ) {
    if (!body.newPayout || !body.reason) {
      throw new ForbiddenException(
        'newPayout болон reason өгөх шаардлагатай',
      );
    }

    this.logger.log(
      `Adjusting claim ${claimId} payout by user ${req.user.id}`,
    );
    const adjustment = await this.decisionService.adjustClaimPayout(
      claimId,
      body.newPayout,
      body.reason,
      req.user,
    );
    return {
      success: true,
      data: adjustment,
      message: 'Төлбөрийн дүн шинэчлэгдлөө',
    };
  }

  /**
   * GET /claims/:id/fraud-check
   * Claim-ийн хууль бус байдлыг шалгах
   * Role: admin, adjuster
   */
  @Get(':id/fraud-check')
  @Roles(UserRole.ADMIN, UserRole.ADJUSTER)
  async checkFraudIndicators(@Param('id') claimId: string) {
    this.logger.log(`Checking fraud indicators for claim ${claimId}`);
    const result = await this.decisionService.checkFraudIndicators(claimId);
    return {
      success: true,
      data: result,
    };
  }
}
