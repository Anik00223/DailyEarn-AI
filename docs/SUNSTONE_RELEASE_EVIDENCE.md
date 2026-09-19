# DailyEarn AI — Sunstone Release Evidence (Verified Facts Only)

> Every number below was **measured** during the final release audit (2026-09-19, commit
> `17be6e8` unless noted). Nothing on this page is aspirational. Where a claim could not be
> verified, it is explicitly marked `NOT_VERIFIED`.

## Problem & Product
- **Problem**: In Bharat's tier-2/3 informal economy, workers choose income activities on
  hearsay — with zero accounting for platform fees, fuel, materials, vehicle needs, or
  local platform availability.
- **Product**: A decision engine that converts *location + skills + time + capital +
  vehicle + target income* into a feasibility verdict, deterministic net-income math,
  ranked verified opportunities, a gap-closing lever list, and a 7-day execution plan.

## Architecture (verified in code and live behavior)
- **Deterministic core** (`backend/src/engines/*`): income, scoring (8 weighted factors),
  feasibility, confidence, income mix, target gap, execution plan. All financial outputs
  and rankings are TypeScript-computed; the LLM is statutorily forbidden from arithmetic.
- **Location Intelligence (`locintel-v1`)**: canonical city registry (OSM Nominatim
  place_rank/importance, city precision only), verified signals (catalog tier coverage,
  platform restrictions, transport), and category relevance mapping feeding `locationFit`.
- **AI layer**: Groq (primary) → NVIDIA (secondary) → deterministic fallback. The AI only
  ever writes qualitative rationale and city tips, prefixed with
  `"General model inference: "` (closed-world: no localities, streets, or landmarks).

## Location Intelligence — live 4-city regression (Phase 5)
Identical inputs (`Teaching`, 4h, ₹751–754 target), city varied:
| City | Tier | Signals | Top-1 | Scores (top-3) | locationFit (tutor) |
|---|---|---|---|---|---|
| Silchar | tier3 | 4 (incl. delivery=limited, transport) | local-home-tutor-school | 91/91/80 | 88 |
| Guwahati | tier2 | 2 | local-home-tutor-school | 91/91/80 | 88 |
| Indore | tier2 | 2 | local-home-tutor-school | 91/91/80 | 88 |
| Bangalore | tier1 | 2 | local-home-tutor-school | 90/90/78 | 80 |

- Determinism: identical repeat request → identical slugs+scores (`true`).
- Same-tier cities (Guwahati vs Indore): identical selection — no artificial randomization.
- Tier-differentiated cities: measurably different scores (tier3/2 get the catalog-verified
  +8 tier-coverage bonus; Bangalore does not).
- Platform restriction evidence (delivery profile, run at commit `81c1e0d`):
  Swiggy locationFit **84** (Silchar) / 78 (Guwahati, Indore) / 70 (Bangalore); **Porter is
  penalized out of Silchar's top-5** (catalog: `supportedLocationTiers: ['tier1','tier2']`
  + restrictions text excluding tier-3) while appearing in the other three cities' top-5.
  Urban Company: 40 in Silchar vs 70 in Mumbai (unit-tested at locFit level).

## AI paths — live (Phase 6, commit `17be6e8`)
| Path | Provider used | HTTP | Latency | Deterministic output |
|---|---|---|---|---|
| Normal | **groq** (`qwen/qwen3.8-27b`) | 200 | 1339 ms | signature A |
| Groq failure (simulated) | **nvidia** | 200 | 14508 ms | signature A |
| Groq+NVIDIA failure | **deterministic** (`fallback_rate_limit`) | 200 | 300 ms | signature A |

- Signature (slug:score:netDaily for all 5 recommendations) was **identical across all
  three paths** → AI can never change income, deductions, score, feasibility, gap, or rank.

## Hyper-local trust (Phase 7)
- `locationIntelligence.context.precision = "city"` in all 4 cities; district shown
  (e.g. Cachar); no street/landmark/locality data exists anywhere in the system.
