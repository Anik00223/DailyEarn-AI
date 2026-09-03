import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 3001,
    DATABASE_URL: 'postgresql://localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    GROQ_API_KEY: 'test_groq_api_key_for_testing_purposes',
    JWT_ACCESS_SECRET: 'test_access_secret_64chars_minimum_so_zod_does_not_fail_validation_schema',
    JWT_REFRESH_SECRET: 'test_refresh_secret_64chars_minimum_so_zod_does_not_fail_validation_schema',
    BCRYPT_ROUNDS: 12,
    CORS_ORIGIN: 'http://localhost:5173',
    ADMIN_SECRET: 'test_admin_secret_32chars_minimum_ok',
  },
}));

vi.mock('../../config/groq', () => ({
  generateContent: vi.fn().mockResolvedValue(
    JSON.stringify({
      why_recommended: 'Top match based on local tuition demand in student zones.',
      tips: [
        {
          slug: 'neighborhood-tutor',
          city_specific_tip: 'Target residential pockets near Silchar colleges and Tarapur.',
        },
      ],
    })
  ),
}));

vi.mock('../../db/index', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

import { evaluateDecision, recalculateSimulator, getDecisionAnalytics, sanitizeAiRationale } from './decision.service';
import { isQualitativeTextOnly, aiEnrichmentResponseSchema } from './decision.schema';

describe('decision.service', () => {
  it('should evaluate Silchar Teaching case study with 4 hours as FEASIBLE', async () => {
    const result = await evaluateDecision(undefined, {
      city: 'Silchar',
      state: 'Assam',
      targetDailyIncome: 800,
      availableHoursPerDay: 4,
      availableCapital: 0,
      hasVehicle: false,
      experienceLevel: 'beginner',
      skills: ['Teaching'],
      language: 'en',
    });

    expect(result.feasibility).toBeDefined();
    expect(result.feasibility.status).toBe('FEASIBLE');
    expect(result.recommendations.length).toBeGreaterThan(0);

    const top = result.recommendations[0];
    expect(top.opportunity.opportunityName).toContain('Tutor');
    expect(top.financials.netDaily).toBeGreaterThan(0);
    expect(top.scoring.totalScore).toBeGreaterThanOrEqual(70);
    expect(result.primary7DayPlan).toBeDefined();
  });

  it('should evaluate Silchar Teaching with 2 hours showing target shortfall', async () => {
    const result = await evaluateDecision(undefined, {
      city: 'Silchar',
      state: 'Assam',
      targetDailyIncome: 800,
      availableHoursPerDay: 2,
      availableCapital: 0,
      hasVehicle: false,
      experienceLevel: 'beginner',
      skills: ['Teaching'],
      language: 'en',
    });

    expect(result.feasibility.status).toBe('POSSIBLE_WITH_CHANGES');
    expect(result.feasibility.targetGap).toBeGreaterThan(0);
    expect(result.feasibility.requiredChanges.length).toBeGreaterThan(0);
  });

  it('should compute exact deterministic arithmetic in recalculateSimulator', () => {
    const sim = recalculateSimulator({
      opportunitySlug: 'swiggy-delivery-partner',
      hours: 4,
      pricePerUnit: 50,
      unitsPerHour: 2,
      travelCost: 100,
      materialCost: 0,
      platformFeePercent: 10,
      targetDailyIncome: 600,
    });

    // 4 hours * 2 units/hr = 8 orders
    // 8 orders * 50 = 400 gross
    // 10% platform fee = 40
    // 400 - 40 - 100 = 260 net
    expect(sim.expectedUnitsPerDay).toBe(8);
    expect(sim.grossDaily).toBe(400);
    expect(sim.platformFee).toBe(40);
    expect(sim.travelCost).toBe(100);
    expect(sim.netDaily).toBe(260);
    expect(sim.netWeekly).toBe(260 * 6);
    expect(sim.targetGap).toBe(340); // 600 - 260
  });

  it('should return valid telemetry metrics from getDecisionAnalytics', async () => {
    const analytics = await getDecisionAnalytics();
    expect(analytics.averageConfidenceScore).toBeGreaterThan(80);
    expect(analytics.feasibilityDistribution).toBeDefined();
    expect(analytics.topVerifiedPlatforms.length).toBeGreaterThan(0);
  });

  it('should guarantee displayedScore === recommendation.score and displayedRank === recommendation.rank', async () => {
    const result = await evaluateDecision(undefined, {
      city: 'Silchar',
      state: 'Assam',
      targetDailyIncome: 700,
      availableHoursPerDay: 4,
      availableCapital: 500,
      hasVehicle: false,
      experienceLevel: 'intermediate',
      skills: ['Teaching'],
      language: 'en',
    });

    expect(result.recommendations.length).toBeGreaterThan(0);
    result.recommendations.forEach((rec, idx) => {
      // 1. Displayed score must equal backend evaluated score
      expect(rec.score).toBe(rec.scoring.totalScore);
      // 2. Displayed rank must equal the actual sorted rank (1-indexed)
      expect(rec.rank).toBe(idx + 1);
      // 3. Why this ranked rationale must be populated and non-empty
      expect(rec.whyRecommended).toBeDefined();
      expect(rec.whyRecommended!.length).toBeGreaterThan(0);
    });
  });

  it('should strictly sanitize or reject numeric scores, ranks, and financial claims from AI rationale', () => {
    const fallback = 'Deterministic fit based on local demand.';

    // 1. AI rationale containing "92/100" is sanitized/rejected even when 92 is correct
    const aiWithScore = 'Top match with score of 92/100 due to strong local teaching background in Silchar.';
    const result1 = sanitizeAiRationale(aiWithScore, 92, 1, fallback);
    expect(result1).not.toContain('92/100');
    expect(result1).not.toContain('score');

    // 2. AI rationale containing "#1" is sanitized/rejected even when rank 1 is correct
    const aiWithRank = 'Why this is ranked #1 for student coaching across college areas.';
    const result2 = sanitizeAiRationale(aiWithRank, 92, 1, fallback);
    expect(result2).not.toContain('#1');

    // 3. AI rationale containing ₹800 is sanitized/rejected
    const aiWithCurrency = 'Expected to deliver ₹800 per day in net income for your family.';
    const result3 = sanitizeAiRationale(aiWithCurrency, 92, 1, fallback);
    expect(result3).not.toContain('₹800');
    expect(result3).not.toContain('₹');

    // 4. Clean qualitative rationale is preserved
    const cleanQualitative = "Strong alignment with the user's teaching experience and available working time.";
    const result4 = sanitizeAiRationale(cleanQualitative, 92, 1, fallback);
    expect(result4).toBe(cleanQualitative);
  });

  it('should reject adversarial numeric/financial phrases in isQualitativeTextOnly and aiEnrichmentResponseSchema', () => {
    // Adversarial test 1: numbers written as words ("ninety-two out of one hundred")
    const test1 = isQualitativeTextOnly('This match scored ninety-two out of one hundred for your profile.');
    expect(test1.valid).toBe(false);
    expect(aiEnrichmentResponseSchema.safeParse({ why_recommended: 'Scored ninety-two out of one hundred' }).success).toBe(false);

    // Adversarial test 2: "first-ranked"
    const test2 = isQualitativeTextOnly('This is the first-ranked option for your skills.');
    expect(test2.valid).toBe(false);
    expect(aiEnrichmentResponseSchema.safeParse({ why_recommended: 'This is the first-ranked option' }).success).toBe(false);

    // Adversarial test 3: "eight hundred rupees"
    const test3 = isQualitativeTextOnly('You can generate eight hundred rupees each shift.');
    expect(test3.valid).toBe(false);
    expect(aiEnrichmentResponseSchema.safeParse({ why_recommended: 'Earn eight hundred rupees' }).success).toBe(false);

    // Adversarial test 4: "about eight hundred"
    const test4 = isQualitativeTextOnly('You will make about eight hundred daily.');
    expect(test4.valid).toBe(false);
    expect(aiEnrichmentResponseSchema.safeParse({ why_recommended: 'Make about eight hundred daily' }).success).toBe(false);

    // Adversarial test 5: "roughly ₹800"
    const test5 = isQualitativeTextOnly('Delivers roughly ₹800 in daily income.');
    expect(test5.valid).toBe(false);
    expect(aiEnrichmentResponseSchema.safeParse({ why_recommended: 'Delivers roughly ₹800 in income' }).success).toBe(false);

    // Adversarial test 6: percentages written as words ("ninety-five percent confidence")
    const test6 = isQualitativeTextOnly('Modeled with ninety-five percent confidence level.');
    expect(test6.valid).toBe(false);
    expect(aiEnrichmentResponseSchema.safeParse({ why_recommended: 'Ninety-five percent confidence' }).success).toBe(false);

    // Adversarial test 7: financial claims without currency symbols ("net income with shortfall")
    const test7 = isQualitativeTextOnly('Higher net income bridges your shortfall.');
    expect(test7.valid).toBe(false);
    expect(aiEnrichmentResponseSchema.safeParse({ why_recommended: 'Higher net income bridges shortfall' }).success).toBe(false);

    // Baseline test: Clean qualitative reasoning MUST pass
    const cleanRationale = "Strong alignment with the user's teaching experience and available working time.";
    const cleanTest = isQualitativeTextOnly(cleanRationale);
    expect(cleanTest.valid).toBe(true);
    expect(aiEnrichmentResponseSchema.safeParse({ why_recommended: cleanRationale }).success).toBe(true);
  });

  it('should produce fresh, non-stale recommendation metadata when user constraints change', async () => {
    // Run 1: Teaching profile
    const run1 = await evaluateDecision(undefined, {
      city: 'Silchar',
      state: 'Assam',
      targetDailyIncome: 600,
      availableHoursPerDay: 4,
      availableCapital: 0,
      hasVehicle: false,
      experienceLevel: 'beginner',
      skills: ['Teaching'],
      language: 'en',
    });

    const top1 = run1.recommendations[0];
    expect(top1.opportunity.opportunityName).toContain('Tutor');

    // Run 2: Delivery profile with Vehicle
    const run2 = await evaluateDecision(undefined, {
      city: 'Silchar',
      state: 'Assam',
      targetDailyIncome: 900,
      availableHoursPerDay: 6,
      availableCapital: 1000,
      hasVehicle: true,
      vehicleType: 'motorcycle',
      experienceLevel: 'intermediate',
      skills: ['Driving & Delivery'],
      language: 'en',
    });

    const top2 = run2.recommendations[0];
    expect(top2.opportunity.category).toBe('delivery');
    expect(top2.opportunity.slug).not.toBe(top1.opportunity.slug);
    // Ensure run 2 has its own fresh rank, score, and financials
    expect(top2.rank).toBe(1);
    expect(top2.score).toBe(top2.scoring.totalScore);
    expect(top2.financials.expectedUnitsPerDay).toBeGreaterThan(0);
    expect(run2.constraints.availableHoursPerDay).toBe(6);
    expect(run2.constraints.skills).toContain('Driving & Delivery');
  });
});
