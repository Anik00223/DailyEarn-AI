import { useRef, useEffect } from 'react';
import { useScrollReveal } from '../../hooks/useScrollAnimation';

const cities = [
  'Silchar', 'Kota', 'Patna', 'Guntur', 'Bhagalpur', 'Jorhat', 'Ranchi', 'Nagpur',
  'Varanasi', 'Indore', 'Bhopal', 'Jaipur', 'Lucknow', 'Kanpur', 'Agra',
  'Nashik', 'Aurangabad', 'Rajkot', 'Vadodara', 'Surat', 'Coimbatore',
  'Madurai', 'Tiruchirappalli', 'Vijayawada', 'Warangal', 'Guwahati',
  'Dibrugarh', 'Siliguri', 'Durgapur', 'Asansol', 'Cuttack', 'Bhubaneswar',
  'Raipur', 'Dehradun', 'Haridwar', 'Jalandhar', 'Amritsar', 'Ludhiana',
  'Jodhpur', 'Udaipur', 'Ajmer', 'Bikaner', 'Allahabad', 'Gorakhpur',
  'Bareilly', 'Aligarh', 'Moradabad', 'Meerut', 'Muzaffarpur', 'Gaya',
];

export function CitySection() {
  const ref = useScrollReveal<HTMLElement>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animId: number;
    let scrollPos = 0;
    const speed = 0.5;

    const animate = () => {
      scrollPos += speed;
      if (scrollPos >= el.scrollWidth / 2) {
        scrollPos = 0;
      }
      el.scrollLeft = scrollPos;
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animId);
  }, []);

  // Duplicate cities for infinite scroll illusion
  const allCities = [...cities, ...cities];

  return (
    <section
      ref={ref}
      style={{
        padding: '100px 0',
        overflow: 'hidden',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 48, padding: '0 24px' }}>
        <h2
          data-reveal
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.6rem, 4vw, 2.5rem)',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          Works in{' '}
          <span style={{ color: 'var(--accent)' }}>500+</span> Indian Cities
        </h2>
      </div>

      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: 16,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          padding: '8px 0',
        }}
      >
        {allCities.map((city, i) => (
          <span
            key={`${city}-${i}`}
            style={{
              fontFamily: 'var(--font-label)',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--accent-border)',
              borderRadius: 50,
              padding: '8px 20px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'border-color 0.3s',
            }}
          >
            📍 {city}
          </span>
        ))}
      </div>
    </section>
  );
}
