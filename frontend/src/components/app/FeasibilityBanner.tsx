import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, ArrowRight, TrendingUp } from 'lucide-react';
import type { FeasibilityVerdict, TargetGapAnalysis } from '../../types/decision.types';
import { formatINR } from '../../utils/formatCurrency';

interface FeasibilityBannerProps {
  feasibility: FeasibilityVerdict;
  gapAnalysis: TargetGapAnalysis;
}

export function FeasibilityBanner({ feasibility, gapAnalysis }: FeasibilityBannerProps) {
  const isFeasible = feasibility.status === 'FEASIBLE';
  const isPossible = feasibility.status === 'POSSIBLE_WITH_CHANGES';

  const statusConfig = {
    FEASIBLE: {
      bg: 'rgba(6, 24, 28, 0.75)',
      border: 'rgba(0, 242, 254, 0.3)',
      accent: 'var(--accent)',
      icon: <CheckCircle2 size={24} color="var(--accent)" />,
      badge: 'TARGET FEASIBLE',
      badgeBg: 'rgba(0, 242, 254, 0.12)',
    },
    POSSIBLE_WITH_CHANGES: {
      bg: 'rgba(28, 20, 8, 0.75)',
      border: 'rgba(255, 170, 0, 0.35)',
      accent: '#FFAA00',
      icon: <AlertTriangle size={24} color="#FFAA00" />,
      badge: 'ADJUSTMENTS REQUIRED',
      badgeBg: 'rgba(255, 170, 0, 0.12)',
    },
    UNLIKELY: {
      bg: 'rgba(28, 10, 16, 0.75)',
      border: 'rgba(255, 77, 106, 0.35)',
      accent: 'var(--danger)',
      icon: <XCircle size={24} color="var(--danger)" />,
      badge: 'TARGET UNLIKELY TODAY',
      badgeBg: 'rgba(255, 77, 106, 0.12)',
    },
    INSUFFICIENT_DATA: {
      bg: 'rgba(6, 18, 26, 0.75)',
      border: 'rgba(0, 242, 254, 0.3)',
      accent: 'var(--accent)',
      icon: <HelpCircle size={24} color="var(--accent)" />,
      badge: 'INSUFFICIENT EVIDENCE',
      badgeBg: 'rgba(0, 242, 254, 0.12)',
    },
  }[feasibility.status] || {
    bg: 'rgba(6, 18, 26, 0.75)',
    border: 'rgba(255, 255, 255, 0.12)',
    accent: '#fff',
    icon: <HelpCircle size={24} color="#fff" />,
    badge: 'ANALYSIS IN PROGRESS',
    badgeBg: 'rgba(255, 255, 255, 0.08)',
  };

  return (
    <section
      className="product-card"
      style={{
        background: statusConfig.bg,
        border: `1px solid ${statusConfig.border}`,
        borderRadius: 'var(--radius-md)',
        padding: '26px 30px',
        marginBottom: 30,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flex: '1 1 500px' }}>
          <div style={{ marginTop: 2 }}>{statusConfig.icon}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'var(--font-label)',
                  fontSize: '0.72rem',
                  letterSpacing: '0.12em',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: statusConfig.accent,
                  background: statusConfig.badgeBg,
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: `1px solid ${statusConfig.border}`,
                }}
              >
                {statusConfig.badge}
              </span>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  letterSpacing: '-0.01em',
                  color: '#fff',
                  margin: 0,
                }}
              >
                {feasibility.headline}
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0, maxWidth: 720 }}>
              {feasibility.explanation}
            </p>
          </div>
        </div>

        {/* Realistic Ceiling & Target Gap stats */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              background: 'rgba(6, 18, 26, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: '12px 20px',
              textAlign: 'right',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-label)',
                fontSize: '0.68rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: 2,
              }}
            >
              Realistic Ceiling
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
              {formatINR(feasibility.realisticCeilingMin)} – {formatINR(feasibility.realisticCeilingMax)}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}> /day</span>
            </span>
          </div>

          {gapAnalysis.gap > 0 && (
            <div
              style={{
                background: 'rgba(28, 20, 8, 0.7)',
                border: '1px solid rgba(255, 170, 0, 0.3)',
                borderRadius: 12,
                padding: '12px 20px',
                textAlign: 'right',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-label)',
                  fontSize: '0.68rem',
                  color: '#FFAA00',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: 2,
                }}
              >
                Target Shortfall
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: '#FFAA00' }}>
                −{formatINR(gapAnalysis.gap)}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}> /day</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* User-Specific Target Gap Scenarios (Phase 8 & 17) */}
      {gapAnalysis.gap > 0 && gapAnalysis.options && gapAnalysis.options.length > 0 && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={14} color="#FFAA00" />
              Find My Path: Scenarios Ranked By User-Specific Realism
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Deterministic ranking based on your current hours, skills, and capital
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 12 }}>
            {gapAnalysis.options.map((opt) => {
              const score = opt.realismScore ?? 75;
              const badgeColor = score >= 80 ? '#00F2FE' : score >= 60 ? '#FFAA00' : '#FF3366';
              return (
                <div
                  key={opt.id}
                  style={{
                    background: 'rgba(6, 18, 26, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-label)', letterSpacing: '0.08em' }}>
                          Rank #{opt.rank} · {opt.type.replace('_', ' ')}
                        </span>
                        {opt.provenanceLabel && (
                          <span
                            style={{
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              color:
                                opt.evidenceType === 'DETERMINISTIC'
                                  ? 'var(--accent)'
                                  : opt.evidenceType === 'USER_INFERENCE'
                                  ? '#818CF8'
                                  : opt.evidenceType === 'MODELLED'
                                  ? '#72F6FF'
                                  : '#FFAA00',
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              padding: '1px 6px',
                              borderRadius: 4,
                              fontFamily: 'var(--font-label)',
                            }}
                          >
                            {opt.provenanceLabel}
                          </span>
                        )}
                      </div>
                      <h4 style={{ margin: '3px 0 0', fontSize: '0.92rem', color: '#fff', fontWeight: 600 }}>
                        {opt.title}
                      </h4>
                    </div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: badgeColor,
                        background: 'rgba(255,255,255,0.04)',
                        padding: '2px 8px',
                        borderRadius: 6,
                        border: `1px solid ${badgeColor}40`,
                        whiteSpace: 'nowrap',
                        fontFamily: 'var(--font-label)',
                      }}
                    >
                      {score}/100 Realism
                    </span>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {opt.explanation || opt.impactDescription}
                  </p>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <div>Impact: <strong style={{ color: 'var(--accent)' }}>+₹{opt.expectedIncomeImpact ?? opt.estimatedExtraDaily}/day</strong></div>
                    <div>Hours: <strong style={{ color: '#fff' }}>+{opt.requiredAdditionalHours ?? 0}h</strong></div>
                    <div>Compatibility: <strong style={{ color: '#72F6FF' }}>{opt.scheduleCompatibility ?? 'HIGH'}</strong></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Required Changes / Actionable Levers */}
      {feasibility.requiredChanges && feasibility.requiredChanges.length > 0 && (
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <TrendingUp size={14} color={statusConfig.accent} />
            {isFeasible ? 'Recommended Execution Focus' : 'Key Operational Adjustments'}
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
            {feasibility.requiredChanges.map((req, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(6, 18, 26, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <ArrowRight size={14} color={statusConfig.accent} style={{ flexShrink: 0 }} />
                <span>{req}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
