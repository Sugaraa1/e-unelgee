import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  getBrandsPopularFirst,
  VEHICLE_CATALOG,
  VEHICLE_COLORS,
  getYearRange,
} from './vehicle-catalog.data';

@ApiTags('Vehicle Catalog')
@Controller('vehicles/catalog')
export class VehiclesCatalogController {
  /**
   * GET /vehicles/catalog/brands
   * Брэндийн жагсаалт — Монголд түгээмэл эхлээд
   */
  @Get('brands')
  @ApiOperation({ summary: 'Машины брэндийн жагсаалт' })
  getBrands() {
    const brands = getBrandsPopularFirst().map((b) => ({
      name: b.name,
      country: b.country,
      popularInMongolia: b.popularInMongolia ?? false,
      modelCount: b.models.length,
    }));
    return { success: true, data: brands };
  }

  /**
   * GET /vehicles/catalog/models?brand=Toyota
   * Брэндэд харгалзах загваруудын жагсаалт
   */
  @Get('models')
  @ApiOperation({ summary: 'Сонгосон брэндийн загваруудын жагсаалт' })
  @ApiQuery({ name: 'brand', required: true, description: 'Брэндийн нэр (жишэ: Toyota)' })
  getModels(@Query('brand') brand: string) {
    const found = VEHICLE_CATALOG.find(
      (b) => b.name.toLowerCase() === brand.toLowerCase(),
    );
    if (!found) {
      return { success: true, data: [] };
    }
    return { success: true, data: found.models };
  }

  /**
   * GET /vehicles/catalog/years
   * Он жилийн жагсаалт (шинэнээс эхэлнэ)
   */
  @Get('years')
  @ApiOperation({ summary: 'Он жилийн жагсаалт (1990–одоо)' })
  getYears() {
    return { success: true, data: getYearRange() };
  }

  /**
   * GET /vehicles/catalog/colors
   * Өнгөний жагсаалт
   */
  @Get('colors')
  @ApiOperation({ summary: 'Машины өнгөний жагсаалт' })
  getColors() {
    return { success: true, data: VEHICLE_COLORS };
  }

  /**
   * GET /vehicles/catalog/all
   * Бүх каталог нэг дор (frontend cache-д зориулсан)
   */
  @Get('all')
  @ApiOperation({ summary: 'Бүх каталог нэг хүсэлтээр (cache-д тохиромжтой)' })
  getAll() {
    return {
      success: true,
      data: {
        brands: getBrandsPopularFirst().map((b) => ({
          name: b.name,
          country: b.country,
          popularInMongolia: b.popularInMongolia ?? false,
        })),
        modelsByBrand: Object.fromEntries(
          VEHICLE_CATALOG.map((b) => [b.name, b.models]),
        ),
        years: getYearRange(),
        colors: VEHICLE_COLORS,
      },
    };
  }
}