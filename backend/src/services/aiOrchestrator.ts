import crypto from 'crypto';
import { generateContent, classifyError, getGroqMetrics } from '../config/groq';
import { generateNvidiaContent, classifyNvidiaError, getNvidiaMetrics } from '../config/nvidia';
import { env, isGroqConfigured, isNvidiaConfigured } from '../config/env';
import { redisGet, redisSet } from '../config/redis';

export interface AiOrchestrationResult {
  content: string;
  provider: 'groq' | 'nvidia' | 'deterministic' | 'cache';
  reason: 'success' | 'rate_limited' | 'timeout' | 'circuit_open' | 'unavailable' | 'fallback' | 'cached';
  latencyMs: number;
  model: string;
  fromCache: boolean;
}

export interface OrchestrateOptions {
  forceGroqFailure?: boolean;
  forceNvidiaFailure?: boolean;
  skipCache?: boolean;
}

export async function orchestrateAiRequest(
  prompt: string,
  validator?: (text: string) => boolean,
  options?: OrchestrateOptions
): Promise<AiOrchestrationResult> {
  const startTime = Date.now();
  const promptHash = crypto.createHash('sha256').update(prompt.trim()).digest('hex');
  const cacheKey = `ai:decision:${promptHash}`;

  // 1. Check Redis / In-Memory Cache (1 hour TTL)
  if (!options?.skipCache) {
    try {
      const cached = await redisGet(cacheKey);
      if (cached && cached.trim().length > 0) {
        if (!validator || validator(cached)) {
          return {
            content: cached,
            provider: 'cache',
            reason: 'cached',
            latencyMs: Date.now() - startTime,
            model: 'cache',
            fromCache: true,
          };
        }
      }
    } catch {
      // Non-fatal cache read error
    }
  }

  let groqFailureReason: 'rate_limited' | 'timeout' | 'circuit_open' | 'unavailable' | null = null;

  // 2. Primary Provider: Groq
  if (isGroqConfigured() && !options?.forceGroqFailure) {
    try {
      const groqStart = Date.now();
      const rawResponse = await generateContent(prompt, validator);
      const latencyMs = Date.now() - groqStart;

      // Cache valid response
      if (!options?.skipCache) {
        try {
          await redisSet(cacheKey, rawResponse, 3600);
        } catch {
          // Non-critical cache write error
        }
      }

      return {
        content: rawResponse,
        provider: 'groq',
        reason: 'success',
        latencyMs,
        model: env.GROQ_MODEL,
        fromCache: false,
      };
    } catch (groqError) {
      const classified = classifyError(groqError);
      if (classified.type === 'rate_limit') {
        groqFailureReason = 'rate_limited';
      } else if (classified.type === 'timeout') {
        groqFailureReason = 'timeout';
      } else if (classified.type === 'circuit_breaker_open') {
        groqFailureReason = 'circuit_open';
      } else {
        groqFailureReason = 'unavailable';
      }
      console.warn(
        `[AiOrchestrator] Primary provider (Groq) failed (${classified.type}): ${classified.message}. Failing over to secondary provider (NVIDIA)...`
      );
    }
  } else {
    groqFailureReason = options?.forceGroqFailure ? 'rate_limited' : 'unavailable';
    if (options?.forceGroqFailure) {
      console.warn(
        '[AiOrchestrator] Primary provider (Groq) simulated failure triggered. Failing over to secondary provider (NVIDIA)...'
      );
    }
  }

  // 3. Secondary Provider: NVIDIA API
  if (isNvidiaConfigured() && !options?.forceNvidiaFailure) {
    try {
      const nvidiaStart = Date.now();
      const rawResponse = await generateNvidiaContent(prompt, validator);
      const latencyMs = Date.now() - nvidiaStart;

      // Cache valid response
      if (!options?.skipCache) {
        try {
          await redisSet(cacheKey, rawResponse, 3600);
        } catch {
          // Non-critical cache write error
        }
      }

      return {
        content: rawResponse,
        provider: 'nvidia',
        reason: 'success',
        latencyMs,
        model: env.NVIDIA_MODEL,
        fromCache: false,
      };
    } catch (nvidiaError) {
      const classified = classifyNvidiaError(nvidiaError);
      console.warn(
        `[AiOrchestrator] Secondary provider (NVIDIA) failed (${classified.type}): ${classified.message}. Reverting to deterministic engine fallback.`
      );
    }
  }

  // 4. Deterministic Local Fallback
  return {
    content: '',
    provider: 'deterministic',
    reason: groqFailureReason || 'fallback',
    latencyMs: Date.now() - startTime,
    model: 'deterministic-engine',
    fromCache: false,
  };
}

export function getAiOrchestratorMetrics() {
  return {
    groq: getGroqMetrics(),
    nvidia: getNvidiaMetrics(),
  };
}
