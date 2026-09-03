import type { SeedOpportunity } from '../db/seeds/verifiedOpportunities';
import type { UserConstraints, ConfidenceAssessment } from './types';

export function calculateConfidence(
  opp: SeedOpportunity,
  constraints: UserConstraints
): ConfidenceAssessment {
  let score = 20; // baseline
  const positiveDrivers: string[] = [];
  const riskFactors: string[] = [];

  // 1. Verification status & Field-level provenance
  if (opp.verificationStatus === 'VERIFIED') {
    score += 25;
    positiveDrivers.push(`Verified against official ${opp.sourceTitle}`);
  } else if (opp.verificationStatus === 'PARTIALLY_VERIFIED') {
    score += 15;
    positiveDrivers.push('Partially verified via public operator guidelines');
  } else if (opp.verificationStatus === 'EXPIRED') {
    score -= 10;
    riskFactors.push('Citation source expired or 404 — verification renewal needed');
  } else {
    riskFactors.push('Unverified community estimates — requires local ground confirmation');
  }

  // Field-level specificity
  if (opp.verifiedFields) {
    if (opp.verifiedFields.basePayoutMin?.status === 'DYNAMIC') {
      riskFactors.push('Base payout is DYNAMIC; actual earnings depend on in-app rate card & surge');
    }
    if (opp.verifiedFields.platformFeePercent?.status === 'VERIFIED') {
      positiveDrivers.push('Platform fee/commission rate verified against official documentation');
    }
    if (opp.verifiedFields.startupCostMin?.status === 'VERIFIED') {
      positiveDrivers.push('Onboarding capital terms verified against primary operator FAQ');
    }
  }

  // 2. Skill match
  const userSkillsLower = (constraints.skills || []).map((s) => s.toLowerCase());
  const hasExactSkill = opp.requiredSkills.some((req) =>
    userSkillsLower.some((usr) => usr.includes(req.toLowerCase()) || req.toLowerCase().includes(usr))
  );

  if (hasExactSkill) {
    score += 20;
    positiveDrivers.push(`Strong direct match with your stated skill profile`);
  } else if (opp.minimumSkillLevel === 'beginner') {
    score += 10;
    positiveDrivers.push(`Beginner-accessible workflow with low training barrier`);
  } else {
    riskFactors.push('Higher skill threshold — may require 1–2 weeks ramp-up');
  }

  // 3. Location tier alignment
  if (opp.supportedLocationTiers.includes('tier3') || opp.supportedLocationTiers.includes('pan_india')) {
    score += 18;
    positiveDrivers.push(`Proven active operational demand in Tier-2/3 cities including ${constraints.city}`);
  } else {
    score += 8;
    riskFactors.push(`Platform coverage in smaller suburban hubs can vary by ward/zone`);
  }

  // 4. Hours sufficiency
  const hours = constraints.availableHoursPerDay || 4;
  if (hours >= 3) {
    score += 12;
    positiveDrivers.push(`Available time (${hours}h) meets optimal order/session throughput threshold`);
  } else {
    riskFactors.push(`Short time window (${hours}h) limits buffer for slow order intervals`);
  }

  // 5. Asset dependencies
  if (opp.requiresVehicle && !constraints.hasVehicle) {
    score -= 20;
    riskFactors.push('Requires vehicle which is not presently available in user profile');
  }

  const confidencePercent = Math.max(25, Math.min(96, Math.round(score)));

  return {
    confidencePercent,
    positiveDrivers,
    riskFactors,
  };
}
