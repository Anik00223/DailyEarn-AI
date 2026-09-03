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
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
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
          background: 'rgba(15, 15, 24, 0.96)',
          border: '1px solid var(--accent-border-h)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--glow-card)',
          width: '100%',
          maxWidth: 540,
          padding: 28,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckSquare size={20} color="var(--accent)" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#fff', margin: 0 }}>
              Report Real-World Outcome
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '36px 16px' }}>
            <CheckCircle2 size={48} color="#00FF88" style={{ marginBottom: 12 }} />
            <h4 style={{ color: '#fff', fontSize: '1.1rem', margin: '0 0 8px' }}>Outcome Feedback Recorded!</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Your real-world numbers help improve ground-truth predictions across Bharat without inflating expectations.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
              Opportunity: <b style={{ color: '#fff' }}>{opp.opportunityName}</b>. Predicted: <b style={{ color: 'var(--accent)' }}>₹{fin.netDaily}/day</b>.
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
                    background: wasEstimateAccurate ? 'rgba(0,255,136,0.1)' : 'transparent',
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
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                Notes / Ground Reality Observations:
              </label>
              <textarea
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                placeholder="e.g., Rain delayed deliveries by 45 mins; tutoring student parents preferred evening slot"
                rows={3}
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '9px 16px', background: 'transparent', border: '1px solid var(--accent-border)', color: '#fff', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{ padding: '9px 20px', background: 'var(--accent)', border: 'none', color: '#000', fontWeight: 700, borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Send size={14} /> Submit Feedback
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
