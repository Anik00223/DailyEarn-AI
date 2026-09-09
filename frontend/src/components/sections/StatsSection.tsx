import { useScrollReveal } from '../../hooks/useScrollAnimation';
import { ShieldCheck, Scale, Fuel, Lock } from 'lucide-react';
import { useDecisionStore } from '../../store/decisionStore';

const principles = [
  {
    icon: Scale,
    title: 'Zero Affiliate Bias',
    description:
      'We accept zero referral revenue from gig platforms or job boards. Recommendations are ranked solely by mathematical fit with your constraints.',
  },
  {
    icon: Fuel,
    title: 'Real-World Deductions',
    description:
      'Platform commission rates (10–25%) and fuel operating costs (₹7.3/km for two-wheelers) are deducted before displaying any take-home figure.',
  },
  {
    icon: ShieldCheck,
    title: 'Physical Delivery Ceilings',
    description:
      'We cap delivery models at a verified 1.6 orders/hour ceiling to account for actual restaurant prep delays and Tier-2 traffic conditions.',
  },
  {
    icon: Lock,
    title: 'Separation of Math & AI',
    description:
      'Calculations are 100% deterministic code. Groq AI is restricted to qualitative localized guidance and 7-day milestone planning.',
  },
];

export function StatsSection() {
  const ref = useScrollReveal<HTMLElement>();
  const { setTrustCenterOpen } = useDecisionStore();

  return (
    <section
      ref={ref}
      style={{
        padding: '100px 24px 110px',
        maxWidth: 1200,
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div style={{ maxWidth: 720, marginBottom: 48 }}>
        <span
          data-reveal
          style={{
            fontFamily: 'var(--font-label)',
            fontSize: '0.74rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            display: 'block',
            marginBottom: 10,
          }}
        >
          Trust & Provenance
        </span>
        <h2
          data-reveal
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.9rem, 3.4vw, 2.7rem)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            lineHeight: 1.2,
            marginBottom: 14,
          }}
        >
          Architected for mathematical honesty.
        </h2>
        <p
          data-reveal
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.98rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          Most gig portals inflate earnings with promotional bonuses that vanish in week two. DailyEarn is intentionally conservative, factoring in genuine operating friction.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20,
        }}
      >
        {principles.map((p, idx) => (
          <div
            key={idx}
            data-reveal
            className="product-card"
            style={{
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 18,
                }}
              >
                <p.icon size={18} color="var(--accent)" />
              </div>

              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.08rem',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  marginBottom: 8,
                }}
              >
                {p.title}
              </h3>

              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.88rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {p.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div
        data-reveal
        style={{
          marginTop: 32,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={() => setTrustCenterOpen(true)}
          className="btn-secondary"
          style={{
            fontSize: '0.84rem',
            padding: '10px 20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <ShieldCheck size={16} color="var(--accent)" />
          Open Full Engine Verification Audit
        </button>
      </div>
    </section>
  );
}
