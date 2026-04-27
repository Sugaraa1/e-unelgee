/**
 * Pricing Service
 *
 * Монголын нөхцөлд тохирсон машины гэмтлийн засварын үнэ тооцох сервис
 * Машины нас, төрөл, гэмтлийн тоо болон AI итгэлийг харгалзан тооцно.
 *
 * Usage:
 *   const estimate = pricingService.calculateEstimate(
 *     damagedParts, confidence, 'SEDAN', 2014
 *   );
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  DamageType,
  Severity,
  REPAIR_PRICING,
  CONFIDENCE_MULTIPLIER,
  LABOR_COST_MULTIPLIER,
  MULTI_DAMAGE_DISCOUNT,
  VEHICLE_TYPE_MULTIPLIER,
  getAgeMultiplier,
} from './pricing.constants';

export interface DamagedPart {
  partName: string;
  damageType: string;
  severity: string;
  confidence: number;
}

export interface EstimatedCost {
  partsCost: {
    min: number;
    max: number;
    recommended: number;
  };
  laborCost: {
    min: number;
    max: number;
    recommended: number;
  };
  totalCost: {
    min: number;
    max: number;
    recommended: number;
  };
  breakdown: {
    partName: string;
    damageType: string;
    severity: string;
    estimatedCost: number;
    confidence: number;
  }[];
  discount: number;
  ageMultiplier: number;
  vehicleAgeLabel?: string;
  notes: string[];
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  /**
   * Засварын үнэ тооцох үндсэн функц
   *
   * @param damagedParts   - AI-аас буцсан гэмтсэн хэсгүүд
   * @param overallConfidence - AI-ын нийт итгэл (0–1)
   * @param vehicleType    - Машины төрөл (SEDAN, SUV, TRUCK, LUXURY, COMPACT)
   * @param vehicleYear    - Машины үйлдвэрлэгдсэн он (жишэ: 2014)
   */
  calculateEstimate(
    damagedParts: DamagedPart[],
    overallConfidence: number = 0.8,
    vehicleType: string = 'SEDAN',
    vehicleYear?: number,
  ): EstimatedCost {
    if (!damagedParts || damagedParts.length === 0) {
      this.logger.warn('❌ Гэмтэлгүй хэсэг');
      return this.getZeroEstimate();
    }

    // 1️⃣ Хэсэг тус бүрийн сэлбэгийн үнэ
    const partEstimates = damagedParts.map((part) =>
      this.estimatePartCost(part),
    );

    // 2️⃣ Нийт сэлбэгийн үнэ
    const partsCostMin         = partEstimates.reduce((s, p) => s + p.min, 0);
    const partsCostMax         = partEstimates.reduce((s, p) => s + p.max, 0);
    const partsCostRecommended = partEstimates.reduce((s, p) => s + p.recommended, 0);

    // 3️⃣ Нийт ноцтой байдлын түвшин тодорхойлох
    const overallSeverity = this.getOverallSeverity(damagedParts);

    // 4️⃣ Хөдөлмөрийн зардал тооцох
    const laborKey = overallSeverity.toUpperCase() as keyof typeof LABOR_COST_MULTIPLIER;
    const laborMultiplier = LABOR_COST_MULTIPLIER[laborKey] ?? 0.35;

    const laborCostMin         = Math.round(partsCostMin * laborMultiplier);
    const laborCostMax         = Math.round(partsCostMax * laborMultiplier);
    const laborCostRecommended = Math.round(partsCostRecommended * laborMultiplier);

    // 5️⃣ Машины төрлийн үржүүлэгч
    const vehicleMultiplier = this.getVehicleMultiplier(vehicleType);

    // 6️⃣ Машины насны хөнгөлөлт
    const ageMultiplier = getAgeMultiplier(vehicleYear);
    const ageLabel      = this.getAgeLabel(vehicleYear);

    // 7️⃣ Олон гэмтлийн хөнгөлөлт
    const multiDiscount = this.calculateMultiDamageDiscount(damagedParts.length);

    // 8️⃣ AI итгэлийн засвар
    const confidenceMultiplier = this.getConfidenceMultiplier(overallConfidence);

    // 9️⃣ Нийт тооцоо: сэлбэг + хөдөлмөр → машины төрөл → нас → хөнгөлөлт → итгэл
    const combinedMultiplier = vehicleMultiplier * ageMultiplier * multiDiscount * confidenceMultiplier;

    const totalMin         = Math.round((partsCostMin + laborCostMin) * combinedMultiplier);
    const totalMax         = Math.round((partsCostMax + laborCostMax) * combinedMultiplier);
    const totalRecommended = Math.round((partsCostRecommended + laborCostRecommended) * combinedMultiplier);

    // 🔟 Тайлбар мессежүүд
    const notes = this.generateNotes(
      damagedParts.length,
      overallSeverity,
      vehicleType,
      overallConfidence,
      multiDiscount,
      ageMultiplier,
      vehicleYear,
    );

    this.logger.log(
      `💰 Үнэлгээ: ₮${totalMin.toLocaleString()} – ₮${totalMax.toLocaleString()} ` +
      `(Санал: ₮${totalRecommended.toLocaleString()}) | ` +
      `Нас: ×${ageMultiplier.toFixed(2)} | Төрөл: ×${vehicleMultiplier}`,
    );

    return {
      partsCost: {
        min:         Math.round(partsCostMin * combinedMultiplier),
        max:         Math.round(partsCostMax * combinedMultiplier),
        recommended: Math.round(partsCostRecommended * combinedMultiplier),
      },
      laborCost: {
        min:         Math.round(laborCostMin * combinedMultiplier),
        max:         Math.round(laborCostMax * combinedMultiplier),
        recommended: Math.round(laborCostRecommended * combinedMultiplier),
      },
      totalCost: {
        min:         totalMin,
        max:         totalMax,
        recommended: totalRecommended,
      },
      breakdown: partEstimates.map((est, idx) => ({
        partName:      damagedParts[idx].partName,
        damageType:    damagedParts[idx].damageType,
        severity:      damagedParts[idx].severity,
        estimatedCost: Math.round(est.recommended * combinedMultiplier),
        confidence:    damagedParts[idx].confidence,
      })),
      discount:         Math.round((1 - multiDiscount) * 100),
      ageMultiplier,
      vehicleAgeLabel:  ageLabel,
      notes,
    };
  }

  // ────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ────────────────────────────────────────────────────────────

  /**
   * Нэг хэсгийн сэлбэгийн үнэ тооцох
   */
  private estimatePartCost(part: DamagedPart): {
    min: number;
    max: number;
    recommended: number;
  } {
    const damageType = part.damageType.toLowerCase() as DamageType;
    const severity   = part.severity.toLowerCase() as Severity;
    const pricing    = REPAIR_PRICING[damageType]?.[severity];

    if (!pricing) {
      this.logger.warn(`⚠️  Тодорхойгүй damage/severity: ${damageType}/${severity}`);
      return { min: 60_000, max: 300_000, recommended: 150_000 };
    }

    // Recommended = min дээр 60% нэмэх, итгэлийг харгалзан
    const confidenceMultiplier = this.getConfidenceMultiplier(part.confidence);
    const range       = pricing.max - pricing.min;
    const recommended = Math.round(pricing.min + range * 0.55 * confidenceMultiplier);

    return {
      min: pricing.min,
      max: pricing.max,
      recommended,
    };
  }

  /**
   * AI итгэлийн үржүүлэгч
   */
  private getConfidenceMultiplier(confidence: number): number {
    if (confidence >= 0.80) return CONFIDENCE_MULTIPLIER.HIGH;
    if (confidence >= 0.60) return CONFIDENCE_MULTIPLIER.MEDIUM;
    return CONFIDENCE_MULTIPLIER.LOW;
  }

  /**
   * Машины төрлийн үржүүлэгч
   */
  private getVehicleMultiplier(vehicleType: string): number {
    const type = (vehicleType || 'SEDAN').toUpperCase();
    return VEHICLE_TYPE_MULTIPLIER[type] ?? VEHICLE_TYPE_MULTIPLIER['SEDAN'];
  }

  /**
   * Олон гэмтлийн хөнгөлөлтийн үржүүлэгч
   */
  private calculateMultiDamageDiscount(damageCount: number): number {
    if (damageCount >= 5) return MULTI_DAMAGE_DISCOUNT.FIVE_OR_MORE;
    if (damageCount >= 3) return MULTI_DAMAGE_DISCOUNT.THREE_OR_MORE;
    if (damageCount >= 2) return MULTI_DAMAGE_DISCOUNT.TWO_OR_MORE;
    return 1.0;
  }

  /**
   * Нийт ноцтой байдал тодорхойлох
   */
  private getOverallSeverity(damagedParts: DamagedPart[]): Severity {
    const severities = damagedParts.map((p) => p.severity.toLowerCase());
    if (severities.includes(Severity.SEVERE))   return Severity.SEVERE;
    if (severities.includes(Severity.MODERATE)) return Severity.MODERATE;
    return Severity.MINOR;
  }

  /**
   * Машины насны тайлбар авах
   */
  private getAgeLabel(vehicleYear?: number): string {
    if (!vehicleYear) return 'Нас тодорхойгүй';
    const age = new Date().getFullYear() - vehicleYear;
    if (age <= 3)  return `Шинэ машин (${age} жил)`;
    if (age <= 7)  return `Харьцангуй шинэ (${age} жил)`;
    if (age <= 12) return `Дунд насны машин (${age} жил)`;
    if (age <= 17) return `Хуучин машин (${age} жил)`;
    return `Маш хуучин машин (${age} жил)`;
  }

  /**
   * Тайлбар мессежүүд үүсгэх
   */
  private generateNotes(
    damageCount: number,
    severity: Severity,
    vehicleType: string,
    confidence: number,
    multiDiscount: number,
    ageMultiplier: number,
    vehicleYear?: number,
  ): string[] {
    const notes: string[] = [];

    if (damageCount === 0) {
      notes.push('Гэмтэл илэрүүлээгүй');
      return notes;
    }

    // Машины насны тайлбар
    if (vehicleYear) {
      const age = new Date().getFullYear() - vehicleYear;
      const discount = Math.round((1 - ageMultiplier) * 100);
      if (discount > 0) {
        notes.push(`${vehicleYear} оны машин (${age} жил) → ${discount}% насны хөнгөлөлт тооцов`);
      }
    }

    // Олон гэмтлийн хөнгөлөлт
    if (damageCount >= 2) {
      const discountPct = Math.round((1 - multiDiscount) * 100);
      notes.push(`${damageCount} хэсэг нэгэн зэрэг засварлавал ${discountPct}% хямдарна`);
    }

    // Ноцтой байдлын анхааруулга
    if (severity === Severity.SEVERE) {
      notes.push('⚠️  Хүнд гэмтэл — сэлбэг солих шаардлагатай тул засварын газраар үнэ нягтал');
    }

    // Итгэлийн анхааруулга
    if (confidence < 0.65) {
      notes.push('⚠️  AI итгэл бага (< 65%) — зургийн чанар сайжруулж дахин оролдоно уу');
    } else if (confidence >= 0.90) {
      notes.push('✅ AI итгэл өндөр (90%+) — үнэлгээ найдвартай');
    }

    // Тансаг машин
    if ((vehicleType || '').toUpperCase() === 'LUXURY') {
      notes.push('💎 Тансаг машины сэлбэг илүү үнэтэй байж болно');
    }

    // Ерөнхий зөвлөмж
    notes.push('ℹ️  Энэ үнэлгээ ойролцоо тооцоо бөгөөд засварын газрын эцсийн үнээс зөрүү гарч болно');

    return notes;
  }

  /**
   * Хоосон үнэлгээ
   */
  private getZeroEstimate(): EstimatedCost {
    return {
      partsCost:        { min: 0, max: 0, recommended: 0 },
      laborCost:        { min: 0, max: 0, recommended: 0 },
      totalCost:        { min: 0, max: 0, recommended: 0 },
      breakdown:        [],
      discount:         0,
      ageMultiplier:    1.0,
      vehicleAgeLabel:  '',
      notes:            ['Гэмтэл илэрүүлээгүй'],
    };
  }

  /**
   * Мөнгөн дүнг форматлах
   */
  formatCurrency(amount: number): string {
    return `₮${Math.round(amount).toLocaleString('mn-MN')}`;
  }

  /**
   * JSON форматаар гаргах
   */
  toJSON(estimate: EstimatedCost) {
    return {
      ...estimate,
      partsCost: {
        min:         this.formatCurrency(estimate.partsCost.min),
        max:         this.formatCurrency(estimate.partsCost.max),
        recommended: this.formatCurrency(estimate.partsCost.recommended),
      },
      laborCost: {
        min:         this.formatCurrency(estimate.laborCost.min),
        max:         this.formatCurrency(estimate.laborCost.max),
        recommended: this.formatCurrency(estimate.laborCost.recommended),
      },
      totalCost: {
        min:         this.formatCurrency(estimate.totalCost.min),
        max:         this.formatCurrency(estimate.totalCost.max),
        recommended: this.formatCurrency(estimate.totalCost.recommended),
      },
    };
  }
}