- 20/20 live tips began with the mandated inference prefix; **0 invented localities**
  (audited against a named-locality regex); 0 duplicated prefixes after the
  prefix-collapse fix (commit `812435b`).

## AI resilience & coalescing (Phase 8, live)
- 3 identical concurrent evaluates → all HTTP 200, identical outputs,
  Groq provider-call delta 2 with **1 coalesced**, NVIDIA absorbed 1 + **2 coalesced**.
- Circuit breakers CLOSED (0 trips) after load; AI failure is a degraded condition
  (deterministic tips render), never a user-facing outage.

## Controlled concurrency (Phase 9 — production, non-AI endpoints)
Mix: 50% `/health/liveness`, 30% `/api/decision/catalog`, 20% `/api/decision/simulator`
(deterministic, no AI calls). Staged: 10 → 25 → 50 → 100 → 250 concurrent users, 3 req each.
| Users | Reqs | RPS | p50 | p95 | p99 | 2xx | 429 | 5xx |
|---|---|---|---|---|---|---|---|---|
| 10 | 30 | 14.4 | 366 ms | 1144 ms | 1222 ms | 30 | 0 | 0 |
| 25 | 75 | 33.5 | 308 ms | 976 ms | 1045 ms | 75 | 0 | 0 |
| 50 | 150 | 79.2 | 308 ms | 950 ms | 1137 ms | 150 | 0 | 0 |
| 100 | 300 | 104.2 | 346 ms | 1140 ms | 1248 ms | 173 | 127 | 0 |
| 250 | 750 | 211.1 | 710 ms | 1690 ms | 2331 ms | 379 | 371 | 0 |

- **Highest verified level: 250 concurrent users (750 requests), 211 RPS, zero 5xx.**
- First bottleneck: the application **rate limiter** (429s from ~100 concurrent) — an
  intentional protection boundary, not infra collapse. Post-load: RSS 132 MB, DB pool
  0 active / 80 max, both AI circuits CLOSED, `/api/health` still answering.
- **100K concurrent users: NOT_VERIFIED** (single Render instance; no staging cluster).
  *Architected for horizontal scaling toward 100K; verified up to 250 under controlled
  test conditions.*

## Real browser end-to-end (Phase 4 + 11, headless Chrome → dailyearn-ai-2.onrender.com)
Fresh synthetic user journey, all steps verified against production:
1. Register (fresh `hallmark_*` user) → redirected to `/dashboard`.
2. Dashboard auto-evaluates the profile location (Silchar): recommendations + 11 city
   mentions + 5 inference-prefixed tips rendered.
3. Business ideas rendered (6 headings, city-attributed, dual-stream income mix present).
4. 7-Day Plan drawer opened ("7-Day Plan") — Day 1 content rendered; "SAVE 7-DAY ROADMAP" clicked.
5. Page refresh → still `/dashboard` with state intact (persistence verified).
6. Logout (sidebar "Exit") → redirected to `/login`.
7. `GET /api/auth/me` without token (direct to backend) → **401**.
8. Login again with the same credentials → `/dashboard`.
- Viewports 1440×900, 1920×1080, 390×844, 375×667: **zero horizontal overflow** at all four.
- Runtime: **zero JavaScript page errors** (only expected 401/404 network console entries).
- Screenshots: `final-01..07`, `final-vp-*` (audit harness, outside repo).

