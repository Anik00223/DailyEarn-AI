import { useState } from 'react';
import { useScrollReveal } from '../../hooks/useScrollAnimation';
import { Sliders, Cpu, Compass } from 'lucide-react';

const steps = [
  {
    number: '01',
    phase: 'Constraint Input',
    icon: Sliders,
    title: 'Declare constraints',
    description:
      'Enter your city, verified daily hours, vehicle availability, and current skills. No resume inflation or unrealistic expectations.',
    tag: 'Stage 01',
  },
  {
    number: '02',
    phase: 'Deterministic Math',
    icon: Cpu,
    title: 'Model verified deductions',
    description:
      'Our engine tests 50+ local platforms against realistic delivery rates, platform commission cuts, and fuel costs to calculate your true net ceiling.',
    tag: 'Stage 02',
  },
  {
    number: '03',
    phase: 'Action Roadmap',
    icon: Compass,
    title: 'Execute your plan',
    description:
      'Receive an actionable step-by-step onboarding plan with neighborhood tips, platform registration checklists, and safety milestones.',
    tag: 'Stage 03',
  },
];

export function HowItWorksSection() {
  const ref = useScrollReveal<HTMLElement>({ y: 16, stagger: 0.12, duration: 0.6 });
  const [activeStep, setActiveStep] = useState<number>(0);

  return (
    <section
      id="how-it-works"
      ref={ref}
      style={{
        padding: '110px 24px',
        maxWidth: 1200,
        margin: '0 auto',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div style={{ maxWidth: 720, marginBottom: 54 }}>
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
          Methodology & Flow
        </span>
        <h2
          data-reveal
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.9rem, 3.4vw, 2.7rem)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            lineHeight: 1.2,
            marginBottom: 14,
          }}
        >
          How DailyEarn calculates what's actually possible.
        </h2>
        <p
          data-reveal
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.98rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          Most income calculators quote theoretical maximums under ideal conditions. DailyEarn calculates your realistic net income by modeling real-world friction.
        </p>
      </div>

      {/* Horizontal Process Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
          position: 'relative',
        }}
      >
        {steps.map((step, index) => {
          const isActive = activeStep === index;
          return (
            <div
              key={step.number}
              data-reveal
              onMouseEnter={() => setActiveStep(index)}
              className="product-card"
              style={{
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease, box-shadow 0.25s ease',
                transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                borderColor: isActive ? 'rgba(0, 242, 254, 0.35)' : 'var(--border-subtle)',
                boxShadow: isActive ? '0 10px 24px -6px rgba(0, 0, 0, 0.45)' : 'none',
                cursor: 'pointer',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: isActive ? 'var(--accent)' : 'var(--text-muted)',
                        boxShadow: isActive ? '0 0 8px var(--accent)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    />
                    <span
                      style={{
                        fontFamily: 'var(--font-label)',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      STEP {step.number}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-label)',
                      color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                      background: isActive ? 'var(--accent-muted)' : 'var(--bg-surface)',
                      border: `1px solid ${isActive ? 'rgba(0, 242, 254, 0.3)' : 'var(--border)'}`,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isActive ? 'Active Stage' : step.tag}
                  </span>
                </div>

              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.18rem',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: '#FFFFFF',
                  marginBottom: 10,
                  lineHeight: 1.3,
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

            <div
              style={{
                marginTop: 24,
                paddingTop: 16,
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-label)',
              }}
            >
              <step.icon size={15} color="var(--accent)" />
              <span>{step.phase}</span>
            </div>
          </div>
        );
      })}
      </div>
    </section>
  );
}
