import { useTranslations } from "next-intl";
import { CalendarCheck, Tag, Car, Headset } from "lucide-react";

const ITEMS = [
  { key: "noSignup", Icon: CalendarCheck },
  { key: "transparent", Icon: Tag },
  { key: "fleet", Icon: Car },
  { key: "support", Icon: Headset },
] as const;

/** Static "why choose us" section — pure Server Component, zero client JS. */
export function ValueProps() {
  const t = useTranslations("home.valueProps");

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
        <p className="text-muted-foreground mt-3">{t("subtitle")}</p>
      </div>

      <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ key, Icon }) => (
          <li
            key={key}
            className="bg-card flex flex-col items-center gap-3 rounded-xl border p-6 text-center"
          >
            <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
              <Icon className="size-6" aria-hidden />
            </span>
            <h3 className="font-semibold">{t(`${key}.title`)}</h3>
            <p className="text-muted-foreground text-sm text-pretty">
              {t(`${key}.desc`)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
