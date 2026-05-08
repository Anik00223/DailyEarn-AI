import { useScrollReveal } from '../../hooks/useScrollAnimation';
import { Zap, MapPin, IndianRupee } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: MapPin,
    title: 'Enter Your City',
    description: 'Tell us where you live — we\'ll find opportunities specific to your local economy.',
  },
  {
    number: '02',
    icon: Zap,
    title: 'Share Your Skills',
    description: 'Select skills you already have — cooking, teaching, driving, coding, or selling.',
  },
  {
    number: '03',
    icon: IndianRupee,
    title: 'Get Earning Ideas',
    description: 'AI generates 5 hyper-local ideas with real platforms, INR math, and step-by-step guides.',
  },
];

export function HowItWorksSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      style={{
        padding: '120px 24px',
        maxWidth: 1100,
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
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
        HOW IT WORKS
      </span>
      <h2
        data-reveal
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.8rem, 4vw, 3rem)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 64,
        }}
      >
        Three Steps to Your First ₹500
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 32,
        }}
      >
        {steps.map((step) => (
          <div
            key={step.number}
            data-reveal
            className="glass"
            style={{
              padding: 32,
              textAlign: 'left',
              transition: 'transform 0.3s var(--ease-smooth), box-shadow 0.3s var(--ease-smooth)',
              cursor: 'default',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = 'var(--glow-card-h)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '3rem',
                fontWeight: 900,
                color: 'var(--accent)',
                opacity: 0.2,
                display: 'block',
                marginBottom: 8,
              }}
            >
              {step.number}
            </span>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'var(--accent-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <step.icon size={24} color="var(--accent)" />
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '1.15rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 8,
              }}
            >
              {step.title}
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
              }}
            >
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
