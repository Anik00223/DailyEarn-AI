import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Cinematic scroll infrastructure.
 *
 * Design decisions:
 *  - Native scrolling + ScrollTrigger scrub (no scroll-jacking). This keeps
 *    trackpad/touch/keyboard scrolling untouched and stays performant.
 *  - Every timeline is created inside a `gsap.context()` scoped to the section
 *    root, so unmount reverts transforms AND kills the ScrollTriggers.
 *  - `prefers-reduced-motion` is honoured by skipping timeline creation; the
 *    DOM's natural (visible) state is the fallback, so no content is ever lost.
 */

let pluginsRegistered = false;

function ensurePlugins(): void {
  if (!pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger);
    pluginsRegistered = true;
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(prefersReducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

export type CineBuild = (scope: HTMLElement, reduced: boolean) => void;

/**
 * Creates a scoped GSAP context for a cinematic section.
 * Returns the ref to attach to the section root element.
 */
export function useCineScope<T extends HTMLElement = HTMLDivElement>(
  build: CineBuild,
  deps: readonly unknown[] = []
) {
  const rootRef = useRef<T>(null);
  const reduced = useReducedMotion();
  const buildRef = useRef(build);
  buildRef.current = build;

  useLayoutEffect(() => {
    ensurePlugins();
    const scope = rootRef.current;
    if (!scope) return;

    const ctx = gsap.context(() => {
      buildRef.current(scope, reduced);
    }, scope);

    // Fonts/images can shift layout after mount; one refresh keeps
    // pinned sections aligned without a scroll-cost loop.
    const raf = window.requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      window.cancelAnimationFrame(raf);
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, ...deps]);

  return rootRef;
}

/**
 * IntersectionObserver-based visibility flag. Used to pause expensive
 * decorative animation (map signal loops, atmosphere) when off-screen.
 */
export function useInViewport<T extends HTMLElement = HTMLDivElement>(
  rootMargin = '220px'
): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setInView(entry.isIntersecting);
      },
      { rootMargin, threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return [ref, inView];
}

/**
 * Shared easing vocabulary for instrument motion — long, smooth, no bounce.
 */
export const CINE_EASE = {
  cine: 'cine',
  instrument: 'power3.out',
  exit: 'power2.in',
  scene: 'none',
} as const;

/**
 * Registers the custom cinematic ease once. Calling repeatedly is safe.
 */
export function registerCineEase(): void {
  if (typeof gsap !== 'undefined' && !gsap.parseEase('cine')) {
    gsap.registerEase('cine', (p: number) => 1 - Math.pow(1 - p, 3.2));
  }
}