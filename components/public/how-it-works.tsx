import { useTranslations } from "next-intl";
import { CalendarDays, Car, KeyRound } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";

const STEPS = [
  { key: "step1", Icon: Car },
  { key: "step2", Icon: CalendarDays },
  { key: "step3", Icon: KeyRound },
] as const;

/**
 * "How it works" — booking in three steps. Server-rendered content; only the
 * thin scroll-reveal / stagger shells are client JS.
 */
export function HowItWorks() {
  const t = useTranslations("howItWorks");

  return (
    <section
      id="how-it-works"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8"
    >
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
        <p className="text-muted-foreground mt-3">{t("subtitle")}</p>
      </Reveal>

      <Stagger className="mt-14 grid gap-10 sm:grid-cols-3" stagger={0.12}>
        {STEPS.map(({ key, Icon }, i) => (
          <StaggerItem
            key={key}
            className="relative flex flex-col items-center gap-4 text-center"
          >
            <div className="relative">
              <span className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-2xl">
                <Icon className="size-7" aria-hidden />
              </span>
              <span className="bg-secondary text-secondary-foreground absolute -end-2 -top-2 flex size-7 items-center justify-center rounded-full text-sm font-bold shadow-sm">
                {i + 1}
              </span>
            </div>
            <h3 className="text-lg font-semibold">{t(`${key}.title`)}</h3>
            <p className="text-muted-foreground max-w-xs text-sm text-pretty">
              {t(`${key}.desc`)}
            </p>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
