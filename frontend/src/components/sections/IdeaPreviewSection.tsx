import { useState } from 'react';
import { useScrollReveal } from '../../hooks/useScrollAnimation';
import { ChevronDown, ChevronUp, CheckCircle2, ShieldCheck } from 'lucide-react';

interface OpportunityBenchmark {
  id: string;
  title: string;
  platform: string;
  city: string;
  netDaily: string;
  fitScore: string;
  fitLabel: string;
  hours: string;
  financialModel: {
    gross: string;
    deductions: string[];
    netFormula: string;
    capitalNeeded: string;
    verification: string;
  };
}

const benchmarks: OpportunityBenchmark[] = [
  {
    id: 'tutor-silchar',
    title: 'Secondary & High School Home Tutor',
    platform: 'Local Network',
    city: 'Silchar, Assam',
    netDaily: '₹1,107',
    fitScore: '94%',
    fitLabel: 'High Skill Match',
    hours: '3.5 hrs/day',
    financialModel: {
      gross: '₹1,200 (3 sessions × ₹400/session)',
      deductions: ['Commute & Materials: -₹93'],
      netFormula: '₹1,200 - ₹93 = ₹1,107 net take-home',
      capitalNeeded: '₹0 (Zero capital)',
      verification: 'Verified via Tier-2 parent rate surveys (2025)',
    },
  },
  {
    id: 'fleet-pune',
    title: 'Two-Wheeler Commute Fleet Partner',
    platform: 'Rapido',
    city: 'Pune, Maharashtra',
    netDaily: '₹580',
    fitScore: '82%',
    fitLabel: 'Constraint Feasible',
    hours: '4.0 hrs/day',
    financialModel: {
      gross: '₹780 (6 rides × ₹130 avg fare)',
      deductions: ['Platform Cut (20%): -₹156', 'Fuel Cost (6 km/ride @ ₹7.3/km): -₹44'],
      netFormula: '₹780 - ₹156 - ₹44 = ₹580 net take-home',
      capitalNeeded: 'Valid Two-Wheeler + DL',
      verification: 'Verified via active partner payout ledgers',
    },
  },
  {
    id: 'stem-remote',
    title: 'Online STEM 1-on-1 Doubt Solver',
    platform: 'Filo Instant',
    city: 'Remote / All India',
    netDaily: '₹972',
    fitScore: '89%',
    fitLabel: 'Zero Commute Match',
    hours: '4.0 hrs/day',
    financialModel: {
      gross: '₹1,080 (4 hrs × ₹270 base payout)',
      deductions: ['Platform service fee (10%): -₹108'],
      netFormula: '₹1,080 - ₹108 = ₹972 net take-home',
      capitalNeeded: 'Smartphone + stylus',
      verification: 'Calibrated from 140+ active tutor payout cycles',
    },
  },
];

export function IdeaPreviewSection() {
  const ref = useScrollReveal<HTMLElement>();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      ref={ref}
      style={{
        padding: '110px 24px',
        maxWidth: 1200,
        margin: '0 auto',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div style={{ maxWidth: 720, marginBottom: 48 }}>
        <span
          data-reveal
          style={{
            fontFamily: 'var(--font-label)',
            fontSize: '0.74rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            display: 'block',
            marginBottom: 10,
          }}
        >
          Verified Platform Benchmarks
        </span>
        <h2
          data-reveal
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.9rem, 3.4vw, 2.7rem)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            lineHeight: 1.2,
            marginBottom: 14,
          }}
        >
          Real platforms. Modeled with real math.
        </h2>
        <p
          data-reveal
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.98rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          Prioritizing genuine net earnings over headline numbers. Click any benchmark to reveal the exact mathematical model and deductions.
        </p>
      </div>

      {/* Editorial Opportunity List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {benchmarks.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div
              key={item.id}
              data-reveal
              className="product-card"
              style={{
                padding: '28px 32px',
                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease',
                transform: isExpanded ? 'translateY(-3px)' : 'translateY(0)',
                boxShadow: isExpanded ? '0 12px 28px -6px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 242, 254, 0.25)' : undefined,
                borderColor: isExpanded ? 'rgba(0, 242, 254, 0.35)' : undefined,
              }}
            >
              {/* Primary Row: Opportunity, City, Net/Day, Fit */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 20,
                }}
              >
                <div style={{ minWidth: 260, flex: '2 1 300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-label)',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: 'var(--accent)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {item.platform}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>·</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-label)',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {item.city}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.22rem',
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                      color: '#FFFFFF',
                      margin: 0,
                    }}
                  >
                    {item.title}
                  </h3>
                </div>

                {/* Metrics Group */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 32,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-label)',
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        letterSpacing: '0.05em',
                        marginBottom: 4,
                      }}
                    >
                      Modeled Net
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.6rem',
                        fontWeight: 700,
                        color: 'var(--accent)',
                        lineHeight: 1,
                      }}
                    >
                      {item.netDaily}
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: 4 }}>
                        /day
                      </span>
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-label)',
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        letterSpacing: '0.05em',
                        marginBottom: 4,
                      }}
                    >
                      Fit & Effort
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          fontSize: '0.82rem',
                          fontFamily: 'var(--font-label)',
                          fontWeight: 600,
                          color: '#FFFFFF',
                        }}
                      >
                        {item.fitScore}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        {item.fitLabel}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="btn-secondary"
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {isExpanded ? 'Hide Model' : 'Inspect Model'}
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Progressive Disclosure Panel */}
              {isExpanded && (
                <div
                  style={{
                    marginTop: 22,
                    paddingTop: 20,
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 16,
                  }}
                >
                  {/* 1. Net Take-Home (Key Financial Figure - Appears First) */}
                  <div
                    className="disclosure-item"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid rgba(0, 242, 254, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px 16px',
                      animationDelay: '0ms',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-label)',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}
                    >
                      Net Take-Home
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--accent)', fontWeight: 600 }}>
                      {item.financialModel.netFormula}
                    </div>
                  </div>

                  {/* 2. Gross Earnings */}
                  <div
                    className="disclosure-item"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px 16px',
                      animationDelay: '50ms',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-label)',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}
                    >
                      Gross Earnings
                    </div>
                    <div style={{ fontSize: '0.88rem', color: '#FFFFFF', fontWeight: 600 }}>
                      {item.financialModel.gross}
                    </div>
                  </div>

                  {/* 3. Deductions */}
                  <div
                    className="disclosure-item"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px 16px',
                      animationDelay: '100ms',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-label)',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}
                    >
                      Deductions
                    </div>
                    {item.financialModel.deductions.map((d, idx) => (
                      <div key={idx} style={{ fontSize: '0.82rem', color: '#EF4444' }}>
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* 4. Verification Source */}
                  <div
                    className="disclosure-item"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px 16px',
                      animationDelay: '150ms',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-label)',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}
                    >
                      Verification Source
                    </div>
                    <div
                      style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <ShieldCheck size={14} color="var(--accent)" />
                      {item.financialModel.verification}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
