import { memo } from 'react';

const ParticleField = memo(function ParticleField() {
  return (
    <div
      aria-hidden="true"
      className="ambient-grid"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 25%, #000 20%, transparent 85%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 25%, #000 20%, transparent 85%)',
        opacity: 0.6,
      }}
    />
  );
});

export default ParticleField;
