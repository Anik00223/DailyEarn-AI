import { useNavigate } from 'react-router-dom';
import { useScrollReveal } from '../../hooks/useScrollAnimation';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  const ref = useScrollReveal<HTMLElement>();
  const navigate = useNavigate();

  return (
    <section ref={ref} style={{ padding: '120px 24px', textAlign: 'center', position: 'relative' }}>
      <div className="glow-orb glow-orb--green" style={{ width: 500, height: 500, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'pulse-glow 5s infinite' }} />
      <h2 data-reveal style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: 16, position: 'relative', zIndex: 1 }}>
        Start Earning Today
      </h2>
      <p data-reveal style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 40, maxWidth: 500, margin: '0 auto 40px', position: 'relative', zIndex: 1 }}>
        Join thousands already discovering new income opportunities in their city.
      </p>
      <button data-reveal onClick={() => navigate('/register')} style={{ background: 'var(--accent)', color: '#000', fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, padding: '20px 48px', borderRadius: 50, display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'all 0.3s', position: 'relative', zIndex: 1, border: 'none' }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--glow-accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
        Get Started Free <ArrowRight size={18} />
      </button>
    </section>
  );
}
