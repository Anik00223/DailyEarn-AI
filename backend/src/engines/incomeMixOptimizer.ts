import type { UserConstraints, EvaluatedOpportunity, IncomeMixBundle } from './types';

export function optimizeIncomeMix(
  constraints: UserConstraints,
  evaluatedOpps: EvaluatedOpportunity[]
): IncomeMixBundle | null {
  const eligible = evaluatedOpps.filter(
    (e) => e.scoring.complexityPenalty < 30 && e.scoring.costPenalty <= 25
  );

  if (eligible.length < 2) return null;

  const totalHours = Math.max(2, constraints.availableHoursPerDay || 4);

  // Pick top candidate
  const primary = eligible[0];

  // Find a complementary secondary candidate in a different category or shift
  const secondary = eligible.slice(1).find((e) => {
    // Different category preferred (e.g. tutoring + delivery, reselling + tutoring)
    return e.opportunity.slug !== primary.opportunity.slug;
  });

  if (!secondary) return null;

  // Split available time realistically (e.g., 60% primary, 40% secondary)
  const primaryHours = Math.max(1, Math.round(totalHours * 0.6 * 10) / 10);
  const secondaryHours = Math.max(1, Math.round((totalHours - primaryHours) * 10) / 10);

  // Pro-rate net daily based on split hours
  const primaryHourlyRate = primary.financials.netDaily / Math.max(1, constraints.availableHoursPerDay || 4);
  const secondaryHourlyRate = secondary.financials.netDaily / Math.max(1, constraints.availableHoursPerDay || 4);

  const primaryNet = Math.round(primaryHourlyRate * primaryHours);
  const secondaryNet = Math.round(secondaryHourlyRate * secondaryHours);
  const combinedNet = primaryNet + secondaryNet;

  return {
    title: `Dual-Stream Income Mix: ${primary.opportunity.opportunityName} + ${secondary.opportunity.opportunityName}`,
    primaryOpportunitySlug: primary.opportunity.slug,
    primaryName: primary.opportunity.opportunityName,
    primaryHours,
    primaryNetDaily: primaryNet,
    secondaryOpportunitySlug: secondary.opportunity.slug,
    secondaryName: secondary.opportunity.opportunityName,
    secondaryHours,
    secondaryNetDaily: secondaryNet,
    combinedHours: primaryHours + secondaryHours,
    combinedNetDaily: combinedNet,
    compatibilityReason: `Compatible non-overlapping schedule: Dedicate ${primaryHours}h during day/peak to ${primary.opportunity.platform} and ${secondaryHours}h to ${secondary.opportunity.platform} for a diversified ₹${combinedNet}/day income.`,
  };
}
