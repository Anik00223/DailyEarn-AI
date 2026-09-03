import { useState } from 'react';
import { X, Calendar, CheckSquare, Square, Clock, BookmarkCheck } from 'lucide-react';
import type { GeneratedPlan } from '../../types/decision.types';

interface SevenDayPlanDrawerProps {
  plan: GeneratedPlan;
  onClose: () => void;
  onSavePlan?: (plan: GeneratedPlan) => void;
}

export function SevenDayPlanDrawer({ plan, onClose, onSavePlan }: SevenDayPlanDrawerProps) {
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  const toggleItem = (dayNum: number, itemIdx: number) => {
    const key = `${dayNum}-${itemIdx}`;
    setCompletedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    if (onSavePlan) onSavePlan(plan);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 150,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        style={{
          width: '100%',
          maxWidth: 600,
          background: 'rgba(12, 12, 18, 0.98)',
          borderLeft: '1px solid var(--accent-border-h)',
          height: '100%',
          overflowY: 'auto',
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--glow-card)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', marginBottom: 4 }}>
              <Calendar size={18} />
              <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
                Personalized Roadmap
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#fff', margin: '0 0 4px' }}>
              Your 7-Day Action Plan
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              {plan.opportunityName} ({plan.platform}) • Target: <b style={{ color: 'var(--accent)' }}>{plan.targetDailyEarn}</b>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* Notes banner */}
        {plan.notes && (
          <div style={{ background: 'rgba(0, 255, 136, 0.05)', border: '1px solid var(--accent-border)', borderRadius: 6, padding: '10px 14px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
            💡 {plan.notes}
          </div>
        )}

        {/* Days List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
          {plan.days.map((day) => (
            <div
              key={day.dayNumber}
              style={{
                background: 'rgba(20, 20, 30, 0.6)',
                border: '1px solid var(--accent-border)',
                borderRadius: 'var(--radius-sm)',
                padding: 18,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent)', fontSize: '0.95rem' }}>
                  {day.title}: <span style={{ color: '#fff', fontWeight: 600 }}>{day.focus}</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Clock size={12} /> {day.estimatedMinutes} mins
                </span>
              </div>

              {/* Action items checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {day.actionItems.map((item, idx) => {
                  const key = `${day.dayNumber}-${idx}`;
                  const isChecked = completedItems[key];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleItem(day.dayNumber, idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        fontSize: '0.83rem',
                        color: isChecked ? 'var(--text-muted)' : 'var(--text-secondary)',
                        textDecoration: isChecked ? 'line-through' : 'none',
                        cursor: 'pointer',
                        padding: '4px 0',
                      }}
                    >
                      <span style={{ marginTop: 2, color: isChecked ? 'var(--accent)' : 'var(--text-muted)' }}>
                        {isChecked ? <CheckSquare size={15} /> : <Square size={15} />}
                      </span>
                      <span>{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 12 }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: 'var(--radius-sm)',
              background: savedSuccess ? '#00FF88' : 'var(--accent)',
              border: 'none',
              color: '#000',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <BookmarkCheck size={16} />
            {savedSuccess ? 'Plan Saved to Account!' : 'Save 7-Day Plan'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '11px 18px',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: '1px solid var(--accent-border)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}
