import type { SeedOpportunity } from '../db/seeds/verifiedOpportunities';
import type { UserConstraints, FinancialModel, ScoringBreakdown, ScoringWeights } from './types';

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  skillFit: 0.20,
  locationFit: 0.15,
  timeFit: 0.15,
  targetFit: 0.15,
  reliability: 0.15,
  demand: 0.10,
  costFit: 0.05,
  complexityFit: 0.05,
};

export function scoreOpportunity(
  opp: SeedOpportunity,
  constraints: UserConstraints,
  financials: FinancialModel,
  customWeights?: Partial<ScoringWeights>
): ScoringBreakdown {
  const weights: ScoringWeights = { ...DEFAULT_SCORING_WEIGHTS, ...customWeights };
  const positiveDrivers: string[] = [];
  const negativeDrivers: string[] = [];

  // 1. Skill Fit (0 - 100)
  const userSkillsLower = (constraints.skills || []).map((s) => s.toLowerCase().trim());
  const oppSkillsLower = opp.requiredSkills.map((s) => s.toLowerCase().trim());

  let skillFit = 40; // baseline for general tasks
  if (oppSkillsLower.length === 0) {
    skillFit = 85;
    positiveDrivers.push('No prerequisite specialized technical skills required');
  } else {
    const matchedSkills = oppSkillsLower.filter((req) =>
      userSkillsLower.some((usr) => usr.includes(req) || req.includes(usr))
    );
    const matchRatio = matchedSkills.length / oppSkillsLower.length;
    if (matchRatio >= 1) {
      skillFit = 96;
      positiveDrivers.push(`Direct 100% skill match with your stated proficiency in ${matchedSkills.join(', ')}`);
    } else if (matchRatio >= 0.5) {
      skillFit = 85;
      positiveDrivers.push(`Matches primary skill: ${matchedSkills.join(', ')}`);
    } else if (matchRatio > 0) {
      skillFit = 70;
      positiveDrivers.push(`Partial skill crossover with ${matchedSkills.join(', ')}`);
    } else {
      skillFit = opp.minimumSkillLevel === 'beginner' ? 45 : 20;
      negativeDrivers.push('Requires skill ramp-up; non-matching initial background');
    }
  }

  // 2. Location Fit (0 - 100)
  let locationFit = 85;
  const isTier1City = ['mumbai', 'delhi', 'bengaluru', 'hyderabad', 'chennai', 'kolkata', 'pune', 'ahmedabad'].includes(
    constraints.city.toLowerCase().trim()
  );
  if (!isTier1City && opp.supportedLocationTiers.includes('tier3')) {
    locationFit = 95;
    positiveDrivers.push(`Strong active local demand in Tier-2/3 market (${constraints.city})`);
  } else if (!isTier1City && !opp.supportedLocationTiers.includes('tier2') && !opp.supportedLocationTiers.includes('tier3')) {
    locationFit = 30;
    negativeDrivers.push(`Platform has limited coverage in non-metro areas like ${constraints.city}`);
  } else if (opp.supportedLocationTiers.includes('pan_india')) {
    locationFit = 92;
    positiveDrivers.push('Pan-India operational availability across all districts');
  }

  // 3. Time Fit (0 - 100)
  const hours = constraints.availableHoursPerDay || 4;
  let timeFit = 85;
  const minRequiredHours = (opp.typicalTimePerUnitMin / 60) * 1.2;
  if (hours < minRequiredHours) {
    timeFit = 35;
    negativeDrivers.push(`Available time (${hours}h) is below the minimum operational cycle (${Math.round(minRequiredHours * 10) / 10}h)`);
  } else if (hours >= 3 && hours <= 8) {
    timeFit = 95;
    positiveDrivers.push(`Daily time (${hours}h) matches optimal shift throughput`);
  } else if (hours < 3) {
    timeFit = 72;
    negativeDrivers.push(`Short time window (${hours}h) creates scheduling vulnerability during slow intervals`);
  }

  // 4. Target Fit (0 - 100)
  const target = constraints.targetDailyIncome || 500;
  const net = financials.netDaily;
  let targetFit = 50;
  const ratio = net / target;
  if (ratio >= 0.85 && ratio <= 1.35) {
    targetFit = 96;
    positiveDrivers.push(`Directly satisfies target: projected ₹${net}/day aligns with ₹${target}/day goal`);
  } else if (ratio > 1.35) {
    targetFit = 90;
    positiveDrivers.push(`Exceeds daily target by +₹${net - target}/day`);
  } else if (ratio >= 0.60) {
    targetFit = 75;
    positiveDrivers.push(`Covers ${Math.round(ratio * 100)}% of daily target baseline`);
  } else if (ratio >= 0.35) {
    targetFit = 55;
    negativeDrivers.push(`Covers only ${Math.round(ratio * 100)}% of target; requires additional stream or hours`);
  } else {
    targetFit = 30;
    negativeDrivers.push(`Substantial shortfall: projected ₹${net}/day is far below requested ₹${target}/day`);
  }

  // 5. Reliability (0 - 100)
  const reliability = opp.reliabilityScore || 85;
  if (reliability >= 90) {
    positiveDrivers.push('High operational reliability score with established payment cadence');
  }

  // 6. Demand Level (0 - 100)
  let demand = 75;
  if (opp.demandLevel === 'surging') {
    demand = 98;
    positiveDrivers.push('Surging consumer demand in current quarter');
  } else if (opp.demandLevel === 'high') {
    demand = 90;
    positiveDrivers.push('Consistently high daily transaction volume');
  } else if (opp.demandLevel === 'medium') {
    demand = 75;
  } else {
    demand = 55;
    negativeDrivers.push('Cyclical or seasonal consumer demand variability');
  }

  // 7. Cost Fit (0 - 100)
  const userCapital = constraints.availableCapital || 0;
  let costFit = 100;
  let costPenalty = 0;
  if (opp.startupCostMin > userCapital) {
    const deficit = opp.startupCostMin - userCapital;
    costPenalty = 25;
    costFit = Math.max(10, Math.round(100 - deficit / 20));
    negativeDrivers.push(`Startup requirement (₹${opp.startupCostMin}) exceeds available capital (₹${userCapital})`);
  } else {
    positiveDrivers.push(`Startup capital requirement within your budget (₹${userCapital} available)`);
  }

  // 8. Complexity / Asset Fit (0 - 100)
  let complexityFit = 100;
  let complexityPenalty = 0;
  if (opp.requiresVehicle && !constraints.hasVehicle) {
    complexityPenalty += 40;
    complexityFit -= 50;
    negativeDrivers.push('Mandatory vehicle missing from user asset profile');
  }
  if (opp.minimumSkillLevel === 'advanced' && constraints.experienceLevel === 'beginner') {
    complexityPenalty += 20;
    complexityFit -= 30;
    negativeDrivers.push('Advanced experience prerequisite vs beginner profile');
  }
  complexityFit = Math.max(10, Math.min(100, complexityFit));

  // 9. Weighted Composite Score
  // Note: Weights are heuristic and configurable, not scientifically or statistically optimized.
  const weightedSum =
    skillFit * weights.skillFit +
    locationFit * weights.locationFit +
    timeFit * weights.timeFit +
    targetFit * weights.targetFit +
    reliability * weights.reliability +
    demand * weights.demand +
    costFit * weights.costFit +
    complexityFit * weights.complexityFit;

  // Penalties explicitly applied to composite score
  const totalScore = Math.max(5, Math.min(99, Math.round(weightedSum - costPenalty - complexityPenalty)));

  // 10. Primary Explanatory Reason (Objective score justification)
  let primaryReason = `Strong ${constraints.skills[0] || 'stated'} skill fit (${skillFit}/100) and verified local demand in ${constraints.city}.`;
  if (complexityPenalty > 30) {
    primaryReason = 'Penalized due to mandatory vehicle/asset dependency.';
  } else if (costPenalty > 0) {
    primaryReason = `Constrained by ₹${opp.startupCostMin} startup capital which exceeds available funds.`;
  } else if (targetFit >= 90 && skillFit >= 85) {
    primaryReason = `High skill match (${skillFit}/100) delivering ~₹${net}/day, aligning with your ₹${target}/day target within ${hours}h.`;
  } else if (timeFit < 50) {
    primaryReason = `Constrained by daily available time (${hours}h) for full operational throughput.`;
  }

  return {
    totalScore,
    skillFit,
    locationFit,
    timeFit,
    targetFit,
    reliability,
    demand,
    costFit,
    complexityFit,
    costPenalty,
    complexityPenalty,
    positiveDrivers,
    negativeDrivers,
    weightsUsed: weights,
    primaryReason,
  };
}
