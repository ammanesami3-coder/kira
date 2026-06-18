import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** About + contact CTA band. */
export function AboutSection({ locale }: { locale: string }) {
  const t = useTranslations("home.about");
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <div className="bg-primary text-primary-foreground relative overflow-hidden rounded-3xl px-6 py-12 sm:px-12 md:py-16">
        <div className="relative mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs">
            {t("badge")}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {t("title")}
          </h2>
          <p className="text-primary-foreground/80 mt-4 text-pretty">
            {t("body")}
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8">
            <Link href="/contact" className="gap-2">
              {t("cta")}
              <Arrow className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
