import { describe, it, expect } from 'vitest';
import { calculateFinancialModel } from './incomeEngine';
import { scoreOpportunity } from './scoringEngine';
import { evaluateFeasibility } from './feasibilityEngine';
import { calculateConfidence } from './confidenceEngine';
import { optimizeIncomeMix } from './incomeMixOptimizer';
import { analyzeTargetGap } from './targetGapEngine';
import { generate7DayExecutionPlan } from './executionPlanEngine';
import { VERIFIED_OPPORTUNITIES_SEED } from '../db/seeds/verifiedOpportunities';
import type { UserConstraints, EvaluatedOpportunity, IncomeMixBundle } from './types';

describe('Deterministic Engines Test Suite', () => {
  const swiggyOpp = VERIFIED_OPPORTUNITIES_SEED.find((o) => o.slug === 'swiggy-delivery-partner')!;
  const tutorOpp = VERIFIED_OPPORTUNITIES_SEED.find((o) => o.slug === 'local-home-tutor-school')!;
  const tiffinOpp = VERIFIED_OPPORTUNITIES_SEED.find((o) => o.slug === 'neighborhood-tiffin-service')!;

  const baseConstraints: UserConstraints = {
    city: 'Silchar',
    state: 'Assam',
    targetDailyIncome: 600,
    availableHoursPerDay: 4,
    availableCapital: 500,
    hasVehicle: true,
    experienceLevel: 'beginner',
    skills: ['Driving', 'Teaching'],
  };

  describe('incomeEngine', () => {
    it('should calculate gross, deductions, and net accurately for delivery with fuel costs', () => {
      const model = calculateFinancialModel(swiggyOpp, baseConstraints);
      expect(model.grossDaily).toBeGreaterThan(0);
      expect(model.travelCost).toBeGreaterThan(0); // vehicle delivery includes fuel
      expect(model.netDaily).toBe(model.grossDaily - model.platformFee - model.travelCost - model.materialCost);
      expect(model.rangeLow).toBeLessThanOrEqual(model.netDaily);
      expect(model.rangeHigh).toBeGreaterThanOrEqual(model.netDaily);
      expect(model.formulaExplanation).toContain('gross');
      expect(model.formulaExplanation).toContain('net/day');
    });

    it('should deduct raw material consumable expenses for tiffin service', () => {
      const model = calculateFinancialModel(tiffinOpp, baseConstraints);
      expect(model.materialCost).toBeGreaterThan(0);
      expect(model.netDaily).toBe(model.grossDaily - model.materialCost);
    });

    it('should scale net income with available hours', () => {
      const model2h = calculateFinancialModel(tutorOpp, { ...baseConstraints, availableHoursPerDay: 2 });
      const model4h = calculateFinancialModel(tutorOpp, { ...baseConstraints, availableHoursPerDay: 4 });
      expect(model4h.netDaily).toBeGreaterThan(model2h.netDaily);
    });
  });

  describe('scoringEngine', () => {
    it('should score high for matching skills and verified local opportunity', () => {
      const fin = calculateFinancialModel(tutorOpp, baseConstraints);
      const score = scoreOpportunity(tutorOpp, baseConstraints, fin);
      expect(score.totalScore).toBeGreaterThanOrEqual(75);
      expect(score.skillFit).toBeGreaterThanOrEqual(80);
      expect(score.complexityPenalty).toBe(0);
    });

    it('should apply heavy penalty if mandatory vehicle is missing', () => {
      const fin = calculateFinancialModel(swiggyOpp, { ...baseConstraints, hasVehicle: false });
      const score = scoreOpportunity(swiggyOpp, { ...baseConstraints, hasVehicle: false }, fin);
      expect(score.complexityPenalty).toBeGreaterThanOrEqual(40);
      expect(score.totalScore).toBeLessThan(60);
    });

    it('should apply capital constraint penalty if startup cost exceeds budget', () => {
      const fin = calculateFinancialModel(swiggyOpp, { ...baseConstraints, availableCapital: 0 });
      const score = scoreOpportunity(swiggyOpp, { ...baseConstraints, availableCapital: 0 }, fin);
      expect(score.costPenalty).toBe(25);
    });
  });

  describe('feasibilityEngine', () => {
    it('should mark a realistic target as FEASIBLE', () => {
      const fin = calculateFinancialModel(tutorOpp, baseConstraints);
      const score = scoreOpportunity(tutorOpp, baseConstraints, fin);
      const conf = calculateConfidence(tutorOpp, baseConstraints);
      const evaluated: EvaluatedOpportunity[] = [{ opportunity: tutorOpp, financials: fin, scoring: score, confidence: conf }];

      const verdict = evaluateFeasibility({ ...baseConstraints, targetDailyIncome: 400 }, evaluated);
      expect(verdict.status).toBe('FEASIBLE');
      expect(verdict.targetGap).toBe(0);
    });

    it('should mark an impossible target (e.g. ₹5,000/day with 2h) as UNLIKELY', () => {
      const fin = calculateFinancialModel(tutorOpp, { ...baseConstraints, availableHoursPerDay: 2 });
      const score = scoreOpportunity(tutorOpp, { ...baseConstraints, availableHoursPerDay: 2 }, fin);
      const conf = calculateConfidence(tutorOpp, { ...baseConstraints, availableHoursPerDay: 2 });
      const evaluated: EvaluatedOpportunity[] = [{ opportunity: tutorOpp, financials: fin, scoring: score, confidence: conf }];

      const verdict = evaluateFeasibility(
        { ...baseConstraints, availableHoursPerDay: 2, targetDailyIncome: 5000 },
        evaluated
      );
      expect(verdict.status).toBe('UNLIKELY');
      expect(verdict.headline).toContain('Unlikely');
      expect(verdict.targetGap).toBeGreaterThan(3000);
      expect(verdict.requiredChanges.length).toBeGreaterThan(0);
    });
  });

  describe('confidenceEngine', () => {
    it('should award high confidence to verified platforms with direct skill match', () => {
      const conf = calculateConfidence(tutorOpp, baseConstraints);
      expect(conf.confidencePercent).toBeGreaterThanOrEqual(80);
      expect(conf.positiveDrivers.length).toBeGreaterThan(0);
    });
  });

  describe('incomeMixOptimizer and targetGapEngine', () => {
    it('should bundle complementary opportunities into a dual-stream mix', () => {
      const fin1 = calculateFinancialModel(tutorOpp, baseConstraints);
      const score1 = scoreOpportunity(tutorOpp, baseConstraints, fin1);
      const conf1 = calculateConfidence(tutorOpp, baseConstraints);

      const fin2 = calculateFinancialModel(swiggyOpp, baseConstraints);
      const score2 = scoreOpportunity(swiggyOpp, baseConstraints, fin2);
      const conf2 = calculateConfidence(swiggyOpp, baseConstraints);

      const evaluated: EvaluatedOpportunity[] = [
        { opportunity: tutorOpp, financials: fin1, scoring: score1, confidence: conf1 },
        { opportunity: swiggyOpp, financials: fin2, scoring: score2, confidence: conf2 },
      ];

      const mix = optimizeIncomeMix(baseConstraints, evaluated);
      expect(mix).not.toBeNull();
      expect(mix?.combinedHours).toBeLessThanOrEqual(baseConstraints.availableHoursPerDay + 0.5);
      expect(mix?.combinedNetDaily).toBeGreaterThan(0);

      const gap = analyzeTargetGap({ ...baseConstraints, targetDailyIncome: 1200 }, evaluated[0], mix);
      expect(gap.gap).toBeGreaterThan(0);
      expect(gap.options.length).toBeGreaterThan(0);
    });
  });

  describe('executionPlanEngine', () => {
    it('should generate a 7-day personalized execution plan with actionable items', () => {
      const fin = calculateFinancialModel(tutorOpp, baseConstraints);
      const plan = generate7DayExecutionPlan(tutorOpp, baseConstraints, fin);
      expect(plan.days.length).toBe(7);
      expect(plan.days[0].dayNumber).toBe(1);
      expect(plan.days[6].dayNumber).toBe(7);
      expect(plan.days[0].actionItems.length).toBeGreaterThan(0);
    });
  });

  describe('Dynamic Fuel & Calculation Status (Phase 3 & 4)', () => {
    it('should compute dynamic fuel from distance, mileage, and fuel price', () => {
      const customConstraints: UserConstraints = {
        ...baseConstraints,
        hasVehicle: true,
        vehicleType: 'motorcycle',
        fuelPricePerLiter: 110,
        vehicleMileageKmPerLiter: 40,
        dailyTravelDistanceKm: 20,
      };
      const model = calculateFinancialModel(swiggyOpp, customConstraints);
      // (20 km / 40 km/L) * 110 = 55
      expect(model.fuelCost).toBe(55);
      expect(model.travelCost).toBe(55);
      expect(model.calculationStatus).toBe('MODELLED');
      expect(model.isDefaultFuelAssumption).toBe(false);
      expect(model.inputs.fuelPricePerLiter).toBe(110);
    });

    it('should calculate zero fuel for bicycle and minimal power cost for electric 2W', () => {
      const cycleModel = calculateFinancialModel(swiggyOpp, {
        ...baseConstraints,
        hasVehicle: true,
        vehicleType: 'bicycle',
      });
      expect(cycleModel.fuelCost).toBe(0);

      const evModel = calculateFinancialModel(swiggyOpp, {
        ...baseConstraints,
        hasVehicle: true,
        vehicleType: 'electric_2w',
        dailyTravelDistanceKm: 20,
      });
      // 20 km * 0.35 = 7
      expect(evModel.fuelCost).toBe(7);
    });
  });

  describe('8-Factor Scoring & Realism Ranking (Phase 6, 7 & 8)', () => {
    it('should output positive and negative drivers and 8 factor scores', () => {
      const fin = calculateFinancialModel(tutorOpp, baseConstraints);
      const score = scoreOpportunity(tutorOpp, baseConstraints, fin);
      expect(score.positiveDrivers.length).toBeGreaterThan(0);
      expect(score.costFit).toBe(100);
      expect(score.complexityFit).toBe(100);
      expect(score.weightsUsed.skillFit).toBe(0.20);
      expect(score.primaryReason).toBeDefined();
    });

    it('should return INSUFFICIENT_DATA when candidate list is empty', () => {
      const verdict = evaluateFeasibility(baseConstraints, []);
      expect(verdict.status).toBe('INSUFFICIENT_DATA');
      expect(verdict.headline).toContain('Insufficient');
    });

    it('should order target gap options by user-specific realismScore descending', () => {
      const topOppItem = {
        opportunity: tutorOpp,
        financials: calculateFinancialModel(tutorOpp, baseConstraints),
        scoring: scoreOpportunity(tutorOpp, baseConstraints, calculateFinancialModel(tutorOpp, baseConstraints)),
        confidence: calculateConfidence(tutorOpp, baseConstraints),
      };

      const gap = analyzeTargetGap({ ...baseConstraints, targetDailyIncome: 1500 }, topOppItem, null);
      expect(gap.options.length).toBeGreaterThan(0);
      for (let i = 0; i < gap.options.length - 1; i++) {
        expect(gap.options[i].realismScore).toBeGreaterThanOrEqual(gap.options[i + 1].realismScore);
        expect(gap.options[i].rank).toBe(i + 1);
      }
    });

    it('should dynamically produce DIFFERENT target-gap rankings for different user profiles', () => {
      const topOppItem = {
        opportunity: tutorOpp,
        financials: calculateFinancialModel(tutorOpp, baseConstraints),
        scoring: scoreOpportunity(tutorOpp, baseConstraints, calculateFinancialModel(tutorOpp, baseConstraints)),
        confidence: calculateConfidence(tutorOpp, baseConstraints),
      };

      // User A: 4h/day, Beginner, 1 skill -> Extra hours ranks #1
      const userA: UserConstraints = {
        ...baseConstraints,
        availableHoursPerDay: 4,
        experienceLevel: 'beginner',
        skills: ['Teaching'],
        targetDailyIncome: 1500,
      };
      const gapA = analyzeTargetGap(userA, topOppItem, null);
      expect(gapA.options[0].type).toBe('INCREASE_HOURS');

      // User B: 8h/day, Advanced -> Pricing ranks #1, INCREASE_HOURS penalized
      const userB: UserConstraints = {
        ...baseConstraints,
        availableHoursPerDay: 8,
        experienceLevel: 'advanced',
        skills: ['Teaching'],
        targetDailyIncome: 1500,
      };
      const gapB = analyzeTargetGap(userB, topOppItem, null);
      expect(gapB.options[0].type).toBe('OPTIMIZE_PRICING');
      const hoursOptB = gapB.options.find((o) => o.type === 'INCREASE_HOURS');
      expect(hoursOptB?.rank).toBeGreaterThan(2); // Heavily penalized due to 8h shift

      // User C: 4h/day, 2 compatible skills -> Income mix ranks #1
      const userC: UserConstraints = {
        ...baseConstraints,
        availableHoursPerDay: 4,
        experienceLevel: 'intermediate',
        skills: ['Teaching', 'Canva Design'],
        targetDailyIncome: 1500,
      };
      const mockMix: IncomeMixBundle = {
        title: 'Teaching + Canva Design Bundle',
        primaryOpportunitySlug: 'local-home-tutor-school',
        primaryName: 'Home Tutoring',
        primaryHours: 2.5,
        primaryNetDaily: 600,
        secondaryOpportunitySlug: 'canva-local-marketing-design',
        secondaryName: 'Canva Design',
        secondaryHours: 1.5,
        secondaryNetDaily: 350,
        combinedHours: 4,
        combinedNetDaily: 950,
        compatibilityReason: 'Afternoon teaching paired with evening digital design',
      };
      const gapC = analyzeTargetGap(userC, topOppItem, mockMix);
      expect(gapC.options[0].type).toBe('INCOME_MIX');

      // Assert that all three users received a unique #1 option
      expect(gapA.options[0].type).not.toBe(gapB.options[0].type);
      expect(gapB.options[0].type).not.toBe(gapC.options[0].type);
      expect(gapA.options[0].type).not.toBe(gapC.options[0].type);
    });

    it('should distinguish provenance labels and never emit unsupported assumptions as factual statements', () => {
      const topOppItem = {
        opportunity: tutorOpp,
        financials: calculateFinancialModel(tutorOpp, baseConstraints),
        scoring: scoreOpportunity(tutorOpp, baseConstraints, calculateFinancialModel(tutorOpp, baseConstraints)),
        confidence: calculateConfidence(tutorOpp, baseConstraints),
      };

      const gapAnalysis = analyzeTargetGap({ ...baseConstraints, targetDailyIncome: 1500 }, topOppItem, null);
      const hoursOpt = gapAnalysis.options.find((o) => o.type === 'INCREASE_HOURS')!;
      const pricingOpt = gapAnalysis.options.find((o) => o.type === 'OPTIMIZE_PRICING')!;
      const skillOpt = gapAnalysis.options.find((o) => o.type === 'ADD_SKILL')!;
      const mixOpt = gapAnalysis.options.find((o) => o.type === 'INCOME_MIX')!;

      // 1. INCREASE_HOURS: Modelled capacity, explicitly disclaims health/fatigue
      expect(hoursOpt.evidenceType).toBe('MODELLED');
      expect(hoursOpt.provenanceLabel).toBe('MODELLED ESTIMATE');
      expect(hoursOpt.explanation).toContain('does not assess health or fatigue');
      expect(hoursOpt.explanation.toLowerCase()).not.toContain('well within sustainable energy limits');

      // 2. OPTIMIZE_PRICING: Heuristic assumption, explicitly disclaims guaranteed rates
      expect(pricingOpt.evidenceType).toBe('HEURISTIC');
      expect(pricingOpt.provenanceLabel).toBe('HEURISTIC ASSUMPTION');
      expect(pricingOpt.explanation).toContain('modelled assumption, not a guaranteed market rate');
      expect(pricingOpt.explanation.toLowerCase()).not.toContain('immediately achievable');

      // 3. ADD_SKILL: Heuristic assumption, explicitly disclaims fixed timelines
      expect(skillOpt.evidenceType).toBe('HEURISTIC');
      expect(skillOpt.provenanceLabel).toBe('HEURISTIC ASSUMPTION');
      expect(skillOpt.explanation).toContain('Training time is uncertain and should be treated as a modelled estimate');
      expect(skillOpt.explanation.toLowerCase()).not.toContain('will take 10–14 days');

      // 4. INCOME_MIX: Modelled or user inference
      expect(['MODELLED', 'USER_INFERENCE']).toContain(mixOpt.evidenceType);
      expect(mixOpt.explanation.toLowerCase()).toContain('schedule');
    });

    it('should classify UPGRADE_ASSET as MODELLED ESTIMATE without claiming deterministic earnings', () => {
      const constraintsNoVehicle: UserConstraints = {
        ...baseConstraints,
        hasVehicle: false,
        targetDailyIncome: 1200,
      };

      const topOppItem: EvaluatedOpportunity = {
        opportunity: swiggyOpp,
        financials: calculateFinancialModel(swiggyOpp, constraintsNoVehicle),
        scoring: scoreOpportunity(swiggyOpp, constraintsNoVehicle, calculateFinancialModel(swiggyOpp, constraintsNoVehicle)),
        confidence: calculateConfidence(swiggyOpp, constraintsNoVehicle),
      };

      const gapAnalysis = analyzeTargetGap(constraintsNoVehicle, topOppItem, null);
      const assetOpt = gapAnalysis.options.find((o) => o.type === 'UPGRADE_ASSET');

      expect(assetOpt).toBeDefined();
      expect(assetOpt!.evidenceType).toBe('MODELLED');
      expect(assetOpt!.provenanceLabel).toBe('MODELLED ESTIMATE');
      expect(assetOpt!.evidenceType).not.toBe('DETERMINISTIC');
      expect(assetOpt!.provenanceLabel).not.toBe('DETERMINISTIC FACT');
      expect(assetOpt!.explanation.toLowerCase()).toContain('may unlock');
      expect(assetOpt!.explanation.toLowerCase()).toContain('remain uncertain');
      expect(assetOpt!.explanation.toLowerCase()).not.toContain('deterministically satisfies');
    });
  });
});

