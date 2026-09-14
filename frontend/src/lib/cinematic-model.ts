/**
 * Cinematic model helpers.
 *
 * DATA INTEGRITY: every number rendered by the cinematic frontend comes from
 * the deterministic calculation layer (DailyEarnCockpit). Nothing here invents
 * payouts, statistics, users or claims — this module only RE-ARRANGES real
 * engine outputs into the shapes the scroll narrative needs.
 */

import type { CalculationModel } from '../components/sections/DailyEarnCockpit';
import { calculateCityNet } from '../components/sections/DailyEarnCockpit';

export type IncomePathKey = 'Teaching' | 'Delivery' | 'Digital';

export const PATH_ORDER: IncomePathKey[] = ['Teaching', 'Delivery', 'Digital'];

const PATH_META: Record<IncomePathKey, { label: string; platform: string }> = {
  Teaching: { label: 'Tutoring & Teaching', platform: 'Local home tutoring' },
  Delivery: { label: 'Delivery & Errands', platform: 'Gig delivery work' },
  Digital: { label: 'Digital Services', platform: 'Freelance / online services' },
};

export interface RankedPath {
  key: IncomePathKey;
  label: string;
  platform: string;
  netDaily: number;
  meetsTarget: boolean;
  isSelected: boolean;
  isLeading: boolean;
  rank: number;
}

/**
 * Ranks the three income paths for the selected city + hours using the
 * SAME deterministic function the cockpit uses. The selected path is not
 * privileged — it earns its rank.
 */
export function rankIncomePaths(
  city: string,
  skill: IncomePathKey,
  hours: number,
  targetIncome: number
): RankedPath[] {
  const rows: RankedPath[] = PATH_ORDER.map((key) => {
    const netDaily = calculateCityNet(city, key, hours);
    return {
      key,
      label: PATH_META[key].label,
      platform: PATH_META[key].platform,
      netDaily,
      meetsTarget: netDaily >= targetIncome,
      isSelected: key === skill,
      isLeading: false,
      rank: 0,
    };
  });

  rows.sort((a, b) => b.netDaily - a.netDaily);
  rows.forEach((row, index) => {
    row.rank = index + 1;
    row.isLeading = index === 0;
  });

  return rows;
}

export type RoadmapPhase = 'VERIFY' | 'EXECUTE' | 'DECIDE';

export interface RoadmapDay {
  day: number;
  phase: RoadmapPhase;
  title: string;
  action: string;
}

const PHASE_TONE: Record<RoadmapPhase, string> = {
  VERIFY: 'var(--sig-mint)',
  EXECUTE: 'var(--sig-cyan)',
  DECIDE: 'var(--sig-amber)',
};

export function phaseTone(phase: RoadmapPhase): string {
  return PHASE_TONE[phase];
}

/**
 * Builds the 7-day execution structure from the deterministic model.
 * Phase colouring encodes meaning: mint = verified preparation,
 * cyan = live earning days, amber = decision on the remaining gap.
 */
export function buildRoadmap(
  calculation: CalculationModel,
  targetIncome: number,
  city: string,
  hours: number
): RoadmapDay[] {
  const { net, gap, platformFee, fuelCost, unitDetail, platform, feasible } = calculation;

  const overhead = platformFee + fuelCost;
  const perHour = hours > 0 ? Math.round(net / hours) : net;

  const days: Array<Omit<RoadmapDay, 'day'>> = [
    {
      phase: 'VERIFY',
      title: 'Confirm the numbers',
      action: `${platform} in ${city}: ${unitDetail}. Verify today's payout rate before committing a full day.`,
    },
    {
      phase: 'VERIFY',
      title: 'Lock the time window',
      action: `Block ${hours} hours that you can repeat for 7 days. ${perHour}/hour is the rate this plan assumes.`,
    },
    {
      phase: 'EXECUTE',
      title: 'Run one full day',
      action: `Work the full window and record actual units completed. Overhead to beat: ₹${overhead}/day.`,
    },
    {
      phase: 'EXECUTE',
      title: 'Remove one cost',
      action: `Cut travel or fee overhead — every ₹1 removed from ₹${overhead} lands directly in net income.`,
    },
    {
      phase: 'EXECUTE',
      title: 'Compare against target',
      action: `Realistic net is ₹${net}/day against a ₹${targetIncome} target${
        feasible ? ' — target already met.' : ` (gap ₹${gap}).`
      }`,
    },
    {
      phase: 'DECIDE',
      title: 'Adjust one variable',
      action: feasible
        ? 'Hold the routine: same window, same area, no cost increases.'
        : `Close the ₹${gap} gap by changing hours, area or a paid-rate mix — one change at a time.`,
    },
    {
      phase: 'DECIDE',
      title: 'Commit or switch',
      action: feasible
        ? 'The path clears the target. Repeat it and stop re-planning.'
        : 'If the gap does not shrink, move the ranking to the next path and repeat this 7-day loop.',
    },
  ];

  return days.map((day, index) => ({ day: index + 1, ...day }));
}