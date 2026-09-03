export type FinancialCalculationStatus = 'DIRECT' | 'MODELLED' | 'PARTIALLY_MODELLED' | 'INSUFFICIENT_DATA';

export interface UserConstraints {
  city: string;
  state: string;
  targetDailyIncome: number;
  availableHoursPerDay: number;
  availableCapital: number;
  hasVehicle: boolean;
  vehicleType?: 'motorcycle' | 'scooter' | 'electric_2w' | 'bicycle' | 'none';
  fuelPricePerLiter?: number;
  vehicleMileageKmPerLiter?: number;
  dailyTravelDistanceKm?: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  skills: string[];
  language?: 'en' | 'hi' | 'bn' | 'te' | 'ta' | 'mr';
}

export interface FinancialModelInputs {
  unitsPerDay: number;
  payoutPerUnit: number;
  platformFeeRatePercent: number;
  travelDistanceKm: number;
  vehicleMileageKmPerLiter?: number;
  fuelPricePerLiter?: number;
  materialCostPerUnit?: number;
}

export interface FinancialModel {
  grossDaily: number;
  platformFee: number;
  travelCost: number;
  fuelCost?: number;
  materialCost: number;
  netDaily: number;
  netWeekly: number;
  netMonthly: number;
  rangeLow: number;
  rangeHigh: number;
  expectedUnitsPerDay: number;
  unitName: string;
  payoutPerUnit: number;
  formulaExplanation: string;
  assumptions: string[];
  calculationStatus?: FinancialCalculationStatus;
  isDefaultFuelAssumption?: boolean;
  inputs?: FinancialModelInputs;
}

export interface ScoringWeights {
  skillFit: number;
  locationFit: number;
  timeFit: number;
  targetFit: number;
  reliability: number;
  demand: number;
  costFit: number;
  complexityFit: number;
}

export interface ScoringBreakdown {
  totalScore: number;
  skillFit: number;
  locationFit: number;
  timeFit: number;
  targetFit: number;
  reliability: number;
  demand: number;
  costFit?: number;
  complexityFit?: number;
  costPenalty: number;
  complexityPenalty: number;
  positiveDrivers?: string[];
  negativeDrivers?: string[];
  weightsUsed?: ScoringWeights;
  primaryReason: string;
}

export interface ConfidenceAssessment {
  confidencePercent: number;
  positiveDrivers: string[];
  riskFactors: string[];
}

export interface FeasibilityVerdict {
  status: 'FEASIBLE' | 'POSSIBLE_WITH_CHANGES' | 'UNLIKELY' | 'INSUFFICIENT_DATA';
  headline: string;
  explanation: string;
  realisticCeilingMin: number;
  realisticCeilingMax: number;
  targetGap: number;
  requiredChanges: string[];
}

export interface IncomeMixBundle {
  title: string;
  primaryOpportunitySlug: string;
  primaryName: string;
  primaryHours: number;
  primaryNetDaily: number;
  secondaryOpportunitySlug: string;
  secondaryName: string;
  secondaryHours: number;
  secondaryNetDaily: number;
  combinedHours: number;
  combinedNetDaily: number;
  compatibilityReason: string;
}

export type FieldVerificationStatus = 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'DYNAMIC' | 'UNVERIFIED' | 'ESTIMATED';
export type EvidenceType = 'OFFICIAL_PLATFORM' | 'GOVERNMENT_REGULATION' | 'MARKET_BENCHMARK' | 'COMMUNITY_ESTIMATE';
export type FieldConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface VerifiedField<T = number> {
  value: T | null;
  status: FieldVerificationStatus;
  evidenceType: EvidenceType;
  sourceUrl?: string;
  sourceTitle?: string;
  verifiedAt: string;
  confidenceLevel: FieldConfidenceLevel;
  notes?: string;
}

