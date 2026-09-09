import { useState, useRef, useCallback } from 'react';
import {
  Heart,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Calendar,
  Sliders,
  CheckSquare,
  HelpCircle,
} from 'lucide-react';
import type { EvaluatedOpportunity } from '../../types/decision.types';
import { formatINR } from '../../utils/formatCurrency';
import { useDecisionStore } from '../../store/decisionStore';
import { JudgeAttackModal } from './JudgeAttackModal';

function formatStatusLabel(status: string): string {
  switch (status) {
    case 'VERIFIED':
      return 'Verified';
    case 'PARTIALLY_VERIFIED':
      return 'Partially verified';
    case 'DYNAMIC':
      return 'Dynamic rate';
    case 'ESTIMATED':
      return 'Estimated from model';
    case 'EXPIRED':
      return 'Expired';
    case 'UNVERIFIED':
    default:
      return 'Unverified';
  }
}

interface RecommendationCardProps {
  item: EvaluatedOpportunity;
  onSave?: (slug: string) => void;
  onDismiss?: (slug: string) => void;
  index?: number;
}

export function RecommendationCard({ item, onSave, onDismiss, index = 0 }: RecommendationCardProps) {
  const [showMath, setShowMath] = useState(false);
  const [showScoreDetails, setShowScoreDetails] = useState(false);
  const [showFieldDetails, setShowFieldDetails] = useState(false);
  const [showJudgeAttack, setShowJudgeAttack] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return { bg: 'rgba(0, 242, 254, 0.12)', color: 'var(--accent)', border: 'rgba(0, 242, 254, 0.3)' };
      case 'PARTIALLY_VERIFIED':
        return { bg: 'rgba(255, 170, 0, 0.12)', color: '#FFAA00', border: 'rgba(255, 170, 0, 0.3)' };
      case 'DYNAMIC':
        return { bg: 'rgba(114, 246, 255, 0.12)', color: '#72F6FF', border: 'rgba(114, 246, 255, 0.3)' };
      case 'ESTIMATED':
        return { bg: 'rgba(129, 140, 248, 0.12)', color: '#818CF8', border: 'rgba(129, 140, 248, 0.3)' };
      case 'EXPIRED':
        return { bg: 'rgba(255, 100, 50, 0.12)', color: '#FF6432', border: 'rgba(255, 100, 50, 0.3)' };
      case 'UNVERIFIED':
      default:
        return { bg: 'rgba(255, 77, 106, 0.12)', color: 'var(--danger)', border: 'rgba(255, 77, 106, 0.3)' };
    }
  };

  const { setActivePlan, setSimulatorOpp, setOutcomeOpp, setTrustCenterOpen } = useDecisionStore();

  const opp = item.opportunity;
  const fin = item.financials;
  const score = item.scoring;
  const conf = item.confidence;

  // RUNTIME CONSISTENCY ASSERTIONS
  // Displayed score and rank must strictly equal backend evaluated numbers
  const displayedScore = item.score ?? score.totalScore;
  const displayedRank = item.rank ?? (index + 1);

  if (import.meta.env.DEV) {
    if (displayedScore !== score.totalScore) {
      console.error(
        `[Consistency Assertion Failed] displayedScore (${displayedScore}) !== backend score (${score.totalScore}) for ${opp.slug}`
      );
    }
    if (item.rank !== undefined && displayedRank !== item.rank) {
      console.error(
        `[Consistency Assertion Failed] displayedRank (${displayedRank}) !== backend rank (${item.rank}) for ${opp.slug}`
      );
    }
  }

  const handleMouseEnter = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'translateY(-2px)';
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'translateY(0)';
  }, []);

  const handleSave = () => {
    setIsSaved(!isSaved);
    if (onSave) onSave(opp.slug);
  };

  return (
    <article
      ref={cardRef}
      className="product-card"
      style={{
        border: displayedRank === 1 ? '1px solid var(--accent)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        padding: '24px 26px',
        transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* HEADER: Rank / Best Match, Verified Badge, Platform, Opportunity Score */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {displayedRank === 1 ? (
            <span
              style={{
                fontFamily: 'var(--font-label)',
                fontSize: '0.68rem',
                letterSpacing: '0.12em',
                fontWeight: 800,
                background: 'rgba(0, 242, 254, 0.14)',
                color: 'var(--accent)',
                border: '1px solid rgba(0, 242, 254, 0.4)',
                padding: '3px 10px',
                borderRadius: 6,
                textTransform: 'uppercase',
              }}
            >
              ★ BEST MATCH
            </span>
          ) : (
            <span
              style={{
                fontFamily: 'var(--font-label)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}
            >
              #{displayedRank}
            </span>
          )}

          <span
            style={{
              fontFamily: 'var(--font-label)',
              fontSize: '0.7rem',
              letterSpacing: '0.06em',
              background: getStatusBadgeStyle(opp.verificationStatus).bg,
              border: `1px solid ${getStatusBadgeStyle(opp.verificationStatus).border}`,
              color: getStatusBadgeStyle(opp.verificationStatus).color,
              borderRadius: 6,
              padding: '3px 9px',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={13} />
            {formatStatusLabel(opp.verificationStatus)}
          </span>

          <span
            style={{
              fontFamily: 'var(--font-label)',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 6,
              padding: '3px 9px',
            }}
          >
            {opp.platform}
          </span>
        </div>

        {/* Opportunity Score Pill */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowScoreDetails(!showScoreDetails)}
            style={{
              background: displayedScore >= 80 ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 170, 0, 0.12)',
              border: `1px solid ${displayedScore >= 80 ? 'rgba(0, 242, 254, 0.4)' : 'rgba(255, 170, 0, 0.4)'}`,
              borderRadius: 20,
              padding: '4px 12px',
              color: displayedScore >= 80 ? 'var(--accent)' : '#FFAA00',
              fontFamily: 'var(--font-label)',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            title="Click to view scoring breakdown"
          >
            {displayedScore}/100 Match
            <HelpCircle size={13} />
          </button>

          {/* Score breakdown tooltip */}
          {showScoreDetails && (
            <div
              className="obsidian-card"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 260,
                borderRadius: 12,
                padding: 14,
                zIndex: 40,
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ fontWeight: 700, color: '#fff', marginBottom: 8, fontFamily: 'var(--font-label)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Scoring Breakdown:
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Skill Match:</span> <b style={{ color: '#fff' }}>{score.skillFit}/100</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Location Fit:</span> <b style={{ color: '#fff' }}>{score.locationFit}/100</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Time Fit:</span> <b style={{ color: '#fff' }}>{score.timeFit}/100</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Target Alignment:</span> <b style={{ color: '#fff' }}>{score.targetFit}/100</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Platform Reliability:</span> <b style={{ color: '#fff' }}>{score.reliability}/100</b>
              </div>
              {score.complexityPenalty > 0 && (
                <div style={{ color: 'var(--danger)', marginTop: 6, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  Vehicle / Asset Penalty: −{score.complexityPenalty}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* EARNINGS HERO: NET DAILY EARNINGS & RANGE */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.3rem',
              fontWeight: 800,
              color: 'var(--accent)',
              textShadow: '0 0 25px rgba(0, 242, 254, 0.3)',
              letterSpacing: '-0.02em',
            }}
          >
            {formatINR(fin.netDaily)}
          </span>
          <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.85rem', color: '#fff', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            NET ESTIMATE / DAY
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            (Gross: {formatINR(fin.grossDaily)})
          </span>
        </div>

        {/* Range & Confidence */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Range: <b style={{ color: '#fff' }}>{formatINR(fin.rangeLow)} – {formatINR(fin.rangeHigh)}</b>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'var(--font-label)',
                fontSize: '0.72rem',
                color: conf.confidencePercent >= 80 ? 'var(--accent)' : '#FFAA00',
                background: 'rgba(255,255,255,0.04)',
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid rgba(255,255,255,0.08)',
                fontWeight: 600,
              }}
              title="Evidence-based heuristic score. Not a probability of earnings."
            >
              Confidence: {conf.confidencePercent}/100
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              (Heuristic calibration)
            </span>
          </div>
        </div>
      </div>

      {/* TITLE & DESCRIPTION */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 6px' }}>
          {opp.opportunityName}
        </h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
          {opp.description}
        </p>
      </div>

      {/* WHY RECOMMENDED (DERIVED FROM DETERMINISTIC PAYLOAD) */}
      {(item.whyRecommended || score.primaryReason) && (
        <div
          style={{
            background: 'rgba(0, 242, 254, 0.04)',
            borderLeft: '3px solid var(--accent)',
            padding: '10px 14px',
            borderRadius: '0 8px 8px 0',
            fontSize: '0.84rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: '#fff' }}>Why this fits:</strong>{' '}
          <span>{item.whyRecommended || score.primaryReason}</span>
        </div>
      )}

      {/* EXPLAIN THIS NUMBER (PROGRESSIVE DISCLOSURE) */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
          <button
            onClick={() => setShowMath(!showMath)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.8rem',
              color: 'var(--accent)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontFamily: 'var(--font-label)',
              fontWeight: 600,
            }}
          >
            <span>See the math</span>
            {showMath ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              padding: '1px 6px',
              borderRadius: 4,
              background: 'rgba(0,229,255,0.08)',
              color: '#00E5FF',
              border: '1px solid rgba(0,229,255,0.25)',
              fontFamily: 'var(--font-label)',
            }}
          >
            {formatStatusLabel(fin.calculationStatus || 'MODELLED')}
          </span>
        </div>

        {showMath && (
          <div
            style={{
              marginTop: 12,
              background: 'rgba(6, 18, 26, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '14px 16px',
              borderRadius: 12,
              fontSize: '0.82rem',
            }}
          >
            <div style={{ fontFamily: 'var(--font-label)', color: 'var(--accent)', marginBottom: 8, fontWeight: 700, letterSpacing: '0.04em' }}>
              {fin.formulaExplanation}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.6 }}>
              {fin.assumptions.map((asm, idx) => (
                <div key={idx} style={{ marginBottom: 2 }}>• {asm}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FIELD-LEVEL VERIFICATION (PROGRESSIVE DISCLOSURE) */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-label)', color: 'var(--text-muted)' }}>
            Source Evidence
          </span>
          <button
            onClick={() => setShowFieldDetails(!showFieldDetails)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'var(--font-label)',
              padding: 0,
              fontWeight: 600,
            }}
          >
            {showFieldDetails ? 'Hide evidence' : 'View evidence'}
            {showFieldDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Row of Field Status Chips with Friendly Labels */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {/* Commission / Platform Fee */}
          {(() => {
            const f = opp.verifiedFields?.platformFeePercent;
            const status = f?.status || (opp.platformFeePercent > 0 ? 'PARTIALLY_VERIFIED' : 'VERIFIED');
            const style = getStatusBadgeStyle(status);
            return (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-label)',
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: style.bg,
                  color: style.color,
                  border: `1px solid ${style.border}`,
                }}
                title={f?.notes || 'Commission deduction'}
              >
                Fee: <b>{f?.value !== null && f?.value !== undefined ? `${f.value}%` : `${opp.platformFeePercent}%`}</b> ({formatStatusLabel(status)})
              </span>
            );
          })()}

          {/* Base Payout */}
          {(() => {
            const f = opp.verifiedFields?.basePayoutMin;
            const status = f?.status || 'DYNAMIC';
            const style = getStatusBadgeStyle(status);
            return (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-label)',
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: style.bg,
                  color: style.color,
                  border: `1px solid ${style.border}`,
                }}
                title={f?.notes || 'Base payout per order/session'}
              >
                Payout: <b>{status === 'DYNAMIC' ? 'Dynamic' : `${formatINR(opp.estimatedPayoutMin)}/unit`}</b> ({formatStatusLabel(status)})
              </span>
            );
          })()}

          {/* Startup Capital */}
          {(() => {
            const f = opp.verifiedFields?.startupCostMin;
            const status = f?.status || 'VERIFIED';
            const style = getStatusBadgeStyle(status);
            return (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-label)',
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: style.bg,
                  color: style.color,
                  border: `1px solid ${style.border}`,
                }}
                title={f?.notes || 'Startup onboarding fee'}
              >
                Startup: <b>{opp.startupCostMin === 0 ? '₹0' : formatINR(opp.startupCostMin)}</b> ({formatStatusLabel(status)})
              </span>
            );
          })()}

          {/* Recurring Costs */}
          {(() => {
            const f = opp.verifiedFields?.recurringCostMonthly;
            const status = f?.status || 'ESTIMATED';
            const style = getStatusBadgeStyle(status);
            return (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-label)',
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: style.bg,
                  color: style.color,
                  border: `1px solid ${style.border}`,
                }}
                title={f?.notes || 'Recurring monthly operating cost'}
              >
                Recurring: <b>{!opp.recurringCostMonthly ? '₹0' : `${formatINR(opp.recurringCostMonthly)}/mo`}</b> ({formatStatusLabel(status)})
              </span>
            );
          })()}

          {/* Unit Duration */}
          {(() => {
            const f = opp.verifiedFields?.typicalTimePerUnitMin;
            const status = f?.status || 'ESTIMATED';
            const style = getStatusBadgeStyle(status);
            return (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-label)',
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: style.bg,
                  color: style.color,
                  border: `1px solid ${style.border}`,
                }}
                title={f?.notes || 'Task duration'}
              >
                Cycle: <b>{opp.typicalTimePerUnitMin}m</b> ({formatStatusLabel(status)})
              </span>
            );
          })()}
        </div>

        {/* Detailed Field Audit Breakdown Drawer */}
        {showFieldDetails && (
          <div style={{ marginTop: 10, background: 'rgba(5, 5, 8, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: 12 }}>
            <div style={{ fontSize: '0.75rem', color: '#FFAA00', marginBottom: 8, lineHeight: 1.4 }}>
              ⚠️ <b>Trust Notice:</b> Not all fields in this opportunity are equally verified. Payouts marked <b>DYNAMIC</b> depend on live platform rate cards, while regulatory fees or platform terms are officially verified.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.75rem' }}>
              {/* Field 1: Commission */}
              {opp.verifiedFields?.platformFeePercent && (
                <div style={{ padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 4, borderLeft: `3px solid ${getStatusBadgeStyle(opp.verifiedFields.platformFeePercent.status).color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b style={{ color: '#fff' }}>Platform Fee / Commission:</b>
                    <span style={{ color: getStatusBadgeStyle(opp.verifiedFields.platformFeePercent.status).color, fontWeight: 600 }}>
                      {opp.verifiedFields.platformFeePercent.status} ({opp.verifiedFields.platformFeePercent.confidenceLevel} Confidence)
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
                    Value: {opp.verifiedFields.platformFeePercent.value ?? 0}% • Evidence: {opp.verifiedFields.platformFeePercent.evidenceType.replace('_', ' ')}
                  </div>
                  {opp.verifiedFields.platformFeePercent.notes && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 2 }}>
                      {opp.verifiedFields.platformFeePercent.notes}
                    </div>
                  )}
                  {opp.verifiedFields.platformFeePercent.sourceUrl && (
                    <a href={opp.verifiedFields.platformFeePercent.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '0.7rem', display: 'inline-block', marginTop: 2 }}>
                      🔗 Source: {opp.verifiedFields.platformFeePercent.sourceTitle || opp.verifiedFields.platformFeePercent.sourceUrl}
                    </a>
                  )}
                </div>
              )}

              {/* Field 2: Payout */}
              {opp.verifiedFields?.basePayoutMin && (
                <div style={{ padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 4, borderLeft: `3px solid ${getStatusBadgeStyle(opp.verifiedFields.basePayoutMin.status).color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b style={{ color: '#fff' }}>Base Payout Rate:</b>
                    <span style={{ color: getStatusBadgeStyle(opp.verifiedFields.basePayoutMin.status).color, fontWeight: 600 }}>
                      {opp.verifiedFields.basePayoutMin.status} ({opp.verifiedFields.basePayoutMin.confidenceLevel} Confidence)
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
                    Value: {opp.verifiedFields.basePayoutMin.value ? formatINR(opp.verifiedFields.basePayoutMin.value) : 'Dynamic (In-App Rate Card)'} (Benchmark: {formatINR(opp.estimatedPayoutMin)} – {formatINR(opp.estimatedPayoutMax)}) • Evidence: {opp.verifiedFields.basePayoutMin.evidenceType.replace('_', ' ')}
                  </div>
                  {opp.verifiedFields.basePayoutMin.notes && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 2 }}>
                      {opp.verifiedFields.basePayoutMin.notes}
                    </div>
                  )}
                  {opp.verifiedFields.basePayoutMin.sourceUrl && (
                    <a href={opp.verifiedFields.basePayoutMin.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '0.7rem', display: 'inline-block', marginTop: 2 }}>
                      🔗 Source: {opp.verifiedFields.basePayoutMin.sourceTitle || opp.verifiedFields.basePayoutMin.sourceUrl}
                    </a>
                  )}
                </div>
              )}

              {/* Field 3: Startup Cost */}
              {opp.verifiedFields?.startupCostMin && (
                <div style={{ padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 4, borderLeft: `3px solid ${getStatusBadgeStyle(opp.verifiedFields.startupCostMin.status).color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b style={{ color: '#fff' }}>Startup / Onboarding Capital:</b>
                    <span style={{ color: getStatusBadgeStyle(opp.verifiedFields.startupCostMin.status).color, fontWeight: 600 }}>
                      {opp.verifiedFields.startupCostMin.status} ({opp.verifiedFields.startupCostMin.confidenceLevel} Confidence)
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
                    Value: {formatINR(opp.startupCostMin)} – {formatINR(opp.startupCostMax)} • Evidence: {opp.verifiedFields.startupCostMin.evidenceType.replace('_', ' ')}
                  </div>
                  {opp.verifiedFields.startupCostMin.notes && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 2 }}>
                      {opp.verifiedFields.startupCostMin.notes}
                    </div>
                  )}
                  {opp.verifiedFields.startupCostMin.sourceUrl && (
                    <a href={opp.verifiedFields.startupCostMin.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '0.7rem', display: 'inline-block', marginTop: 2 }}>
                      🔗 Source: {opp.verifiedFields.startupCostMin.sourceTitle || opp.verifiedFields.startupCostMin.sourceUrl}
                    </a>
                  )}
                </div>
              )}

              {/* Field 4: Recurring Operating Expenses */}
              {opp.verifiedFields?.recurringCostMonthly && (
                <div style={{ padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 4, borderLeft: `3px solid ${getStatusBadgeStyle(opp.verifiedFields.recurringCostMonthly.status).color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b style={{ color: '#fff' }}>Recurring Operating Expenses:</b>
                    <span style={{ color: getStatusBadgeStyle(opp.verifiedFields.recurringCostMonthly.status).color, fontWeight: 600 }}>
                      {opp.verifiedFields.recurringCostMonthly.status} ({opp.verifiedFields.recurringCostMonthly.confidenceLevel} Confidence)
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
                    Value: {formatINR(opp.recurringCostMonthly || 0)}/month • Evidence: {opp.verifiedFields.recurringCostMonthly.evidenceType.replace('_', ' ')}
                  </div>
                  {opp.verifiedFields.recurringCostMonthly.notes && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 2 }}>
                      {opp.verifiedFields.recurringCostMonthly.notes}
                    </div>
                  )}
                </div>
              )}

              {/* Field 5: Duration */}
              {opp.verifiedFields?.typicalTimePerUnitMin && (
                <div style={{ padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 4, borderLeft: `3px solid ${getStatusBadgeStyle(opp.verifiedFields.typicalTimePerUnitMin.status).color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b style={{ color: '#fff' }}>Typical Duration per Unit / Order:</b>
                    <span style={{ color: getStatusBadgeStyle(opp.verifiedFields.typicalTimePerUnitMin.status).color, fontWeight: 600 }}>
                      {opp.verifiedFields.typicalTimePerUnitMin.status} ({opp.verifiedFields.typicalTimePerUnitMin.confidenceLevel} Confidence)
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
                    Value: {opp.typicalTimePerUnitMin} minutes • Evidence: {opp.verifiedFields.typicalTimePerUnitMin.evidenceType.replace('_', ' ')}
                  </div>
                  {opp.verifiedFields.typicalTimePerUnitMin.notes && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 2 }}>
                      {opp.verifiedFields.typicalTimePerUnitMin.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* HYPER-LOCAL CITY TIP */}
      {item.cityTip && (
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>📍 Local Market Tip:</span> {item.cityTip}
        </div>
      )}

      {/* ACTION FOOTER */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        {/* Primary Action: Build my 7-day plan */}
        <button
          onClick={() => {
            const plan = {
              opportunitySlug: opp.slug,
              opportunityName: opp.opportunityName,
              platform: opp.platform,
              targetDailyEarn: `₹${fin.netDaily}/day`,
              days: [
                { dayNumber: 1, title: 'Day 1', focus: 'Setup & Compliance', actionItems: [`Download ${opp.platform} app`, 'Submit KYC documents', 'Review payout schedule'], estimatedMinutes: 60, completed: false },
                { dayNumber: 2, title: 'Day 2', focus: 'Asset Readiness', actionItems: ['Verify phone/vehicle/materials', 'Complete onboarding quiz'], estimatedMinutes: 45, completed: false },
                { dayNumber: 3, title: 'Day 3', focus: 'First Live Task', actionItems: ['Book first slot / first trial student', 'Execute first unit'], estimatedMinutes: 90, completed: false },
                { dayNumber: 4, title: 'Day 4', focus: 'Target Shift', actionItems: ['Complete full scheduled hours', 'Verify gross wallet balance'], estimatedMinutes: 180, completed: false },
                { dayNumber: 5, title: 'Day 5', focus: 'Feedback & Fuel Audit', actionItems: ['Ask for customer review', 'Record fuel/material expense'], estimatedMinutes: 30, completed: false },
                { dayNumber: 6, title: 'Day 6', focus: 'Peak Hours Scaling', actionItems: ['Operate during local peak rush', 'Aim for daily net goal'], estimatedMinutes: 180, completed: false },
                { dayNumber: 7, title: 'Day 7', focus: 'Weekly Net Review', actionItems: ['Audit Week 1 net income', 'Commit schedule for Week 2'], estimatedMinutes: 30, completed: false },
              ],
            };
            setActivePlan(plan);
          }}
          className="btn-primary"
          style={{
            flex: '1 1 150px',
            padding: '9px 14px',
            fontSize: '0.82rem',
            minHeight: 38,
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <Calendar size={14} /> 7-Day Plan
        </button>

        {/* Start on platform */}
        <a
          href={opp.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: '1 1 100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '9px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-label)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: '#fff',
            fontWeight: 500,
            textDecoration: 'none',
            minHeight: 38,
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          Start Now <ExternalLink size={13} />
        </a>

        {/* Simulate */}
        <button
          onClick={() => setSimulatorOpp(item)}
          style={{
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            minHeight: 38,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title="Open interactive income simulator"
        >
          <Sliders size={14} />
        </button>

        {/* Record Outcome */}
        <button
          onClick={() => setOutcomeOpp(item)}
          style={{
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            minHeight: 38,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title="Report actual earnings"
        >
          <CheckSquare size={14} />
        </button>

        {/* Judge Attack Mode */}
        <button
          onClick={() => setShowJudgeAttack(true)}
          style={{
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-label)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--accent)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 600,
            minHeight: 38,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          title="Judge Attack Mode: Inspect math tree, 8-factor score weights, and evidence citations"
        >
          <ShieldCheck size={13} /> Audit Trace
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          style={{
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            background: isSaved ? 'rgba(0, 180, 216, 0.12)' : 'var(--bg-surface)',
            border: `1px solid ${isSaved ? 'var(--accent)' : 'var(--border)'}`,
            color: isSaved ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 38,
            transition: 'all 0.2s',
          }}
          title="Save opportunity"
        >
          <Heart size={14} fill={isSaved ? 'var(--accent)' : 'none'} />
        </button>
      </div>

      {showJudgeAttack && (
        <JudgeAttackModal
          item={item}
          rank={displayedRank}
          onClose={() => setShowJudgeAttack(false)}
        />
      )}
    </article>
  );
}
