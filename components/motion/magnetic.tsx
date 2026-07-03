"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";

/**
 * Magnetic hover: the wrapped element is gently pulled toward the pointer
 * while hovered and springs back to rest on leave. Wrap a single CTA — the
 * pull distance is a fraction (`strength`) of the pointer's offset from the
 * element center, so it stays subtle on any size.
 *
 * transform-only (x/y springs written outside the React render path),
 * mouse pointers only, plain wrapper under `prefers-reduced-motion`.
 */
export function Magnetic({
  children,
  className,
  strength = 0.25,
}: {
  children: React.ReactNode;
  className?: string;
  /** Fraction of the pointer offset applied as pull. Keep ≤ 0.35. */
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 260, damping: 18, mass: 0.5 });
  const y = useSpring(my, { stiffness: 260, damping: 18, mass: 0.5 });

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - (rect.left + rect.width / 2)) * strength);
    my.set((e.clientY - (rect.top + rect.height / 2)) * strength);
  }

  function onPointerLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={`inline-block ${className ?? ""}`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{ x, y }}
    >
      {children}
    </motion.div>
  );
}
