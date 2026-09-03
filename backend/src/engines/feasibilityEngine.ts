import type { UserConstraints, FeasibilityVerdict, EvaluatedOpportunity } from './types';

export function evaluateFeasibility(
  constraints: UserConstraints,
  evaluatedOpps: EvaluatedOpportunity[]
): FeasibilityVerdict {
  const target = constraints.targetDailyIncome || 500;
  const hours = constraints.availableHoursPerDay || 4;

  // Handle Insufficient Data
  if (!evaluatedOpps || evaluatedOpps.length === 0) {
    return {
      status: 'INSUFFICIENT_DATA',
      headline: `Insufficient Verified Evidence for ${constraints.city}`,
      explanation: `No verified local micro-income platforms or benchmarks have been validated for ${constraints.city} under the provided skill profile.`,
      realisticCeilingMin: 0,
      realisticCeilingMax: 0,
      targetGap: target,
      requiredChanges: [
        'Broaden search to regional district hubs or digital remote micro-work',
        'Add foundational local skills (e.g. delivery, tutoring, basic digital typing)',
      ],
    };
  }

  // Find the top realistic candidate that the user is actually eligible for
  const eligibleOpps = evaluatedOpps.filter(
    (e) => e.scoring.complexityPenalty < 30 && e.scoring.costPenalty === 0
  );

  const bestOpps = eligibleOpps.length > 0 ? eligibleOpps : evaluatedOpps;
  const topCandidate = bestOpps[0];

  const ceilingMin = topCandidate ? topCandidate.financials.rangeLow : Math.round(hours * 70);
  const ceilingMax = topCandidate ? topCandidate.financials.rangeHigh : Math.round(hours * 150);

  const targetGap = Math.max(0, target - ceilingMax);

  // Classify Feasibility
  let status: 'FEASIBLE' | 'POSSIBLE_WITH_CHANGES' | 'UNLIKELY' | 'INSUFFICIENT_DATA' = 'FEASIBLE';
  let headline = `Target of ₹${target}/day is Feasible`;
  let explanation = `With ${hours} hours/day and your current skills, verified local opportunities in ${constraints.city} have a modeled earning ceiling of ₹${ceilingMin}–₹${ceilingMax}/day net income. (Modeled ceiling under stated constraints, not guaranteed income).`;
  const requiredChanges: string[] = [];

  if (target <= ceilingMax * 1.05) {
    status = 'FEASIBLE';
    requiredChanges.push('Execute verified registration and first customer outreach');
    requiredChanges.push('Maintain consistency across prime local peak hours');
  } else if (target <= ceilingMax * 1.65) {
    status = 'POSSIBLE_WITH_CHANGES';
    headline = `Target of ₹${target}/day Possible with Key Adjustments`;
    explanation = `Your current realistic modeled ceiling is ₹${ceilingMin}–₹${ceilingMax}/day. There is a ₹${target - ceilingMin}/day gap between your target and baseline expectations.`;
    
    // Suggest concrete levers
    const extraHoursNeeded = Math.ceil((target - ceilingMax) / 100);
    if (extraHoursNeeded > 0 && hours + extraHoursNeeded <= 10) {
      requiredChanges.push(`Increase available time by +${extraHoursNeeded} hours/day (from ${hours}h to ${hours + extraHoursNeeded}h)`);
    }
    requiredChanges.push('Combine two complementary morning & evening micro-income streams');
    requiredChanges.push('Target higher-value clients or premium neighborhood zones');
  } else {
    status = 'UNLIKELY';
    headline = `Target of ₹${target}/day is Unlikely under Current Constraints`;
    explanation = `Generating ₹${target}/day with only ${hours} hours/day and beginner capital in ${constraints.city} is mathematically unlikely under verified local wage norms without speculative risk. Your verified starting baseline is ₹${ceilingMin}–₹${ceilingMax}/day.`;

    requiredChanges.push(`Calibrate expectations to verified starting baseline (₹${ceilingMin}–₹${ceilingMax}/day)`);
    requiredChanges.push(`Dedicate at least 6–8 hours daily instead of ${hours} hours`);
    requiredChanges.push('Build specialized technical or professional trade skills over 30–60 days');
    if (!constraints.hasVehicle) {
      requiredChanges.push('Acquire two-wheeler mobility to unlock high-velocity delivery/transit routes');
    }
  }

  return {
    status,
    headline,
    explanation,
    realisticCeilingMin: ceilingMin,
    realisticCeilingMax: ceilingMax,
    targetGap,
    requiredChanges,
  };
}
