import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orchestrateAiRequest, getAiOrchestratorMetrics } from './aiOrchestrator';
import * as groqModule from '../config/groq';
import * as nvidiaModule from '../config/nvidia';
import * as envModule from '../config/env';
import * as redisModule from '../config/redis';
import { calculateFinancialModel } from '../engines/incomeEngine';
import { VERIFIED_OPPORTUNITIES_SEED } from '../db/seeds/verifiedOpportunities';

describe('AI Orchestrator Multi-Provider Failover & Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    groqModule.resetCircuitBreaker();
    nvidiaModule.resetNvidiaCircuitBreaker();
  });

  it('should use Groq when Groq succeeds (Primary Provider)', async () => {
    vi.spyOn(redisModule, 'redisGet').mockResolvedValue(null);
    vi.spyOn(redisModule, 'redisSet').mockResolvedValue(true);
    vi.spyOn(envModule, 'isGroqConfigured').mockReturnValue(true);
    vi.spyOn(envModule, 'isNvidiaConfigured').mockReturnValue(true);

    vi.spyOn(groqModule, 'generateContent').mockResolvedValue('{"why_recommended": "Groq recommendation"}');
    const nvidiaSpy = vi.spyOn(nvidiaModule, 'generateNvidiaContent');

    const result = await orchestrateAiRequest('sample prompt 1');

    expect(result.provider).toBe('groq');
    expect(result.reason).toBe('success');
    expect(result.content).toBe('{"why_recommended": "Groq recommendation"}');
    expect(nvidiaSpy).not.toHaveBeenCalled();
  });

  it('should fail over to NVIDIA when Groq returns 429 rate limit', async () => {
    vi.spyOn(redisModule, 'redisGet').mockResolvedValue(null);
    vi.spyOn(redisModule, 'redisSet').mockResolvedValue(true);
    vi.spyOn(envModule, 'isGroqConfigured').mockReturnValue(true);
    vi.spyOn(envModule, 'isNvidiaConfigured').mockReturnValue(true);

    vi.spyOn(groqModule, 'generateContent').mockRejectedValue(new Error('Groq API error (rate_limit): Rate limit exceeded'));
    vi.spyOn(nvidiaModule, 'generateNvidiaContent').mockResolvedValue('{"why_recommended": "NVIDIA recommendation"}');

    const result = await orchestrateAiRequest('sample prompt 2');

    expect(result.provider).toBe('nvidia');
    expect(result.reason).toBe('success');
    expect(result.content).toBe('{"why_recommended": "NVIDIA recommendation"}');
  });

  it('should fail over to NVIDIA when Groq times out', async () => {
    vi.spyOn(redisModule, 'redisGet').mockResolvedValue(null);
    vi.spyOn(redisModule, 'redisSet').mockResolvedValue(true);
    vi.spyOn(envModule, 'isGroqConfigured').mockReturnValue(true);
    vi.spyOn(envModule, 'isNvidiaConfigured').mockReturnValue(true);

    vi.spyOn(groqModule, 'generateContent').mockRejectedValue(new Error('Groq API error (timeout): Request timed out'));
    vi.spyOn(nvidiaModule, 'generateNvidiaContent').mockResolvedValue('{"why_recommended": "NVIDIA timeout failover"}');

    const result = await orchestrateAiRequest('sample prompt 3');

    expect(result.provider).toBe('nvidia');
    expect(result.reason).toBe('success');
    expect(result.content).toBe('{"why_recommended": "NVIDIA timeout failover"}');
  });

  it('should fail over to NVIDIA when Groq circuit breaker is open', async () => {
    vi.spyOn(redisModule, 'redisGet').mockResolvedValue(null);
    vi.spyOn(redisModule, 'redisSet').mockResolvedValue(true);
    vi.spyOn(envModule, 'isGroqConfigured').mockReturnValue(true);
    vi.spyOn(envModule, 'isNvidiaConfigured').mockReturnValue(true);

    vi.spyOn(groqModule, 'generateContent').mockRejectedValue(new Error('Groq API error (circuit_breaker_open): Circuit breaker is open'));
    vi.spyOn(nvidiaModule, 'generateNvidiaContent').mockResolvedValue('{"why_recommended": "NVIDIA circuit failover"}');

    const result = await orchestrateAiRequest('sample prompt 4');

    expect(result.provider).toBe('nvidia');
    expect(result.reason).toBe('success');
    expect(result.content).toBe('{"why_recommended": "NVIDIA circuit failover"}');
  });

  it('should return deterministic fallback when both Groq and NVIDIA fail (e.g. 429 on both)', async () => {
    vi.spyOn(redisModule, 'redisGet').mockResolvedValue(null);
    vi.spyOn(envModule, 'isGroqConfigured').mockReturnValue(true);
    vi.spyOn(envModule, 'isNvidiaConfigured').mockReturnValue(true);

    vi.spyOn(groqModule, 'generateContent').mockRejectedValue(new Error('Groq API error (rate_limit): Rate limit exceeded'));
    vi.spyOn(nvidiaModule, 'generateNvidiaContent').mockRejectedValue(new Error('NVIDIA API error (rate_limit): NVIDIA quota exceeded'));

    const result = await orchestrateAiRequest('sample prompt 5');

    expect(result.provider).toBe('deterministic');
    expect(result.content).toBe('');
    expect(result.model).toBe('deterministic-engine');
  });

  it('should return deterministic fallback cleanly when both providers are unconfigured', async () => {
    vi.spyOn(redisModule, 'redisGet').mockResolvedValue(null);
    vi.spyOn(envModule, 'isGroqConfigured').mockReturnValue(false);
    vi.spyOn(envModule, 'isNvidiaConfigured').mockReturnValue(false);

    const result = await orchestrateAiRequest('sample prompt 6');

    expect(result.provider).toBe('deterministic');
    expect(result.reason).toBe('unavailable');
    expect(result.content).toBe('');
  });

  it('should return cached response on cache hit without calling any provider', async () => {
    const cachedResponse = '{"why_recommended": "Cached high-speed response"}';
    vi.spyOn(redisModule, 'redisGet').mockResolvedValue(cachedResponse);
    const groqSpy = vi.spyOn(groqModule, 'generateContent');
    const nvidiaSpy = vi.spyOn(nvidiaModule, 'generateNvidiaContent');

    const result = await orchestrateAiRequest('sample prompt 7');

    expect(result.provider).toBe('cache');
    expect(result.reason).toBe('cached');
    expect(result.content).toBe(cachedResponse);
    expect(result.fromCache).toBe(true);
    expect(groqSpy).not.toHaveBeenCalled();
    expect(nvidiaSpy).not.toHaveBeenCalled();
  });

  it('should coalesce duplicate in-flight NVIDIA requests', async () => {
    vi.spyOn(envModule, 'isNvidiaConfigured').mockReturnValue(true);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => {
        await new Promise((r) => setTimeout(r, 50));
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: '{"why_recommended": "Coalesced response"}' } }],
          }),
        };
      })
    );

    const prompt = 'Identical concurrent NVIDIA prompt';
    const [call1, call2] = await Promise.all([
      nvidiaModule.generateNvidiaContent(prompt),
      nvidiaModule.generateNvidiaContent(prompt),
    ]);

    expect(call1).toBe('{"why_recommended": "Coalesced response"}');
    expect(call2).toBe('{"why_recommended": "Coalesced response"}');
    // Only 1 raw network fetch was made because duplicate request was coalesced
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should strictly mask NVIDIA and Groq API keys in logs and messages', () => {
    const groqSecret = 'gsk_1234567890abcdefghijklmn';
    const nvidiaSecret = 'nvapi-abcdef1234567890qwertyuiop';

    const textWithSecrets = `Failed calling with Groq key ${groqSecret} and NVIDIA key ${nvidiaSecret}`;
    const masked = nvidiaModule.maskSecretInText(textWithSecrets);

    expect(masked).not.toContain(groqSecret);
    expect(masked).not.toContain(nvidiaSecret);
    expect(masked).toContain('gsk_***');
    expect(masked).toContain('nvapi-***');
  });

  it('should ensure deterministic financial outputs remain identical regardless of AI status', () => {
    const opp = VERIFIED_OPPORTUNITIES_SEED[0];

    const constraints = {
      city: 'Silchar',
      state: 'Assam',
      targetDailyIncome: 1000,
      availableCapital: 500,
      skills: ['driving'],
      availableHoursPerDay: 4,
      experienceLevel: 'intermediate' as const,
      hasVehicle: true,
      vehicleType: 'motorcycle' as const,
      fuelPricePerLiter: 102,
      vehicleMileageKmPerLiter: 45,
      dailyTravelDistanceKm: 20,
    };

    const model1 = calculateFinancialModel(opp, constraints);
    const model2 = calculateFinancialModel(opp, constraints);

    expect(model1.grossDaily).toBe(model2.grossDaily);
    expect(model1.netDaily).toBe(model2.netDaily);
    expect(model1.fuelCost).toBe(model2.fuelCost);
    expect(model1.platformFee).toBe(model2.platformFee);
    expect(typeof model1.netDaily).toBe('number');
    expect(model1.netDaily).toBeGreaterThan(0);
  });

  it('should provide safe observability metrics without credentials', () => {
    const metrics = getAiOrchestratorMetrics();
    expect(metrics.groq).toBeDefined();
    expect(metrics.nvidia).toBeDefined();
    expect(metrics.groq.circuitState).toBeDefined();
    expect(metrics.nvidia.circuitState).toBeDefined();

    const metricsStr = JSON.stringify(metrics);
    expect(metricsStr).not.toContain('gsk_');
    expect(metricsStr).not.toContain('nvapi-');
    expect(metricsStr).not.toContain('key');
  });
});
