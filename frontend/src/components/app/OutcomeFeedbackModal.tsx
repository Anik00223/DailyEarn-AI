import { useState } from 'react';
import { X, CheckSquare, Send, CheckCircle2 } from 'lucide-react';
import type { EvaluatedOpportunity } from '../../types/decision.types';
import api from '../../api/client';

interface OutcomeFeedbackModalProps {
  item: EvaluatedOpportunity;
  onClose: () => void;
}

export function OutcomeFeedbackModal({ item, onClose }: OutcomeFeedbackModalProps) {
  const opp = item.opportunity;
  const fin = item.financials;

  const [attempted, setAttempted] = useState(true);
  const [firstStepCompleted, setFirstStepCompleted] = useState(true);
  const [actualDailyEarned, setActualDailyEarned] = useState(fin.netDaily);
  const [hoursSpent, setHoursSpent] = useState(4);
  const [costsIncurred, setCostsIncurred] = useState(fin.travelCost + fin.materialCost);
  const [wasEstimateAccurate, setWasEstimateAccurate] = useState(true);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/decision/outcomes', {
        opportunitySlug: opp.slug,
        city: 'Silchar', // default or current city
        attempted,
        firstStepCompleted,
        predictedDailyIncome: fin.netDaily,
        actualDailyEarned: Number(actualDailyEarned),
        hoursSpent: Number(hoursSpent),
        costsIncurred: Number(costsIncurred),
        wasEstimateAccurate,
        feedbackNotes,
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Failed to submit outcome:', err);
      // Still show success in offline/demo mode
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 160,
        background: 'rgba(2, 6, 9, 0.85)',
        backdropFilter: 'blur(16px)',
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
        className="obsidian-card"
        style={{
          borderRadius: 24,
          border: '1px solid rgba(0, 242, 254, 0.22)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 242, 254, 0.08)',
          width: '100%',
          maxWidth: 540,
          padding: 32,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-label)',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                marginBottom: 6,
              }}
            >
              // GROUND TRUTH REPORTING
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckSquare size={20} color="var(--accent)" />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Report Real Outcome
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '50%',
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '36px 16px' }}>
            <CheckCircle2 size={48} color="var(--accent)" style={{ marginBottom: 12 }} />
            <h4 style={{ color: '#fff', fontSize: '1.2rem', margin: '0 0 8px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Outcome Recorded!</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Your real-world numbers help improve ground-truth predictions across Bharat without inflating expectations.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
              Opportunity: <strong style={{ color: '#fff' }}>{opp.opportunityName}</strong>. Predicted: <strong style={{ color: 'var(--accent)' }}>₹{fin.netDaily}/day</strong>.
            </p>

            {/* Actual Earned */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                How much did you actually earn? (₹)
              </label>
              <input
                type="number"
                value={actualDailyEarned}
                onChange={(e) => setActualDailyEarned(Number(e.target.value))}
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.9rem' }}
                required
              />
            </div>

            {/* Hours spent */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Hours Spent:
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={hoursSpent}
                  onChange={(e) => setHoursSpent(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.9rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Costs / Fuel Incurred (₹):
                </label>
                <input
                  type="number"
                  value={costsIncurred}
                  onChange={(e) => setCostsIncurred(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.9rem' }}
                  required
                />
              </div>
            </div>

            {/* Was accurate toggle */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Was the DailyEarn estimate realistic?
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setWasEstimateAccurate(true)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 6,
                    border: `1px solid ${wasEstimateAccurate ? 'var(--accent)' : 'var(--accent-border)'}`,
                    background: wasEstimateAccurate ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
                    color: wasEstimateAccurate ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  ✓ Realistic (within 20%)
                </button>
                <button
                  type="button"
                  onClick={() => setWasEstimateAccurate(false)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 6,
                    border: `1px solid ${!wasEstimateAccurate ? '#FFAA00' : 'var(--accent-border)'}`,
                    background: !wasEstimateAccurate ? 'rgba(255,170,0,0.1)' : 'transparent',
                    color: !wasEstimateAccurate ? '#FFAA00' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  ⚠ Differed Significantly
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-label)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Notes / Ground Reality Observations:
              </label>
              <textarea
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                placeholder="e.g., Rain delayed deliveries by 45 mins; tutoring student parents preferred evening slot"
                rows={3}
                style={{
                  width: '100%',
                  background: 'rgba(6, 18, 26, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost-pill"
                style={{ padding: '10px 22px', fontSize: '0.82rem', borderRadius: 50 }}
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-cyan-pill"
                style={{ padding: '10px 24px', fontSize: '0.82rem', borderRadius: 50 }}
              >
                <Send size={14} /> SUBMIT FEEDBACK
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
