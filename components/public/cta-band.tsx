import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";

/**
 * Closing call-to-action band. Two clear next steps: browse the fleet or get
 * in touch. Pure Server Component wrapped in a single scroll-reveal.
 */
export function CtaBand({ locale }: { locale: string }) {
  const t = useTranslations("cta");
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <Reveal
        className="bg-primary relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12 md:py-20"
        style={{
          backgroundImage:
            "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 80%, var(--secondary)))",
        }}
      >
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-primary-foreground text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {t("title")}
          </h2>
          <p className="text-primary-foreground/80 mt-4 text-pretty">
            {t("subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="/cars" className="gap-2">
                {t("primary")}
                <Arrow className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground bg-transparent"
            >
              <Link href="/contact">{t("secondary")}</Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
