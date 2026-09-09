import { Layers, Clock, ArrowRight } from 'lucide-react';
import type { IncomeMixBundle } from '../../types/decision.types';
import { formatINR } from '../../utils/formatCurrency';

interface IncomeMixCardProps {
  mix: IncomeMixBundle;
}

export function IncomeMixCard({ mix }: IncomeMixCardProps) {
  return (
    <section
      className="product-card"
      style={{
        borderRadius: 'var(--radius-md)',
        padding: '26px 30px',
        marginBottom: 30,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Layers size={17} color="var(--accent)" />
        <span
          style={{
            fontFamily: 'var(--font-label)',
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 600,
          }}
        >
          Target Gap Resolution · Multi-Stream Combination
        </span>
      </div>

      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
        {mix.title}
      </h3>

      <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 22px', maxWidth: 820 }}>
        {mix.compatibilityReason}
      </p>

      {/* 2-Column Split View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Stream 1 */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 18 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-label)', letterSpacing: '0.06em' }}>
            Primary Stream
          </span>
          <div style={{ fontWeight: 600, color: '#fff', fontSize: '1.05rem', margin: '4px 0 10px' }}>
            {mix.primaryName}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} color="var(--accent)" /> {mix.primaryHours} hrs/day
            </span>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
              +{formatINR(mix.primaryNetDaily)}/day net
            </span>
          </div>
        </div>

        {/* Stream 2 */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 18 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-label)', letterSpacing: '0.06em' }}>
            Secondary Stream
          </span>
          <div style={{ fontWeight: 600, color: '#fff', fontSize: '1.05rem', margin: '4px 0 10px' }}>
            {mix.secondaryName}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} color="var(--accent)" /> {mix.secondaryHours} hrs/day
            </span>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
              +{formatINR(mix.secondaryNetDaily)}/day net
            </span>
          </div>
        </div>
      </div>

      {/* Combined Output Total */}
      <div
        style={{
          marginTop: 18,
          paddingTop: 16,
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
          Combined Allocation: <strong style={{ color: '#fff' }}>{mix.combinedHours} hours/day total</strong>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-label)', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Projected Combined Net:
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              fontWeight: 700,
              color: 'var(--accent)',
            }}
          >
            {formatINR(mix.combinedNetDaily)} <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ day</span>
          </span>
        </div>
      </div>
    </section>
  );
}
