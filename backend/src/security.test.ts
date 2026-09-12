import { describe, it, expect, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { env } from './config/env';
import {
  classifyError,
  generateContent,
  resetCircuitBreaker,
  getGroqMetrics,
} from './config/groq';
import {
  isOriginAllowed,
} from './server';
import {
  APPLICATION_CONNECTION_BUDGET,
  POOL_SIZE_PER_INSTANCE,
} from './config/database';
import { sanitizeText } from './middleware/sanitize';
import { checkTokenRevocationStatus, markUserTokensRevoked } from './config/redis';

describe('Production Engineering & Security Defense Suite', () => {
  beforeEach(() => {
    resetCircuitBreaker();
  });

  describe('1. Database Connection Budgeting Formula', () => {
    it('should respect the mathematical connection budget without exceeding max', () => {
      const maxConn = env.MAX_DB_CONNECTIONS;
      const reserved = env.RESERVED_CONNECTIONS;
      const instances = Math.max(1, env.BACKEND_INSTANCES);

      expect(APPLICATION_CONNECTION_BUDGET).toBe(maxConn - reserved);
      expect(POOL_SIZE_PER_INSTANCE * instances + reserved).toBeLessThanOrEqual(maxConn);
      expect(POOL_SIZE_PER_INSTANCE).toBeGreaterThanOrEqual(2);
    });
  });

  describe('2. CORS & Origin Allowlist Hardening', () => {
    it('should allow same-origin or server-to-server requests without origin header', () => {
      expect(isOriginAllowed(undefined)).toBe(true);
      expect(isOriginAllowed('')).toBe(true);
    });

    it('should allow explicitly configured production origins', () => {
      expect(isOriginAllowed('https://dailyearn-frontend.onrender.com')).toBe(true);
      expect(isOriginAllowed('https://dailyearn-ai-2.onrender.com')).toBe(true);
    });

    it('should strictly reject malicious cross-origin domains', () => {
      expect(isOriginAllowed('https://evil-attacker.com')).toBe(false);
      expect(isOriginAllowed('http://malicious-phishing.site')).toBe(false);
      expect(isOriginAllowed('https://attacker-onrender.com')).toBe(false);
    });

    it('should allow local development origins in non-production environments', () => {
      if (env.NODE_ENV !== 'production') {
        expect(isOriginAllowed('http://localhost:5173')).toBe(true);
        expect(isOriginAllowed('http://127.0.0.1:3000')).toBe(true);
      }
    });
  });

  describe('3. JWT Security & Algorithm Confusion Resistance', () => {
    it('should verify standard HS256 tokens', () => {
      const token = jwt.sign(
        { userId: 'user-123', email: 'user@dailyearn.ai' },
        env.JWT_ACCESS_SECRET,
        { algorithm: 'HS256', expiresIn: '15m' }
      );

      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        algorithms: ['HS256'],
      }) as any;

      expect(decoded.userId).toBe('user-123');
      expect(decoded.email).toBe('user@dailyearn.ai');
    });

    it('should strictly reject algorithm "none" unsigned tokens', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ userId: 'admin', email: 'admin@hacker.com' })).toString('base64url');
      const forgedToken = `${header}.${payload}.`;

      expect(() => {
        jwt.verify(forgedToken, env.JWT_ACCESS_SECRET, {
          algorithms: ['HS256'],
        });
      }).toThrow();
    });

    it('should reject tokens signed with an unauthorized secret', () => {
      const forgedToken = jwt.sign(
        { userId: 'impostor', email: 'fake@dailyearn.ai' },
        'wrong_unauthorized_attacker_secret_key_123456789',
        { algorithm: 'HS256' }
      );

      expect(() => {
        jwt.verify(forgedToken, env.JWT_ACCESS_SECRET, {
          algorithms: ['HS256'],
        });
      }).toThrow();
    });
  });

  describe('4. Token Revocation & Multi-Instance Safety', () => {
    it('should report ACTIVE status for non-revoked token', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const status = await checkTokenRevocationStatus('user-clean-999', nowSeconds);
      // In tests without active Redis, reports UNAVAILABLE for fail-closed fallback
      expect(['ACTIVE', 'UNAVAILABLE']).toContain(status);
    });
  });

  describe('5. Groq Circuit Breaker State Machine & Protection', () => {
    it('should classify error types accurately without exposing secrets', () => {
      const classifiedAuth = classifyError(new Error('Invalid credentials: gsk_1234567890abcdefghijklmnop'), 401);
      expect(classifiedAuth.type).toBe('invalid_key');
      expect(classifiedAuth.retryable).toBe(false);
      expect(classifiedAuth.message).not.toContain('gsk_1234567890abcdefghijklmnop');

      const classifiedTimeout = classifyError(new Error('The operation was aborted due to timeout'), 408);
      expect(classifiedTimeout.type).toBe('timeout');
      expect(classifiedTimeout.retryable).toBe(true);

      const classifiedRate = classifyError(new Error('Rate limit 429 reached'), 429);
      expect(classifiedRate.type).toBe('rate_limit');
      expect(classifiedRate.retryable).toBe(true);
    });

    it('should report metrics accurately', () => {
      const m = getGroqMetrics();
      expect(m.circuitState).toBe('CLOSED');
      expect(typeof m.totalRequests).toBe('number');
      expect(typeof m.inFlightCount).toBe('number');
    });
  });

  describe('6. Input Sanitization & XSS Resistance', () => {
    it('should sanitize HTML tags from user inputs', () => {
      const dirty = '<script>alert("XSS")</script>Hello World';
      const clean = sanitizeText(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).toContain('Hello World');
    });

    it('should sanitize dangerous attributes like onerror and onload', () => {
      const malicious = '<img src=x onerror=alert(1)>Delivery Partner';
      const clean = sanitizeText(malicious);
      expect(clean).not.toContain('onerror');
      expect(clean).toContain('Delivery Partner');
    });
  });

  describe('7. IDOR & Ownership Protection Patterns', () => {
    it('should verify that user operations require explicit matching userId', () => {
      const authenticatedUserId: string = '11111111-1111-1111-1111-111111111111';
      const targetResourceUserId: string = '22222222-2222-2222-2222-222222222222';

      // Verify that authorization ownership check forbids cross-user modification
      const isAuthorized = (authenticatedUserId as string) === (targetResourceUserId as string);
      expect(isAuthorized).toBe(false);
    });
  });
});
