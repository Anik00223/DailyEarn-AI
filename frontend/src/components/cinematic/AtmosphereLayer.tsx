import { memo } from 'react';

/**
 * BACKGROUND LAYER — grain + extremely slow atmospheric light.
 *
 * Pure CSS transform/opacity animation (compositor friendly). Never
 * interactive, never above content. Reduced motion is handled in
 * styles/cinematic.css where all keyframes are disabled.
 */

export type SignalKey = 'cyan' | 'violet' | 'mint' | 'amber' | 'coral' | 'blue';

const SIGNAL_RGB: Record<SignalKey, string> = {
  cyan: '46, 230, 214',
  violet: '139, 124, 246',
  mint: '61, 220, 151',
  amber: '245, 178, 60',
  coral: '255, 107, 94',
  blue: '74, 144, 217',
};

interface LightField {
  signal: SignalKey;
  /** centre position as % of the field */
  x: number;
  y: number;
  /** diameter as vmax-ish percentage */
  size: number;
  opacity?: number;
  variant: 'a' | 'b' | 'c';
}

interface AtmosphereLayerProps {
  fields?: LightField[];
  /** Hide the noise plane where it would dull dense data */
  grain?: boolean;
  className?: string;
}

const DEFAULT_FIELDS: LightField[] = [
  { signal: 'blue', x: 14, y: 12, size: 62, opacity: 0.5, variant: 'a' },
  { signal: 'violet', x: 86, y: 24, size: 54, opacity: 0.44, variant: 'b' },
  { signal: 'cyan', x: 52, y: 92, size: 68, opacity: 0.34, variant: 'c' },
];

export const AtmosphereLayer = memo(function AtmosphereLayer({
  fields = DEFAULT_FIELDS,
  grain = true,
  className,
}: AtmosphereLayerProps) {
  return (
    <div className={`cine-atmos${className ? ` ${className}` : ''}`} aria-hidden="true">
      {grain && <div className="cine-grain" />}
      {fields.map((field, index) => {
        const rgb = SIGNAL_RGB[field.signal];
        return (
          <div
            key={`${field.signal}-${index}`}
            className={`cine-light cine-light--${field.variant}`}
            style={{
              left: `${field.x}%`,
              top: `${field.y}%`,
              width: `${field.size}vw`,
              height: `${field.size}vw`,
              marginLeft: `-${field.size / 2}vw`,
              marginTop: `-${field.size / 2}vw`,
              opacity: field.opacity ?? 0.5,
              background: `radial-gradient(circle at 50% 50%, rgba(${rgb}, 0.34) 0%, rgba(${rgb}, 0.12) 42%, transparent 72%)`,
            }}
          />
        );
      })}
    </div>
  );
});