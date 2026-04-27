import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { PricingService } from '../pricing/pricing.service';

export interface DamagedPart {
  partName: string;
  damageType: 'scratch' | 'dent' | 'crack' | 'broken' | 'paint_damage' | 'glass_damage';
  severity: 'minor' | 'moderate' | 'severe';
  confidence: number;
}

export interface AIAnalysisResult {
  damagedParts: DamagedPart[];
  overallSeverity: 'minor' | 'moderate' | 'severe' | 'none';
  overallConfidence: number;
  estimatedRepairCost?: number;
  estimatedPartsCost?: number;
  estimatedLaborCost?: number;
  costEstimate?: {
    min: number;
    max: number;
    recommended: number;
  };
  analysisDetails: string;
  recommendations: string[];
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private readonly apiKey: string;

  constructor(
    private configService: ConfigService,
    private pricingService: PricingService,
  ) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY', '');

    if (!this.apiKey) {
      this.logger.warn('⚠️  GEMINI_API_KEY тохируулагдаагүй байна.');
    } else {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.logger.log('✅ Google Gemini ажиллаж байна (үнэгүй tier)');
    }
  }

  /**
   * Зургийн URL-г fetch хийж base64 болгох
   */
  private async urlToBase64(imageUrl: string): Promise<{ data: string; mimeType: string }> {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Зураг татахад алдаа: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const mimeType = contentType.split(';')[0].trim();

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    return { data: base64, mimeType };
  }

  /**
   * Машины гэмтлийн зургийг Gemini-р шинжлэх
   */
  async analyzeVehicleDamage(
    imageUrl: string,
    vehicleYear?: number,
    vehicleType?: string,
  ): Promise<AIAnalysisResult> {
    if (!this.genAI) {
      throw new Error('Gemini API тохируулагдаагүй байна');
    }

    try {
      this.logger.log(`🔍 Analyzing image: ${imageUrl}`);

      let base64Data: string;
      let mimeType: string;

      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        const result = await this.urlToBase64(imageUrl);
        base64Data = result.data;
        mimeType = result.mimeType;
      } else {
        const fs = require('fs');
        const path = require('path');
        const absPath = imageUrl.startsWith('/')
          ? imageUrl
          : path.join(process.cwd(), imageUrl);
        const ext = path.extname(absPath).toLowerCase();
        mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
        base64Data = fs.readFileSync(absPath).toString('base64');
        this.logger.log(`📁 Local file уншлаа: ${absPath}`);
      }

      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      });

      // ── Машины мэдээлэл бэлтгэх ──────────────────────────────
      const currentYear = new Date().getFullYear();
      const carAge = vehicleYear ? currentYear - vehicleYear : null;
      const carAgeText = carAge !== null
        ? `Машины нас: ${carAge} жил (${vehicleYear} он)`
        : 'Машины нас: тодорхойгүй';
      const carTypeText = vehicleType
        ? `Машины төрөл: ${vehicleType}`
        : 'Машины төрөл: жижиг/дунд суудлын';

      const prompt = `
Та мэргэжлийн машины гэмтэл үнэлэгч юм. Монголын засварын зах зээлийн үнийг мэддэг.
${carAgeText}
${carTypeText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ДААЛГАВАР: Зургийг нарийн шинжилж, ЗӨВХӨН ХАРАГДАЖ БУЙ гэмтлийг тэмдэглэ.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▌SEVERITY АНГИЛАЛЫН СТАНДАРТ (ЯАЖ АНГИЛАХ ВЭ):

● minor (бага):
  - Гадаргуугийн зураас (4мм-с бага гүн)
  - Өнгө арилсан жижиг хэсэг
  - Будагны гадаргуу цоол бус зэврэлт
  - Жижиг тоос/чулуунаас үүссэн цэгэн зураас
  - Арилгах боломжтой гөлгөр гэмтэл
  → Засах аргачлал: цайруулах, будгийн засвар

● moderate (дунд):
  - Гүн зураас (будаг, цааш металл хүрсэн)
  - Жижиг зан (диаметр 3см хүртэл)
  - Хэсэгчилсэн будаг хуулагдсан
  - Жижиг хагарал (5см хүртэл, бүрэн тасрах гүйгүйгээр)
  - Засах боловч сэлбэг солих шаардлагагүй
  → Засах аргачлал: PDR (paintless dent repair), будгийн засвар

● severe (хүнд) — ЗӨВХӨН дараах тохиолдолд:
  - Бүрэн хуга сэлбэг СОЛИХ шаардлагатай
  - Хэлбэр нь алдагдсан (deformed), бутарч хагарсан
  - Том зан (диаметр 10см+)
  - Шил бүрэн хагарсан эсвэл цоорсон
  - Хаалга, бампер ажиллахгүй болсон
  → Засах аргачлал: сэлбэг солих

▌МОНГОЛЫН ЗАСВАРЫН БОДИТ ҮНЭ (2024-2026):

Scratch (зураас):
  minor:    ₮30,000  – ₮80,000
  moderate: ₮80,000  – ₮200,000
  severe:   ₮200,000 – ₮400,000

Dent (зан/царрах):
  minor:    ₮60,000  – ₮180,000
  moderate: ₮180,000 – ₮450,000
  severe:   ₮450,000 – ₮900,000

Crack (хагарал):
  minor:    ₮80,000  – ₮250,000
  moderate: ₮250,000 – ₮550,000
  severe:   ₮550,000 – ₮1,100,000

Broken (эвдрэл/солих):
  minor:    ₮120,000 – ₮350,000
  moderate: ₮350,000 – ₮750,000
  severe:   ₮750,000 – ₮1,800,000

Paint damage (будаг):
  minor:    ₮40,000  – ₮120,000
  moderate: ₮120,000 – ₮320,000
  severe:   ₮320,000 – ₮650,000

Glass damage (шил):
  minor:    ₮80,000  – ₮250,000
  moderate: ₮250,000 – ₮600,000
  severe:   ₮600,000 – ₮1,500,000

▌МАШИНЫ НАС БОЛОН ЗЭРЭГЛЭЛИЙН НЭМЭЛТ ДҮРЭМ:

- 10+ жилийн хуучин машин (Toyota Aqua, Fit, Vitz гэх мэт):
  → Ихэнх гэмтэл нь minor эсвэл moderate ангилалд багтана
  → severe ангилах нь маш ховор — зөвхөн бүрэн солих шаардлагатай үед
  → Нийт гэмтлийн тооцооны дундаж: ₮150,000 – ₮600,000

- 5-10 жилийн машин:
  → Дундаж нийт тооцоо: ₮300,000 – ₮1,200,000

- Шинэ машин (5 жил хүртэл):
  → Дундаж нийт тооцоо: ₮500,000 – ₮2,500,000

▌АЖИГЛАЛТЫН ЗАМ ЧИГЛЭЛ:
1. Зурагт яг харагдаж буй гэмтэл БҮРИЙГ нэг нэгээр тодорхойл
2. Харагдахгүй хэсгийг таамаглаж оруулахгүй
3. Жижиг гэмтлийг хэтрүүлэн severe болгохгүй
4. Нэг хэсгийн олон төрлийн гэмтлийг тусад нь бичихгүй — хамгийн ноцтойг нэг удаа бич

▌ЗАРЧИМ:
"Харсан зүйлийг л бич. Таамаглаагүй. Хэтрүүлэхгүй."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON FORMAT (ЗӨВХӨН JSON, өөр текст байхгүй):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "damagedParts": [
    {
      "partName": "хэсгийн нэр (жишэ: Rear bumper, Left rear door)",
      "damageType": "scratch | dent | crack | broken | paint_damage | glass_damage",
      "severity": "minor | moderate | severe",
      "confidence": 0.0-1.0
    }
  ],
  "overallSeverity": "none | minor | moderate | severe",
  "overallConfidence": 0.0-1.0,
  "analysisDetails": "Монголоор дэлгэрэнгүй тайлбар — харагдаж буй гэмтлийг нарийн дүрсэл",
  "recommendations": ["зөвлөмж 1", "зөвлөмж 2"]
}

ЧУХАЛ ДҮРЭМ:
- Зөвхөн цэвэр JSON өгөх, markdown \`\`\` тэмдэглэгээ ашиглахгүй
- Гэмтэл байхгүй бол "damagedParts": []
- confidence 0.0-1.0 хооронд байх
- damageType зөвхөн: scratch, dent, crack, broken, paint_damage, glass_damage
- severity зөвхөн: minor, moderate, severe
`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
      ]);

      const content = result.response.text();
      this.logger.log(`📝 Gemini хариу: ${content.substring(0, 300)}...`);

      // JSON parse
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;

      let parsedResult: any;
      try {
        parsedResult = JSON.parse(jsonString);
      } catch (parseError) {
        this.logger.error(`❌ JSON parse алдаа: ${content}`, parseError);
        parsedResult = {
          damagedParts: [],
          overallSeverity: 'none',
          overallConfidence: 0,
          analysisDetails: 'Зургийг шинжлэхэд алдаа гарлаа',
          recommendations: [],
        };
      }

      // Validation + type casting
      const aiResult: AIAnalysisResult = {
        damagedParts: Array.isArray(parsedResult.damagedParts)
          ? parsedResult.damagedParts.map((part: any) => ({
              partName: String(part.partName || 'Unknown'),
              damageType: ['scratch', 'dent', 'crack', 'broken', 'paint_damage', 'glass_damage']
                .includes(part.damageType)
                ? part.damageType
                : 'scratch',
              severity: ['minor', 'moderate', 'severe'].includes(part.severity)
                ? part.severity
                : 'minor',
              confidence: Math.min(1, Math.max(0, Number(part.confidence) || 0.7)),
            }))
          : [],
        overallSeverity: ['none', 'minor', 'moderate', 'severe'].includes(
          parsedResult.overallSeverity,
        )
          ? parsedResult.overallSeverity
          : 'none',
        overallConfidence: Math.min(
          1,
          Math.max(0, Number(parsedResult.overallConfidence) || 0),
        ),
        analysisDetails: String(parsedResult.analysisDetails || ''),
        recommendations: Array.isArray(parsedResult.recommendations)
          ? parsedResult.recommendations.map((r: any) => String(r))
          : [],
      };

      // 💰 Засварын үнэ тооцох — vehicleYear дамжуулах
      if (aiResult.damagedParts.length > 0) {
        const estimate = this.pricingService.calculateEstimate(
          aiResult.damagedParts,
          aiResult.overallConfidence,
          vehicleType || 'SEDAN',
          vehicleYear,
        );

        aiResult.estimatedPartsCost = estimate.partsCost.recommended;
        aiResult.estimatedLaborCost = estimate.laborCost.recommended;
        aiResult.estimatedRepairCost =
          estimate.partsCost.recommended + estimate.laborCost.recommended;
        aiResult.costEstimate = {
          min: estimate.totalCost.min,
          max: estimate.totalCost.max,
          recommended: estimate.totalCost.recommended,
        };

        this.logger.log(
          `💰 Үнэлгээ: ₮${estimate.totalCost.min.toLocaleString()} - ₮${estimate.totalCost.max.toLocaleString()}`,
        );
      }

      this.logger.log(
        `✅ Шинжилгээ дууслаа. Гэмтэл: ${aiResult.damagedParts.length} хэсэг`,
      );

      return aiResult;
    } catch (error) {
      this.logger.error('❌ Gemini шинжилгээ амжилтгүй:', error);
      throw error;
    }
  }

  /**
   * Засварын зардал тооцох (fallback)
   */
  estimateRepairCost(damagedParts: DamagedPart[]): number {
    const costMap = {
      scratch:      { minor: 50000,  moderate: 140000,  severe: 280000 },
      dent:         { minor: 100000, moderate: 300000,  severe: 650000 },
      crack:        { minor: 150000, moderate: 380000,  severe: 800000 },
      broken:       { minor: 200000, moderate: 550000,  severe: 1200000 },
      paint_damage: { minor: 70000,  moderate: 200000,  severe: 450000 },
      glass_damage: { minor: 150000, moderate: 400000,  severe: 950000 },
    };

    let totalCost = 0;
    damagedParts.forEach((part) => {
      const costs = costMap[part.damageType] || { minor: 80000, moderate: 250000, severe: 700000 };
      totalCost += costs[part.severity] * (part.confidence || 0.7);
    });

    return Math.round(totalCost);
  }

  isAvailable(): boolean {
    return !!this.apiKey && !!this.genAI;
  }

  getStatus(): { available: boolean; message: string } {
    if (!this.apiKey) {
      return { available: false, message: 'GEMINI_API_KEY тохируулагдаагүй' };
    }
    return { available: true, message: 'Google Gemini ажиллаж байна (үнэгүй)' };
  }
}