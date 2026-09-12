/**
 * DailyEarn AI — Deterministic Engines Micro-Benchmark Suite
 * Measures pure algorithmic CPU throughput and memory allocation
 * across 10,000 evaluations.
 */
import { calculateFinancialModel } from './engines/incomeEngine';
import { scoreOpportunity } from './engines/scoringEngine';
import { evaluateFeasibility } from './engines/feasibilityEngine';
import { calculateConfidence } from './engines/confidenceEngine';
import { optimizeIncomeMix } from './engines/incomeMixOptimizer';
import { analyzeTargetGap } from './engines/targetGapEngine';
import { generate7DayExecutionPlan } from './engines/executionPlanEngine';
import { VERIFIED_OPPORTUNITIES_SEED } from './db/seeds/verifiedOpportunities';
import type { UserConstraints } from './engines/types';

export function runBenchmark(iterations = 10000) {
  console.log(`\n======================================================`);
  console.log(`🚀 DAILYEARN AI DETERMINISTIC ENGINES BENCHMARK`);
  console.log(`Iterations: ${iterations.toLocaleString()}`);
  console.log(`Opportunity Catalog Size: ${VERIFIED_OPPORTUNITIES_SEED.length} verified items`);
  console.log(`======================================================\n`);

  const initialMemory = process.memoryUsage().heapUsed;
  const startTime = performance.now();

  const cities = ['Silchar', 'Guwahati', 'Kolkata', 'Delhi', 'Mumbai', 'Bengaluru', 'Pune'];
  const targets = [400, 600, 800, 1000, 1200, 1500];
  const hours = [2, 4, 6, 8, 10];

  for (let i = 0; i < iterations; i++) {
    const constraints: UserConstraints = {
      city: cities[i % cities.length],
      state: 'Assam',
      targetDailyIncome: targets[i % targets.length],
      availableHoursPerDay: hours[i % hours.length],
      availableCapital: (i % 5) * 500,
      hasVehicle: i % 2 === 0,
      vehicleType: i % 2 === 0 ? 'motorcycle' : 'bicycle',
      fuelPricePerLiter: 102,
      vehicleMileageKmPerLiter: 45,
      experienceLevel: i % 3 === 0 ? 'beginner' : i % 3 === 1 ? 'intermediate' : 'advanced',
      skills: ['Driving', 'Teaching', 'Cooking'],
    };

    // 1. Evaluate catalog
    const evaluated = VERIFIED_OPPORTUNITIES_SEED.map((opp) => {
      const financials = calculateFinancialModel(opp, constraints);
      const scoring = scoreOpportunity(opp, constraints, financials);
      const confidence = calculateConfidence(opp, constraints);
      return { opportunity: opp, financials, scoring, confidence };
    });

    // 2. Sort by total score descending
    evaluated.sort((a, b) => b.scoring.totalScore - a.scoring.totalScore);
    const topOpps = evaluated.slice(0, 5);

    // 3. Feasibility Verdict
    const feasibility = evaluateFeasibility(constraints, topOpps);

    // 4. Income Mix Bundle
    const incomeMix = optimizeIncomeMix(constraints, topOpps);

    // 5. Target Gap Analysis
    const targetGap = analyzeTargetGap(constraints, topOpps[0], incomeMix);

    // 6. 7-Day Execution Plan
    const plan = generate7DayExecutionPlan(topOpps[0].opportunity, constraints, topOpps[0].financials);

    if (!feasibility || !targetGap || !plan) {
      throw new Error('Benchmark assertion failed');
    }
  }

  const durationMs = performance.now() - startTime;
  const finalMemory = process.memoryUsage().heapUsed;
  const heapDiffMb = Math.round(((finalMemory - initialMemory) / (1024 * 1024)) * 100) / 100;
  const avgTimePerEvalMs = durationMs / iterations;
  const throughputOpsPerSec = Math.round((iterations / (durationMs / 1000)));

  console.log(`⏱️ Benchmark Results:`);
  console.log(`  Total Duration: ${durationMs.toFixed(2)} ms`);
  console.log(`  Average Time per Full Decision Pipeline: ${avgTimePerEvalMs.toFixed(4)} ms (${(avgTimePerEvalMs * 1000).toFixed(1)} µs)`);
  console.log(`  Throughput: ${throughputOpsPerSec.toLocaleString()} full evaluations/sec (single CPU core)`);
  console.log(`  Memory Allocation Delta: ${heapDiffMb} MB\n`);

  return {
    iterations,
    totalDurationMs: durationMs,
    avgTimePerEvaluationMs: avgTimePerEvalMs,
    throughputOpsPerSec,
    heapDeltaMb: heapDiffMb,
  };
}

if (process.argv[1]?.endsWith('benchmark.ts') || process.argv[1]?.endsWith('benchmark.js')) {
  runBenchmark(10000);
}
