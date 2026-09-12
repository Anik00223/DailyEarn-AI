import crypto from 'crypto';
import { env, isGroqConfigured, getGroqApiKey } from './env';

export type GroqErrorType =
  | 'unconfigured'
  | 'rate_limit'
  | 'invalid_key'
  | 'model_error'
  | 'timeout'
  | 'validation_failed'
  | 'bad_request'
  | 'network_error'
  | 'circuit_breaker_open'
  | 'unknown';

export interface GroqError {
  type: GroqErrorType;
  message: string;
  retryable: boolean;
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  consecutiveSuccesses: number;
}

// ─── CIRCUIT BREAKER STATE ───
const circuitBreaker: CircuitBreakerState = {
  state: 'CLOSED',
  failureCount: 0,
  lastFailureTime: 0,
  consecutiveSuccesses: 0,
};

// ─── METRICS TELEMETRY ───
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  coalescedRequests: 0,
  circuitTripCount: 0,
  lastLatencyMs: 0,
};

// ─── IN-FLIGHT REQUEST COALESCING MAP ───
const inFlightRequests = new Map<string, Promise<string>>();

export function getGroqMetrics() {
  return {
    ...metrics,
    circuitState: circuitBreaker.state,
    failureCount: circuitBreaker.failureCount,
    inFlightCount: inFlightRequests.size,
  };
}

export function resetCircuitBreaker(): void {
  circuitBreaker.state = 'CLOSED';
  circuitBreaker.failureCount = 0;
  circuitBreaker.lastFailureTime = 0;
  circuitBreaker.consecutiveSuccesses = 0;
}

export function maskSecretInText(text: string): string {
  if (!text) return '';
  return text
    .replace(/gsk_[a-zA-Z0-9_-]{10,}/g, 'gsk_***')
    .replace(/nvapi-[a-zA-Z0-9_-]{10,}/g, 'nvapi-***');
}

