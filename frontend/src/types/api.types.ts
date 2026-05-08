// ─── API Types — derived from CONTRACT.md ───

export interface User {
  id: string;
  name: string | null;
  email: string;
  city: string | null;
  state: string | null;
  skillTags: string[] | null;
  dailyIncomeGoal: number | null;
  languagePref: 'en' | 'hi' | 'bn' | 'te' | 'ta' | 'mr' | null;
}

export interface Idea {
  id: string;
  userId: string | null;
  title: string;
  description: string;
  estimatedDailyEarn: number;
  estimatedWeeklyEarn: number;
  effortLevel: 'low' | 'medium' | 'high';
  skillsRequired: string[] | null;
  platformName: string;
  platformUrl: string;
  gettingStartedSteps: string[] | null;
  earningsBreakdown: string;
  citySpecificTip: string;
  isSaved: boolean | null;
  isDismissed: boolean | null;
  generatedAt: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
}

export interface UserStats {
  totalIdeasGenerated: number;
  totalSaved: number;
  totalDismissed: number;
  estimatedMonthlyEarnings: number;
  topPlatforms: string[];
}

export interface PaginatedIdeas {
  ideas: Idea[];
  total: number;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  city: string;
  state: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface GenerateIdeasInput {
  city: string;
  state: string;
  skills: string[];
  dailyGoal?: number;
  language?: 'en' | 'hi' | 'bn' | 'te' | 'ta' | 'mr';
  count?: number;
}

export interface UpdateProfileInput {
  name?: string;
  city?: string;
  state?: string;
  skillTags?: string[];
  dailyIncomeGoal?: number;
  languagePref?: 'en' | 'hi' | 'bn' | 'te' | 'ta' | 'mr';
}

export interface ApiError {
  success: false;
  code: string;
  message: string;
  retryAfter?: number;
  errors?: Array<{ field: string; message: string }>;
}
