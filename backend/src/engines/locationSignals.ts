import {
  LOCATION_INTELLIGENCE_VERSION,
  canonicalizeCity,
  getCityRecord,
  type LocationIntelligence,
  type LocationContext,
  type LocationSignal,
  type LocationSignalKind,
  type SignalPresence,
} from './locationIntelligence';

export { LOCATION_INTELLIGENCE_VERSION };
export type { LocationIntelligence };

const SIGNAL_RETRIEVED_AT = '2026-09-19';

export function resolveLocationIntelligence(city: string, state: string): LocationIntelligence {
  const canonical = canonicalizeCity(city);
  const rec = getCityRecord(canonical);
  const retrievedAt = SIGNAL_RETRIEVED_AT;
  if (!rec) {
    return {
      context: { country: 'India', state: state.trim(), district: '',
        city: city.trim(), canonicalCity: canonical,
        latitude: NaN, longitude: NaN, precision: 'unknown', tier: 'unknown',
        source: 'user-input-only (no verified registry entry)', retrievedAt },
      signals: [], version: LOCATION_INTELLIGENCE_VERSION,
    };
  }
  const context: LocationContext = { country: 'India', state: rec.state,
    district: rec.district, city: city.trim(), canonicalCity: rec.canonical,
    latitude: rec.lat, longitude: rec.lon, precision: 'city', tier: rec.tier,
    source: `OSM Nominatim admin record (place_rank=${rec.osmPlaceRank}, importance=${rec.osmImportance})`,
    retrievedAt };
  const src = (s: string) => `${s}; retrieved ${retrievedAt}`;
  const signals: LocationSignal[] = [
    { kind: 'residential', presence: 'supported', confidence: 0.8, retrievedAt: SIGNAL_RETRIEVED_AT,
      source: src(`catalog tier vocabulary: city tier=${rec.tier}`),
      detail: `${rec.canonical} resolves to ${rec.tier} in the verified tier system` },
    { kind: 'retail', presence: 'supported', confidence: 0.7, retrievedAt: SIGNAL_RETRIEVED_AT,
      source: src(`catalog tier vocabulary: city tier=${rec.tier}`),
      detail: 'retail/commercial activity supported at tier scope' },
    ...(rec.tierRestrictedPlatforms && rec.tierRestrictedPlatforms.length > 0 ? [{
      kind: 'delivery' as LocationSignalKind, presence: 'limited' as SignalPresence,
      confidence: 0.9, retrievedAt: SIGNAL_RETRIEVED_AT,
      source: src(`catalog restrictions: ${rec.tierRestrictedPlatforms.join(' & ')} — verified supportedLocationTiers exclude this city's tier`),
      detail: `tier-restricted platforms (${rec.tierRestrictedPlatforms.join(', ')}) limited in ${rec.tier} city ${rec.canonical}` }] : []),
    ...(canonical === 'silchar' ? [{
      kind: 'transport' as LocationSignalKind, presence: 'supported' as SignalPresence,
      confidence: 0.7, retrievedAt: SIGNAL_RETRIEVED_AT,
      source: src('OSM Nominatim railway station record Bhasha Shahid place_rank=30'),
      detail: 'rail connectivity at city precision (station name only)' }] : []),
  ];
  return { context, signals, version: LOCATION_INTELLIGENCE_VERSION };
}
export const CATEGORY_SIGNAL_RELEVANCE: Record<string, Partial<Record<LocationSignalKind, number>>> = {
  delivery: { delivery: 0.5, transport: 0.3, commercial: 0.2 },
  tutoring: { education: 0.6, residential: 0.4 },
  reselling: { retail: 0.5, residential: 0.3, commercial: 0.2 },
  services: { residential: 0.4, commercial: 0.4, businessZone: 0.2 },
  digital: { commercial: 0.5, businessZone: 0.3, retail: 0.2 },
  artisan: { residential: 0.5, retail: 0.3, tourism: 0.2 },
};
export function computeSignalLocationFit(
  category: string, intel: LocationIntelligence,
  opportunity: { slug: string; platform: string; supportedLocationTiers: string[] }
): { locationFit: number; drivers: string[]; penalties: string[]; evidence: string[] } {
  const drivers: string[] = []; const penalties: string[] = []; const evidence: string[] = [];
  const { context, signals } = intel;
  if (context.precision === 'unknown' || context.tier === 'unknown') {
    return { locationFit: 70, drivers, penalties: [`No verified record for ${context.city} — neutral scoring`],
      evidence: ['locationSignal=UNKNOWN (no registry entry)'] };
  }
  let fit = 70;
  const relevance = CATEGORY_SIGNAL_RELEVANCE[category] || {};
  const byKind = new Map(signals.map((s) => [s.kind, s]));
  for (const [kind, weight] of Object.entries(relevance)) {
    const sig = byKind.get(kind as LocationSignalKind);
    if (!sig || sig.presence === 'unknown') continue;
    if (sig.presence === 'supported') {
      const gain = Math.round(sig.confidence * (weight as number) * 30);
      fit += gain;
      drivers.push(`Verified ${kind} context in ${context.city} (+${gain})`);
      evidence.push(`${kind}=supported conf=${sig.confidence}`);
    }
  }
  // Platform-level restriction check is deliberately OUTSIDE the category
  // relevance loop: a registry "limited" verdict for THIS platform in THIS
  // city tier is evidence about the platform, not about the category bucket
  // it happens to sit in (e.g. Urban Company is 'services' — its restriction
  // must still bite). Exactly one penalty per restricted platform.
  const restrictedSignal = signals.find(
    (s) =>
      s.presence === 'limited' &&
      s.detail &&
      s.detail.includes(opportunity.platform)
  );
  if (restrictedSignal) {
    fit -= 40;
    penalties.push(
      `Verified limited ${restrictedSignal.kind} coverage for ${opportunity.platform} in ${context.city} (-40)`
    );
    evidence.push(`${restrictedSignal.kind}=limited for ${opportunity.platform}`);
  }
  if (context.tier !== 'tier1' && opportunity.supportedLocationTiers.includes('tier3')) {
    fit += 8;
    drivers.push(`Tier-2/3 catalog support covers ${context.city} (+8)`);
  }
  return { locationFit: Math.max(30, Math.min(98, Math.round(fit))), drivers, penalties, evidence };
}
