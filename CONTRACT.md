# DailyEarn AI — API Contract v1.0

## Base URL
- Dev:  `http://localhost:3001/api`
- Prod: `https://api.dailyearn.ai/api`

## Auth Pattern
- Access token: `Authorization: Bearer <token>` header (15 min expiry)
- Refresh token: httpOnly cookie named `refreshToken` (7 day expiry)
- Auto-refresh: client retries on `401 TOKEN_EXPIRED`

---

## TypeScript Types

```typescript
interface User {
  id: string;
  name: string | null;
  email: string;
  city: string | null;
  state: string | null;
  skillTags: string[] | null;
  dailyIncomeGoal: number | null;
  languagePref: 'en' | 'hi' | 'bn' | 'te' | 'ta' | 'mr' | null;
}

interface Idea {
  id: string;
  userId: string | null;
  title: string;
  description: string;
  estimatedDailyEarn: number;
  estimatedWeeklyEarn: number;
  effortLevel: 'low' | 'medium' | 'high';
  skillsRequired: string[] | null;
  platformName: string;
  platformUrl: string;
  gettingStartedSteps: string[] | null;
  earningsBreakdown: string;
  citySpecificTip: string;
  isSaved: boolean | null;
  isDismissed: boolean | null;
  generatedAt: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
}

interface UserStats {
  totalIdeasGenerated: number;
  totalSaved: number;
  totalDismissed: number;
  estimatedMonthlyEarnings: number;
  topPlatforms: string[];
}

interface PaginatedIdeas {
  ideas: Idea[];
  total: number;
}

interface AuthResponse {
  accessToken: string;
  user: User;
}

interface RefreshResponse {
  accessToken: string;
}

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  city: string;
  state: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface GenerateIdeasInput {
  city: string;
  state: string;
  skills: string[];
  dailyGoal?: number;    // default: 500
  language?: 'en' | 'hi' | 'bn' | 'te' | 'ta' | 'mr';  // default: 'en'
  count?: number;         // default: 5, max: 10
}

interface UpdateProfileInput {
  name?: string;
  city?: string;
  state?: string;
  skillTags?: string[];
  dailyIncomeGoal?: number;
  languagePref?: 'en' | 'hi' | 'bn' | 'te' | 'ta' | 'mr';
}
```

---

## Endpoints

### Auth

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| `POST` | `/auth/register` | — | `RegisterInput` | `ApiResponse<AuthResponse>` |
| `POST` | `/auth/login` | — | `LoginInput` | `ApiResponse<AuthResponse>` |
| `POST` | `/auth/logout` | ✅ Bearer | — | `ApiResponse<null>` |
| `POST` | `/auth/refresh` | Cookie | — | `ApiResponse<RefreshResponse>` |
| `GET` | `/auth/me` | ✅ Bearer | — | `ApiResponse<User>` |

### Ideas

| Method | Path | Auth | Body/Query | Response |
|--------|------|------|------------|----------|
| `POST` | `/ideas/generate` | ✅ Bearer | `GenerateIdeasInput` | `ApiResponse<Idea[]>` |
| `GET` | `/ideas` | ✅ Bearer | `?page=1&limit=10` | `ApiResponse<PaginatedIdeas>` |
| `PUT` | `/ideas/:id/save` | ✅ Bearer | — | `ApiResponse<Idea>` |
| `PUT` | `/ideas/:id/dismiss` | ✅ Bearer | — | `ApiResponse<null>` |
| `GET` | `/ideas/saved` | ✅ Bearer | — | `ApiResponse<Idea[]>` |

### User

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| `PUT` | `/user/profile` | ✅ Bearer | `UpdateProfileInput` | `ApiResponse<User>` |
| `GET` | `/user/stats` | ✅ Bearer | — | `ApiResponse<UserStats>` |

### Health

| Method | Path | Auth | Response |
|--------|------|------|----------|
| `GET` | `/health` | — | `{ status: 'ok', timestamp: string }` |

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_TOKEN` | 401 | Missing, malformed, or invalid token |
| `TOKEN_EXPIRED` | 401 | Access/refresh token has expired |
| `REFRESH_TOKEN_REUSE` | 401 | Reuse detected — all family sessions revoked |
| `UNAUTHORIZED` | 401 | Invalid credentials |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `VALIDATION_ERROR` | 400 | Zod validation failed |
| `CONFLICT` | 409 | Resource already exists (e.g., duplicate email) |
| `NOT_FOUND` | 404 | Resource not found |
| `IDEA_GENERATION_FAILED` | 502 | AI generation or parsing failed |
| `QUEUE_TIMEOUT` | 504 | Job timed out |
| `INTERNAL_ERROR` | 500 | Unexpected server error (no details exposed) |

---

## Rate Limits

| Endpoint | Limit | Window | Key |
|----------|-------|--------|-----|
| `POST /auth/login` | 5 | 15 min | IP |
| `POST /auth/register` | 3 | 1 hour | IP |
| `POST /ideas/generate` | 10 | 1 hour | User ID |
| Global | 100 | 1 min | IP |

---

## Cookie Spec

```
Name:     refreshToken
HttpOnly: true
Secure:   true (production only)
SameSite: Strict
MaxAge:   604800000 (7 days in ms)
Path:     /api/auth/refresh
```
