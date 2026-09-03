import type {
  UserConstraints,
  EvaluatedOpportunity,
  IncomeMixBundle,
  TargetGapOptionType,
  TargetGapEvidenceType,
  WhatItTakesOption,
} from './types';

export type { TargetGapOptionType, TargetGapEvidenceType, WhatItTakesOption };

export interface TargetGapAnalysis {
  target: number;
  bestEstimatedNet: number;
  gap: number;
  percentageAchieved: number;
  options: WhatItTakesOption[];
}

export function computeOptionRealism(
  type: TargetGapOptionType,
  constraints: UserConstraints,
  topOpportunity: EvaluatedOpportunity | undefined,
  currentNet: number,
  gap: number,
  mixBundle: IncomeMixBundle | null
): {
  realismScore: number;
  expectedIncomeImpact: number;
  requiredAdditionalHours: number;
  requiredCapital: number;
  requiredSkillChange: string;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  scheduleCompatibility: 'HIGH' | 'MEDIUM' | 'LOW';
  evidenceType: TargetGapEvidenceType;
  provenanceLabel: 'DETERMINISTIC FACT' | 'HEURISTIC ASSUMPTION' | 'MODELLED ESTIMATE' | 'USER-SPECIFIC INFERENCE';
  title: string;
  explanation: string;
} {
  const currentHours = constraints.availableHoursPerDay || 4;
  const userCapital = constraints.availableCapital || 0;
  const experience = constraints.experienceLevel || 'beginner';
  const userSkillsCount = (constraints.skills || []).length;

  if (type === 'INCREASE_HOURS') {
    const hourlyRate = currentHours > 0 ? currentNet / currentHours : 100;
    const extraHoursNeeded = Math.max(1, Math.min(6, Math.ceil(gap / Math.max(1, hourlyRate))));
    const totalHours = currentHours + extraHoursNeeded;
    const impact = Math.round(extraHoursNeeded * hourlyRate);

    // Realism scoring for increasing hours:
    // If user currently works <= 4h, adding hours is realistic.
    // If user already works >= 8h, heavy fatigue penalty applies.
    let score = 92;
    if (currentHours >= 8) {
      score = 30; // Already working full-day shifts; adding more is unrealistic
    } else if (totalHours > 8) {
      score -= (totalHours - 8) * 20;
    } else if (totalHours > 6) {
      score -= (totalHours - 6) * 10;
    }
    if (extraHoursNeeded > 4) {
      score -= 20;
    }

    const scheduleCompatibility: 'HIGH' | 'MEDIUM' | 'LOW' =
      totalHours <= 7 ? 'HIGH' : totalHours <= 9 ? 'MEDIUM' : 'LOW';

    return {
      realismScore: Math.max(10, Math.min(98, Math.round(score))),
      expectedIncomeImpact: impact,
      requiredAdditionalHours: extraHoursNeeded,
      requiredCapital: 0,
      requiredSkillChange: 'None (Same operational workflow)',
      complexity: 'LOW',
      scheduleCompatibility,
      evidenceType: 'MODELLED',
      provenanceLabel: 'MODELLED ESTIMATE',
      title: `Add +${extraHoursNeeded} Hour${extraHoursNeeded > 1 ? 's' : ''}/day`,
      explanation: `Adding ${extraHoursNeeded} hour(s) increases modeled capacity from ${currentHours}h to ${totalHours}h at your current ₹${Math.round(hourlyRate)}/hr baseline yield (+₹${impact}/day net). The system models capacity mathematically; it does not assess health or fatigue.`,
    };
  }

  if (type === 'OPTIMIZE_PRICING') {
    // Premium Pricing / Small Group Batching:
    // Realism depends on experience level and pricing leverage.
    // 35% price scenario is explicitly marked as a heuristic assumption.
    let score = 42;
    if (experience === 'advanced') {
      score = 90;
    } else if (experience === 'intermediate') {
      score = 72;
    } else {
      score = 42;
    }

    const premiumBoost = Math.round(currentNet * 0.35);
    if (gap <= premiumBoost) {
      score += 6;
    } else if (gap > premiumBoost * 2) {
      score -= 10;
    }

    return {
      realismScore: Math.max(10, Math.min(98, Math.round(score))),
      expectedIncomeImpact: premiumBoost,
      requiredAdditionalHours: 0,
      requiredCapital: 0,
      requiredSkillChange: 'Commercial batching or premium client positioning',
      complexity: experience === 'advanced' ? 'LOW' : 'MEDIUM',
      scheduleCompatibility: 'HIGH',
      evidenceType: 'HEURISTIC',
      provenanceLabel: 'HEURISTIC ASSUMPTION',
      title: 'Target Premium Clients or Batching',
      explanation: `Pricing may have higher upside for experienced users in small group batches or commercial corridors (+₹${premiumBoost}/day). The 35% scenario is a modelled assumption, not a guaranteed market rate.`,
    };
  }

  if (type === 'INCOME_MIX') {
    // Compatible Dual-Stream Income Mix:
    // Realism is highest if user ALREADY possesses 2+ skills and has >= 3h daily.
    let score = 65;
    if (userSkillsCount >= 2) {
      score = 94; // User already has both skills in profile
    }
    if (currentHours < 3) {
      score -= 25; // Splitting time across two streams with < 3h is schedule-prohibitive
    } else if (currentHours >= 4) {
      score += 3;
    }

    const extraFromMix =
      mixBundle && mixBundle.combinedNetDaily > currentNet
        ? mixBundle.combinedNetDaily - currentNet
        : Math.round(currentNet * 0.4);

    if (extraFromMix >= gap * 0.8) {
      score += 5;
    }

    const title = mixBundle
      ? `Activate Income Mix: ${mixBundle.primaryName} + ${mixBundle.secondaryName}`
      : 'Activate Complementary Dual-Stream Mix';

    const evidenceType: TargetGapEvidenceType =
      userSkillsCount >= 2 ? 'USER_INFERENCE' : 'MODELLED';
    const provenanceLabel =
      userSkillsCount >= 2 ? 'USER-SPECIFIC INFERENCE' : 'MODELLED ESTIMATE';

    return {
      realismScore: Math.max(10, Math.min(98, Math.round(score))),
      expectedIncomeImpact: extraFromMix,
      requiredAdditionalHours: 0,
      requiredCapital: 0,
      requiredSkillChange:
        userSkillsCount >= 2
          ? 'None (Both skills declared in user profile)'
          : 'Basic onboarding for secondary micro-gig',
      complexity: userSkillsCount >= 2 ? 'LOW' : 'MEDIUM',
      scheduleCompatibility: currentHours >= 4 ? 'HIGH' : 'MEDIUM',
      evidenceType,
      provenanceLabel,
      title,
      explanation: mixBundle
        ? `Splitting ${currentHours}h daily into ${mixBundle.primaryHours}h on ${mixBundle.primaryName} and ${mixBundle.secondaryHours}h on ${mixBundle.secondaryName} projects +₹${extraFromMix}/day incremental revenue. Non-overlapping schedules are inferred from standard market shifts; multi-platform execution requires active schedule discipline.`
        : `Pairing daytime work with an indoor evening micro-task projects +₹${extraFromMix}/day net. Schedule compatibility is a modelled inference.`,
    };
  }

  if (type === 'ADD_SKILL') {
    // Secondary Micro-Skill Ramp (e.g. Canva design or CSC digital form filling):
    // Realism is higher for beginners with ₹0 capital and available study time.
    let score = 70;
    if (currentHours >= 8) {
      score -= 25; // Working 8h leaves limited study/practice bandwidth
    } else if (currentHours >= 6) {
      score -= 10;
    }
    if (userSkillsCount >= 3) {
      score -= 15; // User already has 3 skills; adding a 4th is rarely priority
    }
    if (experience === 'beginner') {
      score += 2;
    }

    return {
      realismScore: Math.max(10, Math.min(98, Math.round(score))),
      expectedIncomeImpact: 250,
      requiredAdditionalHours: 1,
      requiredCapital: 0,
      requiredSkillChange: 'Acquire digital template workflow (Canva or CSC)',
      complexity: 'MEDIUM',
      scheduleCompatibility: 'HIGH',
      evidenceType: 'HEURISTIC',
      provenanceLabel: 'HEURISTIC ASSUMPTION',
      title: 'Acquire Secondary Digital Micro-Skill (Canva/CSC)',
      explanation:
        'Acquiring a digital workflow skill could unlock complementary indoor evening deliverables (+₹150–₹350/day). Training time is uncertain and should be treated as a modelled estimate, not a guaranteed timeline.',
    };
  }

  // UPGRADE_ASSET
  const assetCost = 15000;
  let score = 25;
  if (userCapital >= assetCost) {
    score = 75;
  } else if (userCapital > 5000) {
    score = 50;
  } else {
    score = 25;
  }

  return {
    realismScore: Math.max(10, Math.min(98, Math.round(score))),
    expectedIncomeImpact: 400,
    requiredAdditionalHours: 0,
    requiredCapital: assetCost,
    requiredSkillChange: 'Two-wheeler driving license & safety orientation',
    complexity: 'HIGH',
    scheduleCompatibility: 'HIGH',
    evidenceType: 'MODELLED',
    provenanceLabel: 'MODELLED ESTIMATE',
    title: 'Access Two-Wheeler Mobility',
    explanation:
      'Vehicle access may unlock vehicle-dependent delivery or transport opportunities. Actual platform eligibility, vehicle ownership or rental, financing terms, maintenance costs, and net daily earnings remain uncertain and are treated as modelled estimates.',
  };
}

