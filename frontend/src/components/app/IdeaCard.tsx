import { useState, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { Heart, ExternalLink, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { Idea } from '../../types/api.types';
import { formatINR } from '../../utils/formatCurrency';

const effortStyles = {
  low: { bg: 'rgba(0,255,136,0.1)', color: '#00FF88', label: 'Low Effort' },
  medium: { bg: 'rgba(255,170,0,0.1)', color: '#ffaa00', label: 'Medium Effort' },
  high: { bg: 'rgba(255,51,102,0.1)', color: '#ff3366', label: 'High Effort' },
};

interface IdeaCardProps {
  idea: Idea;
  onSave: (id: string) => void;
  onDismiss: (id: string) => void;
  index?: number;
}

export function IdeaCard({ idea, onSave, onDismiss, index = 0 }: IdeaCardProps) {
  const [showMath, setShowMath] = useState(false);
  const [isSaved, setIsSaved] = useState(idea.isSaved ?? false);
  const cardRef = useRef<HTMLDivElement>(null);
  const effort = effortStyles[idea.effortLevel];

  // 3D tilt on mousemove
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rotateY = ((e.clientX - centerX) / rect.width) * 4;
    const rotateX = ((centerY - e.clientY) / rect.height) * 6;
    cardRef.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
  }, []);

  const handleSave = () => {
    setIsSaved(!isSaved);
    onSave(idea.id);
    // Heart pulse animation
    if (!isSaved && cardRef.current) {
      const heart = cardRef.current.querySelector('.heart-icon');
      if (heart) gsap.fromTo(heart, { scale: 1 }, { scale: 1.4, duration: 0.15, yoyo: true, repeat: 1 });
    }
  };

  const handleDismiss = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      x: '-100%', opacity: 0, duration: 0.4, ease: 'power2.in',
      onComplete: () => onDismiss(idea.id),
    });
  };

  return (
    <div
      ref={cardRef}
      style={{
        background: 'rgba(13, 13, 20, 0.75)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--glow-card)',
        backdropFilter: 'blur(12px) saturate(180%)',
        padding: 24,
        transition: 'border-color 0.3s, box-shadow 0.3s',
        cursor: 'default',
        willChange: 'transform',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => {
        if (cardRef.current) cardRef.current.style.borderColor = 'var(--accent-border-h)';
      }}
    >
      {/* ROW 1 — Badges */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'rgba(0,255,136,0.08)', border: '1px solid var(--accent-border)', color: 'var(--accent)', borderRadius: 6, padding: '4px 10px' }}>
          {idea.platformName}
        </span>
        <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: effort.bg, color: effort.color, borderRadius: 6, padding: '4px 10px' }}>
          {effort.label}
        </span>
      </div>

      {/* ROW 2 — Earnings hero */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>
          {formatINR(idea.estimatedDailyEarn)}
        </span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>per day</span>
      </div>

      {/* ROW 3 — Title */}
      <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {idea.title}
      </h3>

      {/* ROW 4 — Description */}
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {idea.description}
      </p>

      {/* ROW 5 — Earnings math (collapsible) */}
      <button onClick={() => setShowMath(!showMath)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: showMath ? 8 : 16, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        📊 See the math {showMath ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {showMath && (
        <div style={{ fontFamily: 'var(--font-label)', fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: 12, borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
          {idea.earningsBreakdown}
        </div>
      )}

      {/* ROW 6 — City tip */}
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
        <span style={{ color: 'var(--accent)' }}>📍 City tip:</span> {idea.citySpecificTip}
      </p>

      {/* ROW 7 — Steps */}
      {idea.gettingStartedSteps && idea.gettingStartedSteps.length > 0 && (
        <ol style={{ listStyle: 'none', padding: 0, marginBottom: 20 }}>
          {idea.gettingStartedSteps.slice(0, 3).map((step, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: '0.85rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)', fontWeight: 700, minWidth: 20 }}>{i + 1}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{step}</span>
            </li>
          ))}
        </ol>
      )}

      {/* FOOTER — Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={handleSave} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', border: `1px solid ${isSaved ? 'var(--accent-border-h)' : 'var(--accent-border)'}`, background: isSaved ? 'var(--accent-glow)' : 'transparent', color: isSaved ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.3s' }}>
          <Heart className="heart-icon" size={16} fill={isSaved ? 'var(--accent)' : 'none'} /> {isSaved ? 'Saved' : 'Save'}
        </button>
        <a href={idea.platformUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontFamily: 'var(--font-display)', background: 'var(--accent)', color: '#000', fontWeight: 700, textDecoration: 'none' }}>
          Start Now <ExternalLink size={14} />
        </a>
        <button onClick={handleDismiss} style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
