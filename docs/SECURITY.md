# DailyEarn AI — Security Architecture & Threat Model

## 1. Executive Summary & Security Philosophy

DailyEarn AI is an intelligence and execution planning platform for daily income earners across India. Because the platform delivers actionable financial guidance, the integrity of its calculations and the confidentiality of user profiles are paramount.

> [!IMPORTANT]
> **Defensive Security Reality**: No production software system is mathematically impossible to compromise. DailyEarn AI enforces **defense-in-depth**, follows OWASP Application Security Verification Standards (ASVS), establishes strict boundaries between deterministic financial engines and qualitative AI advice, and fails safely under stress.

---

## 2. Threat Model & Realistic Attack Classes

| Threat Class | Realistic Attack Vector | DailyEarn AI Defensive Control | Status |
| :--- | :--- | :--- | :--- |
| **Authentication Bypass** | Algorithm confusion (e.g. `alg: none`, HMAC-RSA confusion) | `jwt.verify` strictly enforces `{ algorithms: ['HS256'] }`. Secret tokens are minimum 64 characters. | **Hardened** |
| **Session Fixation / Token Theft** | Stolen access or refresh tokens after user logout | Revocation is horizontally synchronized via Redis blocklist (`auth:revoked:<userId>`). Logout immediately invalidates refresh token in PostgreSQL and writes a 15-minute revocation barrier to Redis with fail-closed DB fallback. | **Hardened** |
| **Credential Stuffing & Brute Force** | High-velocity dictionary attacks on `/api/auth/login` | Distributed IP rate limiting (`loginLimiter` strictly caps at 5 attempts per 15 minutes in production). Passwords hashed with adaptive `bcrypt` (12 rounds). Generic error messages (`Invalid email or password`) prevent user enumeration. | **Hardened** |
| **IDOR / Privilege Escalation** | Manipulating user IDs in requests to read or modify other users' plans, stats, or ideas | Zero client-side trust. All protected routes (`/user/*`, `/ideas/*`, `/decision/plans`, `/decision/outcomes`) derive `userId` strictly from verified JWT claims (`req.user.userId`). Direct object queries enforce `where(and(eq(table.id, id), eq(table.userId, req.user.userId)))`. | **Hardened** |
| **SQL Injection (SQLi)** | Malicious SQL syntax in search, login, or decision inputs | 100% parameterized queries via Drizzle ORM. Zero raw string concatenation in SQL queries. Schema validation on all parameters via Zod. | **Hardened** |
| **Cross-Site Scripting (XSS)** | Injected HTML/JS payloads in opportunity notes, user skills, or feedback | `DOMPurify` HTML sanitization middleware applied to all request bodies, queries, and parameters. React automatic output encoding. Zero `dangerouslySetInnerHTML` or raw `innerHTML` across frontend components. | **Hardened** |
| **Cross-Origin Resource Sharing (CORS)** | Malicious web applications issuing credentialed requests | Strict production CORS allowlist. Disallows wildcard `*` when credentials are true. Preflight cache bounded to 24 hours. | **Hardened** |
| **AI Prompt Injection & Hallucination** | User crafts inputs to force Groq LLM to override financial payouts or scores | **Deterministic Engine Isolation**: The deterministic TypeScript engines (`incomeEngine`, `scoringEngine`, `feasibilityEngine`, `targetGapEngine`) are the sole source of truth for numeric metrics, ranking, and eligibility. Groq output is post-processed by `sanitizeAiRationale` which strips any hallucinated scores, currency amounts, or ranks before rendering. | **Hardened** |
| **AI Denial of Service & Cost Exhaustion** | Concurrent flooding of Groq-backed decision endpoints | AI-specific rate limiter (10 req/min per user/IP), in-flight request coalescing (promise deduplication), 1-hour Redis caching of qualitative outputs, bounded 8-second timeouts, and Circuit Breaker (5 error trip, 30s probe). Instant fallback to deterministic rationale. | **Hardened** |
| **Geocoding Nominatim Overload** | Continuous typing triggering OSM rate-limit bans | Bounded 3.5s AbortController timeout on OSM Nominatim queries, Redis 24-hour cache, and instant static fallback. | **Hardened** |

---

## 3. Authentication & Credential Architecture

### Password Storage
- Passwords hashed using **bcrypt** with `BCRYPT_ROUNDS = 12` (adaptive cost factor balanced for production throughput and brute-force resistance).
- Passwords are never logged, never returned in API responses, and never stored in temporary caches.

### Token Architecture
1. **Access Token**:
   - Short-lived JWT (15-minute lifespan).
   - Contains `{ userId, email, iat, exp }`.
   - Signed with HMAC-SHA256 (`HS256`).
   - Stored strictly in **client memory** (Zustand state store). **Never written to localStorage or sessionStorage**.
2. **Refresh Token**:
   - Long-lived cryptographically random token (7-day lifespan).
   - Stored only in an **HttpOnly, Secure, SameSite=Lax** cookie scoped to `/api/auth`.
   - Stored in PostgreSQL `sessions` table as a one-way **SHA-256 hash** (`refreshTokenHash`).
   - Includes `tokenFamily` UUID for automatic reuse detection. If a revoked refresh token is presented, the entire token family is immediately revoked, defeating token replay attacks.

### Multi-Instance Token Revocation & Failure Safety
- When a user logs out or session reuse is detected:
  1. PostgreSQL session marked `isRevoked: true`.
  2. Redis key `auth:revocation:<userId>` is set to current timestamp with 900s TTL (matching 15-minute access token lifetime).
  3. All horizontal backend instances check `checkTokenRevocationStatus(userId, iat)` on every authenticated request.
  4. **Fail-Closed Security**: If Redis is offline, the authentication middleware executes a fallback query against PostgreSQL `sessions`. If no active, unrevoked session exists for the user, access is **denied (401)**. Redis failure never silently bypasses revocation.

---

## 4. HTTP Security Headers

DailyEarn AI backend configures strict HTTP security headers via Helmet:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://dailyearn-frontend.onrender.com; frame-src 'none'; object-src 'none';
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 5. Residual Risks & Future Roadmap

1. **Distributed DoS at L3/L4**: Volumetric network flooding must be mitigated by cloud provider edge infrastructure (Render CDN / Cloudflare).
2. **Account Recovery & Multi-Factor Auth (MFA)**: Future versions should introduce TOTP/SMS MFA for sensitive profile edits.
3. **Continuous Dependency Vulnerability Scanning**: Automated GitHub Dependabot PRs and CI/CD audit gates ensure ongoing package hygiene.
