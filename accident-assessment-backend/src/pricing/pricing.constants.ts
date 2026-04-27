/**
 * Монголын нөхцөлд тохирсон машины эвдрэлийн засварын үнэ
 * Төгрөгөөр (₮) заасан
 *
 * Last Updated: 2026-04-28
 * Судалсан эх сурвалж: Улаанбаатар хотын засварын газруудын дундаж үнэ
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
 *
 * Ангилалын тодорхойлолт:
 *   minor    — гадаргуугийн зураас, жижиг цэгэн гэмтэл, цайруулах боломжтой
 *   moderate — гүн зураас, жижиг зан, хэсэгчилсэн будаг хуулагдсан
 *   severe   — бүрэн солих шаардлагатай, хэлбэр алдагдсан, том хагарал
 */
export const REPAIR_PRICING: Record<DamageType, Record<Severity, { min: number; max: number }>> = {

  // ── SCRATCH: Зураас, үрчлэх ─────────────────────────────────
  // minor:    гадаргуугийн зураас, будгийн гадна давхарга
  // moderate: гүн зураас, металл харагдсан
  // severe:   маш өргөн, гүн зураас — бүх хэсгийг дахин будах шаардлагатай
  [DamageType.SCRATCH]: {
    [Severity.MINOR]:    { min: 30_000,  max: 80_000 },
    [Severity.MODERATE]: { min: 80_000,  max: 200_000 },
    [Severity.SEVERE]:   { min: 200_000, max: 400_000 },
  },

  // ── DENT: Зан, царрах ────────────────────────────────────────
  // minor:    жижиг зан (диаметр 3см хүртэл), PDR боломжтой
  // moderate: дунд зан (3-8см), будгийн засвартай PDR
  // severe:   том зан (8см+), солих шаардлагатай
  [DamageType.DENT]: {
    [Severity.MINOR]:    { min: 60_000,  max: 180_000 },
    [Severity.MODERATE]: { min: 180_000, max: 450_000 },
    [Severity.SEVERE]:   { min: 450_000, max: 900_000 },
  },

  // ── CRACK: Хагарал ───────────────────────────────────────────
  // minor:    жижиг хагарал (5см хүртэл), зоогдоогүй
  // moderate: дунд хагарал (5-15см), нэг хэсэгт хязгаарлагдсан
  // severe:   урт/гүн хагарал — бүрэн солих шаардлагатай
  [DamageType.CRACK]: {
    [Severity.MINOR]:    { min: 80_000,  max: 250_000 },
    [Severity.MODERATE]: { min: 250_000, max: 550_000 },
    [Severity.SEVERE]:   { min: 550_000, max: 1_100_000 },
  },

  // ── BROKEN: Эвдрэл, хугарал — солих шаардлагатай ────────────
  // minor:    жижиг хэсэг хугарсан (клипс, суваг гэх мэт)
  // moderate: хэсэгчлэн хугарсан — солих шаардлагатай
  // severe:   бүрэн эвдрэл, бүтцийн гэмтэл
  [DamageType.BROKEN]: {
    [Severity.MINOR]:    { min: 120_000, max: 350_000 },
    [Severity.MODERATE]: { min: 350_000, max: 750_000 },
    [Severity.SEVERE]:   { min: 750_000, max: 1_800_000 },
  },

  // ── PAINT_DAMAGE: Будаг эвдрэл ──────────────────────────────
  // minor:    жижиг хэсгийн будаг хуулагдсан/арилсан
  // moderate: дунд хэсгийн будаг хуулагдсан, дахин будах
  // severe:   бүхэл хэсгийг дахин будах шаардлагатай
  [DamageType.PAINT_DAMAGE]: {
    [Severity.MINOR]:    { min: 40_000,  max: 120_000 },
    [Severity.MODERATE]: { min: 120_000, max: 320_000 },
    [Severity.SEVERE]:   { min: 320_000, max: 650_000 },
  },

  // ── GLASS_DAMAGE: Шил эвдрэл ────────────────────────────────
  // minor:    жижиг ан цав (10см хүртэл), наалт боломжтой
  // moderate: дунд хагарал — солих шаардлагатай
  // severe:   бүрэн хагарсан, нунтаглагдсан
  [DamageType.GLASS_DAMAGE]: {
    [Severity.MINOR]:    { min: 80_000,  max: 250_000 },
    [Severity.MODERATE]: { min: 250_000, max: 600_000 },
    [Severity.SEVERE]:   { min: 600_000, max: 1_500_000 },
  },
};

