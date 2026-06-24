"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Expand, ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export interface GalleryImage {
  url: string;
  alt: string;
}

/**
 * Car image gallery with a main image, thumbnail strip and an accessible
 * lightbox (Radix Dialog handles focus trap + Escape; arrow keys page
 * through). The first image is the LCP candidate → eager `priority`.
 */
export function CarGallery({
  images,
  name,
  viewTransitionName,
}: {
  images: GalleryImage[];
  name: string;
  /** Shared-element name to morph from the catalog card image (View
   * Transitions API). Applied to the main image only. */
  viewTransitionName?: string;
}) {
  const t = useTranslations("car");
  const tc = useTranslations("common");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  const current = images[active] ?? images[0];

  if (!current) {
    return (
      <div className="bg-muted text-muted-foreground flex aspect-[4/3] items-center justify-center rounded-xl border">
        <ImageOff className="size-10" aria-hidden />
        <span className="sr-only">{t("noImage")}</span>
      </div>
    );
  }

  const go = (dir: 1 | -1) =>
    setActive((i) => (i + dir + images.length) % images.length);

  return (
    <div className="space-y-3">
      <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-xl border">
        <Image
          src={current.url}
          alt={current.alt}
          fill
          priority
          fetchPriority="high"
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          // Only the primary image (the one shown on the catalog card) carries
          // the shared name, so the morph target is unambiguous.
          style={
            active === 0 && viewTransitionName
              ? { viewTransitionName }
              : undefined
          }
        />
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute end-3 top-3 shadow-sm"
          onClick={() => setOpen(true)}
          aria-label={t("openImage")}
        >
          <Expand className="size-4" aria-hidden />
        </Button>
      </div>

      {images.length > 1 && (
        <ul className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={t("galleryThumb", { n: i + 1 })}
                aria-current={i === active}
                className={cn(
                  "bg-muted focus-visible:ring-ring relative aspect-square w-full overflow-hidden rounded-lg border transition focus-visible:ring-2 focus-visible:outline-none",
                  i === active
                    ? "ring-primary ring-2"
                    : "opacity-70 hover:opacity-100",
                )}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="20vw"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-4xl gap-2 p-3 sm:p-4"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(1);
            if (e.key === "ArrowLeft") go(-1);
          }}
        >
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <div className="bg-muted relative aspect-[4/3] w-full overflow-hidden rounded-lg">
            <Image
              src={current.url}
              alt={current.alt}
              fill
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-contain"
            />
          </div>
          {images.length > 1 && (
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => go(-1)}
                aria-label={tc("previous")}
              >
                <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
              </Button>
              <span className="text-muted-foreground text-sm tabular-nums">
                {active + 1} / {images.length}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => go(1)}
                aria-label={tc("next")}
              >
                <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
