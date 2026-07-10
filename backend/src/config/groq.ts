import { env } from './env';

export type GroqErrorType = 'rate_limit' | 'invalid_key' | 'model_error' | 'timeout' | 'validation_failed' | 'unknown';

export interface GroqError {
  type: GroqErrorType;
  message: string;
  retryable: boolean;
}

function classifyError(error: unknown, status?: number): GroqError {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  if (status === 429 || lowerMessage.includes('429') || lowerMessage.includes('rate limit') || lowerMessage.includes('quota')) {
    return { type: 'rate_limit', message: 'API rate limit exceeded', retryable: true };
  }
  if (status === 401 || status === 403 || lowerMessage.includes('api key') || lowerMessage.includes('invalid api key')) {
    return { type: 'invalid_key', message: 'Invalid API key', retryable: false };
  }
  if (lowerMessage.includes('validation failed') || lowerMessage.includes('json') || lowerMessage.includes('parse')) {
    return { type: 'validation_failed', message: 'Response validation failed', retryable: true };
  }
  if (lowerMessage.includes('timeout') || lowerMessage.includes('deadline') || lowerMessage.includes('aborted')) {
    return { type: 'timeout', message: 'Request timed out', retryable: true };
  }
  if (status && status >= 500) {
    return { type: 'model_error', message: `Server error (${status})`, retryable: true };
  }
  return { type: 'unknown', message, retryable: false };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateContent(
  prompt: string,
  validator?: (text: string) => boolean
): Promise<string> {
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
          'Authorization': `Bearer ${env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
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
        throw new Error(`HTTP_ERROR_STATUS_${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json() as {
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
      // Determine status code if HTTP error
      let status: number | undefined;
      const match = (error instanceof Error ? error.message : '').match(/HTTP_ERROR_STATUS_(\d+)/);
      if (match && match[1]) {
        status = parseInt(match[1], 10);
      }

      const classified = classifyError(error, status);

      console.error(
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
