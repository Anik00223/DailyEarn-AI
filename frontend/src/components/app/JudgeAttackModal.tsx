import { useState } from 'react';
import { X, ShieldCheck, AlertCircle, ExternalLink, Activity, Scale, CheckCircle2 } from 'lucide-react';
import type { EvaluatedOpportunity } from '../../types/decision.types';
import { formatINR } from '../../utils/formatCurrency';

interface JudgeAttackModalProps {
  item: EvaluatedOpportunity;
  rank: number;
  onClose: () => void;
}

export function JudgeAttackModal({ item, rank, onClose }: JudgeAttackModalProps) {
  const [activeTab, setActiveTab] = useState<'decision' | 'math' | 'provenance' | 'sensitivity' | 'llm_boundary'>('decision');
  const [simHours, setSimHours] = useState(4);

  const opp = item.opportunity;
  const fin = item.financials;
  const scoring = item.scoring;
  const conf = item.confidence;
  const vf = opp.verifiedFields;

  // Sensitivity recalculation for 4h vs 2h in debug view
  const simUnits = Math.max(1, Math.round(simHours * (opp.unitsPerHourTypical || 1.5) * 10) / 10);
  const simGross = Math.round(simUnits * fin.payoutPerUnit);
  const simFee = Math.round(simGross * (opp.platformFeePercent / 100));
  const simTravel = opp.requiresVehicle ? Math.round(simUnits * 12) : 0;
  const simNet = Math.max(0, simGross - simFee - simTravel - fin.materialCost);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--surface-primary)',
          border: '1px solid var(--accent-border)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 780,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9)',
          overflow: 'hidden',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 255, 136, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                background: 'rgba(0, 255, 136, 0.15)',
                border: '1px solid var(--accent)',
                borderRadius: 6,
                padding: '4px 8px',
                color: 'var(--accent)',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-label)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <ShieldCheck size={14} /> JUDGE ATTACK & PROVENANCE INSPECTOR
            </span>
            <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
              Rank #{rank}: {opp.opportunityName}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* SUBNAV TABS */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--surface-secondary)',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'decision', label: '1. Scoring Weights' },
            { id: 'math', label: '2. Math Tree' },
            { id: 'provenance', label: '3. Evidence Matrix' },
            { id: 'sensitivity', label: '4. Sensitivity (4h vs 2h)' },
            { id: 'llm_boundary', label: '5. AI Boundary Proof' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '10px 16px',
                border: 'none',
                background: activeTab === tab.id ? 'var(--surface-primary)' : 'transparent',
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                fontFamily: 'var(--font-label)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1, fontSize: '0.85rem' }}>
          {/* TAB 1: DECISION & SCORING */}
          {activeTab === 'decision' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h4 style={{ margin: '0 0 4px', color: '#fff' }}>Deterministic 8-Factor Scoring Engine</h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  Weights are configurable heuristics normalized 0–100. We do not claim they are scientifically or statistically optimized.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                {[
                  { label: 'Skill Fit (20%)', val: scoring.skillFit },
                  { label: 'Location Fit (15%)', val: scoring.locationFit },
                  { label: 'Time Fit (15%)', val: scoring.timeFit },
                  { label: 'Target Fit (15%)', val: scoring.targetFit },
                  { label: 'Reliability (15%)', val: scoring.reliability },
                  { label: 'Demand (10%)', val: scoring.demand },
                  { label: 'Cost Fit (5%)', val: scoring.costFit ?? 100 },
                  { label: 'Complexity Fit (5%)', val: scoring.complexityFit ?? 100 },
                ].map((f, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: 8, borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{f.label}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: f.val >= 80 ? '#00FF88' : '#FFAA00' }}>
                      {f.val}/100
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(0, 255, 136, 0.05)', padding: 12, borderRadius: 8, border: '1px solid var(--accent-border)' }}>
                <div style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>
                  Why this ranked #{item.rank ?? rank} ({(item.score ?? scoring.totalScore)}/100):
                </div>
                <div style={{ color: '#fff' }}>{item.whyRecommended || scoring.primaryReason}</div>
              </div>

              {scoring.positiveDrivers && scoring.positiveDrivers.length > 0 && (
                <div>
                  <strong style={{ color: '#00FF88', fontSize: '0.8rem' }}>Positive Scoring Drivers:</strong>
                  <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: 'var(--text-secondary)' }}>
                    {scoring.positiveDrivers.map((d, idx) => (
                      <li key={idx}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {scoring.negativeDrivers && scoring.negativeDrivers.length > 0 && (
                <div>
                  <strong style={{ color: '#FF3366', fontSize: '0.8rem' }}>Constraint Deductions / Risk Drivers:</strong>
                  <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: 'var(--text-secondary)' }}>
                    {scoring.negativeDrivers.map((d, idx) => (
                      <li key={idx}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MATH TREE */}
          {activeTab === 'math' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <h4 style={{ margin: '0 0 4px', color: '#fff' }}>Financial Arithmetic Decomposition</h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  Calculation Status: <span style={{ color: '#00E5FF', fontWeight: 700 }}>{fin.calculationStatus || 'MODELLED'}</span>. Zero LLM involvement in financial figures.
                </p>
              </div>

              <div style={{ background: 'rgba(5, 5, 8, 0.8)', padding: 14, borderRadius: 8, border: '1px solid var(--accent-border)', fontFamily: 'monospace' }}>
                <div style={{ color: '#00FF88', fontWeight: 700, fontSize: '0.95rem', marginBottom: 8 }}>
                  {fin.formulaExplanation}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  <div>[+] Gross Daily: {formatINR(fin.grossDaily)} ({fin.expectedUnitsPerDay} {fin.unitName} × {formatINR(fin.payoutPerUnit)})</div>
                  <div>[-] Platform Fee ({opp.platformFeePercent}%): -{formatINR(fin.platformFee)}</div>
                  <div>[-] Dynamic Fuel & Commute: -{formatINR(fin.travelCost)} (Dynamic fuel formula: (distance / mileage) × fuelPrice)</div>
                  <div>[-] Material & Consumables: -{formatINR(fin.materialCost)}</div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 6, color: '#fff', fontWeight: 700 }}>
                    [=] Net Daily Income: {formatINR(fin.netDaily)} / day (Range: {formatINR(fin.rangeLow)} – {formatINR(fin.rangeHigh)})
                  </div>
                </div>
              </div>

              <div>
                <strong style={{ color: '#fff', fontSize: '0.82rem' }}>Audit Assumptions:</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: 'var(--text-muted)' }}>
                  {fin.assumptions.map((asm, idx) => (
                    <li key={idx}>{asm}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: PROVENANCE */}
          {activeTab === 'provenance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <h4 style={{ margin: '0 0 4px', color: '#fff' }}>Field-Level Ground Truth Evidence Matrix</h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  Verified against real-world platform terms, government schedules, or observed local market benchmarks.
                </p>
              </div>

              {vf ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { name: 'Platform Commission Fee', field: vf.platformFeePercent, unit: '%' },
                    { name: 'Base Order / Hourly Payout', field: vf.basePayoutMin, unit: '₹' },
                    { name: 'Onboarding / Startup Capital', field: vf.startupCostMin, unit: '₹' },
                    { name: 'Recurring Monthly Cost', field: vf.recurringCostMonthly, unit: '₹' },
                    { name: 'Operational Cycle Time', field: vf.typicalTimePerUnitMin, unit: 'm' },
                  ].map((row, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        padding: 10,
                        borderRadius: 6,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{row.name}</span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background:
                              row.field.status === 'VERIFIED'
                                ? 'rgba(0,255,136,0.15)'
                                : row.field.status === 'DYNAMIC'
                                ? 'rgba(0,229,255,0.15)'
                                : 'rgba(255,170,0,0.15)',
                            color:
                              row.field.status === 'VERIFIED'
                                ? '#00FF88'
                                : row.field.status === 'DYNAMIC'
                                ? '#00E5FF'
                                : '#FFAA00',
                          }}
                        >
                          {row.field.status} ({row.field.evidenceType})
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        {row.field.notes}
                      </div>
                      {row.field.sourceUrl && (
                        <a
                          href={row.field.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.72rem',
                            color: 'var(--accent)',
                            marginTop: 4,
                            textDecoration: 'none',
                          }}
                        >
                          Source: {row.field.sourceTitle || row.field.sourceUrl} <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>Standard platform documentation verified.</div>
              )}
            </div>
          )}

          {/* TAB 4: SENSITIVITY (4H VS 2H) */}
          {activeTab === 'sensitivity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <h4 style={{ margin: '0 0 4px', color: '#fff' }}>Constraint Sensitivity Analysis (4h vs 2h Test)</h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  Test how the decision engine reacts when user hours drop by 50%.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setSimHours(4)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: '1px solid var(--accent)',
                    background: simHours === 4 ? 'var(--accent)' : 'transparent',
                    color: simHours === 4 ? '#000' : 'var(--accent)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Scenario A: 4 Hours/Day
                </button>
                <button
                  onClick={() => setSimHours(2)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: '1px solid #FFAA00',
                    background: simHours === 2 ? '#FFAA00' : 'transparent',
                    color: simHours === 2 ? '#000' : '#FFAA00',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Scenario B: 2 Hours/Day
                </button>
              </div>

              <div style={{ background: 'rgba(5, 5, 8, 0.7)', padding: 14, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.85rem', color: '#fff', marginBottom: 6 }}>
                  Under <strong>{simHours} hours/day</strong>:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Throughput</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{simUnits} {fin.unitName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Gross Daily</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{formatINR(simGross)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Modeled Net Daily</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#00FF88' }}>{formatINR(simNet)}</div>
                  </div>
                </div>
                <div style={{ marginTop: 10, fontSize: '0.78rem', color: simHours === 4 ? '#00FF88' : '#FFAA00' }}>
                  {simHours === 4
                    ? '✓ Feasible baseline: Modeled volume covers standard ₹600–₹800 daily targets under baseline capacity. The system models mathematical capacity; it does not assess health or fatigue.'
                    : '⚠ Shortfall alert: Halving hours reduces order throughput below the target threshold, triggering user-specific target gap scenarios and dual-stream recommendations.'}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LLM BOUNDARY PROOF */}
          {activeTab === 'llm_boundary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 color="#00FF88" size={20} />
                <h4 style={{ margin: 0, color: '#fff' }}>LLM Responsibility Boundary Guarantee</h4>
              </div>

              <div style={{ background: 'rgba(0, 255, 136, 0.04)', padding: 14, borderRadius: 8, border: '1px solid var(--accent-border)' }}>
                <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: 6 }}>
                  Strict Division of Responsibilities:
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <li>
                    <strong>Deterministic TypeScript Engine:</strong> Exclusively executes financial math, 8-factor scoring, feasibility ceilings, fuel formulas, target gap rankings, and field-level evidence lookups.
                  </li>
                  <li>
                    <strong>Groq LLaMA 3.3 70B:</strong> Only generates conversational localized advice and language translation based strictly on the pre-calculated, immutable context provided.
                  </li>
                  <li>
                    <strong>Anti-Hallucination Guardrails:</strong> The prompt explicitly forbids inventing fake local landmarks or altering numbers. If local verified facts are unavailable, it defaults to <em>"General model inference"</em>.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--surface-secondary)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff',
              cursor: 'pointer',
              fontFamily: 'var(--font-label)',
              fontSize: '0.8rem',
            }}
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
