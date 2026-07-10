import { ideaQueue } from '../ideaGeneration.queue';
import { generateContent } from '../../config/groq';
import { geminiResponseSchema } from '../../modules/ideas/ideas.schema';

interface IdeaJobData {
  prompt: string;
  userId: string;
}

interface IdeaJobResult {
  rawResponse: string;
  userId: string;
}

// Process idea generation jobs
ideaQueue.process(async (job): Promise<IdeaJobResult> => {
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

    const rawResponse = await generateContent(data.prompt, validateJSON);

    return {
      rawResponse,
      userId: data.userId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Idea generation job ${job.id} failed:`, message);
    throw error; // Bull will handle retry
  }
});

export function initializeWorker(): void {
  console.log('✅ Idea generation worker initialized');
}
