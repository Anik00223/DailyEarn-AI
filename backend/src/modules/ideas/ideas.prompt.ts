import crypto from 'crypto';

interface IdeaPromptParams {
  city: string;
  state: string;
  skills: string[];
  dailyGoal: number;
  language: string;
  previousIdeaHashes: string[];
  timestamp: number;
  count: number;
}

export function buildIdeaPrompt(params: IdeaPromptParams): string {
  return `You are an expert in Indian local economy and income generation.
Generate exactly ${params.count} unique, hyper-local income ideas.

CONTEXT:
- Timestamp (for uniqueness): ${params.timestamp}
- Ideas already shown (DO NOT repeat these hashes): ${params.previousIdeaHashes.join(', ') || 'none'}
- User city: ${params.city}, ${params.state}, India
- User skills: ${params.skills.join(', ')}
- Daily income goal: ₹${params.dailyGoal}
- Language: ${params.language}

REQUIREMENTS FOR EACH IDEA:
1. Achievable starting TODAY with zero or near-zero upfront cost
2. Must name one REAL Indian platform: Meesho, Urban Company, Swiggy, Zepto, Blinkit, Dunzo, Porter, Byju's, Vedantu, Fiverr, Upwork, OLX, Quikr, WhatsApp Business, Instagram Shop, Moj, ShareChat, Rapido, etc.
3. Earnings must be in ₹ INR with math: "15 orders × ₹40 = ₹600/day"
4. Must specifically reference ${params.city} — local area, college, market, or landmark
5. effort_level must be brutally honest (low/medium/high)
6. Must be meaningfully different from any previously shown ideas

RESPOND ONLY WITH THIS JSON STRUCTURE — NO MARKDOWN, NO EXPLANATION:
{
  "ideas": [
    {
      "title": "60 chars max",
      "description": "2-3 sentences. Must mention ${params.city} by name.",
      "estimated_daily_earn": 500,
      "estimated_weekly_earn": 3000,
      "effort_level": "low",
      "skills_required": ["skill1"],
      "platform_name": "Platform Name",
      "platform_url": "https://real-url.com",
      "getting_started_steps": ["Step 1", "Step 2", "Step 3"],
      "earnings_breakdown": "X units × ₹Y margin = ₹Z/day",
      "city_specific_tip": "Specific tip for ${params.city}"
    }
  ]
}`;
}

export function generateIdeaHash(title: string, platformName: string): string {
  return crypto
    .createHash('sha256')
    .update((title + platformName).toLowerCase().trim())
    .digest('hex');
}
