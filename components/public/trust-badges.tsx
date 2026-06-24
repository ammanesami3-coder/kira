import { useTranslations } from "next-intl";
import { Headset, RefreshCw, ShieldCheck, Umbrella } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";

const ITEMS = [
  { key: "secure", Icon: ShieldCheck },
  { key: "insurance", Icon: Umbrella },
  { key: "support", Icon: Headset },
  { key: "flexible", Icon: RefreshCw },
] as const;

/**
 * Trust strip — reassurance badges (secure booking, insurance, 24/7 support,
 * flexible cancellation). Static Server Component; one light reveal on the row.
 */
export function TrustBadges() {
  const t = useTranslations("trust");

  return (
    <section className="border-b">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Reveal
          variant="fade"
          className="grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {ITEMS.map(({ key, Icon }) => (
            <div
              key={key}
              className="flex items-center justify-center gap-2.5 text-center"
            >
              <Icon className="text-primary size-5 shrink-0" aria-hidden />
              <span className="text-sm font-medium text-pretty">{t(key)}</span>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
