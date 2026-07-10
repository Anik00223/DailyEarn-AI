import { redisGet, redisSet } from '../../config/redis';

export interface LocationSuggestion {
  city: string;
  state: string;
  display: string;
}

interface OSMAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  country?: string;
}

interface OSMResponseItem {
  display_name: string;
  address?: OSMAddress;
}

export async function searchLocations(query: string): Promise<LocationSuggestion[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length < 2) {
    return [];
  }

  const cacheKey = `location:search:${normalizedQuery}`;

  // 1. Check Redis Cache
  try {
    const cached = await redisGet(cacheKey);
    if (cached) {
      return JSON.parse(cached) as LocationSuggestion[];
    }
  } catch (error) {
    console.error('[Locations] Cache read failed:', error);
  }

  // 2. Fetch from OpenStreetMap Nominatim
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=json&addressdetails=1&limit=8&countrycodes=in`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DailyEarn-AI/1.0 (contact@dailyearn.ai)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OSM Nominatim API HTTP error status: ${response.status}`);
    }

    const data = (await response.json()) as OSMResponseItem[];
    const suggestions: LocationSuggestion[] = [];
    const seen = new Set<string>();

    for (const item of data) {
      const addr = item.address;
      if (!addr) continue;

      // Extract best candidate for "city"
      const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
      const state = addr.state || '';

      if (!city || !state) continue;

      // Deduplicate suggestions based on city + state combination
      const dedupKey = `${city.toLowerCase()}:${state.toLowerCase()}`;
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);

      // Clean display name by shortening it
      // Standard OSM display name can be extremely long: "Silchar, Cachar, Assam, 788001, India"
      // We want to format it nicely: "Silchar, Assam" or "Silchar, Cachar, Assam"
      const parts = [city];
      if (addr.county && addr.county.toLowerCase() !== city.toLowerCase()) {
        parts.push(addr.county);
      }
      parts.push(state);
      const cleanDisplay = parts.join(', ');

      suggestions.push({
        city,
        state,
        display: cleanDisplay,
      });
    }

    // 3. Cache the results in Redis (24 hours TTL)
    if (suggestions.length > 0) {
      try {
        await redisSet(cacheKey, JSON.stringify(suggestions), 24 * 60 * 60);
      } catch (error) {
        console.error('[Locations] Cache write failed:', error);
      }
    }

    return suggestions;
  } catch (error) {
    console.error(`[Locations] OSM search failed for "${query}":`, error);
    return [];
  }
}
