import { env, isGroqConfigured } from './env';

export type GroqErrorType =
  | 'unconfigured'
  | 'rate_limit'
  | 'invalid_key'
  | 'model_error'
  | 'timeout'
  | 'validation_failed'
  | 'bad_request'
  | 'network_error'
  | 'unknown';

export interface GroqError {
  type: GroqErrorType;
  message: string;
  retryable: boolean;
}

function maskSecretInText(text: string): string {
  if (!text) return '';
  return text.replace(/gsk_[a-zA-Z0-9_-]{10,}/g, 'gsk_***');
}

export function classifyError(error: unknown, status?: number, errorDetail?: string): GroqError {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const message = maskSecretInText(rawMessage);
  const lowerMessage = message.toLowerCase();
  const lowerDetail = (errorDetail || '').toLowerCase();

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

export async function generateContent(
  prompt: string,
  validator?: (text: string) => boolean
): Promise<string> {
  // Short-circuit immediately if Groq credentials are not configured or placeholder
  if (!isGroqConfigured()) {
    throw new Error('Groq API error (unconfigured): GROQ_API_KEY is not configured or contains placeholder text');
  }

  const maxAttempts = 3;
  const baseDelay = 1500; // 1.5s -> 3s -> 6s exponential backoff
  const timeoutMs = 30000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: env.GROQ_MODEL,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.85,
          response_format: {
            type: 'json_object',
          },
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
        choices?: Array<{
          message?: {
            content?: string;
          };
        }>;
      };

      const text = responseData.choices?.[0]?.message?.content;

      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Groq');
      }

      if (validator && !validator(text)) {
        throw new Error('Response validation failed (invalid JSON structure or fields)');
      }

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

      if (!classified.retryable || attempt === maxAttempts) {
        throw new Error(`Groq API error (${classified.type}): ${classified.message}`);
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`[Groq] Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw new Error('Groq API: all retry attempts exhausted');
}

