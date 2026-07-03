"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Class-strategy dark mode (`.dark` on <html>, matching the tokens in
 * globals.css). next-themes injects a tiny blocking script that applies the
 * stored/system preference before first paint — no flash of the wrong theme.
 * `<html suppressHydrationWarning>` (already set in the locale layout)
 * absorbs the class/style mismatch that script creates.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
