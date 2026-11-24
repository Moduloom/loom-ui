export function prefersReducedMotion() {
  return typeof window !== 'undefined' &&
    !document.documentElement.hasAttribute('data-loom-motion-preview') &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
