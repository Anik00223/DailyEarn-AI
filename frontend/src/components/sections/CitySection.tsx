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
      <div style={{ textAlign: 'center', marginBottom: 36, padding: '0 24px' }}>
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
          Geographic Calibration
        </span>
        <h2
          data-reveal
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.8rem, 3.4vw, 2.6rem)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            marginBottom: 12,
          }}
        >
          Tuned for 50+ Tier-2 & Tier-3 economic centers.
        </h2>
        <p
          data-reveal
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            maxWidth: 580,
            margin: '0 auto',
            lineHeight: 1.5,
          }}
        >
          Gig demand and tutoring rates differ drastically between metro and non-metro cities. DailyEarn calibrates for your specific city’s actual market rates.
        </p>
      </div>

      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: 10,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          padding: '10px 0',
        }}
      >
        {allCities.map((city, i) => (
          <span
            key={`${city}-${i}`}
            style={{
              fontFamily: 'var(--font-label)',
              fontSize: '0.78rem',
              fontWeight: 500,
              letterSpacing: '0.02em',
              color: 'var(--text-secondary)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '7px 16px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'border-color 0.2s, color 0.2s',
            }}
          >
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', opacity: 0.8 }} />
            {city}
          </span>
        ))}
      </div>
    </section>
  );
}
