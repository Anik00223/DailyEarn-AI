# DailyEarn AI — Production Operations & Reliability Manual

## 1. Render Production Architecture

To support the target workload of **100,000 Concurrent Users**, the infrastructure on Render must be provisioned with adequate horizontal compute, memory, and database connection capacity:

| Service | Render Type | Recommended Plan | Configuration | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Static Site** | Static Site | Standard (CDN Enabled) | `staticPublishPath: dist` | Assets cached with `max-age=31536000, immutable`. Zero backend load. |
| **Backend Web Service** | Web Service | Standard / Pro | **4 to 8 Instances** (Auto-scaling: 4 min, 8 max) | Fully stateless. Health check: `/health/liveness`. |
| **PostgreSQL Database** | PostgreSQL | Standard (100 conn) / Pro (250 conn) | `DATABASE_POOL_SIZE = 20-27` | Connection budgeted (`INSTANCE_COUNT × POOL_SIZE + 20 <= MAX_DB`). |
| **Redis Cache & Queue** | Key-Value / Redis | Standard | TLS enabled (`rediss://`) | Distributed rate limiting, AI cache, and token revocation. |

---

## 2. Health & Readiness Probes Configuration

Render and load balancers must be configured with separate liveness and readiness probes to avoid expensive queries on health checks:

### Liveness Probe (`/health/liveness`)
- **Purpose**: Verify Node.js process is responsive and event loop is healthy.
- **Cost**: 0 ms (pure memory check, zero database queries).
- **HTTP Code**: 200 OK.
- **Render Setting**: Configure `healthCheckPath: /health/liveness`.

### Readiness Probe (`/health/readiness`)
- **Purpose**: Verify backend has active PostgreSQL connection capacity before routing user traffic.
- **Cost**: Single lightweight `SELECT 1` query. Returns `{ status: 'ready', pool: { total, idle, active, utilizationPercent } }`.
- **HTTP Code**: 200 OK if connected; 503 Service Unavailable if pool exhausted.

---

## 3. Zero-Downtime Deployment & Migration Safety

### Database Migration Principles:
1. **Never use destructive migrations**: Never run `DROP COLUMN`, `RENAME COLUMN`, or `DROP TABLE` in a single deployment.
2. **Expand and Contract Pattern**:
   - **Phase 1 (Expand)**: Add new nullable columns or tables. Deploy code that writes to both old and new columns.
   - **Phase 2 (Backfill)**: Run background migration to populate new columns.
   - **Phase 3 (Contract)**: Deploy code that reads only from new columns. Drop deprecated columns in a subsequent release.
3. **Automatic Startup Migration**:
   - The backend runs `migrate(db, { migrationsFolder })` on boot with try-catch notice logging, preventing failed non-breaking migrations from halting server boot.

---

## 4. Secret Rotation Procedures

### Rotating `GROQ_API_KEY`:
1. Generate new API key in Groq Console (`console.groq.com`).
2. Update `GROQ_API_KEY` in Render Dashboard -> Web Service -> Environment.
3. Render performs rolling restart of backend instances with zero downtime.
4. Old key can be revoked in Groq Console after 15 minutes.

### Rotating `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`:
1. Update `JWT_REFRESH_SECRET` first. Users currently logged in will be prompted to re-authenticate as their sessions refresh.
2. Update `JWT_ACCESS_SECRET`. Because access tokens are 15-minute lifespan, all active tokens will expire within 15 minutes.
3. To force immediate logout across all users: invalidate all rows in PostgreSQL `sessions` (`UPDATE sessions SET is_revoked = true`) and flush Redis (`FLUSHDB`).

---

## 5. Incident Response & Rollback Procedures

### Circuit Breaker Trip (Groq Unavailable)
- **Symptom**: Groq circuit breaker trips to `OPEN` status.
- **Automated Response**: Backend automatically falls back to deterministic qualitative rationales without dropping user requests or slowing down response times.
- **Action**: Check `https://status.groq.com/`. Once Groq recovers, the circuit breaker automatically probes and closes within 30 seconds.

### High 429 Rate (Rate Limit Exceeded)
- **Symptom**: Spikes in HTTP 429 responses.
- **Diagnosis**: Inspect structured logs for `route` and `ip`. Differentiate between automated scrapers/attacks vs organic traffic spikes.
- **Action**: Adjust `globalLimiter` or `decisionLimiter` environment variables if legitimate burst traffic warrants a higher threshold.

### Immediate Rollback:
```bash
git revert HEAD -m 1
git push origin main
```
Render automatically builds and deploys the previous stable commit.
