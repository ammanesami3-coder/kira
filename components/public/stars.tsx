import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/** Row of 5 rating stars, filled in the brand secondary (gold) color. */
export function Stars({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-0.5", className)} aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < rating
              ? "fill-secondary text-secondary"
              : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}
