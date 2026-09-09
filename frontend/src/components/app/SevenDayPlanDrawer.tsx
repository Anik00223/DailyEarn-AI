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
        background: 'rgba(2, 6, 9, 0.8)',
        backdropFilter: 'blur(16px)',
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
          background: 'rgba(2, 6, 9, 0.96)',
          borderLeft: '1px solid rgba(0, 242, 254, 0.22)',
          height: '100%',
          overflowY: 'auto',
          padding: 36,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 242, 254, 0.06)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
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
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Calendar size={14} /> // EXECUTION PROTOCOL
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#fff',
                letterSpacing: '-0.01em',
                textTransform: 'uppercase',
                margin: '0 0 6px',
              }}
            >
              7-Day Action Plan
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
              {plan.opportunityName} ({plan.platform}) • Target: <strong style={{ color: 'var(--accent)' }}>{plan.targetDailyEarn}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Notes banner */}
        {plan.notes && (
          <div
            style={{
              background: 'rgba(0, 242, 254, 0.05)',
              border: '1px solid rgba(0, 242, 254, 0.2)',
              borderRadius: 12,
              padding: '12px 16px',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              marginBottom: 24,
              lineHeight: 1.5,
            }}
          >
            💡 {plan.notes}
          </div>
        )}

        {/* Days List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
          {plan.days.map((day) => (
            <div
              key={day.dayNumber}
              className="obsidian-card"
              style={{
                borderRadius: 14,
                padding: '18px 20px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-label)',
                    fontWeight: 700,
                    color: 'var(--accent)',
                    fontSize: '0.82rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  DAY 0{day.dayNumber}: <span style={{ color: '#fff' }}>{day.focus}</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  <Clock size={12} color="var(--accent)" /> {day.estimatedMinutes} mins
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
                        fontSize: '0.84rem',
                        color: isChecked ? 'var(--text-muted)' : 'var(--text-secondary)',
                        textDecoration: isChecked ? 'line-through' : 'none',
                        cursor: 'pointer',
                        padding: '3px 0',
                      }}
                    >
                      <span style={{ marginTop: 2, color: isChecked ? 'var(--accent)' : 'var(--text-muted)' }}>
                        {isChecked ? <CheckSquare size={15} color="var(--accent)" /> : <Square size={15} />}
                      </span>
                      <span style={{ lineHeight: 1.4 }}>{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 28, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 12 }}>
          <button
            onClick={handleSave}
            className="btn-cyan-pill"
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '0.82rem',
              borderRadius: 50,
            }}
          >
            <BookmarkCheck size={16} />
            {savedSuccess ? 'PLAN SAVED TO ACCOUNT!' : 'SAVE 7-DAY ROADMAP'}
          </button>
          <button
            onClick={onClose}
            className="btn-ghost-pill"
            style={{
              padding: '12px 24px',
              fontSize: '0.82rem',
              borderRadius: 50,
            }}
          >
            CLOSE
          </button>
        </div>
      </aside>
    </div>
  );
}
