import { useEffect, useState, useRef } from 'react';
import { useScrollReveal } from '../../hooks/useScrollAnimation';

interface StatItem {
  value: number;
  suffix: string;
  label: string;
}

const stats: StatItem[] = [
  { value: 12, suffix: 'K+', label: 'Users Earning Smarter' },
  { value: 240, suffix: 'Cr+', label: 'In Ideas Generated' },
  { value: 500, suffix: '+', label: 'Indian Cities Covered' },
  { value: 35, suffix: '+', label: 'Platforms Integrated' },
];

function CountUpNumber({ target, suffix }: { target: number; suffix: string }) {
  const [current, setCurrent] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) setHasStarted(true);
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    const duration = 2000;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [hasStarted, target]);

  return <span ref={ref}>{current}{suffix}</span>;
}

export function StatsSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      style={{
        padding: '100px 24px',
        maxWidth: 1100,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 32,
          textAlign: 'center',
        }}
      >
        {stats.map((stat, index) => (
          <div key={index} data-reveal>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                fontWeight: 900,
                color: 'var(--accent)',
                marginBottom: 8,
              }}
            >
              <CountUpNumber target={stat.value} suffix={stat.suffix} />
            </div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
              }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
