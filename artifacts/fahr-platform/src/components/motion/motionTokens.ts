// Shared motion tokens for the admin and leadership surfaces.
//
// One set of durations, easings and stagger gaps so the manager, entity, FAHR
// and leadership consoles move the same way instead of each picking its own.

export const MOTION = {
  duration: {
    /** Hover, focus and small state changes. */
    fast: 0.18,
    /** Card and row reveals. */
    base: 0.42,
    /** Page enter and chart draw-in. */
    slow: 0.6,
  },
  /** Gap between items in a staggered reveal, in seconds. */
  stagger: {
    cards: 0.07,
    rows: 0.035,
  },
  ease: {
    /** framer-motion cubic bezier — settles without overshoot. */
    out: [0.22, 1, 0.36, 1] as const,
    /** GSAP equivalent. */
    gsapOut: "power2.out",
  },
  /** Distance blocks travel into place, in pixels. */
  travel: {
    page: 16,
    card: 14,
    row: 8,
  },
} as const;

/** Media query used by the GSAP-driven pieces, which cannot read the hook. */
export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
