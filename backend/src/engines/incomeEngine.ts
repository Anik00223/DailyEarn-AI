import type { SeedOpportunity } from '../db/seeds/verifiedOpportunities';
import type { UserConstraints, FinancialModel, FinancialCalculationStatus } from './types';

export function calculateFinancialModel(
  opp: SeedOpportunity,
  constraints: UserConstraints
): FinancialModel {
  const hours = Math.max(1, Math.min(14, constraints.availableHoursPerDay || 4));

  // 1. Calculate Payout per Unit based on experience level
  const minPayout = opp.estimatedPayoutMin;
  const maxPayout = opp.estimatedPayoutMax;
  let expFactor = 0.35; // default beginner
  if (constraints.experienceLevel === 'intermediate') expFactor = 0.65;
  if (constraints.experienceLevel === 'advanced') expFactor = 0.90;

  const payoutPerUnit = Math.round(minPayout + (maxPayout - minPayout) * expFactor);

  // 2. Units produced or orders completed in available hours
  const expectedUnitsPerDay = Math.max(
    1,
    Math.round(hours * opp.unitsPerHourTypical * 10) / 10
  );

  // 3. Gross Daily Income
  const grossDaily = Math.round(expectedUnitsPerDay * payoutPerUnit);

  // 4. Platform Fee Deduction
  const platformFee = Math.round(grossDaily * (opp.platformFeePercent / 100));

  // 5. Travel & Dynamic Fuel Deductions (PHASE 4: (distance / mileage) * fuelPrice)
  const fuelPrice = constraints.fuelPricePerLiter || 102; // India median petrol benchmark (~₹98-₹106)
  const isScooter = constraints.vehicleType === 'scooter';
  const mileage = constraints.vehicleMileageKmPerLiter || (isScooter ? 38 : 48); // km/liter
  const distancePerUnitKm = opp.category === 'delivery' ? 3.5 : 2.0;
  const totalDistanceKm = constraints.dailyTravelDistanceKm || Math.round(expectedUnitsPerDay * distancePerUnitKm);

  let travelCost = 0;
  let fuelCost = 0;
  let isDefaultFuelAssumption = false;
  const fuelAssumptions: string[] = [];

  if (opp.requiresVehicle) {
    if (constraints.vehicleType === 'electric_2w') {
      fuelCost = Math.round(totalDistanceKm * 0.35); // ~₹0.35/km electricity consumption
      travelCost = fuelCost;
      fuelAssumptions.push(`Electric 2W power consumption estimated at ~₹0.35/km over ${totalDistanceKm} km`);
    } else if (constraints.vehicleType === 'bicycle') {
      fuelCost = 0;
      travelCost = 0;
      fuelAssumptions.push('Bicycle delivery: Zero fuel expense; transit limited to local radius');
    } else {
      fuelCost = Math.round((totalDistanceKm / mileage) * fuelPrice);
      travelCost = fuelCost;
      isDefaultFuelAssumption = !constraints.fuelPricePerLiter || !constraints.vehicleMileageKmPerLiter;
      fuelAssumptions.push(
        `Fuel cost: ${totalDistanceKm} km ÷ ${mileage} km/L × ₹${fuelPrice}/L = ₹${fuelCost}` +
          (isDefaultFuelAssumption ? ' (Estimated using default vehicle/fuel assumptions; not exact)' : '')
      );
    }
  } else if (opp.category === 'tutoring' && opp.platform === 'Local Network') {
    travelCost = Math.round(Math.min(expectedUnitsPerDay, 3) * 15);
    fuelAssumptions.push('Local neighborhood walking/bus commute estimated at ₹15 per home visit');
  }

  // 6. Material / Packaging / Operating Consumable Costs
  let materialCost = 0;
  if (opp.slug === 'neighborhood-tiffin-service') {
    // Food ingredient & disposable packaging containers ~42% of gross
    materialCost = Math.round(grossDaily * 0.42);
  } else if (opp.slug === 'tailoring-boutique-alterations') {
    // Tailoring thread, lace, fall, needles ~₹15/garment
    materialCost = Math.round(expectedUnitsPerDay * 15);
  } else if (opp.slug === 'legal-college-typing-dtp') {
    // Paper & toner wear ~₹2/page
    materialCost = Math.round(expectedUnitsPerDay * 2);
  }

  // 7. Net Daily, Weekly, Monthly
  const netDaily = Math.max(0, grossDaily - platformFee - travelCost - materialCost);
  const netWeekly = netDaily * 6; // standard 6 working days
  const netMonthly = netDaily * 26; // 26 working days/month

  // 8. Range (Conservative 82% to Optimistic 122%)
  const rangeLow = Math.max(Math.round(netDaily * 0.82), minPayout);
  const rangeHigh = Math.round(netDaily * 1.22);

  // 9. Unit Name & Formula Explanation
  let unitName = 'units';
  if (opp.payoutModel === 'per_order') unitName = 'orders';
  else if (opp.payoutModel === 'per_session') unitName = 'sessions';
  else if (opp.payoutModel === 'per_hour') unitName = 'active hours';
  else if (opp.payoutModel === 'per_client') unitName = 'deliverables';
  else if (opp.payoutModel === 'commission') unitName = 'sales';

  const deductionParts: string[] = [];
  if (platformFee > 0) deductionParts.push(`₹${platformFee} platform fee (${opp.platformFeePercent}%)`);
  if (travelCost > 0) deductionParts.push(`₹${travelCost} fuel/commute`);
  if (materialCost > 0) deductionParts.push(`₹${materialCost} materials`);

  const deductionStr = deductionParts.length > 0 ? ` − ${deductionParts.join(' − ')}` : '';
  const formulaExplanation = `${expectedUnitsPerDay} ${unitName} × ₹${payoutPerUnit} = ₹${grossDaily} gross${deductionStr} = ₹${netDaily} estimated net/day`;

  // 10. Explicit Assumptions
  const assumptions: string[] = [
    `Assumes ${hours} available hours/day (${expectedUnitsPerDay} ${unitName} completed)`,
    `Experience level assessed as ${constraints.experienceLevel}`,
    `Calculates 6 productive working days per week (26 days/month)`,
    ...fuelAssumptions,
  ];
  if (platformFee > 0) assumptions.push(`${opp.platform} deducts ~${opp.platformFeePercent}% service commission`);
  if (materialCost > 0) assumptions.push(`Raw materials & consumables deducted based on local wholesale pricing`);

  const calculationStatus: FinancialCalculationStatus = 'MODELLED';

  return {
    grossDaily,
    platformFee,
    travelCost,
    fuelCost,
    materialCost,
    netDaily,
    netWeekly,
    netMonthly,
    rangeLow,
    rangeHigh,
    expectedUnitsPerDay,
    unitName,
    payoutPerUnit,
    formulaExplanation,
    assumptions,
    calculationStatus,
    isDefaultFuelAssumption,
    inputs: {
      unitsPerDay: expectedUnitsPerDay,
      payoutPerUnit,
      platformFeeRatePercent: opp.platformFeePercent,
      travelDistanceKm: totalDistanceKm,
      vehicleMileageKmPerLiter: mileage,
      fuelPricePerLiter: fuelPrice,
      materialCostPerUnit: expectedUnitsPerDay > 0 ? Math.round(materialCost / expectedUnitsPerDay) : 0,
    },
  };
}
