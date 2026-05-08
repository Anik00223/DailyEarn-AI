import { useScrollReveal } from '../../hooks/useScrollAnimation';

const sampleIdeas = [
  {
    title: 'Meesho Reselling – Women\'s Kurtis',
    platform: 'Meesho',
    effort: 'low' as const,
    daily: '₹400 – ₹700',
    breakdown: '10 orders × ₹50 margin = ₹500/day',
    city: 'Silchar',
  },
  {
    title: 'WhatsApp Tiffin Service',
    platform: 'WhatsApp Business',
    effort: 'medium' as const,
    daily: '₹600 – ₹1,000',
    breakdown: '20 tiffins × ₹40 profit = ₹800/day',
    city: 'Kota',
  },
  {
    title: 'Urban Company Home Cleaning',
    platform: 'Urban Company',
    effort: 'high' as const,
    daily: '₹800 – ₹1,200',
    breakdown: '4 jobs × ₹250 = ₹1,000/day',
    city: 'Patna',
  },
];

const effortColors = {
  low: { bg: 'rgba(0,255,136,0.1)', color: '#00FF88' },
  medium: { bg: 'rgba(255,170,0,0.1)', color: '#ffaa00' },
  high: { bg: 'rgba(255,51,102,0.1)', color: '#ff3366' },
};

export function IdeaPreviewSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      style={{
        padding: '120px 24px',
        maxWidth: 1100,
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <span
          data-reveal
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.7rem',
            letterSpacing: '0.25em',
            color: 'var(--accent)',
            display: 'block',
            marginBottom: 16,
          }}
        >
          SAMPLE OUTPUT
        </span>
        <h2
          data-reveal
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          Real Ideas, Real Earnings
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
        }}
      >
        {sampleIdeas.map((idea, index) => (
          <div
            key={index}
            data-reveal
            className="glass"
            style={{
              padding: 24,
              transition: 'transform 0.3s var(--ease-smooth), box-shadow 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = 'var(--glow-card-h)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <span
                style={{
                  fontFamily: 'var(--font-label)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  background: 'rgba(0,255,136,0.08)',
                  border: '1px solid var(--accent-border)',
                  color: 'var(--accent)',
                  borderRadius: 6,
                  padding: '4px 10px',
                }}
              >
                {idea.platform}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-label)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  background: effortColors[idea.effort].bg,
                  color: effortColors[idea.effort].color,
                  borderRadius: 6,
                  padding: '4px 10px',
                }}
              >
                {idea.effort} effort
              </span>
            </div>

            {/* Earnings */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  color: 'var(--accent)',
                }}
              >
                {idea.daily}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>per day</span>
            </div>

            {/* Title */}
            <h3
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 12,
              }}
            >
              {idea.title}
            </h3>

            {/* Breakdown */}
            <div
              style={{
                background: 'var(--bg-elevated)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 12,
              }}
            >
              <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                📊 {idea.breakdown}
              </span>
            </div>

            {/* City tag */}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              📍 Tailored for <span style={{ color: 'var(--accent)' }}>{idea.city}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
