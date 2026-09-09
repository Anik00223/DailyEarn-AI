import { describe, it, expect, vi } from 'vitest';
import { classifyError } from './groq';
import { isQualitativeTextOnly, aiEnrichmentResponseSchema } from '../modules/decision/decision.schema';
import { sanitizeAiRationale } from '../modules/decision/decision.service';
import { maskSecret } from '../groqDiagnostic';

describe('Groq Integration & Error Classification', () => {
  it('should classify unconfigured or placeholder keys accurately', () => {
    const err = classifyError(new Error('Groq API error (unconfigured): GROQ_API_KEY is not configured'));
    expect(err.type).toBe('unconfigured');
    expect(err.retryable).toBe(false);
  });

  it('should classify 401/403 authentication failures as non-retryable invalid_key', () => {
    const err = classifyError(new Error('HTTP_ERROR_STATUS_401: Invalid API Key'), 401, 'Invalid API Key');
    expect(err.type).toBe('invalid_key');
    expect(err.retryable).toBe(false);
    expect(err.message).toContain('authentication failed');
  });

  it('should classify 404 model not found as non-retryable model_error', () => {
    const err = classifyError(new Error('HTTP_ERROR_STATUS_404: Model not found'), 404, 'Model does not exist');
    expect(err.type).toBe('model_error');
    expect(err.retryable).toBe(false);
  });

  it('should classify 429 rate limits as retryable', () => {
    const err = classifyError(new Error('HTTP_ERROR_STATUS_429: Rate limit reached'), 429, 'Rate limit exceeded');
    expect(err.type).toBe('rate_limit');
    expect(err.retryable).toBe(true);
  });

  it('should classify timeouts as retryable timeout errors', () => {
    const err = classifyError(new Error('The user aborted a request. Request timed out'));
    expect(err.type).toBe('timeout');
    expect(err.retryable).toBe(true);
  });

  it('should classify 5xx provider errors as retryable', () => {
    const err = classifyError(new Error('HTTP_ERROR_STATUS_503: Service Unavailable'), 503, 'Service Unavailable');
    expect(err.type).toBe('model_error');
    expect(err.retryable).toBe(true);
  });

  it('should classify network/DNS failures as retryable network_error', () => {
    const err = classifyError(new Error('fetch failed: getaddrinfo ENOTFOUND api.groq.com'));
    expect(err.type).toBe('network_error');
    expect(err.retryable).toBe(true);
  });

  it('should mask API keys in diagnostic previews and messages', () => {
    const secret = 'gsk_abcdef1234567890qwertyuiop';
    const masked = maskSecret(secret);
    expect(masked).not.toBe(secret);
    expect(masked).toContain('gsk_...uiop');
    expect(masked).not.toContain('abcdef1234567890');
  });
});

describe('Qualitative Validation & Fallback Rationale', () => {
  it('should allow natural English qualitative descriptions containing common words like one', () => {
    const validPhrases = [
      'This is one of the highest demand teaching roles in Silchar.',
      'Strong alignment with your teaching background and flexible morning schedule.',
      'One-on-one sessions provide high local reliability in residential areas.',
    ];

    for (const phrase of validPhrases) {
      const res = isQualitativeTextOnly(phrase);
      expect(res.valid).toBe(true);
    }
  });

  it('should strictly reject numeric scores, currency, and quantities', () => {
    const invalidPhrases = [
      'Scored 95/100 for your profile.',
      'Ranked #1 among all options.',
      'Earn ~₹800/day net income.',
      'Delivers eight hundred rupees daily.',
      'Ranked rank one for your location.',
    ];

    for (const phrase of invalidPhrases) {
      const res = isQualitativeTextOnly(phrase);
      expect(res.valid).toBe(false);
    }
  });

  it('should sanitize residual empty brackets and tildes without leaving artifacts', () => {
    const mangled = 'High skill match (95/100) delivering ~₹800/day in Silchar.';
    const sanitized = sanitizeAiRationale(mangled, 'Fallback rationale');
    // If sanitized, it shouldn't contain "()" or "~"
    expect(sanitized).not.toContain('()');
    expect(sanitized).not.toContain('~');
  });
});
