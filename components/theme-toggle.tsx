"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

/**
 * Light/dark switcher shared by the public navbar and the admin sidebar.
 *
 * Hydration-safe without a `mounted` guard: the markup renders both icons
 * unconditionally and lets the `dark:` variant decide visibility in CSS, so
 * server and client HTML are identical. The resolved theme is only read at
 * click time.
 */
export function ThemeToggle() {
  const t = useTranslations("common");
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={t("toggleTheme")}
      title={t("toggleTheme")}
      className="group/theme relative overflow-hidden active:scale-90 motion-safe:transition-transform"
    >
      <Sun
        aria-hidden
        className="size-4.5 scale-100 rotate-0 transition-all duration-300 ease-out group-hover/theme:rotate-45 dark:scale-0 dark:-rotate-90"
      />
      <Moon
        aria-hidden
        className="absolute size-4.5 scale-0 rotate-90 transition-all duration-300 ease-out dark:scale-100 dark:rotate-0 dark:group-hover/theme:-rotate-12"
      />
    </Button>
  );
}
