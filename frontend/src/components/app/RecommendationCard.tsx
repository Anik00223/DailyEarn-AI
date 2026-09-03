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
        return { bg: 'rgba(0, 255, 136, 0.1)', color: '#00FF88', border: 'rgba(0, 255, 136, 0.3)' };
      case 'PARTIALLY_VERIFIED':
        return { bg: 'rgba(255, 170, 0, 0.1)', color: '#FFAA00', border: 'rgba(255, 170, 0, 0.3)' };
      case 'DYNAMIC':
        return { bg: 'rgba(0, 229, 255, 0.1)', color: '#00E5FF', border: 'rgba(0, 229, 255, 0.3)' };
      case 'ESTIMATED':
        return { bg: 'rgba(129, 140, 248, 0.1)', color: '#818CF8', border: 'rgba(129, 140, 248, 0.3)' };
      case 'EXPIRED':
        return { bg: 'rgba(255, 100, 50, 0.1)', color: '#FF6432', border: 'rgba(255, 100, 50, 0.3)' };
      case 'UNVERIFIED':
      default:
        return { bg: 'rgba(255, 51, 102, 0.1)', color: '#FF3366', border: 'rgba(255, 51, 102, 0.3)' };
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

  // 3D tilt on mousemove
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rotateY = ((e.clientX - centerX) / rect.width) * 3;
    const rotateX = ((centerY - e.clientY) / rect.height) * 4;
    cardRef.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
  }, []);

  const handleSave = () => {
    setIsSaved(!isSaved);
    if (onSave) onSave(opp.slug);
  };

  return (
    <article
      ref={cardRef}
      style={{
        background: 'rgba(13, 13, 20, 0.85)',
        border: displayedRank === 1 ? '1px solid rgba(0, 255, 136, 0.4)' : '1px solid var(--accent-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: displayedRank === 1 ? '0 0 24px rgba(0, 255, 136, 0.08)' : 'var(--glow-card)',
        backdropFilter: 'blur(16px)',
        padding: 24,
        transition: 'border-color 0.3s, box-shadow 0.3s',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => {
        if (cardRef.current) cardRef.current.style.borderColor = 'var(--accent-border-h)';
      }}
    >
      {/* HEADER: Rank / Best Match, Verified Badge, Platform, Opportunity Score */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {displayedRank === 1 ? (
            <span
              style={{
                fontFamily: 'var(--font-label)',
                fontSize: '0.68rem',
                letterSpacing: '0.08em',
                fontWeight: 700,
                background: 'rgba(0, 255, 136, 0.15)',
                color: '#00FF88',
                border: '1px solid rgba(0, 255, 136, 0.35)',
                padding: '3px 8px',
                borderRadius: 4,
              }}
            >
              BEST MATCH
            </span>
          ) : (
            <span
              style={{
                fontFamily: 'var(--font-label)',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              #{displayedRank}
            </span>
          )}

          <span
            style={{
              fontFamily: 'var(--font-label)',
              fontSize: '0.7rem',
              letterSpacing: '0.04em',
              background: getStatusBadgeStyle(opp.verificationStatus).bg,
              border: `1px solid ${getStatusBadgeStyle(opp.verificationStatus).border}`,
              color: getStatusBadgeStyle(opp.verificationStatus).color,
              borderRadius: 4,
              padding: '3px 8px',
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
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 4,
              padding: '3px 8px',
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
              background: displayedScore >= 80 ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 170, 0, 0.15)',
              border: `1px solid ${displayedScore >= 80 ? 'rgba(0, 255, 136, 0.4)' : 'rgba(255, 170, 0, 0.4)'}`,
              borderRadius: 20,
              padding: '4px 12px',
              color: displayedScore >= 80 ? '#00FF88' : '#FFAA00',
              fontFamily: 'var(--font-display)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            title="Click to view scoring breakdown"
          >
            Score {displayedScore}/100
            <HelpCircle size={13} />
          </button>

          {/* Score breakdown tooltip */}
          {showScoreDetails && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 250,
                background: 'rgba(10, 10, 15, 0.95)',
                border: '1px solid var(--accent-border-h)',
                borderRadius: 8,
                padding: 12,
                boxShadow: 'var(--glow-card)',
                zIndex: 40,
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ fontWeight: 700, color: '#fff', marginBottom: 6 }}>Scoring Breakdown:</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span>Skill Match:</span> <b>{score.skillFit}/100</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span>Location Fit:</span> <b>{score.locationFit}/100</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span>Time Fit:</span> <b>{score.timeFit}/100</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span>Target Alignment:</span> <b>{score.targetFit}/100</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span>Platform Reliability:</span> <b>{score.reliability}/100</b>
              </div>
              {score.complexityPenalty > 0 && (
                <div style={{ color: 'var(--danger)', marginTop: 4 }}>
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
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.1rem', fontWeight: 700, color: 'var(--accent)' }}>
            {formatINR(fin.netDaily)}
          </span>
          <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
            Estimated NET / day
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
                fontSize: '0.74rem',
                color: conf.confidencePercent >= 80 ? '#00FF88' : '#FFAA00',
                background: 'rgba(255,255,255,0.04)',
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid rgba(255,255,255,0.08)',
                fontWeight: 600,
              }}
              title="Evidence-based heuristic score. Not a probability of earnings."
            >
              Recommendation Confidence: {conf.confidencePercent}/100
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              (Heuristic score · Not guaranteed earnings)
            </span>
          </div>
        </div>
      </div>

      {/* TITLE & DESCRIPTION */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
          {opp.opportunityName}
        </h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
          {opp.description}
        </p>
      </div>

      {/* WHY RECOMMENDED (DERIVED FROM DETERMINISTIC PAYLOAD) */}
      {(item.whyRecommended || score.primaryReason) && (
        <div
          style={{
            background: 'rgba(0, 255, 136, 0.04)',
            borderLeft: '3px solid var(--accent)',
            padding: '8px 12px',
            borderRadius: '0 6px 6px 0',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
          }}
        >
          <strong style={{ color: '#fff' }}>Why this ranked #{displayedRank} ({displayedScore}/100):</strong>{' '}
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
          <div style={{ marginTop: 10, background: 'rgba(5, 5, 8, 0.7)', border: '1px solid var(--accent-border)', padding: 12, borderRadius: 6, fontSize: '0.8rem' }}>
            <div style={{ fontFamily: 'var(--font-label)', color: '#00FF88', marginBottom: 6, fontWeight: 600 }}>
              {fin.formulaExplanation}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.5 }}>
              {fin.assumptions.map((asm, idx) => (
                <div key={idx}>• {asm}</div>
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
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto', paddingTop: 10 }}>
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
          style={{
            flex: '1 1 160px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.84rem',
            fontFamily: 'var(--font-display)',
            background: 'var(--accent)',
            color: '#000',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            minHeight: 40,
          }}
        >
          <Calendar size={14} /> Build my 7-day plan
        </button>

        {/* Start on platform */}
        <a
          href={opp.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: '1 1 110px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-display)',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--accent-border)',
            color: '#fff',
            fontWeight: 600,
            textDecoration: 'none',
            minHeight: 40,
          }}
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
            background: 'transparent',
            border: '1px solid var(--accent-border)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
          title="Open interactive income simulator"
        >
          <Sliders size={13} />
        </button>

        {/* Record Outcome */}
        <button
          onClick={() => setOutcomeOpp(item)}
          style={{
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            background: 'transparent',
            border: '1px solid var(--accent-border)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
          title="Report actual earnings"
        >
          <CheckSquare size={13} />
        </button>

        {/* Judge Attack Mode */}
        <button
          onClick={() => setShowJudgeAttack(true)}
          style={{
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            background: 'rgba(0, 229, 255, 0.08)',
            border: '1px solid rgba(0, 229, 255, 0.35)',
            color: '#00E5FF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontWeight: 600,
          }}
          title="Judge Attack Mode: Inspect math tree, 8-factor score weights, and evidence citations"
        >
          <ShieldCheck size={13} /> Judge Trace
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          style={{
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            background: isSaved ? 'rgba(0,255,136,0.1)' : 'transparent',
            border: `1px solid ${isSaved ? 'var(--accent)' : 'var(--accent-border)'}`,
            color: isSaved ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer',
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
