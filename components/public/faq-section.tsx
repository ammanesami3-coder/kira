import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

/**
 * Frequently-asked questions. Rendered with native `<details>`/`<summary>`
 * so it ships zero client JS (great for INP / bundle size) while staying
 * fully accessible and crawlable. The matching `FAQPage` JSON-LD is emitted
 * by the page using `FAQ_KEYS` + the same `faq.items.*` messages.
 */

/** Order of the FAQ entries; shared with the page that builds FAQPage JSON-LD. */
export const FAQ_KEYS = [
  "account",
  "documents",
  "deposit",
  "payment",
  "cancel",
  "delivery",
] as const;

export function FaqSection() {
  const t = useTranslations("faq");

  return (
    <section
      aria-labelledby="faq-heading"
      className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24 lg:px-8"
    >
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2
          id="faq-heading"
          className="text-3xl font-bold tracking-tight sm:text-4xl"
        >
          {t("title")}
        </h2>
        <p className="text-muted-foreground mt-3">{t("subtitle")}</p>
      </div>

      <ul className="space-y-3">
        {FAQ_KEYS.map((key) => (
          <li key={key}>
            <details className="group bg-card rounded-xl border px-5 open:shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium [&::-webkit-details-marker]:hidden">
                {t(`items.${key}.q`)}
                <Plus
                  className="text-muted-foreground size-5 shrink-0 transition-transform group-open:rotate-45"
                  aria-hidden
                />
              </summary>
              <p className="text-muted-foreground pb-5 leading-relaxed text-pretty">
                {t(`items.${key}.a`)}
              </p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
