import type { SeedOpportunity } from '../db/seeds/verifiedOpportunities';
import type { UserConstraints, FinancialModel } from './types';

export interface PlanDayItem {
  dayNumber: number;
  title: string;
  focus: string;
  actionItems: string[];
  estimatedMinutes: number;
  completed: boolean;
}

export interface GeneratedPlan {
  opportunitySlug: string;
  opportunityName: string;
  platform: string;
  targetDailyEarn: string;
  days: PlanDayItem[];
  notes: string;
}

export function generate7DayExecutionPlan(
  opp: SeedOpportunity,
  constraints: UserConstraints,
  financials: FinancialModel
): GeneratedPlan {
  const city = constraints.city;
  const platform = opp.platform;

  let day1Actions = [
    `Download official ${platform} app or visit ${opp.sourceUrl}`,
    'Upload required KYC documents (Aadhaar, PAN card, and Bank Passbook/UPI)',
    'Review platform payout frequency and peak hours schedule',
  ];

  let day2Actions = [
    `Inspect and ready all mandatory equipment (${opp.requiresVehicle ? 'Vehicle, RC, DL, and helmet' : 'Smartphone/notebook/materials'})`,
    'Complete online onboarding tutorial or platform readiness assessment',
    `Identify the top 2 high-density zones or residential colonies in ${city} for your service`,
  ];

  let day3Actions = [
    `Activate your profile and book your first 2-hour starter window on ${platform}`,
    'Perform your very first customer interaction or completed order',
    'Record exact time taken and any small initial hurdles in a notebook',
  ];

  let day4Actions = [
    `Complete a full ${constraints.availableHoursPerDay || 4}-hour scheduled shift/session`,
    'Aim for your target throughput: minimum 2–3 completed units/orders',
    'Track initial gross income in platform wallet',
  ];

  let day5Actions = [
    'Ask initial customers/clients for honest feedback or 5-star ratings',
    'Calculate actual fuel/material expenses incurred during Days 3 and 4',
    'Fine-tune your schedule to match local peak commercial hours',
  ];

  let day6Actions = [
    'Expand your operational radius or active referral network',
    `Target your full daily net expectation of ₹${financials.netDaily}`,
    'Test batching tasks together to reduce idle commute minutes',
  ];

  let day7Actions = [
    'Perform a 30-minute weekly financial review: Total Gross − Deductions = Real Net Income',
    `Compare actual earnings against predicted range (₹${financials.rangeLow} – ₹${financials.rangeHigh})`,
    'Lock in your calendar and schedule commitments for Week 2',
  ];

  // Specific adjustments by category
  if (opp.category === 'tutoring') {
    day1Actions = [
      'Prepare syllabus roadmap for Classes 6-10 (Maths/Science/English)',
      'Draft a professional 1-paragraph introduction message highlighting your qualifications',
      'Set clear hourly/monthly pricing structure (₹250–₹400/session)',
    ];
    day2Actions = [
      `Share introduction with 10 families, local apartment WhatsApp groups, and friends in ${city}`,
      'Print or prepare 5 paper notices for local stationery stores or residential noticeboards',
      'Set up clean, distraction-free study space with whiteboard/notebooks',
    ];
    day3Actions = [
      'Conduct your first free 30-minute trial session with a prospective pupil',
      'Assess student baseline knowledge and diagnostic strengths/weaknesses',
      'Agree on weekly schedule (e.g. Mon-Wed-Fri 5:00-6:30 PM)',
    ];
  } else if (opp.category === 'reselling') {
    day1Actions = [
      'Install Meesho app and link UPI bank account for zero-deduction margin transfers',
      'Browse top-rated festive apparel, kitchenware, and daily essentials with 4.2+ star ratings',
      'Select 3 high-demand product categories to focus on',
    ];
    day2Actions = [
      'Download product image catalogs without supplier watermarks',
      'Create a dedicated WhatsApp Broadcast List for trusted family and neighbors',
      'Set transparent margins: add ₹100–₹150 profit per item above wholesale price',
    ];
    day3Actions = [
      'Post first 3 curated catalog collections on WhatsApp Status and Instagram',
      'Personally message 5 close contacts with customized recommendations',
      'Assist any interested buyer with sizing, color choices, and COD payment options',
    ];
  } else if (opp.category === 'artisan' && opp.slug === 'neighborhood-tiffin-service') {
    day1Actions = [
      'Finalize a wholesome, cost-effective weekly menu (Dal, Roti, Seasonal Sabzi, Rice)',
      'Source wholesale 3-compartment meal containers from local market',
      'Calculate per-plate raw ingredient cost (target under ₹40/meal)',
    ];
    day2Actions = [
      `Visit student hostels, coaching institutes, and bachelor PGs in ${city}`,
      'Provide 3 sample tiffin boxes to local PG caretakers or student coordinators',
      'Secure first 2 recurring weekly lunch/dinner subscribers',
    ];
  }

  const days: PlanDayItem[] = [
    { dayNumber: 1, title: 'Day 1', focus: 'Setup, Compliance & Pricing', actionItems: day1Actions, estimatedMinutes: 60, completed: false },
    { dayNumber: 2, title: 'Day 2', focus: 'Profile & Asset Preparation', actionItems: day2Actions, estimatedMinutes: 75, completed: false },
    { dayNumber: 3, title: 'Day 3', focus: 'First Live Attempt / Client Pilot', actionItems: day3Actions, estimatedMinutes: 120, completed: false },
    { dayNumber: 4, title: 'Day 4', focus: 'Target Shift & Real Unit Delivery', actionItems: day4Actions, estimatedMinutes: Math.round((constraints.availableHoursPerDay || 4) * 60), completed: false },
    { dayNumber: 5, title: 'Day 5', focus: 'Feedback, Quality & Expense Audit', actionItems: day5Actions, estimatedMinutes: 45, completed: false },
    { dayNumber: 6, title: 'Day 6', focus: 'Volume Scaling & Peak Hour Focus', actionItems: day6Actions, estimatedMinutes: Math.round((constraints.availableHoursPerDay || 4) * 60), completed: false },
    { dayNumber: 7, title: 'Day 7', focus: 'Weekly Net Income Audit & Week 2 Plan', actionItems: day7Actions, estimatedMinutes: 40, completed: false },
  ];

  return {
    opportunitySlug: opp.slug,
    opportunityName: opp.opportunityName,
    platform: opp.platform,
    targetDailyEarn: `₹${financials.netDaily}/day`,
    days,
    notes: `Customized for ${city}. Focus on disciplined execution of Day 1 and 2 to ensure zero delay in reaching Day 3 client interaction.`,
  };
}
