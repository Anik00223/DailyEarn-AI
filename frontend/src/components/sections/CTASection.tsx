import { useNavigate } from 'react-router-dom';
import { useScrollReveal } from '../../hooks/useScrollAnimation';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  const ref = useScrollReveal<HTMLElement>();
  const navigate = useNavigate();

  return (
    <section
      ref={ref}
      style={{
        padding: '110px 24px 130px',
        position: 'relative',
      }}
    >
      <div
        data-reveal
        className="product-card"
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '56px 40px',
          textAlign: 'center',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-label)',
            fontSize: '0.74rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            display: 'block',
            marginBottom: 12,
          }}
        >
          Start Your Evaluation
        </span>

        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.9rem, 3.4vw, 2.8rem)',
            fontWeight: 700,
            color: '#FFFFFF',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            marginBottom: 14,
            maxWidth: 620,
            margin: '0 auto 14px',
          }}
        >
          Know your realistic daily ceiling before investing time.
        </h2>

        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.98rem',
            color: 'var(--text-secondary)',
            marginBottom: 32,
            maxWidth: 500,
            margin: '0 auto 32px',
            lineHeight: 1.6,
          }}
        >
          Input your available hours, location, and existing skills to receive verified local gig and tutoring benchmarks with exact deductions.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/register')}
            className="btn-primary"
            style={{ padding: '11px 24px', fontSize: '0.88rem' }}
          >
            Start Free Evaluation <ArrowRight size={15} />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="btn-secondary"
            style={{ padding: '11px 22px', fontSize: '0.88rem' }}
          >
            Sign In
          </button>
        </div>
      </div>
    </section>
  );
}
