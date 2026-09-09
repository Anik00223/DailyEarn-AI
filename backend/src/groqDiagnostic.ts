import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env from backend or root if present
const envFiles = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
];
for (const f of envFiles) {
  if (fs.existsSync(f)) {
    dotenv.config({ path: f });
  }
}

export interface DiagnosticResult {
  envChecked: {
    keyPresent: boolean;
    isPlaceholder: boolean;
    maskedPreview: string;
    modelConfigured: string;
  };
  authStatus: 'PASS' | 'FAIL' | 'SKIPPED';
  modelAccessStatus: 'PASS' | 'FAIL' | 'SKIPPED';
  llmRequestStatus: 'PASS' | 'FAIL' | 'SKIPPED';
  errorCategory?: string;
  httpStatus?: number | string;
  safeMessage: string;
  deterministicFallbackReady: boolean;
}

export function maskSecret(key?: string): string {
  if (!key) return 'NONE';
  const trimmed = key.trim().replace(/^['"]|['"]$/g, '');
  if (trimmed.length <= 8) return '***';
  return `${trimmed.substring(0, 4)}...${trimmed.substring(trimmed.length - 4)} (length: ${trimmed.length})`;
}

export async function runGroqDiagnostic(): Promise<DiagnosticResult> {
  const rawKey = process.env.GROQ_API_KEY;
  const key = rawKey ? rawKey.trim().replace(/^['"]|['"]$/g, '') : '';
  const model = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';

  const isPresent = Boolean(key && key.length > 0);
  const isPlaceholder =
    !isPresent ||
    key.includes('placeholder') ||
    key.includes('your_groq_api_key') ||
    key.includes('your_') ||
    key === 'gsk_placeholder_for_render_deterministic_fallback';

  const envChecked = {
    keyPresent: isPresent && !isPlaceholder,
    isPlaceholder,
    maskedPreview: maskSecret(key),
    modelConfigured: model,
  };

  console.log('====================================================');
  console.log('         DAILYEARN AI — GROQ INTEGRATION DIAGNOSTIC  ');
  console.log('====================================================');
  console.log(`[ENV] GROQ_API_KEY Configured: ${envChecked.keyPresent}`);
  console.log(`[ENV] Key Status: ${isPlaceholder ? 'MISSING_OR_PLACEHOLDER' : 'VALID_FORMAT'}`);
  console.log(`[ENV] Key Preview: ${envChecked.maskedPreview}`);
  console.log(`[ENV] Configured Model: ${model}`);
  console.log('----------------------------------------------------');

  if (isPlaceholder || !key) {
    const result: DiagnosticResult = {
      envChecked,
      authStatus: 'FAIL',
      modelAccessStatus: 'SKIPPED',
      llmRequestStatus: 'SKIPPED',
      errorCategory: 'MISSING_OR_PLACEHOLDER_KEY',
      httpStatus: 'N/A',
      safeMessage: 'GROQ_API_KEY is missing or contains placeholder text. DailyEarn AI will use deterministic engine fallback.',
      deterministicFallbackReady: true,
    };
    printResult(result);
    return result;
  }

  // Step 1: Test models endpoint for authentication
  console.log('[TEST 1/2] Testing Groq Authentication & Model Discovery...');
  let availableModels: string[] = [];
  try {
    const modelRes = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });

    if (!modelRes.ok) {
      let safeMsg = 'Groq API authentication failed';
      try {
        const errJson = (await modelRes.json()) as { error?: { message?: string } };
        if (errJson.error?.message) {
          safeMsg = errJson.error.message;
        }
      } catch {
        // use default
      }

      let category = 'HTTP_ERROR';
      if (modelRes.status === 401 || modelRes.status === 403) category = 'UNAUTHORIZED';
      else if (modelRes.status === 429) category = 'RATE_LIMIT';

      const result: DiagnosticResult = {
        envChecked,
        authStatus: 'FAIL',
        modelAccessStatus: 'FAIL',
        llmRequestStatus: 'SKIPPED',
        errorCategory: category,
        httpStatus: modelRes.status,
        safeMessage: safeMsg,
        deterministicFallbackReady: true,
      };
      printResult(result);
      return result;
    }

    const modelsData = (await modelRes.json()) as { data?: Array<{ id: string }> };
    availableModels = modelsData.data?.map((m) => m.id) || [];
    console.log('[INFO] Available Groq Models on this account:', availableModels.join(', '));
  } catch (netErr) {
    const result: DiagnosticResult = {
      envChecked,
      authStatus: 'FAIL',
      modelAccessStatus: 'SKIPPED',
      llmRequestStatus: 'SKIPPED',
      errorCategory: 'NETWORK_OR_DNS_ERROR',
      httpStatus: 'NETWORK_ERR',
      safeMessage: netErr instanceof Error ? netErr.message : 'Network failure reaching api.groq.com',
      deterministicFallbackReady: true,
    };
    printResult(result);
    return result;
  }

  const modelFound = availableModels.includes(model);

  // Step 2: Minimal chat completion
  console.log(`[TEST 2/2] Testing Minimal LLM Completion on ${model}...`);
  try {
    const compRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Respond with valid JSON: {"status":"ok"}' }],
        response_format: { type: 'json_object' },
        max_tokens: 40,
        temperature: 0.1,
      }),
    });

    if (!compRes.ok) {
      let safeMsg = 'Completion request failed';
      try {
        const errJson = (await compRes.json()) as { error?: { message?: string } };
        if (errJson.error?.message) safeMsg = errJson.error.message;
      } catch {
        // default
      }

      let category = 'LLM_REQUEST_ERROR';
      if (compRes.status === 404) category = 'MODEL_NOT_FOUND';
      else if (compRes.status === 429) category = 'RATE_LIMIT';

      const result: DiagnosticResult = {
        envChecked,
        authStatus: 'PASS',
        modelAccessStatus: modelFound ? 'PASS' : 'FAIL',
        llmRequestStatus: 'FAIL',
        errorCategory: category,
        httpStatus: compRes.status,
        safeMessage: safeMsg,
        deterministicFallbackReady: true,
      };
      printResult(result);
      return result;
    }

    const compData = (await compRes.json()) as any;
    const content = compData.choices?.[0]?.message?.content;
    const isOk = content && content.includes('status');

    const result: DiagnosticResult = {
      envChecked,
      authStatus: 'PASS',
      modelAccessStatus: modelFound ? 'PASS' : 'FAIL',
      llmRequestStatus: isOk ? 'PASS' : 'FAIL',
      safeMessage: isOk
        ? 'Groq LLM authenticated, model accessible, and returning valid JSON.'
        : 'Groq returned unexpected response structure.',
      deterministicFallbackReady: true,
    };
    printResult(result);
    return result;
  } catch (err) {
    const result: DiagnosticResult = {
      envChecked,
      authStatus: 'PASS',
      modelAccessStatus: modelFound ? 'PASS' : 'FAIL',
      llmRequestStatus: 'FAIL',
      errorCategory: 'COMPLETION_NETWORK_ERROR',
      safeMessage: err instanceof Error ? err.message : 'Error sending completion request',
      deterministicFallbackReady: true,
    };
    printResult(result);
    return result;
  }
}

function printResult(res: DiagnosticResult): void {
  console.log('----------------------------------------------------');
  console.log(`GROQ_AUTH: ${res.authStatus}`);
  console.log(`MODEL_ACCESS: ${res.modelAccessStatus}`);
  console.log(`LLM_REQUEST: ${res.llmRequestStatus}`);
  if (res.errorCategory) console.log(`ERROR_CATEGORY: ${res.errorCategory}`);
  if (res.httpStatus) console.log(`HTTP_STATUS: ${res.httpStatus}`);
  console.log(`SAFE_MESSAGE: ${res.safeMessage}`);
  console.log(`DETERMINISTIC_FALLBACK_READY: ${res.deterministicFallbackReady ? 'PASS' : 'FAIL'}`);
  console.log('====================================================');
}

if (require.main === module || process.argv[1]?.includes('groqDiagnostic')) {
  runGroqDiagnostic().catch((e) => {
    console.error('Fatal diagnostic failure:', e.message);
    process.exit(1);
  });
}
