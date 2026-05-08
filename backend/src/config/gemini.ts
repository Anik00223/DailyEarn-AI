import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerativeModel,
} from '@google/generative-ai';
import { env } from './env';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const model: GenerativeModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  safetySettings,
  generationConfig: {
    temperature: 0.85,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 4096,
    responseMimeType: 'application/json',
  },
});

export type GeminiErrorType = 'rate_limit' | 'invalid_key' | 'model_error' | 'timeout' | 'unknown';

export interface GeminiError {
  type: GeminiErrorType;
  message: string;
  retryable: boolean;
}

function classifyError(error: unknown): GeminiError {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('429') || lowerMessage.includes('rate limit') || lowerMessage.includes('quota')) {
    return { type: 'rate_limit', message: 'API rate limit exceeded', retryable: true };
  }
  if (lowerMessage.includes('401') || lowerMessage.includes('403') || lowerMessage.includes('api key') || lowerMessage.includes('invalid')) {
    return { type: 'invalid_key', message: 'Invalid API key', retryable: false };
  }
  if (lowerMessage.includes('timeout') || lowerMessage.includes('deadline')) {
    return { type: 'timeout', message: 'Request timed out', retryable: true };
  }
  if (lowerMessage.includes('500') || lowerMessage.includes('503') || lowerMessage.includes('model')) {
    return { type: 'model_error', message: 'Model error', retryable: true };
  }
  return { type: 'unknown', message, retryable: false };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateContent(prompt: string): Promise<string> {
  const maxAttempts = 3;
  const baseDelay = 1000; // 1s → 2s → 4s exponential backoff
  const timeoutMs = 30000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const result = await model.generateContent(prompt);
      clearTimeout(timeoutId);

      const response = result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini');
      }

      return text;
    } catch (error) {
      const classified = classifyError(error);

      console.error(
        `Gemini attempt ${attempt}/${maxAttempts} failed:`,
        classified.type,
        classified.message
      );

      if (!classified.retryable || attempt === maxAttempts) {
        throw new Error(`Gemini API error (${classified.type}): ${classified.message}`);
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw new Error('Gemini API: all retry attempts exhausted');
}

export { model as geminiModel };
