import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { resolveBranding } from "@/lib/branding";
import { getAgencySettings } from "@/server/queries";
import { type Locale } from "@/config/site.config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrandLogo } from "@/components/public/brand";
import { LoginForm } from "@/components/admin/login-form";

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.login");
  const settings = await getAgencySettings().catch(() => null);
  const brand = resolveBranding(settings, locale as Locale);

  return (
    <div className="bg-muted/30 flex min-h-dvh items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="flex justify-center pb-2">
            <BrandLogo size="sm" name={brand.name} logo={brand.logo} />
          </div>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
