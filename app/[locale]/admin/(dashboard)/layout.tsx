import { setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { type Locale } from "@/config/site.config";
import { resolveBranding } from "@/lib/branding";
import { createClient } from "@/lib/supabase/server";
import { getAgencySettings } from "@/server/queries";
import { AdminSidebar } from "@/components/admin/sidebar";

/**
 * Protected dashboard shell. The proxy already gates /admin, but we re-check
 * the session here as defence-in-depth (and to keep the layout self-contained
 * if the matcher ever changes). Renders the sidebar + the page content.
 */
export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/admin/login", locale });
  }

  const settings = await getAgencySettings().catch(() => null);
  const brand = resolveBranding(settings, locale as Locale);

  return (
    <div className="bg-muted/20 flex min-h-dvh flex-col md:flex-row">
      <AdminSidebar brandName={brand.name} brandLogo={brand.logo} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
