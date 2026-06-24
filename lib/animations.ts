/**
 * Shared Motion variants for the public site.
 *
 * Design rules (CLAUDE.md §6):
 *   - Animate ONLY `transform` and `opacity` so every effect is GPU-composited
 *     and never triggers layout / paint (no CLS, cheap INP).
 *   - Keep durations short and easing gentle for a "premium" feel.
 *   - These are pure data; the client wrappers in `components/motion/*` decide
 *     whether to play them and collapse them to a no-op under
 *     `prefers-reduced-motion`.
 */

import type { Transition, Variants } from "motion/react";

/** Standard entrance easing + duration shared across reveals. */
export const EASE_OUT: Transition = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1],
};

/** Fade + rise. The default scroll-reveal for sections and cards. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: EASE_OUT },
};

/** Plain fade — for elements where vertical motion would feel heavy. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: EASE_OUT },
};

/** Subtle scale-in — for media / badges. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: EASE_OUT },
};

/**
 * Container that staggers its children. Pair with `staggerItem` on each child;
 * the parent orchestrates timing while children carry the actual motion.
 */
export function staggerContainer(stagger = 0.08, delayChildren = 0): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: stagger, delayChildren },
    },
  };
}

/** Child variant for a `staggerContainer`. */
export const staggerItem: Variants = fadeInUp;

/**
 * Shared `whileInView` viewport config: trigger a little before the element is
 * fully on screen, and only once (reveals never replay on scroll-up).
 */
export const REVEAL_VIEWPORT = {
  once: true,
  amount: 0.2,
  margin: "0px 0px -10% 0px",
} as const;