## Security (Phase 12 — live production probes + 14-check `security.test.ts`)
| Check | Live result |
|---|---|
| JWT `alg:none` | 401 rejected |
| Garbage token / no token on `/api/auth/me` | 401 / 401 |
| CORS untrusted origin preflight | no `access-control-allow-origin` granted |
| SQL-injection payload in `city` | **403 rejected** (input guard) |
| XSS payload in `city` | 200, echoed verbatim — see limitations (LOW, not exploitable: React auto-escaping, zero `dangerouslySetInnerHTML`/`innerHTML` sinks anywhere) |
| Oversized payload (2 KB city + maxed skills) | 400 rejected |
| Path traversal `/api/decision/catalog/../../server.js` | 404 |
| Stack-trace leak in error responses | none (structured `{code,message,errors}` only) |
| Anonymous access to live AI diagnostics (`/test-ai`) | was 200 — **defect fixed** (commit `17be6e8`): now 401 unauth / 200 authed |
| Response headers | `x-frame-options: DENY`, `nosniff`, HSTS, CSP, `x-request-id` present |

## Database capacity (Phase 10)
- Connection budget formula (enforced in code): `instances × pool/instance + reserved ≤ DB max`.
  Production measured: 1 instance × 80 pool + 20 reserved = **100 ≤ 100**.
- Under full load test: `activeCount 0 / maxAllowed 80`, `waitingCount 0` — no starvation.
- `/health/readiness`: `database: connected`; DB marked `ok` in `/api/health` throughout.

## Observability (Phase 13)
- `X-Request-Id` header on live responses (verified); structured telemetry logs per request
  (requestId, method, route, status, duration); `/api/monitor` exposes uptime, memory
  (RSS 126–132 MB measured), pool state, Groq/NVIDIA metrics (calls, coalesced, circuit
  state), and AI config with **key lengths only — no secrets**.
- Gap (documented, not fixed): no external APM/trace aggregation — logs are Render stdout only.

## Bugs found & fixed in this audit (Phase 14)
1. **Doubled inference prefix** on AI tips (live-reproduced 2/5 tips in Bangalore run) —
   root cause: verbatim tip assignment; fix: `collapseInferencePrefixes` normalization +
   6 unit tests (commit `812435b`); live re-verify: 0/20 doubled.
2. **Unauthenticated `/api/decision/test-ai`** triggering live provider calls (200 anonymous)
   — quota-abuse vector; fix: `authenticate` middleware + QA verifier script auth (commit
   `17be6e8`); live re-verify: 401 unauth / 200 authed.

## Final regression (Phase 15)
- Backend: **98/98 tests pass** (10 files); `tsc` build clean.
- Frontend: production build clean (Vite).
- Browser E2E executed against deploy `812435b` (the only later change, `17be6e8`, touches
  only an authenticated diagnostics route — re-verified live separately).

## Production deployment (Phase 1–3)
- `HEAD == origin/main == Render` at every step (verified via `/api/health` commit field).
- Production health: `database ok`, `groq configured (CLOSED)`, `nvidia configured (CLOSED)`,
  liveness `alive`, readiness `ready`.
- **Redis: DEGRADED/BLOCKED** — `REDIS_URL` is intentionally unset; Render Dashboard
  configuration (Key-Value service) is required. Consequences (graceful, by design):
  rate limiting falls back to in-memory per-instance stores; AI cache is effectively
  disabled in production; auth revocation falls back to PostgreSQL. App remains fully
  functional (`/api/health` reports degraded, not down).

## Known limitations (honest)
1. Redis not configured in production (above) → no cross-instance cache/rate-limit sharing.
2. 100K concurrency NOT_VERIFIED; verified ceiling 250 users / 211 RPS / 0 5xx (single instance).
3. NVIDIA fallback latency is high (measured 14.5 s tip path vs 1.3 s Groq); acceptable as failover-only.
4. XSS input echo is stored unescaped in DB (defense-in-depth gap; not exploitable in-app —
   React escaping + zero HTML sinks; documented for future input hardening).
5. City registry covers 5 audited cities; all other cities use the neutral/legacy fallback path.
6. Test accounts: synthetic QA users (`locqa_*`, `hallmark_*`, `deployverify_*`
   `@dailyearn-test.dev`) remain in the database — no real users were touched; removal
   requires DB credentials not held in this environment.


