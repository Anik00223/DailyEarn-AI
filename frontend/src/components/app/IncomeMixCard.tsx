import { Layers, Clock, ArrowRight } from 'lucide-react';
import type { IncomeMixBundle } from '../../types/decision.types';
import { formatINR } from '../../utils/formatCurrency';

interface IncomeMixCardProps {
  mix: IncomeMixBundle;
}

export function IncomeMixCard({ mix }: IncomeMixCardProps) {
  return (
    <section
      style={{
        background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.05) 0%, rgba(20, 20, 30, 0.8) 100%)',
        border: '1px solid rgba(0, 255, 136, 0.3)',
        borderRadius: 'var(--radius-md)',
        padding: '24px 28px',
        marginBottom: 32,
        boxShadow: 'var(--glow-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Layers size={20} color="var(--accent)" />
        <span
          style={{
            fontFamily: 'var(--font-label)',
            fontSize: '0.75rem',
            color: 'var(--accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 700,
          }}
        >
          Target Gap Solution: Dual-Stream Income Mix
        </span>
      </div>

      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: '#fff', margin: '0 0 8px' }}>
        {mix.title}
      </h3>

      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 20px', maxWidth: 800 }}>
        {mix.compatibilityReason}
      </p>

      {/* 2-Column Split View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Stream 1 */}
        <div style={{ background: 'rgba(5, 5, 8, 0.6)', border: '1px solid var(--accent-border)', borderRadius: 8, padding: 16 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-label)' }}>
            Stream 1 (Primary)
          </span>
          <div style={{ fontWeight: 600, color: '#fff', fontSize: '1.05rem', margin: '4px 0 8px' }}>
            {mix.primaryName}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={13} /> {mix.primaryHours} hrs/day
            </span>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
              +{formatINR(mix.primaryNetDaily)}/day net
            </span>
          </div>
        </div>

        {/* Stream 2 */}
        <div style={{ background: 'rgba(5, 5, 8, 0.6)', border: '1px solid var(--accent-border)', borderRadius: 8, padding: 16 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-label)' }}>
            Stream 2 (Complementary)
          </span>
          <div style={{ fontWeight: 600, color: '#fff', fontSize: '1.05rem', margin: '4px 0 8px' }}>
            {mix.secondaryName}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={13} /> {mix.secondaryHours} hrs/day
            </span>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
              +{formatINR(mix.secondaryNetDaily)}/day net
            </span>
          </div>
        </div>
      </div>

      {/* Combined Output Total */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Combined Workload: <b>{mix.combinedHours} hours/day total</b>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Projected Combined Net:</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent)' }}>
            {formatINR(mix.combinedNetDaily)} / day
          </span>
        </div>
      </div>
    </section>
  );
}
