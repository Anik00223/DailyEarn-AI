/**
 * Location Intelligence — canonical geography + verified signals (PART 1).
 * Unknown != zero. Unknown stays unknown. Precision never exceeds 'city'.
 */
export type LocationPrecision = 'city' | 'unknown';
export type SignalPresence = 'supported' | 'limited' | 'unknown';
export interface LocationContext {
  country: string; state: string; district: string; city: string;
  canonicalCity: string; latitude: number; longitude: number;
  precision: LocationPrecision; tier: 'tier1' | 'tier2' | 'tier3' | 'unknown';
  source: string; retrievedAt: string;
}
export type LocationSignalKind =
  | 'education' | 'commercial' | 'healthcare' | 'tourism' | 'transport'
  | 'retail' | 'residential' | 'delivery' | 'businessZone';
export interface LocationSignal {
  kind: LocationSignalKind; presence: SignalPresence; confidence: number;
  source: string; retrievedAt: string; detail?: string;
}
export interface LocationIntelligence {
  context: LocationContext; signals: LocationSignal[]; version: string;
}
export const LOCATION_INTELLIGENCE_VERSION = 'locintel-v1';
const METRO_ALIASES: Record<string, string> = {
  bangalore: 'bengaluru', bengaluru: 'bengaluru', bombay: 'mumbai',
  madras: 'chennai', calcutta: 'kolkata', poona: 'pune',
};
export const TIER1_CITIES: ReadonlySet<string> = new Set([
  'mumbai', 'delhi', 'bengaluru', 'hyderabad',
  'chennai', 'kolkata', 'pune', 'ahmedabad',
]);
interface CityRecord {
  canonical: string; state: string; district: string;
  lat: number; lon: number; tier: 'tier1' | 'tier2' | 'tier3';
  osmPlaceRank: number; osmImportance: number;
  tierRestrictedPlatforms?: string[];
}
const CITY_REGISTRY: Record<string, CityRecord> = {
  silchar: { canonical: 'silchar', state: 'Assam', district: 'Cachar',
    lat: 24.8179, lon: 92.7562, tier: 'tier3',
    osmPlaceRank: 12, osmImportance: 0.24,
    tierRestrictedPlatforms: ['Porter', 'Urban Company'] },
  guwahati: { canonical: 'guwahati', state: 'Assam', district: 'Kamrup Metropolitan',
    lat: 26.1806, lon: 91.7539, tier: 'tier2',
    osmPlaceRank: 16, osmImportance: 0.56 },
  bengaluru: { canonical: 'bengaluru', state: 'Karnataka', district: 'Bengaluru Urban',
    lat: 12.9716, lon: 77.5946, tier: 'tier1',
    osmPlaceRank: 16, osmImportance: 0.85 },
  indore: { canonical: 'indore', state: 'Madhya Pradesh', district: 'Indore',
    lat: 22.7196, lon: 75.8577, tier: 'tier2',
    osmPlaceRank: 16, osmImportance: 0.62 },
  mumbai: { canonical: 'mumbai', state: 'Maharashtra', district: 'Mumbai City',
    lat: 19.076, lon: 72.8777, tier: 'tier1',
    osmPlaceRank: 16, osmImportance: 0.9 },
};
export function canonicalizeCity(city: string): string {
  const n = city.toLowerCase().trim();
  return METRO_ALIASES[n] || n;
}
export function getCityRecord(canonical: string): CityRecord | undefined {
  return CITY_REGISTRY[canonical];
}
