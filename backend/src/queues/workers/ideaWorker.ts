import { getIdeaQueue, type IdeaJobData, type IdeaJobResult } from '../ideaGeneration.queue';
import { orchestrateAiRequest } from '../../services/aiOrchestrator';
import { geminiResponseSchema } from '../../modules/ideas/ideas.schema';
import { isRedisAvailable } from '../../config/redis';

// Process idea generation jobs — registered lazily only when Redis/queue exists.
// With no queue (Redis offline), jobs run in-process via ideas.service fallback,
// so this processor is never attached and no dangling consumer is created.
const queue = getIdeaQueue();
if (queue) {
  queue.process(async (job): Promise<IdeaJobResult> => {
    const data = job.data as IdeaJobData;

    console.log(`Processing idea generation job ${job.id} for user ${data.userId}`);

    try {
      const validateJSON = (text: string): boolean => {
        try {
          let cleaned = text.trim();
          if (cleaned.startsWith('```')) {
            cleaned = cleaned
              .replace(/^```(?:json)?\n?/, '')
              .replace(/\n?```$/, '');
          }
          const json = JSON.parse(cleaned);
          geminiResponseSchema.parse(json);
          return true;
        } catch {
          return false;
        }
      };

      const orchestration = await orchestrateAiRequest(data.prompt, validateJSON);
      if (!orchestration.content) {
        throw new Error(`AI generation failed across providers (${orchestration.reason})`);
      }

      return {
        rawResponse: orchestration.content,
        userId: data.userId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Idea generation job ${job.id} failed:`, message);
      throw error; // Bull will handle retry
    }
  });
}

export function initializeWorker(): void {
  if (!isRedisAvailable() || !getIdeaQueue()) {
    console.log('ℹ️ Idea worker idle (Redis offline) — generation runs in-process');
    return;
  }
  console.log('✅ Idea generation worker initialized');
}