export function classifyError(error: unknown, status?: number, errorDetail?: string): GroqError {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const message = maskSecretInText(rawMessage);
  const lowerMessage = message.toLowerCase();
  const lowerDetail = (errorDetail || '').toLowerCase();

  if (lowerMessage.includes('circuit breaker is open')) {
    return {
      type: 'circuit_breaker_open',
      message: 'Groq AI circuit breaker is active (temporarily failing fast due to provider errors)',
      retryable: false,
    };
  }
  if (lowerMessage.includes('unconfigured') || lowerMessage.includes('placeholder')) {
    return {
      type: 'unconfigured',
      message: 'Groq API is not configured or contains placeholder credentials',
      retryable: false,
    };
  }
  if (
    status === 401 ||
    status === 403 ||
    lowerMessage.includes('api key') ||
    lowerDetail.includes('invalid api key') ||
    lowerDetail.includes('unauthorized')
  ) {
    return {
      type: 'invalid_key',
      message: 'Groq API authentication failed. Verify GROQ_API_KEY in environment.',
      retryable: false,
    };
  }
  if (status === 404 || lowerDetail.includes('model') || lowerMessage.includes('model not found')) {
    return {
      type: 'model_error',
      message: `Configured Groq model (${env.GROQ_MODEL}) is not available or not found`,
      retryable: false,
    };
  }
  if (
    status === 429 ||
    lowerMessage.includes('429') ||
    lowerMessage.includes('rate limit') ||
    lowerDetail.includes('rate limit')
  ) {
    return { type: 'rate_limit', message: 'Groq API rate limit exceeded', retryable: true };
  }
  if (status === 400 || lowerDetail.includes('bad request')) {
    return {
      type: 'bad_request',
      message: `Groq API bad request: ${maskSecretInText(errorDetail || message)}`,
      retryable: false,
    };
  }
  if (lowerMessage.includes('validation failed') || lowerMessage.includes('json parse')) {
    return { type: 'validation_failed', message: 'AI response failed schema validation', retryable: true };
  }
  if (lowerMessage.includes('timeout') || lowerMessage.includes('deadline') || lowerMessage.includes('aborted')) {
    return { type: 'timeout', message: 'Groq API request timed out', retryable: true };
  }
  if (
    lowerMessage.includes('fetch failed') ||
    lowerMessage.includes('econnrefused') ||
    lowerMessage.includes('enotfound')
  ) {
    return { type: 'network_error', message: 'Network connection to api.groq.com failed', retryable: true };
  }
  if (status && status >= 500) {
    return { type: 'model_error', message: `Groq upstream server error (${status})`, retryable: true };
  }
  return { type: 'unknown', message: errorDetail || message, retryable: false };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkCircuitState(): void {
  const now = Date.now();
  if (circuitBreaker.state === 'OPEN') {
    if (now - circuitBreaker.lastFailureTime > env.CIRCUIT_BREAKER_RESET_TIMEOUT_MS) {
      circuitBreaker.state = 'HALF_OPEN';
      console.warn('[CircuitBreaker:Groq] Transitioned from OPEN to HALF_OPEN (probing provider recovery)');
    } else {
      throw new Error('Circuit breaker is open: Groq provider is temporarily suspended due to repeated failures');
    }
  }
}

function recordCircuitSuccess(): void {
  metrics.successfulRequests++;
  if (circuitBreaker.state === 'HALF_OPEN') {
    circuitBreaker.consecutiveSuccesses++;
    if (circuitBreaker.consecutiveSuccesses >= 2) {
      circuitBreaker.state = 'CLOSED';
      circuitBreaker.failureCount = 0;
      circuitBreaker.consecutiveSuccesses = 0;
      console.log('✅ [CircuitBreaker:Groq] Provider verified healthy — circuit closed');
    }
  } else if (circuitBreaker.state === 'CLOSED') {
    circuitBreaker.failureCount = 0;
  }
}

function recordCircuitFailure(): void {
  metrics.failedRequests++;
  circuitBreaker.failureCount++;
  circuitBreaker.lastFailureTime = Date.now();
  circuitBreaker.consecutiveSuccesses = 0;

  if (
    circuitBreaker.state === 'CLOSED' &&
    circuitBreaker.failureCount >= env.CIRCUIT_BREAKER_FAIL_THRESHOLD
  ) {
    circuitBreaker.state = 'OPEN';
    metrics.circuitTripCount++;
    console.warn(
      `🚨 [CircuitBreaker:Groq] Circuit TRIPPED to OPEN after ${circuitBreaker.failureCount} consecutive failures. Failing fast for ${env.CIRCUIT_BREAKER_RESET_TIMEOUT_MS}ms.`
    );
  } else if (circuitBreaker.state === 'HALF_OPEN') {
    circuitBreaker.state = 'OPEN';
    console.warn('🚨 [CircuitBreaker:Groq] Probe failed in HALF_OPEN — circuit reopened');
  }
}

/**
 * Executes raw network request to Groq API with bounded timeout and retry protection.
 */
async function executeGroqRequest(
  prompt: string,
  validator?: (text: string) => boolean
): Promise<string> {
  metrics.totalRequests++;
  checkCircuitState();

  if (!isGroqConfigured()) {
    throw new Error('Groq API error (unconfigured): GROQ_API_KEY is not configured or contains placeholder text');
  }

  const maxAttempts = 2; // Bounded retries: max 2 attempts only
  const baseDelay = 1000;
  const timeoutMs = env.GROQ_TIMEOUT_MS; // Bounded 8s default timeout
  const startTime = Date.now();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getGroqApiKey()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: env.GROQ_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.85,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let safeDetail = '';
        try {
          const errText = await response.text();
          const parsed = JSON.parse(errText);
          safeDetail = parsed.error?.message || '';
        } catch {
          // ignore parsing error
        }
        throw new Error(
          `HTTP_ERROR_STATUS_${response.status}${safeDetail ? ': ' + maskSecretInText(safeDetail) : ''}`
        );
      }

      const responseData = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const text = responseData.choices?.[0]?.message?.content;

      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Groq');
      }

      if (validator && !validator(text)) {
        throw new Error('Response validation failed (invalid JSON structure or fields)');
      }

      metrics.lastLatencyMs = Date.now() - startTime;
      recordCircuitSuccess();
      return text;
    } catch (error) {
      let status: number | undefined;
      let detail: string | undefined;
      const match = (error instanceof Error ? error.message : '').match(/HTTP_ERROR_STATUS_(\d+)(?:: (.*))?/);
      if (match && match[1]) {
        status = parseInt(match[1], 10);
        detail = match[2];
      }

      const classified = classifyError(error, status, detail);

      console.warn(
        `[Groq] Attempt ${attempt}/${maxAttempts} failed: ${classified.type} - ${classified.message}`
      );

      // Non-retryable errors (e.g. invalid key, model error, bad request) fail immediately
      if (!classified.retryable || attempt === maxAttempts) {
        recordCircuitFailure();
        throw new Error(`Groq API error (${classified.type}): ${classified.message}`);
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  recordCircuitFailure();
  throw new Error('Groq API: all retry attempts exhausted');
}

/**
 * Public generateContent method with request coalescing/deduplication.
 * Identical concurrent requests share the exact same pending in-flight promise.
 */
export async function generateContent(
  prompt: string,
  validator?: (text: string) => boolean
): Promise<string> {
  const promptHash = crypto.createHash('sha256').update(prompt.trim()).digest('hex');

  // Request Coalescing / Deduplication
  const existingPromise = inFlightRequests.get(promptHash);
  if (existingPromise) {
    metrics.coalescedRequests++;
    return existingPromise;
  }

  const promise = executeGroqRequest(prompt, validator).finally(() => {
    inFlightRequests.delete(promptHash);
  });

  inFlightRequests.set(promptHash, promise);
  return promise;
}
