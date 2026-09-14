import { memo } from 'react';
import type { CalculationModel } from '../sections/DailyEarnCockpit';

/* ── STAGE 4 · FEASIBILITY GAUGE ───────────────────────────────────────── */

const GAUGE_R = 52;
const GAUGE_CIRC = Math.PI * GAUGE_R; // half circle

export function gaugeSignal(ratio: number): string {
  if (ratio >= 1) return 'var(--sig-mint)';
  if (ratio >= 0.7) return 'var(--sig-amber)';
  return 'var(--sig-coral)';
}

export const FeasibilityGauge = memo(function FeasibilityGauge({
  calc,
  target,
}: MoneyProps) {
  const ratio = Math.min(1.25, calc.net / Math.max(1, target));
  const pct = Math.round(Math.min(1, ratio) * 100);
  const color = gaugeSignal(ratio);
  return (
    <div className="cine-gauge" data-cine="gauge">
      <svg viewBox="0 0 140 80" width="180" height="104" aria-hidden="true">
        <path
          className="cine-gauge__track"
          d={`M 18 70 A ${GAUGE_R} ${GAUGE_R} 0 0 1 122 70`}
          strokeWidth="6"
        />
        <path
          className="cine-gauge__value"
          data-cine-gauge
          d={`M 18 70 A ${GAUGE_R} ${GAUGE_R} 0 0 1 122 70`}
          stroke={color}
          strokeWidth="6"
          strokeDasharray={GAUGE_CIRC}
          strokeDashoffset={GAUGE_CIRC * (1 - Math.min(1, ratio))}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="cine-gauge__readout">
        <span className="cine-kpi__value" style={{ color }}>{pct}%</span>
        <span className="cine-label cine-label--micro">of target</span>
      </div>
      <span
        className="cine-label cine-label--micro"
        style={{ color, marginTop: 6 }}
      >
        {calc.feasible ? 'TARGET REACHABLE' : `GAP ${formatINR(calc.gap)} / DAY`}
      </span>
    </div>
  );
});

/* ── STAGE 4 · OPPORTUNITY DISCOVERY ───────────────────────────────────── */

export interface OpportunityRow {
  city: string;
  skill: Skill;
  net: number;
}

export const OpportunityPaths = memo(function OpportunityPaths({
  rows,
  activeCity,
  onSelectCity,
}: {
  rows: OpportunityRow[];
  activeCity: string;
  onSelectCity?: (city: string) => void;
}) {
  return (
    <div className="cine-paths" data-cine="paths">
      {rows.map((r, i) => (
        <button
          key={`${r.city}-${r.skill}`}
          type="button"
          className={`cine-path${i === 0 ? ' cine-path--leading' : ''}`}
          data-cine-path
          style={{ width: '100%', textAlign: 'left' }}
          onClick={() => onSelectCity?.(r.city)}
          aria-label={`${r.city}, ${r.skill}, ${formatINR(r.net)} net per day`}
        >
          <span className="cine-path__rank">{String(i + 1).padStart(2, '0')}</span>
          <span>
            <span className="cine-path__title">{r.city}</span>
            <span className="cine-path__meta" style={{ display: 'block' }}>
              {r.skill}
              {r.city === activeCity ? ' · your base' : ''}
            </span>
          </span>
          <span className="cine-path__net" style={{ color: i === 0 ? 'var(--sig-mint)' : 'var(--cine-text)' }}>
            {formatINR(r.net)}
          </span>
        </button>
      ))}
    </div>
  );
});

/* ── STAGE 5 · 7-DAY ACTION ROADMAP ────────────────────────────────────── */

export function buildRoadmap(calc: CalculationModel, city: string): Array<{ day: number; title: string; action: string }> {
  const platform = calc.platform;
  return [
    { day: 1, title: 'Register', action: `Create and verify your ${platform} profile in ${city}.` },
    { day: 2, title: 'Prepare', action: 'Set up documents, gear and payment details for payouts.' },
    { day: 3, title: 'First units', action: `Complete your first sessions — baseline: ${calc.unitDetail}.` },
    { day: 4, title: 'Review', action: 'Compare actual net vs the model and note where time leaks.' },
    { day: 5, title: 'Optimise', action: 'Shift hours toward the highest-paying windows you observed.' },
    { day: 6, title: 'Scale', action: 'Repeat your best day’s pattern at full available hours.' },
    { day: 7, title: 'Consolidate', action: 'Lock a weekly routine and track net, not gross.' },
  ];
}

export const RoadmapStage = memo(function RoadmapStage({
  calc,
  city,
}: {
  calc: CalculationModel;
  city: string;
}) {
  const days = buildRoadmap(calc, city);
  return (
    <div className="cine-roadmap" data-cine="roadmap">
      {days.map((d, i) => (
        <div className={`cine-day${i < 3 ? ' cine-day--done' : ''}`} key={d.day} data-cine-day>
          <span className="cine-day__index cine-t-cyan">DAY {d.day}</span>
          <span className="cine-day__title">{d.title}</span>
          <span className="cine-day__action">{d.action}</span>
          <div className="cine-day__bar" data-cine-day-bar />
        </div>
      ))}
    </div>
  );
});

