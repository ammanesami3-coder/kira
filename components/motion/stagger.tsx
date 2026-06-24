"use client";

import { motion } from "motion/react";

import {
  REVEAL_VIEWPORT,
  staggerContainer,
  staggerItem,
} from "@/lib/animations";

/**
 * Container that reveals its `StaggerItem` children one after another as the
 * group scrolls into view. Use for card grids (fleet categories, featured
 * cars, catalog results) — pass the grid classes straight to `className`.
 */
export function Stagger({
  children,
  className,
  stagger = 0.08,
  delayChildren = 0,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer(stagger, delayChildren)}
      initial="hidden"
      whileInView="visible"
      viewport={REVEAL_VIEWPORT}
    >
      {children}
    </motion.div>
  );
}

/** A single item inside a `Stagger`. Carries the fade/rise motion. */
export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  );
}
