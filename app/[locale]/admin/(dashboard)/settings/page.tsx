import { setRequestLocale } from "next-intl/server";

import { getAgencySettings } from "@/server/queries";
import { SettingsForm } from "@/components/admin/settings/settings-form";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const settings = await getAgencySettings().catch(() => null);
  return <SettingsForm settings={settings} />;
}
