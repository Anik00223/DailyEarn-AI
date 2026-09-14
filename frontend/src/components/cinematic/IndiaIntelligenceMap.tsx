import { memo, useMemo, useState } from 'react';
import {
  INDIA_CITIES,
  outlinePath,
  project,
  distanceRatio,
  type MapCity,
} from '../../lib/india-geo';
import { useInViewport } from '../../hooks/useCinematicScroll';
import { calculateCityNet } from '../sections/DailyEarnCockpit';

/**
 * CENTRAL INTELLIGENCE VISUAL — a cinematic (not navigational) India map.
 *
 * REAL GEOGRAPHY: the outline and every node come from survey coordinates in
 * lib/india-geo.ts. Node intel values come from the deterministic engine in
 * DailyEarnCockpit (calculateCityNet) — no invented numbers anywhere.
 *
 * Pulses / flowing paths are pure CSS animations on SVG transforms, paused
 * when the map scrolls out of the viewport (`.cine-map--idle`).
 */

export type SkillKey = 'Teaching' | 'Delivery' | 'Digital';

interface IndiaIntelligenceMapProps {
  activeCity: string;
  skill: SkillKey;
  hours: number;
  onSelectCity?: (city: string) => void;
}

const SIG_ACTIVE = 'var(--sig-cyan)';
const SIG_PEER = 'var(--sig-violet)';

function formatINR(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export const IndiaIntelligenceMap = memo(function IndiaIntelligenceMap({
  activeCity,
  skill,
  hours,
  onSelectCity,
}: IndiaIntelligenceMapProps) {
  const [hovered, setHovered] = useState<MapCity | null>(null);
  const [mapRef, inView] = useInViewport<HTMLDivElement>('120px');

  const outline = useMemo(() => outlinePath(), []);
  const nodes = useMemo(
    () =>
      INDIA_CITIES.map((c) => {
        const p = project(c.lat, c.lon);
        return { ...c, x: p.x, y: p.y };
      }),
    []
  );

  const active = nodes.find((n) => n.city === activeCity) ?? nodes[0];

  // Intelligence paths: the active city linked to its five nearest nodes.
  const paths = useMemo(() => {
    if (!active) return [];
    return nodes
      .filter((n) => n.city !== active.city)
      .map((n) => ({ node: n, d: distanceRatio(active, n) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 5)
      .map(({ node }) => {
        const mx = (active.x + node.x) / 2 + (node.y - active.y) * 0.16;
        const my = (active.y + node.y) / 2 - (node.x - active.x) * 0.16;
        return `M ${active.x.toFixed(1)} ${active.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${node.x.toFixed(1)} ${node.y.toFixed(1)}`;
      });
  }, [active, nodes]);

  const intelNet: number | null = hovered
    ? calculateCityNet(hovered.city, skill, hours)
    : null;

  return (
    <div
      ref={mapRef}
      className={`cine-map${inView ? '' : ' cine-map--idle'}`}
      role="img"
      aria-label="Map of India showing income opportunity nodes"
    >
      <svg
        className="cine-map__svg"
        viewBox="0 0 1000 1080"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="cine-terrain" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(74,144,217,0.28)" />
            <stop offset="55%" stopColor="rgba(74,144,217,0.10)" />
            <stop offset="100%" stopColor="rgba(139,124,246,0.16)" />
          </linearGradient>
        </defs>

        {/* graticule — geographic texture */}
        <g aria-hidden="true">
          {[7, 14, 21, 28, 35].map((lat) => {
            const y = project(lat, 80).y;
            return (
              <line
                key={`h${lat}`}
                className="cine-map__graticule"
                x1={project(lat, 66.5).x}
                x2={project(lat, 98.5).x}
                y1={y}
                y2={y}
              />
            );
          })}
          {[70, 76, 82, 88, 94].map((lon) => {
            const x = project(20, lon).x;
            return (
              <line
                key={`v${lon}`}
                className="cine-map__graticule"
                y1={project(37.5, lon).y}
                y2={project(6, lon).y}
                x1={x}
                x2={x}
              />
            );
          })}
        </g>

        {/* terrain glow + outline */}
        <polygon className="cine-map__terrain" points={outline} />
        <polygon className="cine-map__outline" points={outline} />

        {/* intelligence paths from the active city */}
        <g aria-hidden="true">
          {paths.map((d, i) => (
            <path key={i} className="cine-map__path" d={d} opacity={0.85 - i * 0.14} />
          ))}
        </g>

        {/* city nodes */}
        <g>
          {nodes.map((n) => {
            const isActive = n.city === active.city;
            const color = isActive ? SIG_ACTIVE : SIG_PEER;
            return (
              <g
                key={n.city}
                transform={`translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`}
                style={{ cursor: onSelectCity ? 'pointer' : 'default' }}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(n)}
                onBlur={() => setHovered(null)}
                onClick={() => onSelectCity?.(n.city)}
                tabIndex={onSelectCity ? 0 : undefined}
                role={onSelectCity ? 'button' : undefined}
                aria-label={`${n.city}, ${n.state}`}
              >
                {/* pulses live at local origin so CSS scale() radiates correctly */}
                {isActive && (
                  <>
                    <circle className="cine-map__pulse" r={26} stroke={SIG_ACTIVE} />
                    <circle
                      className="cine-map__pulse"
                      r={26}
                      stroke={SIG_ACTIVE}
                      style={{ animationDelay: '1.8s' }}
                    />
                  </>
                )}
                <circle
                  className="cine-map__node-ring"
                  r={isActive ? 15 : 9}
                  stroke={color}
                  strokeOpacity={isActive ? 0.95 : 0.55}
                />
                <circle
                  className="cine-map__node-core"
                  r={isActive ? 5.5 : 3.2}
                  fill={color}
                  fillOpacity={isActive ? 1 : 0.75}
                />
                {(isActive || n.city === hovered?.city) && (
                  <text
                    className={`cine-map__node-label${isActive ? ' cine-map__node-label--active' : ''}`}
                    x={16}
                    y={5}
                  >
                    {n.city}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* CINE_MAP_APPEND_ANCHOR */}

    </div>
  );
});
