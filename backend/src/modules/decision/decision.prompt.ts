import type { UserConstraints, EvaluatedOpportunity, FeasibilityVerdict } from '../../engines/types';

export function buildDecisionEnrichmentPrompt(
  constraints: UserConstraints,
  topOpps: EvaluatedOpportunity[],
  feasibility: FeasibilityVerdict
): string {
  const oppSummaries = topOpps.map((e, idx) => ({
    index: idx + 1,
    slug: e.opportunity.slug,
    name: e.opportunity.opportunityName,
    platform: e.opportunity.platform,
    netDaily: e.financials.netDaily,
    score: e.scoring.totalScore,
    category: e.opportunity.category,
    status: e.opportunity.verificationStatus,
    calculationStatus: e.financials.calculationStatus,
  }));

  return `You are DailyEarn AI's hyper-local Bharat economic analyst.
Your role is SOLELY to provide conversational explanation and localized nuance for a user in ${constraints.city}, ${constraints.state}, India.

CRITICAL RESPONSIBILITY BOUNDARY:
- You are NOT the source of mathematical, scoring, or financial truth.
- You must NEVER generate:
  * numeric scores (e.g. 92/100, Score 92)
  * recommendation ranks (e.g. #1, Rank 1)
  * target-gap numeric values (e.g. ₹250 shortfall)
  * gross income values
  * net income values (e.g. ₹800/day)
  * confidence percentages (e.g. 84%)
  * financial calculations
- All numbers, ranks, scores, and rupees are injected authoritatively and separately by deterministic engines.
- You must provide STRICTLY QUALITATIVE reasoning only.

USER CONSTRAINTS:
- City: ${constraints.city}, ${constraints.state}
- Target: ₹${constraints.targetDailyIncome}/day
- Available Time: ${constraints.availableHoursPerDay} hrs/day
- Stated Skills: ${constraints.skills.join(', ')}
- Feasibility: ${feasibility.status} (${feasibility.headline})

PRE-CALCULATED DETERMINISTIC OPPORTUNITY RANKINGS (REFERENCE CONTEXT ONLY):
${JSON.stringify(oppSummaries, null, 2)}

INSTRUCTIONS:
1. Provide a "why_recommended" sentence explaining the qualitative reason why ${oppSummaries[0]?.name || 'the top match'} aligns with the user's skills and constraints.
   - STRICT BAN: DO NOT include any numbers, scores (/100), ranks (#1), or currency (₹).
   - Allowed Example: "Strong alignment with the user's teaching experience and available working time in residential colonies."
   - Forbidden Example: "Ranked #1 with score of 92/100 delivering ₹800/day net."
2. For each opportunity, provide a "city_specific_tip":
   - If verified local market context (commercial corridors, student PG zones, transit hubs) in ${constraints.city} is known with certainty, cite it.
   - If verified local data is NOT available, prefix the tip with: "General model inference: " and provide practical advice for Tier-2/3 market operations. Never fabricate fake street or merchant names.
3. Language: Respond in ${constraints.language || 'en'}.

RESPOND ONLY WITH THIS VALID JSON OBJECT (no markdown, no preamble):
{
  "why_recommended": "1 qualitative sentence explaining skill and operational fit without any numbers or ranks",
  "tips": [
    {
      "slug": "${topOpps[0]?.opportunity.slug || 'slug'}",
      "city_specific_tip": "Realistic localized tip or 'General model inference: ...'"
    }
  ]
}`;
}
