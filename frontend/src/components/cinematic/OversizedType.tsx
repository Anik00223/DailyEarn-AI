import { memo, type CSSProperties } from 'react';

/**
 * OVERSIZED TYPOGRAPHY AS A MOTION OBJECT.
 *
 * Each line lives inside its own clip (`.cine-line`), so a parent GSAP
 * timeline can slide the inner `<span>` from beyond the viewport edge and
 * reveal it progressively — a masked reveal, not an opacity fade.
 *
 * The inner spans carry `data-cine-line` plus `data-cine-role` so scroll
 * timelines can target them declaratively without prop drilling.
 */

export type TypeScale = 'hero' | 'display' | 'statement';
export type TypeTone = 'solid' | 'outline' | 'muted';

interface OversizedTypeProps {
  lines: string[];
  scale?: TypeScale;
  tone?: TypeTone;
  /** Reveal direction used by the parent timeline */
  from?: 'left' | 'right' | 'up';
  /** Per-line accent colouring (semantic tokens only) */
  accentLine?: number;
  accentColor?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  style?: CSSProperties;
  /** Unique role used to group timelines, e.g. "stage-1" */
  role?: string;
  as?: 'h1' | 'h2' | 'h3' | 'div' | 'p';
}

export const OversizedType = memo(function OversizedType({
  lines,
  scale = 'display',
  tone = 'solid',
  from = 'up',
  accentLine,
  accentColor = 'var(--sig-cyan)',
  align = 'left',
  className,
  style,
  role = 'type',
  as: Tag = 'div',
}: OversizedTypeProps) {
  const toneClass =
    tone === 'outline' ? ' cine-type--outline' : tone === 'muted' ? ' cine-type--muted' : '';

  const initialTransform =
    from === 'up'
      ? 'translate3d(0, 105%, 0)'
      : from === 'left'
        ? 'translate3d(-40%, 0, 0)'
        : 'translate3d(40%, 0, 0)';

  return (
    <Tag
      className={`cine-type cine-type--${scale}${toneClass}${className ? ` ${className}` : ''}`}
      style={{ textAlign: align, ...style }}
      data-cine-type={role}
    >
      {lines.map((line, index) => {
        const isAccent = accentLine === index;
        return (
          <span className="cine-line" key={`${line}-${index}`}>
            <span
              data-cine-line
              data-cine-role={role}
              data-cine-index={index}
              style={{
                // Natural DOM state is fully visible: if JS never runs (or the
                // user prefers reduced motion) the headline still reads.
                color: isAccent ? accentColor : undefined,
                // consumed by the parent scrub timeline as its start offset
                ['--cine-from' as string]: initialTransform,
              }}
            >
              {line}
            </span>
          </span>
        );
      })}
    </Tag>
  );
});

/**
 * Reads the authored start offset back out for GSAP timelines, falling back
 * to a vertical mask reveal when the CSS variable is unavailable.
 */
export function lineStartOffset(el: HTMLElement, fallback = 'translate3d(0, 105%, 0)'): string {
  const value = getComputedStyle(el).getPropertyValue('--cine-from').trim();
  return value || fallback;
}