/**
 * Монголын нөхцөлд тохирсон машины эвдрэлийн засварын үнэ
 * Төгрөгөөр (₮) заасан
 * 
 * Last Updated: 2026-04-18
 */

export enum DamageType {
  SCRATCH = 'scratch',
  DENT = 'dent',
  CRACK = 'crack',
  BROKEN = 'broken',
  PAINT_DAMAGE = 'paint_damage',
  GLASS_DAMAGE = 'glass_damage',
}

export enum Severity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  SEVERE = 'severe',
}

/**
 * Засварын үнийн хүрээ (min - max)
 * Төгрөг (₮)
 */
export const REPAIR_PRICING: Record<DamageType, Record<Severity, { min: number; max: number }>> = {
  // SCRATCH: Урах, сүрэлэх үед үйл явцын эвдрэл
  [DamageType.SCRATCH]: {
    [Severity.MINOR]: {
      min: 50000,      // ₮50,000
      max: 150000,     // ₮150,000
    },
    [Severity.MODERATE]: {
      min: 150000,     // ₮150,000
      max: 300000,     // ₮300,000
    },
    [Severity.SEVERE]: {
      min: 300000,     // ₮300,000
      max: 600000,     // ₮600,000
    },
  },

  // DENT: Зан, царруулах эвдрэл
  [DamageType.DENT]: {
    [Severity.MINOR]: {
      min: 150000,     // ₮150,000
      max: 400000,     // ₮400,000
    },
    [Severity.MODERATE]: {
      min: 400000,     // ₮400,000
      max: 800000,     // ₮800,000
    },
    [Severity.SEVERE]: {
      min: 800000,     // ₮800,000
      max: 1500000,    // ₮1,500,000
    },
  },

  // CRACK: Трещина, шалтгалан үүссэн эвдрэл
  [DamageType.CRACK]: {
    [Severity.MINOR]: {
      min: 200000,     // ₮200,000
      max: 500000,     // ₮500,000
    },
    [Severity.MODERATE]: {
      min: 500000,     // ₮500,000
      max: 1000000,    // ₮1,000,000
    },
    [Severity.SEVERE]: {
      min: 1000000,    // ₮1,000,000
      max: 2500000,    // ₮2,500,000
    },
  },

  // BROKEN: Эвдрэлээр үүссэн хувьцаа, сэлбэгийн сольцох шаардлага
  [DamageType.BROKEN]: {
    [Severity.MINOR]: {
      min: 300000,     // ₮300,000
      max: 800000,     // ₮800,000
    },
    [Severity.MODERATE]: {
      min: 800000,     // ₮800,000
      max: 1500000,    // ₮1,500,000
    },
    [Severity.SEVERE]: {
      min: 1500000,    // ₮1,500,000
      max: 3500000,    // ₮3,500,000
    },
  },

  // PAINT_DAMAGE: Будаг эвдрэл - дахин буддаг шаардлага
  [DamageType.PAINT_DAMAGE]: {
    [Severity.MINOR]: {
      min: 100000,     // ₮100,000
      max: 300000,     // ₮300,000
    },
    [Severity.MODERATE]: {
      min: 300000,     // ₮300,000
      max: 600000,     // ₮600,000
    },
    [Severity.SEVERE]: {
      min: 600000,     // ₮600,000
      max: 1200000,    // ₮1,200,000
    },
  },

  // GLASS_DAMAGE: Шил эвдрэл - сольцох шаардлага
  [DamageType.GLASS_DAMAGE]: {
    [Severity.MINOR]: {
      min: 150000,     // ₮150,000
      max: 400000,     // ₮400,000
    },
    [Severity.MODERATE]: {
      min: 400000,     // ₮400,000
      max: 800000,     // ₮800,000
    },
    [Severity.SEVERE]: {
      min: 800000,     // ₮800,000
      max: 1800000,    // ₮1,800,000
    },
  },
};

/**
 * Confidence multiplier
 * AI-ын итгэл өндөр байвал үнэ өндөр
 */
export const CONFIDENCE_MULTIPLIER = {
  HIGH: 1.0,      // 0.8+ confidence: full price
  MEDIUM: 0.85,   // 0.6-0.79 confidence: 85% of max
  LOW: 0.7,       // <0.6 confidence: 70% of max
};

/**
 * Labor cost estimation
 * Хүндийн үржүүлэлт
 */
export const LABOR_COST_MULTIPLIER = {
  MINOR: 0.3,     // 30% of parts cost
  MODERATE: 0.5,  // 50% of parts cost
  SEVERE: 0.8,    // 80% of parts cost
};

/**
 * Multiple damages discount
 * Олон эвдрэл байвал хөнгөлөлт
 */
export const MULTI_DAMAGE_DISCOUNT = {
  TWO_OR_MORE: 0.95,    // 5% discount
  THREE_OR_MORE: 0.90,  // 10% discount
  FIVE_OR_MORE: 0.85,   // 15% discount
};

/**
 * Vehicle type adjustment
 * Машины төрлөөр үнэ өөрчлөгдөнө
 */
export const VEHICLE_TYPE_MULTIPLIER = {
  SEDAN: 1.0,          // Base price
  SUV: 1.15,           // 15% more expensive (larger parts)
  TRUCK: 1.25,         // 25% more expensive
  LUXURY: 1.5,         // 50% more expensive (premium parts)
};
