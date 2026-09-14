import { useEffect, useState } from 'react';

/**
 * true when the viewport is too narrow for the pinned cinematic film.
 * In that case the film renders as a static vertical sequence
 * (`.cine-film--static`) instead of the scroll-driven composition.
 */
export function useFilmViewport(breakpoint = 1024): boolean {
  const [compact, setCompact] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = (event: MediaQueryListEvent) => setCompact(event.matches);
    setCompact(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [breakpoint]);

  return compact;
}
