import { VERIFIED_OPPORTUNITIES_SEED, type SeedOpportunity } from '../../db/seeds/verifiedOpportunities';
import type { GeminiIdea, GenerateIdeasInput } from './ideas.schema';

/**
 * Deterministic idea fallback — used ONLY when every AI provider attempt fails
 * or returns a malformed response after retries. A transient upstream AI
 * failure must never become an application 5xx, so the request is satisfied
 * from the human-verified opportunity catalog instead.
 *
 * Geography stays CLOSED-WORLD: the user's city/state is referenced by name
 * only. No landmarks, roads, colleges, neighbourhoods or local statistics are
 * ever invented — tips explicitly instruct the user to verify demand on the
 * platform's own zone map.
 */

const ASSUMED_FOCUSED_HOURS = 4; // conservative daily effort assumption
const WORKING_DAYS_PER_WEEK = 6;

function platformUrlFor(opportunity: SeedOpportunity): string {
  return opportunity.sourceUrl || 'https://www.google.com/search?q=' + encodeURIComponent(opportunity.platform);
}

function effortFor(opportunity: SeedOpportunity): 'low' | 'medium' | 'high' {
  if (opportunity.startupCostMax > 5000) return 'high';
  if (opportunity.requiresVehicle || opportunity.startupCostMax > 1000) return 'medium';
  return 'low';
}

/**
 * Ranks catalog opportunities against the user's skills and returns the top
 * `count` mapped to the GeminiIdea contract. Deterministic: identical inputs
 * always yield identical output (stable sort, no randomness), which also lets
 * the existing ideaHash dedupe keep repeat fallback rows out of the DB.
 */
export function buildDeterministicIdeas(params: GenerateIdeasInput): GeminiIdea[] {
  const userSkills = params.skills.map((s) => s.toLowerCase().trim());

  const ranked = VERIFIED_OPPORTUNITIES_SEED.filter(
    (o) => o.verificationStatus === 'VERIFIED' || o.verificationStatus === 'PARTIALLY_VERIFIED'
  )
    .map((opportunity) => {
      const required = opportunity.requiredSkills.map((s) => s.toLowerCase().trim());
      const skillOverlap = required.filter((r) => userSkills.some((u) => u && (r.includes(u) || u.includes(r)))).length;
      return { opportunity, skillOverlap };
    })
    .sort(
      (a, b) =>
        b.skillOverlap - a.skillOverlap ||
        b.opportunity.reliabilityScore - a.opportunity.reliabilityScore ||
        (a.opportunity.slug < b.opportunity.slug ? -1 : 1)
    );

  return ranked.slice(0, Math.max(1, params.count)).map(({ opportunity }) => {
    const midpointPayout = (opportunity.estimatedPayoutMin + opportunity.estimatedPayoutMax) / 2;
    const estimatedDaily = Math.max(
      0,
      Math.round(midpointPayout * opportunity.unitsPerHourTypical * ASSUMED_FOCUSED_HOURS)
    );
    const tip = `Work within your own area of ${params.city}, ${params.state} — start with customers you can reach on foot or by bicycle. No local landmarks are assumed; confirm live demand on ${opportunity.platform}'s own serviceability/zone map before committing time.`;

    return {
      title: `${opportunity.opportunityName} in ${params.city}`.slice(0, 200),
      description: `${opportunity.description} This is a human-verified platform opportunity applicable pan-India, including ${params.city}.`,
      estimated_daily_earn: estimatedDaily,
      estimated_weekly_earn: estimatedDaily * WORKING_DAYS_PER_WEEK,
      effort_level: effortFor(opportunity),
      skills_required: [...opportunity.requiredSkills],
      platform_name: opportunity.platform,
      platform_url: platformUrlFor(opportunity),
      getting_started_steps: [
        `Open ${opportunity.platform} partner onboarding (${platformUrlFor(opportunity)}) and sign up with your phone number`,
        'Complete KYC as listed in the platform requirements',
        `Accept your first task in ${params.city} and finish it to unlock weekly payouts`,
      ],
      earnings_breakdown: `Per-unit payout ₹${opportunity.estimatedPayoutMin}–₹${opportunity.estimatedPayoutMax} × ~${opportunity.unitsPerHourTypical} units/hour × ~${ASSUMED_FOCUSED_HOURS} focused hours/day (figures from the verified catalog, ${opportunity.lastVerifiedDate}).`,
      city_specific_tip: tip,
    };
  });
}
