import { create } from 'zustand';
import type { DecisionResult, EvaluatedOpportunity, GeneratedPlan } from '../types/decision.types';

interface DecisionState {
  decision: DecisionResult | null;
  isEvaluating: boolean;
  activePlan: GeneratedPlan | null;
  simulatorOpp: EvaluatedOpportunity | null;
  isTrustCenterOpen: boolean;
  outcomeOpp: EvaluatedOpportunity | null;
  setDecision: (decision: DecisionResult | null) => void;
  setEvaluating: (evaluating: boolean) => void;
  setActivePlan: (plan: GeneratedPlan | null) => void;
  setSimulatorOpp: (opp: EvaluatedOpportunity | null) => void;
  setTrustCenterOpen: (open: boolean) => void;
  setOutcomeOpp: (opp: EvaluatedOpportunity | null) => void;
}

export const useDecisionStore = create<DecisionState>((set) => ({
  decision: null,
  isEvaluating: false,
  activePlan: null,
  simulatorOpp: null,
  isTrustCenterOpen: false,
  outcomeOpp: null,
  setDecision: (decision) => set({ decision }),
  setEvaluating: (isEvaluating) => set({ isEvaluating }),
  setActivePlan: (activePlan) => set({ activePlan }),
  setSimulatorOpp: (simulatorOpp) => set({ simulatorOpp }),
  setTrustCenterOpen: (isTrustCenterOpen) => set({ isTrustCenterOpen }),
  setOutcomeOpp: (outcomeOpp) => set({ outcomeOpp }),
}));
