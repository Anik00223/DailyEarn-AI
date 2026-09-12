import React, { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  DailyEarnCockpit,
  type CalculationModel,
  type StoryStage,
} from './DailyEarnCockpit';
import {
  Sliders,
  Activity,
  IndianRupee,
  ShieldCheck,
  CalendarCheck,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface ScrollStorytellingSectionProps {
  selectedCity: string;
  onSelectCity: (city: string) => void;
  selectedSkill: 'Teaching' | 'Delivery' | 'Digital';
  onSelectSkill: (skill: 'Teaching' | 'Delivery' | 'Digital') => void;
  selectedHours: number;
  onSelectHours: (hours: number) => void;
  targetIncome: number;
  onSelectTarget: (target: number) => void;
  calculation: CalculationModel;
  onPrimaryAction?: () => void;
}

interface Chapter {
  id: StoryStage;
  number: string;
  phase: string;
  icon: LucideIcon;
  title: string;
  description: string;
  accentColor: string;
  getHighlight: (calc: CalculationModel, city: string, hours: number, skill: string, target: number) => string;
}

const CHAPTERS: Chapter[] = [
  {
    id: 'inputs',
    number: '01',
    phase: 'Constraint Baseline',
    icon: Sliders,
    title: 'Declare your real-world reality.',
    description:
      'Enter your city, verified daily hours, vehicle availability, and declared skills. No resume inflation or theoretical guesswork.',
    accentColor: '#00F2FE',
    getHighlight: (_calc, city, hours, skill, target) =>
      `${city} · ${hours}h/day · ${skill} · Target ₹${target.toLocaleString('en-IN')}/d`,
  },
  {
    id: 'analysis',
    number: '02',
    phase: 'Market Intelligence',
    icon: Activity,
    title: 'Regional demand clusters ignite.',
    description:
      'DailyEarn scans active platforms across 50+ regional hubs, tracking real-time order volume, peak meal-time surges, and local customer density.',
    accentColor: '#8B5CF6',
    getHighlight: (calc) =>
      `${calc.demandLevel === 'high' || calc.demandLevel === 'surging' ? 'High Surge Density' : 'Active Market Cluster'} · ${calc.category || 'verified'} sector`,
  },
  {
    id: 'modeling',
    number: '03',
    phase: 'Deterministic Deductions',
    icon: IndianRupee,
    title: 'Model verified commissions & fuel.',
    description:
      'Theoretical earnings are deceptive. DailyEarn subtracts platform service commissions, deadhead commute miles, and real pump fuel prices.',
    accentColor: '#EF4444',
    getHighlight: (calc) =>
      `Gross ₹${calc.gross.toLocaleString('en-IN')} - Deductions ₹${(calc.platformFee + calc.fuelCost).toLocaleString('en-IN')} = Net ₹${calc.net.toLocaleString('en-IN')}/d`,
  },
  {
    id: 'recommendation',
    number: '04',
    phase: 'Feasibility & Opportunity',
    icon: ShieldCheck,
    title: 'Ranked by net take-home, not hype.',
    description:
      'The algorithm matches your constraints against proven local payout track records to deliver your authentic daily earning ceiling.',
    accentColor: '#10B981',
    getHighlight: (calc, _c, _h, _s, target) =>
      calc.feasible
        ? `Goal Met: 100% within reach of ₹${target.toLocaleString('en-IN')}/day target`
        : `Target Shortfall: -₹${calc.gap.toLocaleString('en-IN')}/day vs ₹${target.toLocaleString('en-IN')}/day`,
  },
  {
    id: 'action',
    number: '05',
    phase: 'Action Execution',
    icon: CalendarCheck,
    title: 'Know exactly what to do on Day 1.',
    description:
      'Receive a step-by-step 7-day milestone roadmap outlining onboarding verification, pilot deliveries, and target shift scheduling to secure your first rupee.',
    accentColor: '#10B981',
    getHighlight: (calc) =>
      `Actionable Milestone Plan for ${calc.platform}`,
  },
];

export function ScrollStorytellingSection({
  selectedCity,
  onSelectCity,
  selectedSkill,
  onSelectSkill,
  selectedHours,
  onSelectHours,
  targetIncome,
  onSelectTarget,
  calculation,
  onPrimaryAction,
}: ScrollStorytellingSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentStage, setCurrentStage] = useState<StoryStage>('inputs');
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Set up ScrollTrigger to drive the 5 story stages smoothly as the user scrolls naturally
  useEffect(() => {
    if (!containerRef.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    // Only apply pinned ScrollTrigger on desktop viewports (>= 1024px)
    if (window.innerWidth < 1024) return;

    const ctx = gsap.context(() => {
      const stages: StoryStage[] = ['inputs', 'analysis', 'modeling', 'recommendation', 'action'];

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top+=75',
        end: 'bottom bottom',
        pin: '.scroll-story-sticky-theater',
        pinSpacing: false,
        scrub: 0.6,
        onUpdate: (self) => {
          const progress = self.progress;
          const stageIndex = Math.min(
            stages.length - 1,
            Math.floor(progress * stages.length)
          );
          setCurrentStage(stages[stageIndex]);
          setActiveIndex(stageIndex);
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const currentChapter = CHAPTERS[activeIndex];

  // Calculations for Mobile Visual Previews
  const gross = Math.max(calculation.gross, 1);
  const netPercent = Math.min(100, Math.round((calculation.net / gross) * 100));
  const targetCoverageRatio = Math.min(1, calculation.net / Math.max(targetIncome, 1));

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="scroll-story-container"
      style={{
        position: 'relative',
        minHeight: '290vh',
        background: '#05070A',
        color: '#F8FAFC',
        padding: '0 24px',
        overflow: 'visible',
      }}
    >
      {/* DESKTOP PINNED STORYTELLING THEATER (>= 1024px) */}
      <div
        className="scroll-story-sticky-theater"
        style={{
          position: 'sticky',
          top: 75,
          height: 'calc(100vh - 85px)',
          maxWidth: 1360,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 36,
          zIndex: 20,
        }}
      >
        {/* LEFT COLUMN: SUPPORTING NARRATIVE (34% width - strictly secondary) */}
        <div
          className="scroll-story-narrative-col"
          style={{
            flex: '0 0 34%',
            maxWidth: 420,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
            padding: '20px 0',
          }}
        >
          {/* Section Supertitle */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: currentChapter.accentColor,
              marginBottom: 12,
              transition: 'color 0.3s ease',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: currentChapter.accentColor,
                boxShadow: `0 0 8px ${currentChapter.accentColor}`,
                transition: 'all 0.3s ease',
              }}
            />
            <span>CONTINUOUS REASONING PIPELINE</span>
          </div>

          {/* Chapter Progress Indicators Track */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            {CHAPTERS.map((ch, idx) => {
              const isActive = idx === activeIndex;
              const isPast = idx < activeIndex;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    setActiveIndex(idx);
                    setCurrentStage(ch.id);
                  }}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    background: isActive
                      ? ch.accentColor
                      : isPast
                      ? 'rgba(255, 255, 255, 0.25)'
                      : 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: isActive ? `0 0 10px ${ch.accentColor}` : 'none',
                  }}
                  title={`Stage ${ch.number}: ${ch.phase}`}
                />
              );
            })}
          </div>

          {/* Active Chapter Card */}
          <div
            className="product-card"
            style={{
              padding: '28px 26px',
              borderRadius: 14,
              background: '#0B111A',
              border: '1px solid #1E293B',
              borderLeft: `3px solid ${currentChapter.accentColor}`,
              boxShadow: '0 12px 32px -6px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
              transition: 'all 0.3s ease',
            }}
          >
            {/* Step Tag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: `${currentChapter.accentColor}18`,
                  border: `1px solid ${currentChapter.accentColor}44`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: currentChapter.accentColor,
                }}
              >
                <currentChapter.icon size={15} />
              </div>
              <div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: currentChapter.accentColor,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    display: 'block',
                  }}
                >
                  Step {currentChapter.number} · {currentChapter.phase}
                </span>
              </div>
            </div>

            {/* Chapter Headline */}
            <h3
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#FFFFFF',
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
                margin: '0 0 12px',
              }}
            >
              {currentChapter.title}
            </h3>

            {/* Chapter Description */}
            <p
              style={{
                fontSize: '0.88rem',
                color: '#94A3B8',
                lineHeight: 1.6,
                margin: '0 0 18px',
              }}
            >
              {currentChapter.description}
            </p>

            {/* Live Context Highlight Chip (Strictly Data-Driven) */}
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.76rem',
                color: '#E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: currentChapter.accentColor,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 600 }}>
                {currentChapter.getHighlight(
                  calculation,
                  selectedCity,
                  selectedHours,
                  selectedSkill,
                  targetIncome
                )}
              </span>
            </div>
          </div>

          {/* Scroll Hint */}
          <div
            style={{
              marginTop: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.72rem',
              color: '#64748B',
            }}
          >
            <span>Scroll naturally to watch engine evolve</span>
            <ChevronRight size={13} color={currentChapter.accentColor} />
          </div>
        </div>

        {/* RIGHT COLUMN: THE HERO CENTRAL INTELLIGENCE ARTWORK (66% width - Dominant) */}
        <div
          className="scroll-story-artwork-col"
          style={{
            flex: '1 1 66%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <div style={{ width: '100%', maxWidth: 880 }}>
            <DailyEarnCockpit
              selectedCity={selectedCity}
              onSelectCity={onSelectCity}
              selectedSkill={selectedSkill}
              onSelectSkill={onSelectSkill}
              selectedHours={selectedHours}
              onSelectHours={onSelectHours}
              targetIncome={targetIncome}
              onSelectTarget={onSelectTarget}
              calculation={calculation}
              onPrimaryAction={onPrimaryAction}
              storyStage={currentStage}
              hideControls={true}
            />
          </div>
        </div>
      </div>

      {/* MOBILE NATURAL SEQUENTIAL FLOW (< 1024px) */}
      {/* Follows strict user specification: Visual preview ↓ Story content ↓ Next visual state ↓ Story content */}
      <div
        className="scroll-story-mobile-flow"
        style={{
          display: 'none',
          padding: '48px 0 40px',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span
            style={{
              fontSize: '0.72rem',
              color: '#00F2FE',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            CONTINUOUS REASONING PIPELINE
          </span>
          <h2
            style={{
              fontSize: 'clamp(1.35rem, 4.5vw, 1.8rem)',
              fontWeight: 800,
              color: '#FFFFFF',
              marginTop: 6,
              letterSpacing: '-0.02em',
            }}
          >
            Watch your time transform into earnings.
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#94A3B8', marginTop: 4, maxWidth: 360, margin: '6px auto 0' }}>
            Scroll naturally through the 5 intelligence stages.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {CHAPTERS.map((ch) => (
            <div
              key={ch.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              {/* 1. VISUAL PREVIEW FOR THIS STAGE */}
              <div
                className="mobile-stage-visual-preview"
                style={{
                  borderRadius: 12,
                  padding: '14px 16px',
                  background: '#0B111A',
                  border: '1px solid #1E293B',
                  borderTop: `2px solid ${ch.accentColor}`,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
                  boxSizing: 'border-box',
                }}
              >
                {ch.id === 'inputs' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.68rem', color: '#00F2FE', fontWeight: 700, textTransform: 'uppercase' }}>
                        Constraint Baseline
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{selectedCity} Node</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.75rem' }}>
                      <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '6px 8px', borderRadius: 6 }}>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '0.65rem' }}>SKILL</span>
                        <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{selectedSkill}</span>
                      </div>
                      <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '6px 8px', borderRadius: 6 }}>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '0.65rem' }}>HOURS</span>
                        <span style={{ color: '#00F2FE', fontWeight: 700 }}>{selectedHours}h / day</span>
                      </div>
                    </div>
                  </div>
                )}

                {ch.id === 'analysis' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.68rem', color: '#8B5CF6', fontWeight: 700, textTransform: 'uppercase' }}>
                        Market Cluster Active
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#A78BFA' }}>
                        {calculation.demandLevel === 'high' || calculation.demandLevel === 'surging' ? 'High Surge' : 'Active'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>
                      {calculation.platform}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: '#94A3B8', marginTop: 3 }}>
                      {calculation.unitDetail} · {selectedCity} Hub
                    </div>
                  </div>
                )}

                {ch.id === 'modeling' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.68rem', color: '#EF4444', fontWeight: 700, textTransform: 'uppercase' }}>
                        Deductions Model
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#00F2FE', fontWeight: 700 }}>
                        {netPercent}% take-home
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Gross: ₹{calculation.gross.toLocaleString('en-IN')}</span>
                        <span style={{ fontSize: '0.7rem', color: '#EF4444', marginLeft: 8 }}>
                          -₹{(calculation.platformFee + calculation.fuelCost).toLocaleString('en-IN')} costs
                        </span>
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF' }}>
                        ₹{calculation.net.toLocaleString('en-IN')}
                        <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 400 }}> net</span>
                      </div>
                    </div>
                  </div>
                )}

                {ch.id === 'recommendation' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 700, textTransform: 'uppercase' }}>
                        Target Feasibility
                      </span>
                      <span style={{ fontSize: '0.72rem', color: calculation.feasible ? '#10B981' : '#F59E0B', fontWeight: 700 }}>
                        {calculation.feasible ? '✓ Target Met' : `-₹${calculation.gap.toLocaleString('en-IN')} Shortfall`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF' }}>
                        {Math.round(targetCoverageRatio * 100)}%
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', lineHeight: 1.3 }}>
                        of ₹{targetIncome.toLocaleString('en-IN')}/day target · Ceiling: ₹{calculation.net.toLocaleString('en-IN')}/day
                      </div>
                    </div>
                  </div>
                )}

                {ch.id === 'action' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 700, textTransform: 'uppercase' }}>
                        7-Day Execution Pathway
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 600 }}>Action Ready</span>
                    </div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#FFFFFF' }}>
                      {calculation.platform} Onboarding
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 3 }}>
                      Day 1 Verification → Day 2–3 Peak Pilots → Day 4–7 Full Schedule
                    </div>
                    {onPrimaryAction && (
                      <button
                        type="button"
                        onClick={onPrimaryAction}
                        style={{
                          width: '100%',
                          marginTop: 8,
                          padding: '8px 12px',
                          borderRadius: 6,
                          background: 'linear-gradient(135deg, #10B981, #059669)',
                          border: 'none',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        Launch My Income Plan <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 2. STORY CONTENT CARD */}
              <div
                className="product-card"
                style={{
                  padding: '20px 18px',
                  borderRadius: 12,
                  background: '#090E16',
                  border: '1px solid #1E293B',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 5,
                      background: `${ch.accentColor}18`,
                      border: `1px solid ${ch.accentColor}44`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: ch.accentColor,
                    }}
                  >
                    <ch.icon size={13} />
                  </div>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      color: ch.accentColor,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Step {ch.number} · {ch.phase}
                  </span>
                </div>

                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 8px', lineHeight: 1.3 }}>
                  {ch.title}
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#94A3B8', lineHeight: 1.55, margin: '0 0 14px' }}>
                  {ch.description}
                </p>
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'rgba(0, 0, 0, 0.4)',
                    fontSize: '0.74rem',
                    color: '#CBD5E1',
                    fontWeight: 600,
                    wordBreak: 'break-word',
                  }}
                >
                  {ch.getHighlight(
                    calculation,
                    selectedCity,
                    selectedHours,
                    selectedSkill,
                    targetIncome
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .scroll-story-sticky-theater {
            display: none !important;
          }
          .scroll-story-mobile-flow {
            display: block !important;
          }
          .scroll-story-container {
            min-height: auto !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
            padding-bottom: 40px !important;
          }
        }
      `}</style>
    </section>
  );
}
