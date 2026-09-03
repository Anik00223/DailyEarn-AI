import { useState } from 'react';
import { Award, Check, Info } from 'lucide-react';
import type { UserConstraints } from '../../types/decision.types';

interface CompetitionHeroDemoProps {
  onLoadDemo: (constraints: UserConstraints) => void;
}

export function CompetitionHeroDemo({ onLoadDemo }: CompetitionHeroDemoProps) {
  const [demoHours, setDemoHours] = useState<4 | 2>(4);
  const [isActive, setIsActive] = useState(false);

  const runDemo = (hours: 4 | 2) => {
    setDemoHours(hours);
    setIsActive(true);
    onLoadDemo({
      city: 'Silchar',
      state: 'Assam',
      targetDailyIncome: 800,
      availableHoursPerDay: hours,
      availableCapital: 0,
      hasVehicle: false,
      experienceLevel: 'beginner',
      skills: ['Teaching'],
      language: 'en',
    });
  };

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, rgba(0, 255, 136, 0.08) 0%, rgba(15, 15, 24, 0.95) 100%)',
        border: '1px solid var(--accent-border-h)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 20px',
        marginBottom: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              background: 'rgba(0, 255, 136, 0.15)',
              border: '1px solid var(--accent)',
              borderRadius: 6,
              padding: '4px 8px',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.75rem',
              fontFamily: 'var(--font-label)',
              fontWeight: 700,
            }}
          >
            <Award size={14} /> JUDGE DEMO MODE
          </span>
          <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
            National Competition Scenario: <span style={{ color: 'var(--accent)' }}>Silchar, Assam</span>
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            (Skill: Teaching | Target: ₹800/day | Capital: ₹0)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => runDemo(4)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: '0.8rem',
              fontFamily: 'var(--font-label)',
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${isActive && demoHours === 4 ? 'var(--accent)' : 'var(--accent-border)'}`,
              background: isActive && demoHours === 4 ? 'var(--accent)' : 'rgba(255,255,255,0.04)',
              color: isActive && demoHours === 4 ? '#000' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {isActive && demoHours === 4 && <Check size={13} />} Test 4 Hours/day (Feasible)
          </button>

          <button
            onClick={() => runDemo(2)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: '0.8rem',
              fontFamily: 'var(--font-label)',
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${isActive && demoHours === 2 ? '#FFAA00' : 'var(--accent-border)'}`,
              background: isActive && demoHours === 2 ? '#FFAA00' : 'rgba(255,255,255,0.04)',
              color: isActive && demoHours === 2 ? '#000' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {isActive && demoHours === 2 && <Check size={13} />} Test 2 Hours/day (Target Gap)
          </button>
        </div>
      </div>

      {isActive && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
          <Info size={13} color="var(--accent)" />
          {demoHours === 4 ? (
            <span>
              <strong>Under 4 hours/day:</strong> Modeled ceiling is ~₹1,107/day. Target of ₹800 is <strong>FEASIBLE</strong> without secondary gig requirement.
            </span>
          ) : (
            <span>
              <strong>Under 2 hours/day:</strong> Daily volume drops 50% to ~₹546/day. Engine detects ₹254 shortfall, marks verdict <strong>POSSIBLE WITH CHANGES</strong>, and generates <strong>Dual-Stream Income Mix</strong>.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
