"use client";

import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

/**
 * 3D tilt wrapper for cards: on desktop hover the card tracks the pointer
 * with a gentle perspective rotation, plus a pointer-following sheen.
 *
 * Performance contract (CLAUDE.md §6):
 *   - transform/opacity only, springs write to `style` off the React render
 *     path, `will-change: transform` pins the card to its own layer.
 *   - Mouse pointers only — touch/pen never tilt (no scroll fighting).
 *   - Under `prefers-reduced-motion` it renders a plain wrapper.
 *
 * Children stay server-rendered; only this thin shell is client JS.
 */
export function TiltCard({
  children,
  className,
  maxTilt = 6,
}: {
  children: React.ReactNode;
  className?: string;
  /** Max rotation in degrees at the card edges. */
  maxTilt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Pointer position within the card, 0..1 (0.5 = center / at rest).
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 220, damping: 24, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 220, damping: 24, mass: 0.6 });

  const rotateX = useTransform(sy, [0, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(sx, [0, 1], [-maxTilt, maxTilt]);

  const sheenX = useTransform(sx, (v) => `${v * 100}%`);
  const sheenY = useTransform(sy, (v) => `${v * 100}%`);
  const sheen = useMotionTemplate`radial-gradient(24rem circle at ${sheenX} ${sheenY}, color-mix(in srgb, var(--primary) 9%, transparent), transparent 65%)`;

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  }

  function onPointerLeave() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      className={`group/tilt relative ${className ?? ""}`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      whileHover={{ scale: 1.015 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 900,
        willChange: "transform",
      }}
    >
      {children}
      {/* Pointer-following sheen. pointer-events-none keeps the card's
          stretched link clickable; rounded to match the card beneath. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100"
        style={{ background: sheen }}
      />
    </motion.div>
  );
}
