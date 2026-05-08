import { ideaQueue } from '../ideaGeneration.queue';
import { generateContent } from '../../config/gemini';

interface IdeaJobData {
  prompt: string;
  userId: string;
  requestId: string;
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
    const rawResponse = await generateContent(data.prompt);

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