// ────────────────────────────────────────────────────────────────
// CONFIDENCE MULTIPLIER
// AI-ын итгэл өндөр байвал recommended үнэ өндөр болно
// ────────────────────────────────────────────────────────────────
export const CONFIDENCE_MULTIPLIER = {
  HIGH:   1.0,   // 0.8+  итгэл: бүтэн үнэ
  MEDIUM: 0.85,  // 0.6-0.79: 85%
  LOW:    0.70,  // <0.6:  70%
};

// ────────────────────────────────────────────────────────────────
// LABOR COST MULTIPLIER
// Хөдөлмөрийн зардал = сэлбэгийн зардлын % (бодит засварын газрын дундаж)
// ────────────────────────────────────────────────────────────────
export const LABOR_COST_MULTIPLIER = {
  MINOR:    0.20,  // сэлбэгийн 20% — энгийн засвар
  MODERATE: 0.35,  // сэлбэгийн 35% — дунд хэмжээний ажил
  SEVERE:   0.55,  // сэлбэгийн 55% — солих, будах ажил
};

// ────────────────────────────────────────────────────────────────
// MULTI-DAMAGE DISCOUNT
// Олон хэсэг нэг дор засварлавал хөнгөлөлт
// ────────────────────────────────────────────────────────────────
export const MULTI_DAMAGE_DISCOUNT = {
  TWO_OR_MORE:   0.93,  // 7% хөнгөлөлт
  THREE_OR_MORE: 0.87,  // 13% хөнгөлөлт
  FIVE_OR_MORE:  0.80,  // 20% хөнгөлөлт
};

// ────────────────────────────────────────────────────────────────
// VEHICLE TYPE MULTIPLIER
// Машины зэрэглэлээр сэлбэгийн үнэ өөр
// ────────────────────────────────────────────────────────────────
export const VEHICLE_TYPE_MULTIPLIER: Record<string, number> = {
  SEDAN:   1.0,   // Жижиг/дунд суудлын (Aqua, Fit, Vitz, Corolla гэх мэт)
  SUV:     1.20,  // Том SUV (Land Cruiser, Prado, Hilux Surf гэх мэт)
  TRUCK:   1.30,  // Пикап, ачааны
  LUXURY:  1.60,  // Тансаг (Lexus, BMW, Mercedes гэх мэт)
  COMPACT: 0.90,  // Маш жижиг (Kei car)
};

// ────────────────────────────────────────────────────────────────
// VEHICLE AGE DISCOUNT
// Хуучин машинд сэлбэг хямд, засварын стандарт бага
// ────────────────────────────────────────────────────────────────
export const VEHICLE_AGE_DISCOUNT: Array<{ maxAge: number; multiplier: number; label: string }> = [
  { maxAge: 3,   multiplier: 1.00, label: 'Шинэ (3 хүртэл жил)' },
  { maxAge: 7,   multiplier: 0.90, label: 'Харьцангуй шинэ (4-7 жил)' },
  { maxAge: 12,  multiplier: 0.78, label: 'Дунд нас (8-12 жил)' },
  { maxAge: 17,  multiplier: 0.65, label: 'Хуучин (13-17 жил)' },
  { maxAge: 999, multiplier: 0.52, label: 'Маш хуучин (18+ жил)' },
];

/**
 * Машины насаар discount multiplier авах
 */
export function getAgeMultiplier(vehicleYear?: number): number {
  if (!vehicleYear) return 1.0;
  const age = new Date().getFullYear() - vehicleYear;
  const bracket = VEHICLE_AGE_DISCOUNT.find((b) => age <= b.maxAge);
  return bracket?.multiplier ?? 0.52;
}