export function analyzeTargetGap(
  constraints: UserConstraints,
  topOpportunity: EvaluatedOpportunity | undefined,
  mixBundle: IncomeMixBundle | null
): TargetGapAnalysis {
  const target = constraints.targetDailyIncome || 500;
  const currentNet = topOpportunity ? topOpportunity.financials.netDaily : 0;
  const gap = Math.max(0, target - currentNet);
  const percentageAchieved =
    currentNet > 0 ? Math.min(100, Math.round((currentNet / target) * 100)) : 0;

  const optionTypes: TargetGapOptionType[] = [
    'INCREASE_HOURS',
    'OPTIMIZE_PRICING',
    'INCOME_MIX',
    'ADD_SKILL',
  ];

  if (topOpportunity?.opportunity.requiresVehicle && !constraints.hasVehicle) {
    optionTypes.push('UPGRADE_ASSET');
  }

  const rawOptions: WhatItTakesOption[] = [];

  if (gap > 0 && topOpportunity) {
    for (const optType of optionTypes) {
      const evaluation = computeOptionRealism(
        optType,
        constraints,
        topOpportunity,
        currentNet,
        gap,
        mixBundle
      );

      const feasibilityRating: 'HIGH' | 'MEDIUM' | 'LOW' =
        evaluation.realismScore >= 80 ? 'HIGH' : evaluation.realismScore >= 55 ? 'MEDIUM' : 'LOW';

      rawOptions.push({
        id: `opt_${optType.toLowerCase()}`,
        type: optType,
        optionType: optType,
        title: evaluation.title,
        impactDescription: evaluation.explanation,
        explanation: evaluation.explanation,
        estimatedExtraDaily: evaluation.expectedIncomeImpact,
        expectedIncomeImpact: evaluation.expectedIncomeImpact,
        realismScore: evaluation.realismScore,
        rank: 0, // Assigned after sorting
        requiredAdditionalHours: evaluation.requiredAdditionalHours,
        requiredCapital: evaluation.requiredCapital,
        requiredSkillChange: evaluation.requiredSkillChange,
        complexity: evaluation.complexity,
        scheduleCompatibility: evaluation.scheduleCompatibility,
        feasibilityRating,
        evidenceType: evaluation.evidenceType,
        provenanceLabel: evaluation.provenanceLabel,
      });
    }
  }

  // Sort strictly by user-specific realismScore descending
  rawOptions.sort((a, b) => b.realismScore - a.realismScore);

  // Assign deterministic dynamic rank (1, 2, 3...)
  rawOptions.forEach((opt, idx) => {
    opt.rank = idx + 1;
  });

  return {
    target,
    bestEstimatedNet: currentNet,
    gap,
    percentageAchieved,
    options: rawOptions,
  };
}
