/**
 * Pricing Service
 * 
 * Монголын нөхцөлд тохирсон машины эвдрэлийн засварын үнэ тооцох сервис
 * 
 * Usage:
 * const estimate = pricingService.calculateEstimate(damagedParts, confidence);
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
  notes: string[];
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  /**
   * AI analysis результатын үндэслэнэ засварын үнэ тооцох
   * 
   * @param damagedParts - AI-аас буцсан эвдэрсэн хэсгүүдийн array
   * @param overallConfidence - AI-ын нийт итгэл (0-1)
   * @param vehicleType - Машины төрөл (SEDAN, SUV, TRUCK, LUXURY)
   * @returns Засварын үнийн үнэлгээ
   */
  calculateEstimate(
    damagedParts: DamagedPart[],
    overallConfidence: number = 0.8,
    vehicleType: string = 'SEDAN',
  ): EstimatedCost {
    if (!damagedParts || damagedParts.length === 0) {
      this.logger.warn('❌ Эвдрэлгүй хэсэг');
      return this.getZeroEstimate();
    }

    // 1️⃣ Хэсэг тус бүрийн үнэ тооцох
    const partEstimates = damagedParts.map((part) =>
      this.estimatePartCost(part),
    );

    // 2️⃣ Нийт хэсгүүдийн үнэ
    const partsCostMin = partEstimates.reduce((sum, p) => sum + p.min, 0);
    const partsCostMax = partEstimates.reduce((sum, p) => sum + p.max, 0);
    const partsCostRecommended = partEstimates.reduce(
      (sum, p) => sum + p.recommended,
      0,
    );

    // 3️⃣ Хөдөлмөрийн үнэ тооцох
    const overallSeverity = this.getOverallSeverity(damagedParts);
    const laborMultiplier = LABOR_COST_MULTIPLIER[overallSeverity] || 0.5;

    const laborCostMin = Math.round(partsCostMin * laborMultiplier);
    const laborCostMax = Math.round(partsCostMax * laborMultiplier);
    const laborCostRecommended = Math.round(partsCostRecommended * laborMultiplier);

    // 4️⃣ Машины төрлөөр үржүүлэх
    const vehicleMultiplier = this.getVehicleMultiplier(vehicleType);
    const totalMin = Math.round((partsCostMin + laborCostMin) * vehicleMultiplier);
    const totalMax = Math.round((partsCostMax + laborCostMax) * vehicleMultiplier);
    const totalRecommended = Math.round(
      (partsCostRecommended + laborCostRecommended) * vehicleMultiplier,
    );

    // 5️⃣ Олон эвдрэлийн хөнгөлөлт
    const discount = this.calculateMultiDamageDiscount(damagedParts.length);
    const finalMin = Math.round(totalMin * discount);
    const finalMax = Math.round(totalMax * discount);
    const finalRecommended = Math.round(totalRecommended * discount);

    // 6️⃣ Итгэл дээр үндэслэнэ adjust хийх
    const confidenceMultiplier = this.getConfidenceMultiplier(overallConfidence);
    const adjustedMin = Math.round(finalMin * confidenceMultiplier);
    const adjustedMax = Math.round(finalMax * confidenceMultiplier);
    const adjustedRecommended = Math.round(
      finalRecommended * confidenceMultiplier,
    );

    // 7️⃣ Түүх үүсгэх
    const notes = this.generateNotes(
      damagedParts.length,
      overallSeverity,
      vehicleType,
      overallConfidence,
      discount,
    );

    this.logger.log(
      `💰 Үнэлгээ: ₮${adjustedMin.toLocaleString()} - ₮${adjustedMax.toLocaleString()} (Санал: ₮${adjustedRecommended.toLocaleString()})`,
    );

    return {
      partsCost: {
        min: Math.round(partsCostMin * vehicleMultiplier * discount * confidenceMultiplier),
        max: Math.round(partsCostMax * vehicleMultiplier * discount * confidenceMultiplier),
        recommended: Math.round(
          partsCostRecommended * vehicleMultiplier * discount * confidenceMultiplier,
        ),
      },
      laborCost: {
        min: Math.round(laborCostMin * vehicleMultiplier * discount * confidenceMultiplier),
        max: Math.round(laborCostMax * vehicleMultiplier * discount * confidenceMultiplier),
        recommended: Math.round(
          laborCostRecommended * vehicleMultiplier * discount * confidenceMultiplier,
        ),
      },
      totalCost: {
        min: adjustedMin,
        max: adjustedMax,
        recommended: adjustedRecommended,
      },
      breakdown: partEstimates.map((est, idx) => ({
        partName: damagedParts[idx].partName,
        damageType: damagedParts[idx].damageType,
        severity: damagedParts[idx].severity,
        estimatedCost: est.recommended,
        confidence: damagedParts[idx].confidence,
      })),
      discount: Math.round((1 - discount) * 100), // Хөнгөлөлтийн хувь
      notes,
    };
  }

  /**
   * Хэсэг тус бүрийн үнэ тооцох
   */
  private estimatePartCost(part: DamagedPart): {
    min: number;
    max: number;
    recommended: number;
  } {
    const damageType = part.damageType.toLowerCase() as DamageType;
    const severity = part.severity.toLowerCase() as Severity;

    // Pricing table-аас авах
    const pricing = REPAIR_PRICING[damageType]?.[severity];

    if (!pricing) {
      this.logger.warn(
        `⚠️  Unknown damage type/severity: ${damageType}/${severity}`,
      );
      return { min: 100000, max: 500000, recommended: 300000 };
    }

    // Итгэлийн үндэслэнэ recommended үнэ тооцох
    const confidenceMultiplier = this.getConfidenceMultiplier(part.confidence);
    const recommended = Math.round(
      pricing.min + (pricing.max - pricing.min) * 0.6 * confidenceMultiplier,
    );

    return {
      min: pricing.min,
      max: pricing.max,
      recommended,
    };
  }

  /**
   * Итгэлийн үржүүлэлт авах
   */
  private getConfidenceMultiplier(confidence: number): number {
    if (confidence >= 0.8) return CONFIDENCE_MULTIPLIER.HIGH;
    if (confidence >= 0.6) return CONFIDENCE_MULTIPLIER.MEDIUM;
    return CONFIDENCE_MULTIPLIER.LOW;
  }

  /**
   * Машины төрлөөр үржүүлэлт авах
   */
  private getVehicleMultiplier(vehicleType: string): number {
    const type = vehicleType?.toUpperCase() || 'SEDAN';
    return VEHICLE_TYPE_MULTIPLIER[type] || VEHICLE_TYPE_MULTIPLIER.SEDAN;
  }

  /**
   * Олон эвдрэлийн хөнгөлөлт
   */
  private calculateMultiDamageDiscount(damageCount: number): number {
    if (damageCount >= 5) return MULTI_DAMAGE_DISCOUNT.FIVE_OR_MORE;
    if (damageCount >= 3) return MULTI_DAMAGE_DISCOUNT.THREE_OR_MORE;
    if (damageCount >= 2) return MULTI_DAMAGE_DISCOUNT.TWO_OR_MORE;
    return 1.0; // No discount for single damage
  }

  /**
   * Нийт ноцтой байдал авах
   */
  private getOverallSeverity(damagedParts: DamagedPart[]): Severity {
    const severities = damagedParts.map((p) => p.severity.toLowerCase());

    if (severities.includes(Severity.SEVERE)) return Severity.SEVERE;
    if (severities.includes(Severity.MODERATE)) return Severity.MODERATE;
    return Severity.MINOR;
  }

  /**
   * Үнэлгээтэй түүх үүсгэх
   */
  private generateNotes(
    damageCount: number,
    severity: Severity,
    vehicleType: string,
    confidence: number,
    discount: number,
  ): string[] {
    const notes: string[] = [];

    if (damageCount === 0) {
      notes.push('Эвдрэл илэрүүлээгүй');
    }

    if (damageCount >= 2) {
      const discountPercent = Math.round((1 - discount) * 100);
      notes.push(`${damageCount} хэсэг эвдэрсэн → ${discountPercent}% хөнгөлөлт`);
    }

    if (severity === Severity.SEVERE) {
      notes.push('⚠️  Том эвдрэл - мэргэжилтэн шалга');
    }

    if (confidence < 0.6) {
      notes.push('⚠️  Бага итгэл - нарийвчилсан үзүүлэлт хийхийг зөвлөж байна');
    }

    if (vehicleType?.toUpperCase() === 'LUXURY') {
      notes.push('💎 Эргэлтийн цаг машины хэсгүүд илүү үнэтэй байж болно');
    }

    return notes;
  }

  /**
   * Үнэ байхгүй үед буцаах
   */
  private getZeroEstimate(): EstimatedCost {
    return {
      partsCost: { min: 0, max: 0, recommended: 0 },
      laborCost: { min: 0, max: 0, recommended: 0 },
      totalCost: { min: 0, max: 0, recommended: 0 },
      breakdown: [],
      discount: 0,
      notes: ['Эвдрэл илэрүүлээгүй'],
    };
  }

  /**
   * Töгрөгийн формат
   */
  formatCurrency(amount: number): string {
    return `₮${amount.toLocaleString('mn-MN')}`;
  }

  /**
   * Үнэлгээг гүйлгээний гүйцэтгэлийн JSON болгох
   */
  toJSON(estimate: EstimatedCost) {
    return {
      ...estimate,
      partsCost: {
        min: this.formatCurrency(estimate.partsCost.min),
        max: this.formatCurrency(estimate.partsCost.max),
        recommended: this.formatCurrency(estimate.partsCost.recommended),
      },
      laborCost: {
        min: this.formatCurrency(estimate.laborCost.min),
        max: this.formatCurrency(estimate.laborCost.max),
        recommended: this.formatCurrency(estimate.laborCost.recommended),
      },
      totalCost: {
        min: this.formatCurrency(estimate.totalCost.min),
        max: this.formatCurrency(estimate.totalCost.max),
        recommended: this.formatCurrency(estimate.totalCost.recommended),
      },
    };
  }
}
