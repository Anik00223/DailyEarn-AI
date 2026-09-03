import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { GenerateBar } from '../components/app/GenerateBar';
import { RecommendationCard } from '../components/app/RecommendationCard';
import { FeasibilityBanner } from '../components/app/FeasibilityBanner';
import { IncomeMixCard } from '../components/app/IncomeMixCard';
import { IncomeSimulatorModal } from '../components/app/IncomeSimulatorModal';
import { SevenDayPlanDrawer } from '../components/app/SevenDayPlanDrawer';
import { TrustCenterModal } from '../components/app/TrustCenterModal';
import { OutcomeFeedbackModal } from '../components/app/OutcomeFeedbackModal';
import { CompetitionHeroDemo } from '../components/demo/CompetitionHeroDemo';
import { Sparkles, Compass } from 'lucide-react';
import api from '../api/client';
import type { UserConstraints, DecisionResult, ApiResponse } from '../types/decision.types';
import { useDecisionStore } from '../store/decisionStore';

export function DashboardPage() {
  const {
    decision,
    isEvaluating,
    activePlan,
    simulatorOpp,
    isTrustCenterOpen,
    outcomeOpp,
    setDecision,
    setEvaluating,
    setActivePlan,
    setSimulatorOpp,
    setTrustCenterOpen,
    setOutcomeOpp,
  } = useDecisionStore();

  const [activeConstraints, setActiveConstraints] = useState<UserConstraints>({
    city: 'Silchar',
    state: 'Assam',
    targetDailyIncome: 800,
    availableHoursPerDay: 4,
    availableCapital: 0,
    hasVehicle: false,
    experienceLevel: 'beginner',
    skills: ['Teaching'],
    language: 'en',
  });

  const cardsRef = useRef<HTMLDivElement>(null);

  const handleEvaluate = async (constraints: UserConstraints) => {
    setActiveConstraints(constraints);
    // Clear stale decision state immediately so old metadata is never displayed during or after constraint changes
    setDecision(null);
    setActivePlan(null);
    setSimulatorOpp(null);
    setEvaluating(true);

    try {
      const res = await api.post<ApiResponse<DecisionResult>>('/decision/evaluate', constraints);
      if (res.data.success && res.data.data) {
        setDecision(res.data.data);

        // Animate newly rendered recommendation cards
        setTimeout(() => {
          if (cardsRef.current) {
            const cards = cardsRef.current.querySelectorAll('article');
            gsap.fromTo(cards, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out' });
          }
        }, 50);
      }
    } catch (err) {
      console.error('Decision evaluation failed:', err);
    } finally {
      setEvaluating(false);
    }
  };

  // Initial load: trigger default evaluation on mount if empty
  useEffect(() => {
    if (!decision) {
      handleEvaluate(activeConstraints);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ paddingTop: 72, minHeight: '100vh', paddingBottom: 60 }}>
      {/* Generate / Constraints Bar */}
      <GenerateBar
        onEvaluate={handleEvaluate}
        isEvaluating={isEvaluating}
        initialConstraints={activeConstraints}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px' }}>
        {/* Competition Hero Demo Selector */}
        <CompetitionHeroDemo onLoadDemo={handleEvaluate} />

        {/* Empty state while no evaluation has taken place */}
        {!decision && !isEvaluating && (
          <div style={{ textAlign: 'center', padding: '70px 24px' }}>
            <Compass size={48} color="var(--accent)" style={{ marginBottom: 16, opacity: 0.7 }} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#fff', marginBottom: 8 }}>
              Ready to Evaluate Your Income Path
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
              Select your city, skills, and constraints above to calculate your realistic earning ceiling and verified local recommendations.
            </p>
          </div>
        )}

        {/* Skeleton loading state */}
        {isEvaluating && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-md)' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 380, borderRadius: 'var(--radius-md)' }} />
              ))}
            </div>
          </div>
        )}

        {/* Evaluated Decision View */}
        {decision && !isEvaluating && (
          <div>
            {/* Feasibility Banner */}
            <FeasibilityBanner
              feasibility={decision.feasibility}
              gapAnalysis={decision.targetGapAnalysis}
            />

            {/* Income Mix Bundle if available */}
            {decision.incomeMix && <IncomeMixCard mix={decision.incomeMix} />}

            {/* Recommendation Cards Section */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: '#fff', margin: '0 0 6px' }}>
                Ranked Verified Opportunities for {decision.constraints.city}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 20px' }}>
                Scored and calculated deterministically based on your {decision.constraints.availableHoursPerDay} hours/day time budget and {decision.constraints.experienceLevel} experience.
              </p>

              <div
                ref={cardsRef}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}
              >
                {decision.recommendations.map((item, index) => (
                  <RecommendationCard
                    key={item.opportunity.slug}
                    item={item}
                    index={index}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS & DRAWERS */}
      {/* 1. Interactive Income Simulator Modal */}
      {simulatorOpp && (
        <IncomeSimulatorModal
          item={simulatorOpp}
          onClose={() => setSimulatorOpp(null)}
          targetDailyIncome={decision?.constraints.targetDailyIncome}
        />
      )}

      {/* 2. 7-Day Execution Plan Drawer */}
      {activePlan && (
        <SevenDayPlanDrawer
          plan={activePlan}
          onClose={() => setActivePlan(null)}
          onSavePlan={async (plan) => {
            try {
              await api.post('/decision/plans', plan);
            } catch (e) {
              console.warn('Plan save offline fallback');
            }
          }}
        />
      )}

      {/* 3. Trust Center & Verification Modal */}
      {isTrustCenterOpen && (
        <TrustCenterModal onClose={() => setTrustCenterOpen(false)} />
      )}

      {/* 4. Real-World Outcome Feedback Modal */}
      {outcomeOpp && (
        <OutcomeFeedbackModal
          item={outcomeOpp}
          onClose={() => setOutcomeOpp(null)}
        />
      )}
    </main>
  );
}
