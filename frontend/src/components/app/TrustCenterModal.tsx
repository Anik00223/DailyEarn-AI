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
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
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
        style={{
          background: 'rgba(15, 15, 24, 0.96)',
          border: '1px solid var(--accent-border-h)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--glow-card)',
          width: '100%',
          maxWidth: 640,
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: 28,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={22} color="var(--accent)" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: '#fff', margin: 0 }}>
              Trust, Evidence & Verification Center
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Core Principles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          {/* Section 1 */}
          <div style={{ background: 'rgba(0, 255, 136, 0.04)', border: '1px solid var(--accent-border)', borderRadius: 8, padding: 16 }}>
            <h4 style={{ color: '#fff', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color="var(--accent)" />
              Deterministic Financial Architecture (Zero LLM Math)
            </h4>
            <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.82rem' }}>
              Unlike generic AI chatbots that hallucinate earning numbers, DailyEarn AI calculates every rupee using deterministic TypeScript mathematical engines. Net earnings account for real deductions: verified platform commissions (e.g. Urban Company 22%, Porter 12%, Swiggy 0%), dynamic fuel consumption equations ((distance ÷ mileage) × fuel price), and operating consumables.
            </p>
          </div>

          {/* Section 2: Verification Taxonomy */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--accent-border)', borderRadius: 8, padding: 16 }}>
            <h4 style={{ color: '#fff', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={16} color="#00E5FF" />
              Field-Level Verification Standards
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <div><strong style={{ color: '#00FF88' }}>✓ VERIFIED:</strong> Confirmed against official primary platform documentation or statutory government gazette rules.</div>
              <div><strong style={{ color: '#00E5FF' }}>↻ DYNAMIC:</strong> Payout is variable; determined in real-time by the platform's live algorithmic order rate card & surge.</div>
              <div><strong style={{ color: '#818CF8' }}>≈ ESTIMATED:</strong> Modelled via regional market operating benchmarks and typical throughput rates.</div>
              <div><strong style={{ color: '#FFAA00' }}>⚠ PARTIALLY VERIFIED:</strong> Platform existence confirmed; localized rate card varies by account tier or territory.</div>
              <div><strong style={{ color: '#FF3366' }}>? INSUFFICIENT DATA:</strong> Unverified community estimates; requires ground truth validation before operational commitment.</div>
            </div>
          </div>

          {/* Section 3: Global Disclaimer */}
          <div style={{ background: 'rgba(255, 51, 102, 0.06)', border: '1px solid rgba(255, 51, 102, 0.3)', borderRadius: 8, padding: 16 }}>
            <h4 style={{ color: '#FF3366', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertOctagon size={16} color="#FF3366" />
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
            style={{
              padding: '9px 18px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent)',
              border: 'none',
              color: '#000',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
