import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Sliders, ChevronDown, Sparkles } from 'lucide-react';
import type { CalculationModel } from './DailyEarnCockpit';

const POPULAR_CITIES = ['Silchar', 'Patna', 'Kota', 'Pune', 'Kolkata', 'Guwahati', 'Guntur'];
const SKILLS: Array<'Teaching' | 'Delivery' | 'Digital'> = ['Teaching', 'Delivery', 'Digital'];

interface HeroSectionProps {
  selectedCity: string;
  onSelectCity: (city: string) => void;
  selectedSkill: 'Teaching' | 'Delivery' | 'Digital';
  onSelectSkill: (skill: 'Teaching' | 'Delivery' | 'Digital') => void;
  selectedHours: number;
  onSelectHours: (hours: number) => void;
  targetIncome: number;
  onSelectTarget: (target: number) => void;
  calculation: CalculationModel;
}

export function HeroSection({
  selectedCity,
  onSelectCity,
  selectedSkill,
  onSelectSkill,
  selectedHours,
  onSelectHours,
  targetIncome,
  onSelectTarget,
  calculation,
}: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  // Subtle 0–5 second entrance sequence (intentional, premium, non-blocking)
  useEffect(() => {
    if (!sectionRef.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      tl.fromTo(
        '.hero-editorial > *',
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08 }
      ).fromTo(
        '.hero-console-dock',
        { y: 18, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6 },
        '-=0.2'
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '50px 24px 36px',
        maxWidth: 1240,
        margin: '0 auto',
      }}
    >
      {/* 1. EDITORIAL HEADLINE & INTRODUCTION */}
      <div className="hero-editorial" style={{ textAlign: 'center', maxWidth: 880, margin: '0 auto 32px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 14px',
            borderRadius: 20,
            background: 'rgba(0, 242, 254, 0.08)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            fontSize: '0.76rem',
            color: '#94A3B8',
            marginBottom: 16,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#00F2FE',
              boxShadow: '0 0 8px #00F2FE',
            }}
          />
          <span style={{ color: '#E2E8F0', fontWeight: 600 }}>Hyper-local income intelligence for India</span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(2.2rem, 4.4vw, 3.5rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            color: '#FFFFFF',
            marginBottom: 16,
          }}
        >
          Know what your time can{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #00F2FE 0%, #38BDF8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              position: 'relative',
              display: 'inline-block',
            }}
          >
            realistically earn.
          </span>
        </h1>

        <p
          style={{
            fontSize: '1.02rem',
            color: '#94A3B8',
            lineHeight: 1.6,
            maxWidth: 680,
            margin: '0 auto 24px',
          }}
        >
          DailyEarn analyzes your city, skills, available hours, and target to calculate verified local income
          opportunities — subtracting platform commissions, vehicle fuel, and deadhead transit miles.
        </p>

        {/* CTA Buttons */}
        <div
          style={{
            display: 'flex',
            gap: 14,
            justifyContent: 'center',
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <button
            className="btn-primary"
            onClick={() => navigate('/register')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: '0.92rem',
              background: 'linear-gradient(135deg, #00B4D8, #0077B6)',
              color: '#FFFFFF',
              boxShadow: '0 4px 18px rgba(0, 180, 216, 0.4)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Calculate My Income <ArrowRight size={16} />
          </button>
          <a
            href="#how-it-works"
            className="btn-secondary"
            style={{
              padding: '12px 20px',
              borderRadius: 8,
              fontSize: '0.9rem',
              color: '#CBD5E1',
              border: '1px solid #334155',
              background: 'rgba(255, 255, 255, 0.03)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            Explore Live Model <ChevronDown size={14} />
          </a>
        </div>

        {/* Trust Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            flexWrap: 'wrap',
            fontSize: '0.78rem',
            color: '#64748B',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Check size={13} color="#00F2FE" /> Deterministic arithmetic
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Check size={13} color="#00F2FE" /> Real fuel & commission deductions
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Check size={13} color="#00F2FE" /> Zero false promises
          </span>
        </div>
      </div>

      {/* 2. IMMEDIATE INTERACTIVE CONSOLE DOCK */}
      <div
        className="hero-console-dock product-card"
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '20px 24px',
          borderRadius: 16,
          background: '#0B111A',
          border: '1px solid #1E293B',
          boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sliders size={15} color="#00F2FE" />
            <span
              style={{
                fontSize: '0.72rem',
                color: '#00F2FE',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Interactive Scenario Calibrator
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Updates reasoning engine below in real time
          </span>
        </div>

        {/* 4 Inputs Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            alignItems: 'flex-start',
          }}
        >
          {/* City Selector */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.68rem',
                color: '#94A3B8',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 6,
              }}
            >
              City ({selectedCity})
            </label>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {POPULAR_CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => onSelectCity(city)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 5,
                    fontSize: '0.73rem',
                    border: `1px solid ${selectedCity === city ? '#00F2FE' : '#1E293B'}`,
                    background: selectedCity === city ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    color: selectedCity === city ? '#00F2FE' : '#94A3B8',
                    fontWeight: selectedCity === city ? 700 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Skill Selector */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.68rem',
                color: '#94A3B8',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 6,
              }}
            >
              Primary Skill
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              {SKILLS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => onSelectSkill(skill)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    border: `1px solid ${selectedSkill === skill ? '#8B5CF6' : '#1E293B'}`,
                    background: selectedSkill === skill ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    color: selectedSkill === skill ? '#A78BFA' : '#94A3B8',
                    fontWeight: selectedSkill === skill ? 700 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Hours Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  color: '#94A3B8',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Available Time
              </span>
              <span style={{ fontSize: '0.75rem', color: '#00F2FE', fontWeight: 700 }}>
                {selectedHours} hrs / day
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="10"
              step="1"
              value={selectedHours}
              onChange={(e) => onSelectHours(Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: '#00F2FE',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Target Income Input */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  color: '#94A3B8',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Daily Target
              </span>
              <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>
                ₹{targetIncome.toLocaleString('en-IN')} / day
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[600, 800, 1200, 1500].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onSelectTarget(t)}
                  style={{
                    flex: 1,
                    padding: '5px 4px',
                    borderRadius: 5,
                    fontSize: '0.72rem',
                    border: `1px solid ${targetIncome === t ? '#10B981' : '#1E293B'}`,
                    background: targetIncome === t ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    color: targetIncome === t ? '#10B981' : '#94A3B8',
                    fontWeight: targetIncome === t ? 700 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  ₹{t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Scenario Result Strip */}
        <div
          style={{
            marginTop: 18,
            padding: '12px 16px',
            borderRadius: 8,
            background: '#080C14',
            border: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
              Calculated Daily Ceiling:
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
              ₹{calculation.net.toLocaleString('en-IN')}
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 400 }}> take-home</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                fontSize: '0.74rem',
                color: calculation.feasible ? '#10B981' : '#F59E0B',
                fontWeight: 600,
              }}
            >
              {calculation.feasible
                ? `✓ Feasible for ₹${targetIncome.toLocaleString('en-IN')}/day`
                : `⚠ -₹${calculation.gap.toLocaleString('en-IN')} Gap vs ₹${targetIncome.toLocaleString('en-IN')}`}
            </span>
            <a
              href="#how-it-works"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.74rem',
                color: '#00F2FE',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Watch engine reason below <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
