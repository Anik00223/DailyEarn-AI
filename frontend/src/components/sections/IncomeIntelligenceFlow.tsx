import React, { useEffect, useState, useRef } from 'react';

interface IncomeIntelligenceFlowProps {
  city: string;
  skill: 'Teaching' | 'Delivery' | 'Digital';
  hours: number;
  target: number;
  calculation: {
    gross: number;
    net: number;
    platform: string;
    platformFee: number;
    fuelCost: number;
    unitDetail: string;
    feasible: boolean;
    gap: number;
  };
}

export function IncomeIntelligenceFlow({
  city,
  skill,
  hours,
  target,
  calculation,
}: IncomeIntelligenceFlowProps) {
  // Track which property just changed to animate the corresponding node
  const [activeNode, setActiveNode] = useState<'city' | 'skill' | 'hours' | 'target' | null>(null);
  const prevProps = useRef({ city, skill, hours, target });

  useEffect(() => {
    let changed: 'city' | 'skill' | 'hours' | 'target' | null = null;
    if (prevProps.current.city !== city) changed = 'city';
    else if (prevProps.current.skill !== skill) changed = 'skill';
    else if (prevProps.current.hours !== hours) changed = 'hours';
    else if (prevProps.current.target !== target) changed = 'target';

    if (changed) {
      setActiveNode(changed);
      const timer = setTimeout(() => setActiveNode(null), 600);
      prevProps.current = { city, skill, hours, target };
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [city, skill, hours, target]);

  const skillLabel = skill === 'Digital' ? 'Freelance' : skill;

  return (
    <div
      className="income-flow-container"
      style={{
        background: 'rgba(255, 255, 255, 0.015)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        padding: '11px 13px',
        marginBottom: 14,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header telemetry badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 9,
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          paddingBottom: 6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            className="pulse-dot"
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'var(--accent)',
              opacity: 0.7,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-label)',
              fontSize: '0.67rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            Income Intelligence Flow
          </span>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-label)',
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
          }}
        >
          Continuous Calibration
        </span>
      </div>

      {/* Visual Flow Diagram */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 7,
          position: 'relative',
        }}
      >
        {/* Tier 1: 4 Constraints Inputs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
          }}
        >
          {/* City Node */}
          <div
            className={`flow-node ${activeNode === 'city' ? 'node-active' : ''}`}
            style={{
              padding: '4px 6px',
              borderRadius: 4,
              background: activeNode === 'city' ? 'var(--accent-muted)' : 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${activeNode === 'city' ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)'}`,
              transition: 'all 0.25s ease',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>City</div>
            <div style={{ fontSize: '0.72rem', color: '#FFFFFF', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {city}
            </div>
          </div>

          {/* Skill Node */}
          <div
            className={`flow-node ${activeNode === 'skill' ? 'node-active' : ''}`}
            style={{
              padding: '4px 6px',
              borderRadius: 4,
              background: activeNode === 'skill' ? 'var(--accent-muted)' : 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${activeNode === 'skill' ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)'}`,
              transition: 'all 0.25s ease',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Skill</div>
            <div style={{ fontSize: '0.72rem', color: '#FFFFFF', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {skillLabel}
            </div>
          </div>

          {/* Hours Node */}
          <div
            className={`flow-node ${activeNode === 'hours' ? 'node-active' : ''}`}
            style={{
              padding: '4px 6px',
              borderRadius: 4,
              background: activeNode === 'hours' ? 'var(--accent-muted)' : 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${activeNode === 'hours' ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)'}`,
              transition: 'all 0.25s ease',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time</div>
            <div style={{ fontSize: '0.72rem', color: '#FFFFFF', fontWeight: 600 }}>
              {hours}h/d
            </div>
          </div>

          {/* Target Node */}
          <div
            className={`flow-node ${activeNode === 'target' ? 'node-active' : ''}`}
            style={{
              padding: '4px 6px',
              borderRadius: 4,
              background: activeNode === 'target' ? 'var(--accent-muted)' : 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${activeNode === 'target' ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)'}`,
              transition: 'all 0.25s ease',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target</div>
            <div style={{ fontSize: '0.72rem', color: '#FFFFFF', fontWeight: 600 }}>
              ₹{target}
            </div>
          </div>
        </div>

        {/* Dynamic Animated Flow Rails (Ultra-thin 0.75px SVG tracks with 2 calm alternating nodes) */}
        <div style={{ height: 22, position: 'relative', width: '100%' }}>
          <svg
            viewBox="0 0 320 22"
            fill="none"
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%', display: 'block' }}
          >
            {/* Guide tracks connecting the 4 constraint positions (40, 120, 200, 280) to center (160) */}
            <path d="M 40 2 C 40 12, 160 10, 160 20" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.75" />
            <path d="M 120 2 C 120 12, 160 10, 160 20" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.75" />
            <path d="M 200 2 C 200 12, 160 10, 160 20" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.75" />
            <path d="M 280 2 C 280 12, 160 10, 160 20" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.75" />

            {/* Only 2 quiet, subdued moving nodes alternating calmly (5.4s duration, soft opacity) */}
            <circle r="1.5" fill="var(--accent)" opacity="0.45">
              <animateMotion
                path="M 40 2 C 40 12, 160 10, 160 20"
                dur="5.4s"
                repeatCount="indefinite"
                keyPoints="0;1"
                keyTimes="0;1"
              />
            </circle>
            <circle r="1.5" fill="var(--accent)" opacity="0.45">
              <animateMotion
                path="M 200 2 C 200 12, 160 10, 160 20"
                dur="5.4s"
                begin="2.7s"
                repeatCount="indefinite"
                keyPoints="0;1"
                keyTimes="0;1"
              />
            </circle>
          </svg>
        </div>

        {/* Tier 2: DailyEarn Engine Analysis Node */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: 5,
            padding: '5px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent)', opacity: 0.85 }}>⚙</span>
            <span style={{ fontSize: '0.71rem', fontWeight: 600, color: '#FFFFFF' }}>
              DailyEarn Deduction Engine
            </span>
          </div>

          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {skill === 'Teaching'
              ? 'Zero platform cut · Direct parent payout'
              : skill === 'Delivery'
              ? '18% platform cut · ₹15/order fuel calibrated'
              : '10% platform fee · Zero commute'}
          </span>
        </div>

        {/* Connecting Outward Flow Rails to Outputs (Single calm diverging node) */}
        <div style={{ height: 16, position: 'relative', width: '100%' }}>
          <svg
            viewBox="0 0 320 16"
            fill="none"
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%', display: 'block' }}
          >
            {/* Diverging tracks from center (160) to left output (80) and right output (240) */}
            <path d="M 160 0 C 160 7, 80 7, 80 16" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.75" />
            <path d="M 160 0 C 160 7, 240 7, 240 16" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.75" />

            <circle r="1.5" fill="var(--accent)" opacity="0.45">
              <animateMotion
                path="M 160 0 C 160 7, 80 7, 80 16"
                dur="4.6s"
                repeatCount="indefinite"
                keyPoints="0;1"
                keyTimes="0;1"
              />
            </circle>
          </svg>
        </div>

        {/* Tier 3: Output Indicators */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}
        >
          {/* Realistic Income Output */}
          <div
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.015)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Realistic Ceiling:</span>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent)' }}>
              ₹{calculation.net}/d
            </span>
          </div>

          {/* Best Opportunity Output */}
          <div
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.015)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Best Fit:</span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 90,
              }}
            >
              {calculation.platform.split('/')[0].trim()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
