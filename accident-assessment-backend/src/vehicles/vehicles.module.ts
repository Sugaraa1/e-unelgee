import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { Vehicle } from './entities/vehicle.entity';
import { VehiclesCatalogController } from './vehicles-catalog.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle])],
  controllers: [VehiclesController, VehiclesCatalogController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}