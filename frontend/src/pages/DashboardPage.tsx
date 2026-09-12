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
import { AppSidebar } from '../components/layout/AppSidebar';
import { Sparkles, Compass, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
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
            gsap.fromTo(cards, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.08, ease: 'power2.out' });
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Sleek App Navigation Sidebar */}
      <AppSidebar />

      {/* Main Content Area (offset on desktop for 64px sidebar rail) */}
      <main className="dashboard-content-area" style={{ minHeight: '100vh', paddingBottom: 80, paddingTop: 72 }}>
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
            <div className="product-card" style={{ textAlign: 'center', padding: '70px 24px', margin: '20px 0' }}>
              <Compass size={44} color="#00B4D8" style={{ marginBottom: 16, opacity: 0.8 }} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                Ready to Evaluate Your Income Path
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
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
                  <div key={i} className="skeleton" style={{ height: 360, borderRadius: 'var(--radius-md)' }} />
                ))}
              </div>
            </div>
          )}

          {/* Evaluated Decision View */}
          {decision && !isEvaluating && (
            <div>
              {/* SECTION 9: YOUR INCOME STRATEGY — ONE PRIMARY NUMBER + CONTEXTUAL SUPPORTING METRICS */}
              <div
                style={{
                  marginBottom: 28,
                  padding: '24px 26px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(18, 25, 33, 0.95) 0%, rgba(14, 20, 28, 0.9) 100%)',
                  border: '1px solid #263543',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00B4D8' }} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    YOUR INCOME STRATEGY · {decision.constraints.city.toUpperCase()}, {decision.constraints.state.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
                  {/* ONE PRIMARY NUMBER */}
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                      REALISTIC DAILY CEILING
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.4rem)', fontWeight: 800, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
                        ₹{decision.feasibility.realisticCeilingMax.toLocaleString('en-IN')}
                      </span>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>/ day take-home</span>
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '8px 0 0', maxWidth: 480, lineHeight: 1.5 }}>
                      Expected net income after verified platform fees, deadhead commute, and fuel deductions based on {decision.constraints.availableHoursPerDay} hours/day.
                    </p>
                  </div>

                  {/* CONTEXTUAL SUPPORTING METRICS */}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid #263543', borderRadius: 8, padding: '12px 16px', minWidth: 130 }}>
                      <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Daily Target</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', margin: '3px 0', display: 'block' }}>
                        ₹{decision.constraints.targetDailyIncome.toLocaleString('en-IN')}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Target threshold</span>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid #263543', borderRadius: 8, padding: '12px 16px', minWidth: 140 }}>
                      <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Feasibility</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700, color: decision.feasibility.status === 'FEASIBLE' ? '#10B981' : '#F59E0B', margin: '3px 0', display: 'block' }}>
                        {decision.feasibility.status === 'FEASIBLE' ? 'Within Reach' : 'Adjustment Needed'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {decision.feasibility.targetGap === 0 ? '₹0 daily gap' : `₹${decision.feasibility.targetGap}/d shortfall`}
                      </span>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid #263543', borderRadius: 8, padding: '12px 16px', minWidth: 120 }}>
                      <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Capacity</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#00F2FE', margin: '3px 0', display: 'block' }}>
                        {decision.constraints.availableHoursPerDay} hrs/d
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{decision.constraints.experienceLevel}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feasibility Banner */}
              <FeasibilityBanner
                feasibility={decision.feasibility}
                gapAnalysis={decision.targetGapAnalysis}
              />

              {/* Income Mix Bundle if available */}
              {decision.incomeMix && <IncomeMixCard mix={decision.incomeMix} />}

              {/* AI Service Fallback Notice */}
              {decision.aiStatus && decision.aiStatus.status !== 'applied' && (
                <div
                  style={{
                    margin: '0 0 20px 0',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 170, 0, 0.08)',
                    border: '1px solid rgba(255, 170, 0, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: '0.84rem',
                    color: '#FFAA00',
                    lineHeight: 1.45,
                  }}
                >
                  <Sparkles size={18} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>AI Qualitative Note:</strong> {decision.aiStatus.message}
                  </span>
                </div>
              )}

              {/* SECTION 10: INTERACTIVE OPPORTUNITY LAYER */}
              <div id="opportunities" style={{ marginBottom: 28 }}>
                {/* Visual Pipeline Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 6,
                    background: '#0E141C',
                    border: '1px solid #263543',
                    marginBottom: 18,
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                    <span style={{ color: '#00F2FE', fontWeight: 600 }}>{decision.constraints.city}</span>
                    <span>→</span>
                    <span style={{ color: 'var(--text-primary)' }}>Verified Local Demand</span>
                    <span>→</span>
                    <span style={{ color: '#FFFFFF', fontWeight: 600 }}>Top {decision.recommendations.length} Best-Fit Opportunities</span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Ranked by 8-factor deterministic scoring
                  </div>
                </div>

                <div
                  ref={cardsRef}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}
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

      {/* Desktop Sidebar Layout Offset */}
      <style>{`
        @media (min-width: 768px) {
          .dashboard-content-area {
            margin-left: 64px;
          }
        }
      `}</style>
    </div>
  );
}
