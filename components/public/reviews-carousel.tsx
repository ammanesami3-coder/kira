"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Quote } from "lucide-react";

import type { AgencyReview } from "@/lib/reviews";
import {
  EASE_OUT,
  REVEAL_VIEWPORT,
  staggerContainer,
  staggerItem,
} from "@/lib/animations";
import { Stars } from "@/components/public/stars";

/**
 * Draggable reviews rail for the curated Google reviews. The track is a
 * `drag="x"` motion element constrained to the (overflow-hidden) viewport,
 * so it works with mouse, touch and RTL without any slider library; cards
 * stagger in on first scroll into view.
 *
 * transform-only. Under `prefers-reduced-motion` the rail falls back to a
 * native horizontally scrollable list (keyboard/AT friendly either way —
 * drag adds, never replaces, scroll semantics).
 */
export function ReviewsCarousel({ reviews }: { reviews: AgencyReview[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  return (
    <div
      ref={viewportRef}
      className={
        reduced
          ? "overflow-x-auto"
          : "cursor-grab overflow-hidden active:cursor-grabbing"
      }
    >
      <motion.ul
        className="flex items-stretch gap-5 py-2"
        drag={reduced ? false : "x"}
        dragConstraints={reduced ? undefined : viewportRef}
        variants={staggerContainer(0.07)}
        initial="hidden"
        whileInView="visible"
        viewport={REVEAL_VIEWPORT}
      >
        {reviews.map((review, i) => (
          <motion.li
            key={`${review.author}-${i}`}
            variants={staggerItem}
            transition={EASE_OUT}
            className="glass flex w-[82vw] max-w-sm shrink-0 flex-col gap-4 rounded-2xl p-6 select-none sm:w-96"
          >
            <div className="flex items-center justify-between">
              <Quote className="text-primary/30 size-7" aria-hidden />
              <Stars rating={review.rating} />
            </div>
            <blockquote className="text-sm leading-relaxed text-pretty">
              {review.quote}
            </blockquote>
            <div className="mt-auto flex items-center gap-3 pt-2">
              <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full font-semibold">
                {review.author.charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {review.author}
                </p>
                {review.date && (
                  <p className="text-muted-foreground truncate text-xs">
                    {review.date}
                  </p>
                )}
              </div>
            </div>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
