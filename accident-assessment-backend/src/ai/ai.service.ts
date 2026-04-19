// src/ai/ai.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PricingService } from '../pricing/pricing.service';

export interface DamagedPart {
  partName: string;
  damageType: 'scratch' | 'dent' | 'crack' | 'broken' | 'paint_damage' | 'glass_damage';
  severity: 'minor' | 'moderate' | 'severe';
  confidence: number; // 0-1
}

export interface AIAnalysisResult {
  damagedParts: DamagedPart[];
  overallSeverity: 'minor' | 'moderate' | 'severe' | 'none';
  overallConfidence: number; // 0-1
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
  private openai: OpenAI;
  private readonly apiKey: string;

  constructor(
    private configService: ConfigService,
    private pricingService: PricingService,
  ) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY', '');

    if (!this.apiKey) {
      this.logger.warn(
        '⚠️  OPENAI_API_KEY not set. AI analysis will be disabled.',
      );
    } else {
      this.openai = new OpenAI({ apiKey: this.apiKey });
      this.logger.log('✅ OpenAI initialized');
    }
  }

  /**
   * Analyze vehicle damage from image URL using GPT-4 Vision
   */
  async analyzeVehicleDamage(imageUrl: string): Promise<AIAnalysisResult> {
    if (!this.apiKey) {
      this.logger.error('OpenAI API key not configured');
      throw new Error('AI service not available');
    }

    try {
      this.logger.log(`🔍 Analyzing image: ${imageUrl}`);

      const prompt = `
Та машины гэмтлийн зургийг шинжилж дараах JSON форматаар хариулна уу.

**Даалгавар:**
1. Зурагт эвдэрсэн хэсгүүдийг тодорхойлох
2. Эвдрэлийн төрлийг тодорхойлох
3. Ноцтой байдлыг үнэлэх (0-1 confidence)
4. Нийт ноцтой байдлыг үнэлэх

**JSON Format (ҮНЭМЛЭХҮҮНИЙ JSON ХАРИУЛТ):**
{
  "damagedParts": [
    {
      "partName": "хэсгийн нэр (жишээ: 'Front bumper', 'Hood', 'Door')",
      "damageType": "scratch | dent | crack | broken | paint_damage | glass_damage",
      "severity": "minor | moderate | severe",
      "confidence": 0.0-1.0
    }
  ],
  "overallSeverity": "none | minor | moderate | severe",
  "overallConfidence": 0.0-1.0,
  "analysisDetails": "Дэлгэрэнгүй тайлбар",
  "recommendations": ["зөвлөмж 1", "зөвлөмж 2"]
}

**Чухал:**
- Зүгээр JSON-г өгөх, өөр текст байхгүй
- Хэрэв гэмтэл байхгүй бол "damagedParts": []
- Confidence нь 0.0-ээс 1.0 хүртэл тоо байх ёстой
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || '{}';

      // 1️⃣ JSON хэсгийг гаргаж авах
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;

      // 2️⃣ JSON parse хамгаал
      let parsedResult;
      try {
        parsedResult = JSON.parse(jsonString);
      } catch (parseError) {
        this.logger.error(
          `❌ JSON parse failed. Raw content: ${content}`,
          parseError,
        );
        // Parse амсаагүй үед default value буцаа
        parsedResult = {
          damagedParts: [],
          overallSeverity: 'none',
          overallConfidence: 0,
          analysisDetails: 'JSON parse алдаа - гаралтыг хэвэгтэг шалгана уу',
          recommendations: [],
        };
      }

      // 3️⃣ Validation + Type casting
      const result: AIAnalysisResult = {
        damagedParts: Array.isArray(parsedResult.damagedParts)
          ? parsedResult.damagedParts.map((part: any) => ({
              partName: String(part.partName || 'Unknown'),
              damageType: String(part.damageType || 'scratch'),
              severity: String(part.severity || 'minor'),
              confidence: Math.min(1, Math.max(0, Number(part.confidence) || 0)),
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

      // 💰 PRICING: Засварын үнэ тооцох (Monbile нөхцөлд тохирсон)
      if (result.damagedParts.length > 0) {
        const estimate = this.pricingService.calculateEstimate(
          result.damagedParts,
          result.overallConfidence,
          'SEDAN', // Default vehicle type
        );

        result.estimatedPartsCost = estimate.partsCost.recommended;
        result.estimatedLaborCost = estimate.laborCost.recommended;
        result.estimatedRepairCost =
          estimate.partsCost.recommended + estimate.laborCost.recommended;
        result.costEstimate = {
          min: estimate.totalCost.min,
          max: estimate.totalCost.max,
          recommended: estimate.totalCost.recommended,
        };

        this.logger.log(
          `💰 Засварын үнэлгээ: ₮${estimate.totalCost.min.toLocaleString()} - ₮${estimate.totalCost.max.toLocaleString()} (Санал: ₮${estimate.totalCost.recommended.toLocaleString()})`,
        );
      }

      this.logger.log(
        `✅ Analysis complete. Damaged parts found: ${result.damagedParts.length}`,
      );

      return result;
    } catch (error) {
      this.logger.error('❌ AI analysis failed:', error);
      // Service алдаа нь queue retry логик сүүлээ
      throw error;
    }
  }

  /**
   * Estimate repair cost based on damaged parts
   */
  estimateRepairCost(damagedParts: DamagedPart[]): number {
    // Simple cost estimation (можно улучшить)
    const costMap = {
      scratch: { minor: 50, moderate: 150, severe: 300 },
      dent: { minor: 100, moderate: 300, severe: 500 },
      crack: { minor: 200, moderate: 500, severe: 1000 },
      broken: { minor: 300, moderate: 800, severe: 2000 },
      paint_damage: { minor: 100, moderate: 300, severe: 600 },
      glass_damage: { minor: 150, moderate: 400, severe: 1000 },
    };

    let totalCost = 0;

    damagedParts.forEach((part) => {
      const costs = costMap[part.damageType] || { minor: 100, moderate: 300, severe: 1000 };
      const baseCost = costs[part.severity] || 0;
      // Confidence-г үндэслэн зэргэлдэх
      totalCost += baseCost * (part.confidence || 0.5);
    });

    return Math.round(totalCost);
  }

  /**
   * Health check for AI service
   */
  isAvailable(): boolean {
    return !!this.apiKey && !!this.openai;
  }

  /**
   * Get service status
   */
  getStatus(): { available: boolean; message: string } {
    if (!this.apiKey) {
      return {
        available: false,
        message: 'OpenAI API key not configured',
      };
    }

    return {
      available: true,
      message: 'AI service ready',
    };
  }
}
