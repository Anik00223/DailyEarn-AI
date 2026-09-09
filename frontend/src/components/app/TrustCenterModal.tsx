import { X, ShieldCheck, FileText, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface TrustCenterModalProps {
  onClose: () => void;
}

export function TrustCenterModal({ onClose }: TrustCenterModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 160,
        background: 'rgba(2, 6, 9, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="obsidian-card"
        style={{
          borderRadius: 24,
          width: '100%',
          maxWidth: 640,
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: 32,
          border: '1px solid rgba(0, 242, 254, 0.22)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 242, 254, 0.08)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-label)',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                marginBottom: 6,
              }}
            >
              // VERIFICATION PROTOCOL
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck size={22} color="var(--accent)" />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Trust & Verification Center
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Core Principles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          {/* Section 1 */}
          <div
            style={{
              background: 'rgba(6, 24, 34, 0.7)',
              border: '1px solid rgba(0, 242, 254, 0.2)',
              borderRadius: 14,
              padding: 18,
            }}
          >
            <h4 style={{ color: '#fff', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.92rem' }}>
              <CheckCircle2 size={16} color="var(--accent)" />
              Deterministic Financial Architecture (Zero LLM Math)
            </h4>
            <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Unlike generic AI chatbots that hallucinate earning numbers, DailyEarn AI calculates every rupee using deterministic TypeScript mathematical engines. Net earnings account for real deductions: verified platform commissions (e.g. Urban Company 22%, Porter 12%, Swiggy 0%), dynamic fuel consumption equations ((distance ÷ mileage) × fuel price), and operating consumables.
            </p>
          </div>

          {/* Section 2: Verification Taxonomy */}
          <div
            style={{
              background: 'rgba(6, 18, 26, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: 18,
            }}
          >
            <h4 style={{ color: '#fff', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.92rem' }}>
              <FileText size={16} color="var(--accent)" />
              Field-Level Verification Standards
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <div><strong style={{ color: 'var(--accent)' }}>✓ VERIFIED:</strong> Confirmed against official primary platform documentation or statutory government gazette rules.</div>
              <div><strong style={{ color: '#72F6FF' }}>↻ DYNAMIC:</strong> Payout is variable; determined in real-time by the platform's live algorithmic order rate card & surge.</div>
              <div><strong style={{ color: '#818CF8' }}>≈ ESTIMATED:</strong> Modelled via regional market operating benchmarks and typical throughput rates.</div>
              <div><strong style={{ color: '#FFAA00' }}>⚠ PARTIALLY VERIFIED:</strong> Platform existence confirmed; localized rate card varies by account tier or territory.</div>
              <div><strong style={{ color: 'var(--danger)' }}>? INSUFFICIENT DATA:</strong> Unverified community estimates; requires ground truth validation before operational commitment.</div>
            </div>
          </div>

          {/* Section 3: Global Disclaimer */}
          <div
            style={{
              background: 'rgba(28, 10, 16, 0.7)',
              border: '1px solid rgba(255, 77, 106, 0.25)',
              borderRadius: 14,
              padding: 18,
            }}
          >
            <h4 style={{ color: 'var(--danger)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.92rem' }}>
              <AlertOctagon size={16} color="var(--danger)" />
              Official Earnings Disclaimer
            </h4>
            <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.85)' }}>
              Earnings shown by DailyEarn AI are modelled estimates and evidence-backed heuristics, not guaranteed income. Actual earnings depend on demand, platform policies, location, expenses, experience, pricing, and execution. Modeled earning ceilings represent calculated upper operating boundaries, not promises.
            </p>
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <button
            onClick={onClose}
            className="btn-cyan-pill"
            style={{
              padding: '10px 24px',
              fontSize: '0.82rem',
              borderRadius: 50,
            }}
          >
            ACKNOWLEDGE & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
