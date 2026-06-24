"use client";

import { useRef } from "react";
import { useInView } from "motion/react";

/**
 * Lazily-mounted location map. The Google Maps embed (keyless `output=embed`)
 * is a third-party iframe, so we only mount it once it scrolls into view —
 * keeping it off the critical path so it never weighs on LCP/INP. A reserved
 * aspect ratio prevents layout shift while it loads.
 */
export function LocationMap({
  query,
  title,
}: {
  query: string;
  title: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "200px" });

  const src = `https://maps.google.com/maps?q=${encodeURIComponent(
    query,
  )}&z=15&output=embed`;

  return (
    <div
      ref={ref}
      className="bg-muted relative aspect-[16/10] w-full overflow-hidden rounded-xl border"
    >
      {inView && (
        <iframe
          src={src}
          title={title}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 size-full"
        />
      )}
    </div>
  );
}
