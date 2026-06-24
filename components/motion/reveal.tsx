"use client";

import { motion } from "motion/react";

import {
  EASE_OUT,
  REVEAL_VIEWPORT,
  fadeIn,
  fadeInUp,
  scaleIn,
} from "@/lib/animations";

const VARIANTS = { up: fadeInUp, fade: fadeIn, scale: scaleIn } as const;

/**
 * Scroll-reveal wrapper: fades/rises its children in the first time they enter
 * the viewport (`whileInView`, once). Wraps a Server-Component subtree, so the
 * revealed content stays server-rendered and crawlable — only the thin motion
 * shell is client JS. Under `prefers-reduced-motion` the MotionProvider
 * collapses this to a pure opacity fade.
 */
export function Reveal({
  children,
  className,
  variant = "up",
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof VARIANTS;
  delay?: number;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={VARIANTS[variant]}
      initial="hidden"
      whileInView="visible"
      viewport={REVEAL_VIEWPORT}
      transition={delay ? { ...EASE_OUT, delay } : undefined}
    >
      {children}
    </motion.div>
  );
}
