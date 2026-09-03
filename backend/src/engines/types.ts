import type {
  SeedOpportunity,
  VerifiedField,
  OpportunityFieldVerification,
  FieldVerificationStatus,
  EvidenceType,
  FieldConfidenceLevel,
} from '../db/seeds/verifiedOpportunities';

export type {
  SeedOpportunity,
  VerifiedField,
  OpportunityFieldVerification,
  FieldVerificationStatus,
  EvidenceType,
  FieldConfidenceLevel,
};

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
  fuelCost: number;
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
  calculationStatus: FinancialCalculationStatus;
  isDefaultFuelAssumption: boolean;
  inputs: FinancialModelInputs;
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
  totalScore: number; // 0 - 100
  skillFit: number;
  locationFit: number;
  timeFit: number;
  targetFit: number;
  reliability: number;
  demand: number;
  costFit: number;
  complexityFit: number;
  costPenalty: number;
  complexityPenalty: number;
  positiveDrivers: string[];
  negativeDrivers: string[];
  weightsUsed: ScoringWeights;
  primaryReason: string;
}

export interface ConfidenceAssessment {
  confidencePercent: number; // 0 - 100
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

export interface EvaluatedOpportunity {
  opportunity: SeedOpportunity;
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
  optionType: TargetGapOptionType;
  title: string;
  impactDescription: string;
  explanation: string;
  estimatedExtraDaily: number;
  expectedIncomeImpact: number;
  realismScore: number;
  rank: number;
  requiredAdditionalHours: number;
  requiredCapital: number;
  requiredSkillChange: string;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  scheduleCompatibility: 'HIGH' | 'MEDIUM' | 'LOW';
  feasibilityRating: 'HIGH' | 'MEDIUM' | 'LOW';
  evidenceType: TargetGapEvidenceType;
  provenanceLabel: 'DETERMINISTIC FACT' | 'HEURISTIC ASSUMPTION' | 'MODELLED ESTIMATE' | 'USER-SPECIFIC INFERENCE';
}

