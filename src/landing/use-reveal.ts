import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

/**
 * Marks an element once it has scrolled into view.
 *
 * One-way on purpose: elements do not un-reveal when they leave. A page that fades
 * things back out flickers when you scroll up.
 *
 * With no `IntersectionObserver` — an old browser, or jsdom — everything reveals
 * immediately. Content that never appears because the animation never fired is a
 * worse failure than content that arrives without one.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  // With no IntersectionObserver — an old browser, or jsdom — start revealed rather
  // than reveal from an effect. Content that never appears because an animation never
  // fired is a worse failure than content that arrives without one.
  const [shown, setShown] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const element = ref.current;
    if (element === null || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, shown };
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function subscribeToMotion(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => {};

  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function motionIsReduced(): boolean {
  if (typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(REDUCED_MOTION).matches;
}

/**
 * Whether the reader has asked for less motion.
 *
 * `useSyncExternalStore` rather than state set from an effect: the preference lives
 * outside React and can change while the page is open, which is exactly what this
 * hook is for. The effect version also rendered once with the wrong answer before
 * correcting itself, so a reduced-motion reader got one animated frame.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeToMotion, motionIsReduced, () => false);
}
