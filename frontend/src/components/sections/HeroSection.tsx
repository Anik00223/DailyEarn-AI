import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CITIES = ['Silchar', 'Patna', 'Kota', 'Guntur', 'Bhagalpur', 'Jorhat', 'Ranchi', 'Nagpur'];

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [currentCity, setCurrentCity] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  // Typewriter effect
  useEffect(() => {
    const city = CITIES[currentCity];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (displayText.length < city.length) {
        timeout = setTimeout(() => setDisplayText(city.slice(0, displayText.length + 1)), 100);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 2000);
      }
    } else {
      if (displayText.length > 0) {
        timeout = setTimeout(() => setDisplayText(displayText.slice(0, -1)), 50);
      } else {
        setIsDeleting(false);
        setCurrentCity((prev) => (prev + 1) % CITIES.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentCity]);

  // GSAP Entry Timeline
  useEffect(() => {
    if (!sectionRef.current) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo('.hero-eyebrow', { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.1)
        .fromTo('.hero-headline', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.3)
        .fromTo('.hero-subtitle', { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.6)
        .fromTo(
          '.hero-cta',
          { scale: 0.9, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' },
          0.8
        )
        .fromTo('.hero-trust', { opacity: 0 }, { opacity: 1, duration: 0.5 }, 1.0);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        zIndex: 1,
        padding: '0 24px',
        overflow: 'hidden',
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--gradient-hero)',
          zIndex: -1,
        }}
      />

      {/* Glow orbs */}
      <div
        className="glow-orb glow-orb--green"
        style={{ width: 400, height: 400, top: '10%', left: '20%', animation: 'pulse-glow 6s infinite' }}
      />
      <div
        className="glow-orb glow-orb--blue"
        style={{ width: 300, height: 300, bottom: '15%', right: '15%', animation: 'pulse-glow 8s infinite' }}
      />

      {/* Eyebrow */}
      <span
        className="hero-eyebrow"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.7rem',
          letterSpacing: '0.25em',
          color: 'var(--accent)',
          marginBottom: 24,
          opacity: 0,
        }}
      >
        AI-POWERED INCOME IDEAS
      </span>

      {/* Headline */}
      <h1
        className="hero-headline"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(3rem, 8vw, 7rem)',
          fontWeight: 900,
          lineHeight: 0.9,
          letterSpacing: '-0.03em',
          color: 'var(--text-primary)',
          marginBottom: 28,
          opacity: 0,
        }}
      >
        Earn More.
        <br />
        Starting Today.
      </h1>

      {/* Subtitle with typewriter */}
      <p
        className="hero-subtitle"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1.1rem',
          color: 'var(--text-secondary)',
          marginBottom: 40,
          opacity: 0,
          maxWidth: 520,
        }}
      >
        Hyper-local income ideas for{' '}
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
          {displayText}
          <span style={{ animation: 'pulse-glow 1s infinite' }}>|</span>
        </span>{' '}
        — generated in 3 seconds
      </p>

      {/* CTA Button */}
      <button
        className="hero-cta"
        onClick={() => navigate('/register')}
        style={{
          background: 'var(--accent)',
          color: '#000',
          fontFamily: 'var(--font-display)',
          fontSize: '0.85rem',
          fontWeight: 700,
          padding: '18px 40px',
          borderRadius: 50,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          transition: 'all 0.3s var(--ease-smooth)',
          opacity: 0,
          border: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--accent-dim)';
          e.currentTarget.style.boxShadow = 'var(--glow-accent)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--accent)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        Generate My Ideas <ArrowRight size={18} />
      </button>

      {/* Trust text */}
      <p
        className="hero-trust"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          marginTop: 20,
          opacity: 0,
        }}
      >
        12,000+ people earning smarter across India
      </p>
    </section>
  );
}
