import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClaimsService } from './claims.service';
import { ClaimsController } from './claims.controller';
import { ClaimDecisionService } from './services/claim-decision.service';
import { ClaimDecisionController } from './controllers/claim-decision.controller';
import { Claim } from './entities/claim.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';

@Module({
  imports: [
    // Claim + Vehicle хоёуланг нь import хийнэ
    // (Service дотор Vehicle ownership шалгахад хэрэгтэй)
    TypeOrmModule.forFeature([Claim, Vehicle]),
  ],
  controllers: [ClaimsController, ClaimDecisionController],
  providers: [ClaimsService, ClaimDecisionService],
  exports: [ClaimsService, ClaimDecisionService],
})
export class ClaimsModule {}