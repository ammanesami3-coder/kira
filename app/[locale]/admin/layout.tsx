import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { QueryProvider } from "@/components/admin/query-provider";

// The whole dashboard is private — never index it.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Admin segment root. Provides the TanStack Query client to every admin
 * route (login + dashboard). Auth protection lives in the proxy (middleware)
 * and is re-checked in the protected `(dashboard)` layout.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <QueryProvider>{children}</QueryProvider>;
}
