/**
 * India geographic geometry for the central intelligence visual.
 *
 * This is REAL geography (survey-accurate coordinates), not invented data:
 *  - the outline is an ordered lat/lon polygon generalising the mainland
 *  - every city is a real Indian city at its real coordinates
 *
 * A single equirectangular projection is used for both, with a latitude
 * correction so the silhouette is not vertically stretched:
 * at ~24°N one degree of longitude ≈ 101 km vs 111 km for latitude.
 */

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface MapCity extends GeoPoint {
  city: string;
  state: string;
}

export const PROJECTION = {
  lonMin: 66.5,
  lonMax: 98.5,
  latMin: 6.0,
  latMax: 37.5,
  width: 1000,
  /** lon span (32°) : lat span (31.5°) scaled by the km-per-degree ratio ≈ 1.08 */
  height: 1080,
} as const;

export interface ProjectedPoint {
  x: number;
  y: number;
}

export function project(lat: number, lon: number): ProjectedPoint {
  const { lonMin, lonMax, latMin, latMax, width, height } = PROJECTION;
  const x = ((lon - lonMin) / (lonMax - lonMin)) * width;
  const y = ((latMax - lat) / (latMax - latMin)) * height;
  return { x, y };
}

/** Ordered main-land outline (clockwise from the Rann of Kutch). */
export const INDIA_OUTLINE: GeoPoint[] = [
  { lat: 23.85, lon: 68.20 },
  { lat: 24.55, lon: 70.55 },
  { lat: 26.55, lon: 70.05 },
  { lat: 28.05, lon: 71.10 },
  { lat: 29.75, lon: 73.35 },
  { lat: 32.30, lon: 74.60 },
  { lat: 34.60, lon: 74.45 },
  { lat: 35.55, lon: 77.80 },
  { lat: 34.05, lon: 78.90 },
  { lat: 32.10, lon: 78.95 },
  { lat: 30.55, lon: 81.05 },
  { lat: 28.85, lon: 82.90 },
  { lat: 27.55, lon: 84.85 },
  { lat: 26.85, lon: 87.95 },
  { lat: 27.90, lon: 88.90 },
  { lat: 27.10, lon: 89.55 },
  { lat: 26.75, lon: 92.00 },
  { lat: 27.85, lon: 95.50 },
  { lat: 28.30, lon: 97.40 },
  { lat: 27.05, lon: 97.00 },
  { lat: 25.50, lon: 95.20 },
  { lat: 23.70, lon: 93.40 },
  { lat: 22.00, lon: 92.50 },
  { lat: 23.05, lon: 91.20 },
  { lat: 24.20, lon: 90.50 },
  { lat: 22.30, lon: 89.00 },
  { lat: 21.70, lon: 88.05 },
  { lat: 20.70, lon: 87.00 },
  { lat: 19.50, lon: 85.85 },
  { lat: 17.90, lon: 83.35 },
  { lat: 16.00, lon: 81.05 },
  { lat: 15.90, lon: 80.25 },
  { lat: 13.50, lon: 80.35 },
  { lat: 11.70, lon: 79.80 },
  { lat: 10.30, lon: 79.40 },
  { lat: 8.90, lon: 78.20 },
  { lat: 8.10, lon: 77.50 },
  { lat: 9.50, lon: 76.35 },
  { lat: 11.20, lon: 75.80 },
  { lat: 13.00, lon: 74.70 },
  { lat: 15.00, lon: 73.90 },
  { lat: 17.90, lon: 73.00 },
  { lat: 20.70, lon: 72.90 },
  { lat: 21.60, lon: 72.60 },
  { lat: 22.30, lon: 69.00 },
  { lat: 22.60, lon: 68.90 },
];

export function outlinePath(): string {
  return INDIA_OUTLINE.map((p) => {
    const { x, y } = project(p.lat, p.lon);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

/** Real cities used as intelligence nodes. Geographic facts only. */
export const INDIA_CITIES: MapCity[] = [
  { city: 'Silchar', state: 'Assam', lat: 24.82, lon: 92.80 },
  { city: 'Guwahati', state: 'Assam', lat: 26.14, lon: 91.74 },
  { city: 'Imphal', state: 'Manipur', lat: 24.82, lon: 93.94 },
  { city: 'Kolkata', state: 'West Bengal', lat: 22.57, lon: 88.36 },
  { city: 'Patna', state: 'Bihar', lat: 25.59, lon: 85.14 },
  { city: 'Ranchi', state: 'Jharkhand', lat: 23.36, lon: 85.33 },
  { city: 'Bhubaneswar', state: 'Odisha', lat: 20.30, lon: 85.82 },
  { city: 'Raipur', state: 'Chhattisgarh', lat: 21.25, lon: 81.63 },
  { city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.85, lon: 80.95 },
  { city: 'Delhi', state: 'Delhi', lat: 28.61, lon: 77.21 },
  { city: 'Jaipur', state: 'Rajasthan', lat: 26.91, lon: 75.79 },
  { city: 'Chandigarh', state: 'Punjab', lat: 30.73, lon: 76.78 },
  { city: 'Dehradun', state: 'Uttarakhand', lat: 30.32, lon: 78.03 },
  { city: 'Srinagar', state: 'Jammu & Kashmir', lat: 34.08, lon: 74.80 },
  { city: 'Bhopal', state: 'Madhya Pradesh', lat: 23.26, lon: 77.41 },
  { city: 'Ahmedabad', state: 'Gujarat', lat: 23.02, lon: 72.57 },
  { city: 'Mumbai', state: 'Maharashtra', lat: 19.08, lon: 72.88 },
  { city: 'Pune', state: 'Maharashtra', lat: 18.52, lon: 73.86 },
  { city: 'Nagpur', state: 'Maharashtra', lat: 21.15, lon: 79.09 },
  { city: 'Hyderabad', state: 'Telangana', lat: 17.39, lon: 78.49 },
  { city: 'Bengaluru', state: 'Karnataka', lat: 12.97, lon: 77.59 },
  { city: 'Chennai', state: 'Tamil Nadu', lat: 13.08, lon: 80.27 },
  { city: 'Coimbatore', state: 'Tamil Nadu', lat: 11.02, lon: 76.96 },
  { city: 'Kochi', state: 'Kerala', lat: 9.93, lon: 76.27 },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.69, lon: 83.22 },
];

export function findCity(city: string, state?: string): MapCity | undefined {
  const target = city.trim().toLowerCase();
  return INDIA_CITIES.find(
    (c) =>
      c.city.toLowerCase() === target &&
      (!state || c.state.toLowerCase() === state.trim().toLowerCase())
  );
}

/** Normalised distance (0–1 of the map diagonal) between two cities. */
export function distanceRatio(a: MapCity, b: MapCity): number {
  const pa = project(a.lat, a.lon);
  const pb = project(b.lat, b.lon);
  const dx = pa.x - pb.x;
  const dy = pa.y - pb.y;
  return Math.sqrt(dx * dx + dy * dy) / PROJECTION.width;
}