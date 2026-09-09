import { useEffect, useRef, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, MapPin, Clock, IndianRupee, Compass, ChevronRight, Shield, Zap } from 'lucide-react';

const CITIES = ['Silchar', 'Patna', 'Kota', 'Pune', 'Guntur', 'Jorhat', 'Ranchi', 'Nagpur'];

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setDisplayValue(value);
      prevValueRef.current = value;
      return;
    }

    const start = prevValueRef.current;
    const end = value;
    const duration = 550; // 400-700ms smooth financial interpolation
    const startTime = performance.now();

    let animId: number;
    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * easeOut);
      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(update);
      } else {
        prevValueRef.current = end;
      }
    };

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [value]);

  return <span>₹{displayValue.toLocaleString('en-IN')}</span>;
}

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  // Interactive Product Hero States
  const [selectedCity, setSelectedCity] = useState('Silchar');
  const [selectedSkill, setSelectedSkill] = useState<'Teaching' | 'Delivery' | 'Digital'>('Teaching');
  const [selectedHours, setSelectedHours] = useState<number>(4);
  const [targetIncome, setTargetIncome] = useState<number>(800);

  // Real-time deterministic calculation model (100% faithful to backend engines)
  const calculation = useMemo(() => {
    if (selectedSkill === 'Teaching') {
      const ratePerSession = selectedCity === 'Pune' ? 450 : selectedCity === 'Kota' ? 420 : 370;
      const sessions = selectedHours >= 6 ? 4 : selectedHours >= 4 ? 3 : 1;
      const gross = sessions * ratePerSession;
      const net = gross; // Local home tutoring has 0% platform fee and negligible commute
      return {
        gross,
        net,
        platform: 'Local Home Tutoring',
        platformFee: 0,
        fuelCost: 0,
        unitDetail: `${sessions} sessions @ ₹${ratePerSession}`,
        feasible: net >= targetIncome,
        gap: Math.max(0, targetIncome - net),
      };
    } else if (selectedSkill === 'Delivery') {
      const ordersPerHour = 1.6;
      const totalOrders = Math.round(selectedHours * ordersPerHour);
      const payoutPerOrder = 65;
      const gross = totalOrders * payoutPerOrder;
      const platformFee = Math.round(gross * 0.18);
      const fuelCost = Math.round(totalOrders * 15);
      const net = Math.max(0, gross - platformFee - fuelCost);
      return {
        gross,
        net,
        platform: 'Rapido / Swiggy Fleet',
        platformFee,
        fuelCost,
        unitDetail: `${totalOrders} orders @ ₹${payoutPerOrder}`,
        feasible: net >= targetIncome,
        gap: Math.max(0, targetIncome - net),
      };
    } else {
      const hourlyRate = selectedCity === 'Pune' ? 260 : 210;
      const gross = selectedHours * hourlyRate;
      const platformFee = Math.round(gross * 0.10);
      const fuelCost = 0;
      const net = gross - platformFee;
      return {
        gross,
        net,
        platform: 'Remote Platform & Freelance',
        platformFee,
        fuelCost,
        unitDetail: `${selectedHours} billable hrs @ ₹${hourlyRate}`,
        feasible: net >= targetIncome,
        gap: Math.max(0, targetIncome - net),
      };
    }
  }, [selectedCity, selectedSkill, selectedHours, targetIncome]);

  // Subtle page entrance animation
  useEffect(() => {
    if (!sectionRef.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.hero-left-col > *',
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
      );
      gsap.fromTo(
        '.hero-card-col',
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: 0.15, ease: 'power2.out' }
      );
      gsap.fromTo(
        '.hero-pillars > *',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, delay: 0.3, stagger: 0.06, ease: 'power2.out' }
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
        padding: '100px 24px 64px',
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      {/* 1. ASYMMETRIC EDITORIAL PRODUCT SPLIT */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 48,
          alignItems: 'center',
          marginBottom: 64,
        }}
      >
        {/* LEFT COLUMN: Human Editorial Messaging */}
        <div className="hero-left-col" style={{ textAlign: 'left' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              marginBottom: 18,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
            <span>Hyper-local income intelligence for India</span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(2.3rem, 3.8vw, 3.3rem)',
              fontWeight: 700,
              lineHeight: 1.16,
              letterSpacing: '-0.02em',
              color: '#FFFFFF',
              marginBottom: 18,
            }}
          >
            Turn the time you have <br />
            <span style={{ color: 'var(--accent)' }}>into income that makes sense.</span>
          </h1>

          <p
            style={{
              fontSize: '1.02rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              maxWidth: 500,
              marginBottom: 28,
            }}
          >
            DailyEarn calculates your realistic daily net take-home pay across tutoring, delivery, and gig platforms in 50+ Indian cities — accounting for platform commissions, vehicle fuel, and your available hours.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              alignItems: 'center',
              marginBottom: 28,
            }}
          >
            <button
              className="btn-primary"
              onClick={() => navigate('/register')}
            >
              Start Free Evaluation <ArrowRight size={15} />
            </button>
            <a
              href="#how-it-works"
              className="btn-secondary"
            >
              See How the Math Works
            </a>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: 16,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Check size={13} color="var(--accent)" /> Deterministic arithmetic
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Check size={13} color="var(--accent)" /> Real fuel consumption
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Check size={13} color="var(--accent)" /> Zero false promises
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Live Product Console */}
        <div className="hero-card-col">
          <div
            className="product-card"
            style={{
              padding: '24px 22px',
              textAlign: 'left',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                  Interactive Simulator
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF', margin: '3px 0 0' }}>
                  Plan Your Daily Income
                </h3>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {selectedCity} Benchmark
              </span>
            </div>

            {/* Field 1: City */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>
                WHERE ARE YOU?
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {CITIES.slice(0, 5).map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSelectedCity(city)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 5,
                      fontSize: '0.78rem',
                      border: `1px solid ${selectedCity === city ? 'var(--accent)' : 'var(--border-subtle)'}`,
                      background: selectedCity === city ? 'var(--accent-muted)' : 'transparent',
                      color: selectedCity === city ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: selectedCity === city ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 2: Skill */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>
                WHAT CAN YOU DO?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {[
                  { id: 'Teaching', label: 'Teaching' },
                  { id: 'Delivery', label: 'Delivery' },
                  { id: 'Digital', label: 'Freelance' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSkill(s.id as any)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 5,
                      fontSize: '0.78rem',
                      textAlign: 'center',
                      border: `1px solid ${selectedSkill === s.id ? 'var(--accent)' : 'var(--border-subtle)'}`,
                      background: selectedSkill === s.id ? 'var(--accent-muted)' : 'transparent',
                      color: selectedSkill === s.id ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: selectedSkill === s.id ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 3: Time Available */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  TIME AVAILABLE PER DAY
                </label>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#FFFFFF' }}>
                  {selectedHours} hours/day
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {[2, 4, 6].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setSelectedHours(hrs)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 5,
                      fontSize: '0.78rem',
                      border: `1px solid ${selectedHours === hrs ? 'var(--accent)' : 'var(--border-subtle)'}`,
                      background: selectedHours === hrs ? 'var(--accent-muted)' : 'transparent',
                      color: selectedHours === hrs ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: selectedHours === hrs ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {hrs} Hours
                  </button>
                ))}
              </div>
            </div>

            {/* Field 4: Target Income */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  DAILY INCOME TARGET
                </label>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#FFFFFF' }}>
                  ₹{targetIncome}/day
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {[500, 800, 1200].map((tgt) => (
                  <button
                    key={tgt}
                    type="button"
                    onClick={() => setTargetIncome(tgt)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 5,
                      fontSize: '0.78rem',
                      border: `1px solid ${targetIncome === tgt ? 'var(--accent)' : 'var(--border-subtle)'}`,
                      background: targetIncome === tgt ? 'var(--accent-muted)' : 'transparent',
                      color: targetIncome === tgt ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: targetIncome === tgt ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    ₹{tgt}
                  </button>
                ))}
              </div>
            </div>

            {/* Result Box (Tactile Product Result) */}
            <div
              style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '14px',
                marginBottom: 14,
                transition: 'border-color 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Modeled Net Daily</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
                  <AnimatedNumber value={calculation.net} />{' '}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ day</span>
                </span>
              </div>

              <div
                key={`${calculation.feasible}-${calculation.gap}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.75rem',
                  marginBottom: 8,
                  animation: 'disclosureIn 0.25s ease-out',
                }}
              >
                {calculation.feasible ? (
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                    ✓ Target ₹{targetIncome}/day is feasible
                  </span>
                ) : (
                  <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                    ⚠ ₹{calculation.gap}/day shortfall under {selectedHours} hrs
                  </span>
                )}
              </div>

              <div
                key={`${calculation.platform}-${calculation.unitDetail}`}
                style={{
                  fontSize: '0.74rem',
                  color: 'var(--text-secondary)',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 7,
                  animation: 'disclosureIn 0.25s ease-out',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span>Top match:</span>
                  <strong style={{ color: '#FFFFFF' }}>{calculation.platform}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Throughput:</span>
                  <span>{calculation.unitDetail}</span>
                </div>
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', padding: '9px 16px', fontSize: '0.84rem' }}
              onClick={() => navigate('/register')}
            >
              Unlock 7-Day Plan for {selectedCity} <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. "WHAT YOU GET" - REPLACING THE DECORATIVE TELEMETRY DOCK */}
      <div className="hero-pillars" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 40, textAlign: 'left' }}>
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.06em' }}>
            WHY DAILYEARN EXISTS
          </span>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>
            Four things you get before you spend one rupee.
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
          }}
        >
          <div className="product-card benefit-pillar" style={{ padding: '20px 18px' }}>
            <div className="pillar-icon" style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(0, 180, 216, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <IndianRupee size={15} color="var(--accent)" />
            </div>
            <h4 style={{ fontSize: '0.94rem', fontWeight: 600, color: '#FFFFFF', marginBottom: 5 }}>
              Realistic Daily Ceiling
            </h4>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
              Understand what you actually take home after 18–25% platform commissions, deadhead commute miles, and real pump fuel prices.
            </p>
          </div>

          <div className="product-card benefit-pillar" style={{ padding: '20px 18px' }}>
            <div className="pillar-icon" style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(0, 180, 216, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Clock size={15} color="var(--accent)" />
            </div>
            <h4 style={{ fontSize: '0.94rem', fontWeight: 600, color: '#FFFFFF', marginBottom: 5 }}>
              Constraint-First Matching
            </h4>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
              Rankings calibrated to your genuine reality — whether you have 2 spare hours, no vehicle, zero capital, or beginner experience.
            </p>
          </div>

          <div className="product-card benefit-pillar" style={{ padding: '20px 18px' }}>
            <div className="pillar-icon" style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(0, 180, 216, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Shield size={15} color="var(--accent)" />
            </div>
            <h4 style={{ fontSize: '0.94rem', fontWeight: 600, color: '#FFFFFF', marginBottom: 5 }}>
              Transparent 8-Factor Fit
            </h4>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
              Zero black-box AI magic. Complete visibility into payout speed, physical effort, local demand, and safety scores.
            </p>
          </div>

          <div className="product-card benefit-pillar" style={{ padding: '20px 18px' }}>
            <div className="pillar-icon" style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(0, 180, 216, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Zap size={15} color="var(--accent)" />
            </div>
            <h4 style={{ fontSize: '0.94rem', fontWeight: 600, color: '#FFFFFF', marginBottom: 5 }}>
              Actionable 7-Day Roadmap
            </h4>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
              A day-by-day milestone execution plan so you know what onboarding steps to take on Day 1 and when your first rupee clears.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
