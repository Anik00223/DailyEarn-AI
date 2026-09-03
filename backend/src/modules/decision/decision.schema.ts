import { z } from 'zod';

export const evaluateDecisionSchema = z.object({
  city: z.string().min(2, 'City is required').max(100),
  state: z.string().min(2, 'State is required').max(100),
  targetDailyIncome: z.number().int().min(100).max(25000).default(600),
  availableHoursPerDay: z.number().min(1).max(14).default(4),
  availableCapital: z.number().int().min(0).max(100000).default(0),
  hasVehicle: z.boolean().default(false),
  vehicleType: z.enum(['motorcycle', 'scooter', 'electric_2w', 'bicycle', 'none']).optional(),
  fuelPricePerLiter: z.number().min(50).max(200).optional(),
  vehicleMileageKmPerLiter: z.number().min(10).max(100).optional(),
  dailyTravelDistanceKm: z.number().min(0).max(200).optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  skills: z.array(z.string().min(1).max(50)).min(1, 'Select at least one skill').max(10),
  language: z.enum(['en', 'hi', 'bn', 'te', 'ta', 'mr']).default('en'),
});

export const simulatorRecalculateSchema = z.object({
  opportunitySlug: z.string(),
  hours: z.number().min(0.5).max(14),
  daysPerWeek: z.number().min(1).max(7).default(6).optional(),
  pricePerUnit: z.number().min(1),
  unitsPerHour: z.number().min(0.1).max(20),
  travelCost: z.number().min(0).default(0),
  travelDistanceKm: z.number().min(0).max(150).optional(),
  fuelPricePerLiter: z.number().min(50).max(200).optional(),
  vehicleMileageKmPerLiter: z.number().min(10).max(100).optional(),
  materialCost: z.number().min(0).default(0),
  platformFeePercent: z.number().min(0).max(100).default(0),
  targetDailyIncome: z.number().min(100).default(600),
});

export const savePlanSchema = z.object({
  opportunitySlug: z.string(),
  opportunityName: z.string(),
  platform: z.string(),
  targetDailyEarn: z.string(),
  days: z.array(
    z.object({
      dayNumber: z.number().int().min(1).max(7),
      title: z.string(),
      focus: z.string(),
      actionItems: z.array(z.string()),
      estimatedMinutes: z.number(),
      completed: z.boolean().default(false),
    })
  ),
  notes: z.string().optional(),
});

export const recordOutcomeSchema = z.object({
  opportunitySlug: z.string(),
  city: z.string(),
  attempted: z.boolean().default(true),
  firstStepCompleted: z.boolean().default(false),
  predictedDailyIncome: z.number().int().min(0),
  actualDailyEarned: z.number().int().min(0),
  hoursSpent: z.number().min(0).max(24),
  costsIncurred: z.number().int().min(0).default(0),
  wasEstimateAccurate: z.boolean().optional(),
  feedbackNotes: z.string().max(1000).optional(),
});

export function isQualitativeTextOnly(text: string): { valid: boolean; reason?: string } {
  if (!text || typeof text !== 'string') {
    return { valid: false, reason: 'Empty or non-string input' };
  }

  // 1. Any numeric digits are strictly forbidden in qualitative text
  if (/\d/.test(text)) {
    return { valid: false, reason: 'Contains numeric digits' };
  }

  // 2. Currency symbols or currency terms
  if (/[₹$€£]|\b(?:rs\.?|inr|rupees?|paisa|paise)\b/i.test(text)) {
    return { valid: false, reason: 'Contains currency symbols or currency terms' };
  }

  // 3. Percent signs or percentage words
  if (/%|\b(?:percent(?:age)?|pct)\b/i.test(text)) {
    return { valid: false, reason: 'Contains percentage terms or % symbol' };
  }

  // 4. Numbers written as words (e.g. "ninety-two", "one hundred", "eight hundred", "fifty", etc.)
  const numberWordsRegex =
    /\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:-(?:one|two|three|four|five|six|seven|eight|nine))?\s*(?:hundred|thousand|lakh|crore)?\b/i;
  if (numberWordsRegex.test(text) || /\b(?:hundred|thousand|lakh|crore)\b/i.test(text)) {
    return { valid: false, reason: 'Contains numeric words' };
  }

  // 5. Explicit rank references written as words (e.g. "first-ranked", "rank one", "top-ranked")
  if (/\b(?:first|second|third|fourth|fifth|top)-?ranked\b/i.test(text) || /\brank\s+(?:one|two|three)\b/i.test(text)) {
    return { valid: false, reason: 'Contains rank references' };
  }

  // 6. Explicit score claims or financial metrics terms
  if (/\b(?:score|scoring|target[- ]gap|shortfall|net[- ]income|gross[- ]income)\b/i.test(text)) {
    return { valid: false, reason: 'Contains scoring or financial metrics terms' };
  }

  return { valid: true };
}

export const aiEnrichmentResponseSchema = z.object({
  why_recommended: z
    .string()
    .max(500)
    .refine((val) => isQualitativeTextOnly(val).valid, {
      message: 'why_recommended must contain strictly qualitative reasoning without numbers, ranks, or financial values',
    })
    .optional(),
  tips: z
    .array(
      z.object({
        slug: z.string(),
        city_specific_tip: z.string().max(500),
      })
    )
    .optional(),
});

export type EvaluateDecisionInput = z.infer<typeof evaluateDecisionSchema>;
export type SimulatorRecalculateInput = z.infer<typeof simulatorRecalculateSchema>;
export type SavePlanInput = z.infer<typeof savePlanSchema>;
export type RecordOutcomeInput = z.infer<typeof recordOutcomeSchema>;
export type AiEnrichmentResponse = z.infer<typeof aiEnrichmentResponseSchema>;
