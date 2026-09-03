import { db } from '../index';
import { opportunities } from '../schema/opportunities';
import { VERIFIED_OPPORTUNITIES_SEED } from './verifiedOpportunities';
import { count } from 'drizzle-orm';

export async function seedOpportunities(): Promise<number> {
  try {
    const [existingCount] = await db.select({ count: count() }).from(opportunities);
    if (existingCount && existingCount.count > 0) {
      return existingCount.count;
    }

    let inserted = 0;
    for (const seed of VERIFIED_OPPORTUNITIES_SEED) {
      await db.insert(opportunities).values({
        slug: seed.slug,
        platform: seed.platform,
        opportunityName: seed.opportunityName,
        category: seed.category,
        description: seed.description,
        requiredSkills: seed.requiredSkills,
        minimumSkillLevel: seed.minimumSkillLevel,
        supportedLocationTiers: seed.supportedLocationTiers,
        supportedCities: seed.supportedCities,
        eligibilityRequirements: seed.eligibilityRequirements,
        requiresVehicle: seed.requiresVehicle,
        requiresSmartphone: seed.requiresSmartphone,
        minimumAge: seed.minimumAge,
        startupCostMin: seed.startupCostMin,
        startupCostMax: seed.startupCostMax,
        recurringCostMonthly: seed.recurringCostMonthly,
        payoutModel: seed.payoutModel,
        estimatedPayoutMin: seed.estimatedPayoutMin,
        estimatedPayoutMax: seed.estimatedPayoutMax,
        platformFeePercent: seed.platformFeePercent,
        typicalTimePerUnitMin: seed.typicalTimePerUnitMin,
        unitsPerHourTypical: seed.unitsPerHourTypical,
        demandLevel: seed.demandLevel,
        reliabilityScore: seed.reliabilityScore,
        verificationStatus: seed.verificationStatus,
        sourceUrl: seed.sourceUrl,
        sourceTitle: seed.sourceTitle,
        verifiedFields: seed.verifiedFields,
        notes: seed.notes,
        restrictions: seed.restrictions,
        activeStatus: true,
      }).onConflictDoNothing();
      inserted++;
    }

    console.log(`✅ Seeded ${inserted} verified opportunities`);
    return inserted;
  } catch (error) {
    console.warn('⚠️ Seeding opportunities to DB skipped (falling back to in-memory catalog):', error instanceof Error ? error.message : error);
    return VERIFIED_OPPORTUNITIES_SEED.length;
  }
}
