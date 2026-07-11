"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { signIn } from "@/server/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * `redirectedFrom` (set by proxy.ts) carries the locale prefix (/fr/admin),
 * but the next-intl router prefixes the active locale itself — strip it so
 * we don't navigate to /fr/fr/admin.
 */
function stripLocalePrefix(path: string): string {
  for (const locale of routing.locales) {
    if (path === `/${locale}`) return "/";
    if (path.startsWith(`/${locale}/`)) return path.slice(locale.length + 1);
  }
  return path;
}

export function LoginForm() {
  const t = useTranslations("admin.login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const result = await signIn(values);
    if (!result.ok) {
      setServerError(
        result.error === "INVALID_CREDENTIALS"
          ? t("invalidCredentials")
          : t("genericError"),
      );
      return;
    }
    // Cookies were set server-side; navigate into the dashboard.
    const raw = searchParams.get("redirectedFrom");
    const target = raw ? stripLocalePrefix(raw) : null;
    router.replace(target?.startsWith("/admin") ? target : "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          dir="ltr"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          dir="ltr"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
      </div>

      {serverError && (
        <p className="text-destructive text-sm" role="alert">
          {serverError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
