"use client";

import { MotionConfig } from "motion/react";

/**
 * Site-wide Motion configuration. `reducedMotion="user"` makes every Motion
 * animation honour the OS-level `prefers-reduced-motion` setting: transform
 * and layout animations are skipped (only opacity is allowed through), so the
 * whole animation layer self-disables for users who ask for less motion —
 * with no per-component branching.
 *
 * Children are a Server-Component subtree passed straight through, so wrapping
 * the public layout in this client boundary costs no extra client JS for the
 * page content itself.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