/**
 * FLOATING INSTRUMENTS for the cinematic film.
 * Every number rendered here comes from the deterministic engine
 * (getDeterministicCalculation / calculateCityNet) — never invented.
 */

export function formatINR(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

/* ── STAGE 1 · INPUT CONTROLS ──────────────────────────────────────────── */

export const CITIES = ['Pune', 'Kolkata', 'Patna', 'Kota', 'Guwahati', 'Silchar', 'Delhi', 'Bengaluru'];
export const SKILLS = ['Teaching', 'Delivery', 'Digital'] as const;
export type Skill = (typeof SKILLS)[number];

interface ControlsProps {
  city: string;
  skill: Skill;
  hours: number;
  onCity: (c: string) => void;
  onSkill: (s: Skill) => void;
  onHours: (h: number) => void;
}

export const ControlsPanel = memo(function ControlsPanel({
  city,
  skill,
  hours,
  onCity,
  onSkill,
  onHours,
}: ControlsProps) {
  return (
    <div className="cine-controls" data-cine="controls" aria-label="Earning inputs">
      <div className="cine-control">
        <span className="cine-label cine-label--micro">City</span>
        <div className="cine-chips" role="radiogroup" aria-label="Select city">
          {CITIES.map((c) => (
            <button
              key={c}
              type="button"
              className="cine-chip"
              aria-pressed={c === city}
              onClick={() => onCity(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="cine-control">
        <span className="cine-label cine-label--micro">Skill</span>
        <div className="cine-chips" role="radiogroup" aria-label="Select skill">
          {SKILLS.map((s) => (
            <button
              key={s}
              type="button"
              className="cine-chip"
              aria-pressed={s === skill}
              onClick={() => onSkill(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="cine-control">
        <span className="cine-label cine-label--micro">Hours / day</span>
        <div className="cine-stepper">
          <button type="button" aria-label="Fewer hours" onClick={() => onHours(Math.max(1, hours - 1))}>
            −
          </button>
          <input
            type="range"
            className="cine-range"
            min={1}
            max={12}
            step={1}
            value={hours}
            aria-label="Hours per day"
            onChange={(e) => onHours(Number(e.target.value))}
          />
          <button type="button" aria-label="More hours" onClick={() => onHours(Math.min(12, hours + 1))}>
            +
          </button>
        </div>
        <span className="cine-value">{hours} h</span>
      </div>
    </div>
  );
});

/* ── STAGE 3 · MONEY MODEL ─────────────────────────────────────────────── */

interface MoneyProps {
  calc: CalculationModel;
  target: number;
}

export const MoneyModelPanel = memo(function MoneyModelPanel({ calc, target }: MoneyProps) {
  const rows: Array<{ key: string; label: string; amount: number; signal: string; width: number }> = [
    { key: 'gross', label: 'Gross income', amount: calc.gross, signal: 'var(--sig-blue)', width: 100 },
    { key: 'fee', label: 'Platform fee', amount: calc.platformFee, signal: 'var(--sig-coral)', width: (calc.platformFee / Math.max(1, calc.gross)) * 100 },
    { key: 'fuel', label: 'Fuel / travel', amount: calc.fuelCost, signal: 'var(--sig-coral)', width: (calc.fuelCost / Math.max(1, calc.gross)) * 100 },
  ];
  const netWidth = (calc.net / Math.max(1, calc.gross)) * 100;

  return (
    <div className="cine-money" data-cine="money">
      {rows.map((r) => (
        <div className="cine-money__row" key={r.key}>
          <span className="cine-money__label" style={{ color: 'var(--cine-text-2)' }}>
            {r.label}
          </span>
          <div className="cine-money__track">
            <div
              className="cine-money__fill"
              data-cine-bar={r.key}
              style={{ width: `${r.width}%`, background: r.signal }}
            />
          </div>
          <span className="cine-money__amount" style={{ color: r.signal }}>
            −{formatINR(r.amount)}
          </span>
        </div>
      ))}
      <div className="cine-money__row cine-money__row--net" data-cine="net-row">
        <span className="cine-money__label">Net / day</span>
        <div className="cine-money__track">
          <div
            className="cine-money__fill"
            data-cine-bar="net"
            style={{ width: `${netWidth}%`, background: 'var(--sig-cyan)' }}
          />
        </div>
        <span className="cine-money__amount cine-t-cyan" data-cine-count="net">
          {formatINR(calc.net)}
        </span>
      </div>
      <p className="cine-money__note cine-type--muted" data-cine="unit-detail">
        {calc.unitDetail} · via {calc.platform} · {calc.verificationStatus.toLowerCase().replace('_', ' ')}
      </p>
      <p className="cine-money__note cine-type--muted" data-cine="target-ref">
        Target {formatINR(target)} / day
      </p>
    </div>
  );
});