export interface OpportunityFieldVerification {
  platformFeePercent: VerifiedField<number>;
  basePayoutMin: VerifiedField<number>;
  basePayoutMax: VerifiedField<number>;
  startupCostMin: VerifiedField<number>;
  startupCostMax: VerifiedField<number>;
  recurringCostMonthly: VerifiedField<number>;
  typicalTimePerUnitMin: VerifiedField<number>;
}

export interface OpportunityData {
  slug: string;
  platform: string;
  opportunityName: string;
  category: 'delivery' | 'tutoring' | 'reselling' | 'services' | 'digital' | 'artisan';
  description: string;
  requiredSkills: string[];
  minimumSkillLevel: 'beginner' | 'intermediate' | 'advanced';
  supportedLocationTiers: string[];
  eligibilityRequirements: string[];
  requiresVehicle: boolean;
  requiresSmartphone: boolean;
  minimumAge: number;
  startupCostMin: number;
  startupCostMax: number;
  recurringCostMonthly: number;
  payoutModel: string;
  estimatedPayoutMin: number;
  estimatedPayoutMax: number;
  platformFeePercent: number;
  typicalTimePerUnitMin: number;
  unitsPerHourTypical: number;
  demandLevel: string;
  reliabilityScore: number;
  verificationStatus: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'UNVERIFIED' | 'EXPIRED';
  sourceUrl: string;
  sourceTitle: string;
  lastVerifiedDate?: string;
  notes?: string;
  verifiedFields?: OpportunityFieldVerification;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
}

export interface EvaluatedOpportunity {
  opportunity: OpportunityData;
  financials: FinancialModel;
  scoring: ScoringBreakdown;
  confidence: ConfidenceAssessment;
  cityTip?: string;
  whyRecommended?: string;
  rank?: number;
  score?: number;
}

export type TargetGapOptionType =
  | 'INCREASE_HOURS'
  | 'OPTIMIZE_PRICING'
  | 'INCOME_MIX'
  | 'ADD_SKILL'
  | 'UPGRADE_ASSET';

export type TargetGapEvidenceType =
  | 'DETERMINISTIC'
  | 'MODELLED'
  | 'HEURISTIC'
  | 'USER_INFERENCE';

export interface WhatItTakesOption {
  id: string;
  type: TargetGapOptionType;
  optionType?: TargetGapOptionType;
  title: string;
  impactDescription: string;
  explanation?: string;
  estimatedExtraDaily: number;
  expectedIncomeImpact?: number;
  realismScore?: number;
  rank?: number;
  requiredAdditionalHours?: number;
  requiredCapital?: number;
  requiredSkillChange?: string;
  complexity?: 'LOW' | 'MEDIUM' | 'HIGH';
  scheduleCompatibility?: 'HIGH' | 'MEDIUM' | 'LOW';
  feasibilityRating: 'HIGH' | 'MEDIUM' | 'LOW';
  evidenceType?: TargetGapEvidenceType;
  provenanceLabel?: 'DETERMINISTIC FACT' | 'HEURISTIC ASSUMPTION' | 'MODELLED ESTIMATE' | 'USER-SPECIFIC INFERENCE';
}

export interface TargetGapAnalysis {
  target: number;
  bestEstimatedNet: number;
  gap: number;
  percentageAchieved: number;
  options: WhatItTakesOption[];
}

export interface PlanDayItem {
  dayNumber: number;
  title: string;
  focus: string;
  actionItems: string[];
  estimatedMinutes: number;
  completed?: boolean;
}

export interface GeneratedPlan {
  opportunitySlug: string;
  opportunityName: string;
  platform: string;
  targetDailyEarn: string;
  days: PlanDayItem[];
  notes?: string;
}

export interface DecisionResult {
  id?: string;
  feasibility: FeasibilityVerdict;
  targetGapAnalysis: TargetGapAnalysis;
  incomeMix: IncomeMixBundle | null;
  recommendations: EvaluatedOpportunity[];
  constraints: UserConstraints;
  primary7DayPlan: GeneratedPlan | null;
}
