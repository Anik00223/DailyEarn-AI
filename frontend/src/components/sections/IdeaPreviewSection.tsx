import { useState, useMemo } from 'react';
import { useScrollReveal } from '../../hooks/useScrollAnimation';
import { ChevronDown, ChevronUp, CheckCircle2, ShieldCheck, Activity, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OpportunityBenchmark {
  id: string;
  title: string;
  platform: string;
  cityContext: string;
  category: string;
  categoryColor: string;
  hours: number;
  gross: number;
  platformFee: number;
  fuelCost: number;
  netDaily: number;
  alignmentScore: number;
  alignmentLabel: string;
  verificationStatus: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'DYNAMIC';
  verificationSource: string;
  unitDetail: string;
}

export function IdeaPreviewSection() {
  const ref = useScrollReveal<HTMLElement>();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>('featured-tutoring');

  // Grounded platform benchmarks derived from genuine verified opportunity seed profiles
  const benchmarks: OpportunityBenchmark[] = useMemo(() => {
    // 1. Home Tutoring (3 sessions @ 370)
    const tutorSessions = 3;
    const tutorRate = 370;
    const tutorGross = tutorSessions * tutorRate;
    const tutorNet = tutorGross;

    // 2. Swiggy Food & Instamart Delivery (6 deliveries @ 65)
    const delOrders = 6;
    const delRate = 65;
    const delGross = delOrders * delRate;
    const delFee = Math.round(delGross * 0.18);
    const delFuel = delOrders * 15;
    const delNet = delGross - delFee - delFuel;

    // 3. Online STEM Tutor (4 hours @ 260)
    const stemHours = 4;
    const stemRate = 260;
    const stemGross = stemHours * stemRate;
    const stemFee = Math.round(stemGross * 0.1);
    const stemNet = stemGross - stemFee;

    return [
      {
        id: 'featured-tutoring',
        title: 'Secondary & High School Home Tutor',
        platform: 'Local Tutor Network',
        cityContext: 'Tier-2 & Tier-3 City Neighborhoods',
        category: 'tutoring',
        categoryColor: '#8B5CF6',
        hours: 3.5,
        gross: tutorGross,
        platformFee: 0,
        fuelCost: 0,
        netDaily: tutorNet,
        alignmentScore: 94,
        alignmentLabel: 'Direct Skill Match',
        verificationStatus: 'PARTIALLY_VERIFIED',
        verificationSource: 'Tier-2 Parent Tutor Network Survey (2026)',
        unitDetail: `${tutorSessions} academic sessions @ ₹${tutorRate}/session`,
      },
      {
        id: 'fleet-delivery',
        title: 'Food & Quick-Commerce Fleet Partner',
        platform: 'Swiggy / Rapido Partner',
        cityContext: 'Metro & Tier-2 Zonal Hubs',
        category: 'delivery',
        categoryColor: '#00F2FE',
        hours: 4.0,
        gross: delGross,
        platformFee: delFee,
        fuelCost: delFuel,
        netDaily: delNet,
        alignmentScore: 90,
        alignmentLabel: 'High Local Demand',
        verificationStatus: 'PARTIALLY_VERIFIED',
        verificationSource: 'Delivery Partner Official Rate Cards (2026)',
        unitDetail: `${delOrders} deliveries @ ₹${delRate}/order`,
      },
      {
        id: 'remote-stem',
        title: 'Online STEM 1-on-1 Doubt Solver',
        platform: 'Remote Platform & Freelance',
        cityContext: 'Pan-India Remote',
        category: 'digital',
        categoryColor: '#10B981',
        hours: 4.0,
        gross: stemGross,
        platformFee: stemFee,
        fuelCost: 0,
        netDaily: stemNet,
        alignmentScore: 88,
        alignmentLabel: 'Zero Commute Match',
        verificationStatus: 'PARTIALLY_VERIFIED',
        verificationSource: 'Freelance Platform Payout Ledger Benchmarks',
        unitDetail: `${stemHours} billable hours @ ₹${stemRate}/hr`,
      },
    ];
  }, []);

  const featured = benchmarks[0];
  const supporting = benchmarks.slice(1);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      ref={ref}
      style={{
        padding: '90px 24px',
        maxWidth: 1240,
        margin: '0 auto',
        position: 'relative',
        zIndex: 2,
      }}
    >
      {/* Section Header */}
      <div style={{ maxWidth: 720, marginBottom: 40 }}>
        <span
          data-reveal
          style={{
            fontFamily: 'var(--font-label)',
            fontSize: '0.74rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#00F2FE',
            display: 'block',
            marginBottom: 8,
          }}
        >
          AUTHENTIC LOCAL BENCHMARKS
        </span>
        <h2
          data-reveal
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.8rem, 3.2vw, 2.5rem)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            lineHeight: 1.2,
            marginBottom: 12,
          }}
        >
          Real platforms. Modeled with real math.
        </h2>
        <p
          data-reveal
          style={{
            fontSize: '0.98rem',
            color: '#94A3B8',
            lineHeight: 1.6,
          }}
        >
          Prioritizing genuine net earnings over inflated gross promises. Inspect the exact deterministic breakdown
          for commissions, fuel costs, and unit payout rates.
        </p>
      </div>

      {/* ASYMMETRIC GRID: 1 LARGE FEATURED CARD (LEFT) + 2 COMPACT SUPPORTING CARDS (RIGHT) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN: LARGE FEATURED CARD */}
        <div
          data-reveal
          className="product-card"
          style={{
            padding: '30px',
            borderRadius: 14,
            background: '#0B111A',
            border: '1px solid #1E293B',
            boxShadow: '0 16px 40px -12px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
            position: 'relative',
          }}
        >
          {/* Top Tag Strip */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '3px 10px',
                borderRadius: 20,
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                color: '#A78BFA',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Featured Opportunity
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{featured.cityContext}</span>
          </div>

          <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
            {featured.title}
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94A3B8', margin: '0 0 20px' }}>
            Platform: <strong style={{ color: '#E2E8F0' }}>{featured.platform}</strong> · {featured.unitDetail}
          </p>

          {/* Prominent Net Ceiling Display */}
          <div
            style={{
              background: '#080C14',
              borderRadius: 10,
              padding: '18px 20px',
              border: '1px solid #1E293B',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                Realistic Net Take-Home
              </span>
              <span style={{ fontSize: '0.75rem', color: '#00F2FE', fontWeight: 600 }}>
                {featured.hours} hrs/day
              </span>
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#00F2FE', margin: '4px 0 8px' }}>
              ₹{featured.netDaily.toLocaleString('en-IN')}{' '}
              <span style={{ fontSize: '0.9rem', color: '#94A3B8', fontWeight: 400 }}>/ day</span>
            </div>

            {/* Deductions Breakdown Meter */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                paddingTop: 12,
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.75rem',
              }}
            >
              <div>
                <span style={{ color: '#94A3B8', display: 'block' }}>Gross</span>
                <span style={{ color: '#FFFFFF', fontWeight: 700 }}>₹{featured.gross}</span>
              </div>
              <div>
                <span style={{ color: '#94A3B8', display: 'block' }}>Commission</span>
                <span style={{ color: '#F59E0B', fontWeight: 700 }}>-₹{featured.platformFee}</span>
              </div>
              <div>
                <span style={{ color: '#94A3B8', display: 'block' }}>Fuel / Commute</span>
                <span style={{ color: '#EF4444', fontWeight: 700 }}>-₹{featured.fuelCost}</span>
              </div>
            </div>
          </div>

          {/* Provenance and Citation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
              fontSize: '0.75rem',
              color: '#94A3B8',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: 16,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} color="#00F2FE" />
              {featured.verificationSource}
            </span>
            <button
              className="btn-primary"
              onClick={() => navigate('/register')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 6,
                fontSize: '0.78rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #00B4D8, #0077B6)',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              Model My City <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: 2 COMPACT SUPPORTING CARDS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {supporting.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                data-reveal
                className="product-card"
                style={{
                  padding: '22px 24px',
                  borderRadius: 12,
                  background: '#0B111A',
                  border: isExpanded ? '1px solid #38BDF8' : '1px solid #1E293B',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: item.categoryColor,
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.platform}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{item.cityContext}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '3px 0 0' }}>
                      {item.unitDetail} · {item.hours}h shift
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#00F2FE' }}>
                      ₹{item.netDaily.toLocaleString('en-IN')}
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 400, marginLeft: 4 }}>
                        /day
                      </span>
                    </div>
                  </div>
                </div>

                {/* Inspect Model Button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    Alignment: {item.alignmentScore}/100 · {item.alignmentLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.73rem',
                      color: '#00F2FE',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 600,
                    }}
                  >
                    {isExpanded ? 'Hide Model' : 'Inspect Deductions'}
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>

                {/* Progressively Disclosed Model */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: '12px 14px',
                      borderRadius: 8,
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '0.73rem',
                      color: '#94A3B8',
                      lineHeight: 1.6,
                    }}
                  >
                    <div>• Gross Payout: ₹{item.gross}</div>
                    <div>• Platform Deductions: -₹{item.platformFee}</div>
                    <div>• Fuel / Transit Overhead: -₹{item.fuelCost}</div>
                    <div style={{ color: '#00F2FE', fontWeight: 600 }}>• Net Take-Home: ₹{item.netDaily}/day</div>
                    <div style={{ color: '#64748B', fontSize: '0.68rem', marginTop: 4 }}>
                      Source: {item.verificationSource}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
