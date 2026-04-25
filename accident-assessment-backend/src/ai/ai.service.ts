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
  async analyzeVehicleDamage(imageUrl: string): Promise<AIAnalysisResult> {
    if (!this.genAI) {
      throw new Error('Gemini API тохируулагдаагүй байна');
    }

    try {
      this.logger.log(`🔍 Analyzing image: ${imageUrl}`);

      // Зургийг base64 болгох
      const { data: base64Data, mimeType } = await this.urlToBase64(imageUrl);

      // Gemini Flash загвар ашиглах (үнэгүй)
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
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

      const prompt = `
Та машины гэмтлийн зургийг шинжилж дараах JSON форматаар хариулна уу.

**Даалгавар:**
1. Зурагт эвдэрсэн хэсгүүдийг тодорхойлох
2. Эвдрэлийн төрлийг тодорхойлох  
3. Ноцтой байдлыг үнэлэх
4. Нийт ноцтой байдлыг үнэлэх

**JSON Format (ЗӨВХӨН JSON ХАРИУЛНА, өөр текст байхгүй):**
{
  "damagedParts": [
    {
      "partName": "хэсгийн нэр (жишэ: Front bumper, Hood, Door)",
      "damageType": "scratch | dent | crack | broken | paint_damage | glass_damage",
      "severity": "minor | moderate | severe",
      "confidence": 0.0-1.0
    }
  ],
  "overallSeverity": "none | minor | moderate | severe",
  "overallConfidence": 0.0-1.0,
  "analysisDetails": "Дэлгэрэнгүй тайлбар монголоор",
  "recommendations": ["зөвлөмж 1", "зөвлөмж 2"]
}

**Чухал дүрэм:**
- Зөвхөн цэвэр JSON өгөх, markdown \`\`\` тэмдэглэгээ ашиглахгүй
- Хэрэв гэмтэл байхгүй бол "damagedParts": []
- Confidence 0.0-ээс 1.0 хүртэл тоо байх ёстой
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
      this.logger.log(`📝 Gemini хариу: ${content.substring(0, 200)}...`);

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

      // 💰 Засварын үнэ тооцох
      if (aiResult.damagedParts.length > 0) {
        const estimate = this.pricingService.calculateEstimate(
          aiResult.damagedParts,
          aiResult.overallConfidence,
          'SEDAN',
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
      scratch: { minor: 50000, moderate: 150000, severe: 300000 },
      dent: { minor: 100000, moderate: 300000, severe: 500000 },
      crack: { minor: 200000, moderate: 500000, severe: 1000000 },
      broken: { minor: 300000, moderate: 800000, severe: 2000000 },
      paint_damage: { minor: 100000, moderate: 300000, severe: 600000 },
      glass_damage: { minor: 150000, moderate: 400000, severe: 1000000 },
    };

    let totalCost = 0;
    damagedParts.forEach((part) => {
      const costs = costMap[part.damageType] || { minor: 100000, moderate: 300000, severe: 1000000 };
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