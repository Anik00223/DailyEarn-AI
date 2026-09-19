import { describe, it, expect } from 'vitest';
import { collapseInferencePrefixes } from './decision.prompt';

describe('AI tip prefix normalization (live-observed doubled-prefix defect)', () => {
  const P = 'General model inference: ';

  it('collapses a doubled prefix to exactly one', () => {
    const in2 = `${P}${P}Explore local retail markets in Bangalore.`;
    const out = collapseInferencePrefixes(in2);
    expect(out.startsWith(P)).toBe(true);
    expect(out).toBe(`${P}Explore local retail markets in Bangalore.`);
    expect(out.match(new RegExp(P, 'g'))?.length).toBe(1);
  });

  it('collapses tripled prefixes', () => {
    const out = collapseInferencePrefixes(`${P}${P}${P}Tip body here.`);
    expect(out).toBe(`${P}Tip body here.`);
  });

  it('preserves a single valid prefix untouched', () => {
    const t = `${P}Leverage residential areas in your area in Silchar.`;
    expect(collapseInferencePrefixes(t)).toBe(t);
  });

  it('preserves a tip with no prefix (deterministic fallback path)', () => {
    const t = 'General city-level inference: Focus on high-footfall markets.';
    expect(collapseInferencePrefixes(t)).toBe(t);
  });

  it('trims stray whitespace inside the normalized tip', () => {
    expect(collapseInferencePrefixes(`${P}   Body text.  `)).toBe(`${P}Body text.`);
  });

  it('is safe on empty input', () => {
    expect(collapseInferencePrefixes('')).toBe('');
  });
});
