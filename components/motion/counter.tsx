"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";
import { useLocale } from "next-intl";

import type { Locale } from "@/config/site.config";

const localeTag: Record<Locale, string> = { ar: "ar-MA", fr: "fr-MA" };

/**
 * Count-up statistic. Renders the final, localized value on the server (so it
 * is correct with JS disabled and for screen readers / SEO), then animates
 * from 0 → value the first time it scrolls into view. Honours
 * `prefers-reduced-motion` by skipping the animation entirely.
 *
 * Only the text content changes during the tween — width is reserved with
 * `tabular-nums` so there is no layout shift (CLS-safe).
 */
export function Counter({
  value,
  suffix = "",
  duration = 1.6,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const locale = useLocale() as Locale;
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();

  const format = (n: number) =>
    `${new Intl.NumberFormat(localeTag[locale]).format(n)}${suffix}`;

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView || reduce) return;
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => {
        el.textContent = format(Math.round(v));
      },
    });
    return () => controls.stop();
    // format is derived from value/suffix/locale; intentionally not a dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce, value, duration]);

  return (
    <span ref={ref} className="tabular-nums" suppressHydrationWarning>
      {format(value)}
    </span>
  );
}
