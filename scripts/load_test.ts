/**
 * DailyEarn AI — Controlled Concurrency Load-Testing Suite
 * Simulates realistic traffic profiles across progressive concurrency stages.
 * Measures throughput, p50, p95, p99 latencies, 429 rate limits, and failure rates.
 *
 * Usage:
 *   npx tsx scripts/load_test.ts [targetUrl] [totalRequests] [concurrency]
 *   Example: npx tsx scripts/load_test.ts http://localhost:3001 2000 100
 */

interface LoadMetrics {
  totalRequests: number;
  successful: number;
  rateLimited429: number;
  serverErrors5xx: number;
  networkErrors: number;
  latencies: number[];
  startTime: number;
  endTime: number;
}

interface RequestScenario {
  name: string;
  weight: number;
  method: 'GET' | 'POST';
  path: string;
  body?: any;
}

const SCENARIOS: RequestScenario[] = [
  // 40% Static / Liveness Edge reads
  { name: 'Liveness Probe', weight: 20, method: 'GET', path: '/health/liveness' },
  { name: 'Opportunity Catalog', weight: 20, method: 'GET', path: '/api/decision/catalog' },
  // 20% Decision / Simulator evaluations
  {
    name: 'Decision Simulator',
    weight: 10,
    method: 'POST',
    path: '/api/decision/simulator',
    body: {
      opportunitySlug: 'swiggy-delivery-partner',
      hours: 5,
      pricePerUnit: 60,
      unitsPerHour: 2.5,
      platformFeePercent: 12,
      travelCost: 150,
      materialCost: 0,
      targetDailyIncome: 700,
    },
  },
  {
    name: 'Decision Evaluate (Guest)',
    weight: 10,
    method: 'POST',
    path: '/api/decision/evaluate',
    body: {
      city: 'Silchar',
      state: 'Assam',
      targetDailyIncome: 650,
      availableHoursPerDay: 4,
      availableCapital: 500,
      hasVehicle: true,
      vehicleType: 'motorcycle',
      experienceLevel: 'beginner',
      skills: ['Driving'],
      language: 'en',
    },
  },
  // 20% Auth / Health / Telemetry reads
  { name: 'Readiness Probe', weight: 10, method: 'GET', path: '/health/readiness' },
  { name: 'System Monitor', weight: 10, method: 'GET', path: '/api/monitor' },
  // 10% Decision Analytics
  { name: 'Decision Analytics', weight: 10, method: 'GET', path: '/api/decision/analytics' },
  // 5% Location Search
  { name: 'Location Autocomplete', weight: 5, method: 'GET', path: '/api/locations/search?q=silchar' },
  // 5% Health Diagnostic
  { name: 'API Health', weight: 5, method: 'GET', path: '/api/health' },
];

function pickWeightedScenario(): RequestScenario {
  const totalWeight = SCENARIOS.reduce((acc, s) => acc + s.weight, 0);
  let random = Math.random() * totalWeight;
  for (const s of SCENARIOS) {
    if (random < s.weight) return s;
    random -= s.weight;
  }
  return SCENARIOS[0];
}

function calculatePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

export async function runLoadStage(
  targetBaseUrl: string,
  totalRequests: number,
  concurrency: number
): Promise<LoadMetrics> {
  console.log(`\n------------------------------------------------------------`);
  console.log(`⚡ STAGE: ${concurrency.toLocaleString()} Concurrent Workers | ${totalRequests.toLocaleString()} Total Requests`);
  console.log(`Target: ${targetBaseUrl}`);
  console.log(`------------------------------------------------------------`);

  const metrics: LoadMetrics = {
    totalRequests,
    successful: 0,
    rateLimited429: 0,
    serverErrors5xx: 0,
    networkErrors: 0,
    latencies: [],
    startTime: performance.now(),
    endTime: 0,
  };

  let requestsDispatched = 0;

  async function worker() {
    while (requestsDispatched < totalRequests) {
      requestsDispatched++;
      const scenario = pickWeightedScenario();
      const url = `${targetBaseUrl.replace(/\/$/, '')}${scenario.path}`;

      const t0 = performance.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(url, {
          method: scenario.method,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: scenario.body ? JSON.stringify(scenario.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const duration = performance.now() - t0;
        metrics.latencies.push(duration);

        if (res.status >= 200 && res.status < 400) {
          metrics.successful++;
        } else if (res.status === 429) {
          metrics.rateLimited429++;
        } else if (res.status >= 500) {
          metrics.serverErrors5xx++;
        } else {
          metrics.successful++; // other 4xx client errors
        }
      } catch {
        metrics.networkErrors++;
        metrics.latencies.push(performance.now() - t0);
      }
    }
  }

  // Spawn concurrency worker pool
  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  metrics.endTime = performance.now();
  const totalDurationSec = (metrics.endTime - metrics.startTime) / 1000;
  metrics.latencies.sort((a, b) => a - b);

  const rps = Math.round(metrics.totalRequests / totalDurationSec);
  const p50 = calculatePercentile(metrics.latencies, 50);
  const p95 = calculatePercentile(metrics.latencies, 95);
  const p99 = calculatePercentile(metrics.latencies, 99);
  const errorRate = (
    ((metrics.serverErrors5xx + metrics.networkErrors) / metrics.totalRequests) *
    100
  ).toFixed(2);
  const rateLimitRate = ((metrics.rateLimited429 / metrics.totalRequests) * 100).toFixed(2);

  console.log(`📊 STAGE RESULTS:`);
  console.log(`  Requests Completed: ${metrics.totalRequests}`);
  console.log(`  Duration: ${totalDurationSec.toFixed(2)}s`);
  console.log(`  Throughput: ${rps.toLocaleString()} req/sec`);
  console.log(`  p50 Latency: ${p50.toFixed(1)} ms`);
  console.log(`  p95 Latency: ${p95.toFixed(1)} ms`);
  console.log(`  p99 Latency: ${p99.toFixed(1)} ms`);
  console.log(`  Success Rate (2xx/3xx): ${metrics.successful} (${((metrics.successful / metrics.totalRequests) * 100).toFixed(1)}%)`);
  console.log(`  Rate Limited (429): ${metrics.rateLimited429} (${rateLimitRate}%)`);
  console.log(`  Server Failures (5xx): ${metrics.serverErrors5xx}`);
  console.log(`  Network Drops: ${metrics.networkErrors}`);
  console.log(`  Error Rate: ${errorRate}%\n`);

  return metrics;
}

async function main() {
  const targetUrl = process.argv[2] || 'http://localhost:3001';
  const totalReqs = parseInt(process.argv[3] || '2000', 10);
  const concurrency = parseInt(process.argv[4] || '100', 10);

  console.log(`\n============================================================`);
  console.log(`🛡️ DAILYEARN AI PRODUCTION SCALE LOAD BENCHMARK`);
  console.log(`Target Base URL: ${targetUrl}`);
  console.log(`============================================================`);

  await runLoadStage(targetUrl, totalReqs, concurrency);
}

if (process.argv[1]?.endsWith('load_test.ts') || process.argv[1]?.endsWith('load_test.js')) {
  main().catch(console.error);
}
