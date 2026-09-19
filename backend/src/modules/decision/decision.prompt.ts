import type { UserConstraints, EvaluatedOpportunity, FeasibilityVerdict } from '../../engines/types';
import type { LocationIntelligence } from '../../engines/locationSignals';

/**
 * PHASE 11: the verified location-intelligence block is the ONLY geography the
 * model may reference. Everything in it is deterministic, source-traced, and
 * rendered at city precision — the model explains it, never extends it.
 */
function renderVerifiedLocationBlock(intel: LocationIntelligence): string {
  const { context, signals, version } = intel;
  const lines: string[] = [];
  lines.push(`VERIFIED LOCATION INTELLIGENCE (version ${version}):`);
  lines.push(
    `- City: ${context.city}, ${context.state}, ${context.country}` +
      (context.district ? ` (district: ${context.district})` : '')
  );
  lines.push(
    `- Precision: ${context.precision.toUpperCase()} — verified to city level ONLY.` +
      ' No street, colony, market, campus, or station-level knowledge exists anywhere in this system.'
  );
  lines.push(`- Source: ${context.source}; retrieved ${context.retrievedAt}`);
  if (signals.length === 0) {
    lines.push(
      '- Verified signals: NONE. No verified local facts exist beyond the city/state name itself — do not describe or assume any demand characteristic for this city.'
    );
  } else {
    lines.push('- Verified signals (the ONLY local facts you may reference):');
    for (const s of signals) {
      lines.push(
        `  * ${s.kind}=${s.presence} (confidence ${s.confidence}) — ${s.detail ?? 'no detail'}` +
          ` [source: ${s.source}; retrieved ${s.retrievedAt}]`
      );
    }
  }
  lines.push(
    '- You may reference ONLY the signal facts listed above, stated generically at city level.' +
      ' Inventing anything beyond them — roads, colonies, markets, campuses, stations, neighborhood names,' +
      ' or demand claims not listed — is a failed response.'
  );
  return lines.join('\n');
}

export function buildDecisionEnrichmentPrompt(
  constraints: UserConstraints,
  topOpps: EvaluatedOpportunity[],
  feasibility: FeasibilityVerdict,
  locationIntelligence?: LocationIntelligence
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

  // Closed-world geography guard: verified catalog carries NO street/locality
  // facts (supportedCities is empty for every entry). The model therefore has
  // no verified neighborhood names for ANY city — it must reference the city
  // by name only and prefix every tip with the inference disclosure.
  // PHASE 11: the resolved location intelligence (context + verified signals)
  // rides the prompt as the single authoritative geography source; everything
  // beyond it remains closed-world.
  const verifiedLocationBlock = locationIntelligence
    ? renderVerifiedLocationBlock(locationIntelligence)
    : 'VERIFIED LOCATION INTELLIGENCE: NOT RESOLVED — you know the city/state NAME ONLY and have zero verified local facts.';
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

CLOSED-WORLD GEOGRAPHY (STRICT — applies to EVERY city including metros):
- We hold NO verified street names, colony names, market names, campus names,
  road names, or locality names for ${constraints.city}. Treat it exactly like
  any other city: you know the city/state NAME ONLY.
- Every "city_specific_tip" MUST begin with the exact prefix "General model inference: ".
- Tips must reference "${constraints.city}" by name only, with generic phrasing
  such as "your area in ${constraints.city}". Naming any specific locality,
  road, market, college, campus, mall, station, or neighborhood is FORBIDDEN —
  a tip containing one is a failed response.
- A metro city does NOT grant locality knowledge. A tip for a metro that names
  localities is equally invalid.
- State the operational advice only (where to find customers, how to start),
  never a geography fact.

${verifiedLocationBlock}

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
   - Begin EVERY tip with the exact prefix "General model inference: " (no exceptions,
     for every city including metros — this prefix is how the product honestly marks
     unvalidated locality advice).
   - Reference ${constraints.city} by NAME ONLY (e.g. "your area in ${constraints.city}").
     NEVER name a specific road, colony, market, campus, college, mall, station, or
     neighborhood — verified local data at that granularity does not exist.
   - You MAY ground a tip in a fact from the VERIFIED LOCATION INTELLIGENCE block
     above (only those exact facts, never extended). Any tip content beyond that
     block remains marked model inference by the prefix.
   - Give practical Tier-2/3 market operating advice (where to find customers, how to start).
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
