"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Car,
  CalendarRange,
  ClipboardList,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/server/auth";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/public/brand";

interface NavItem {
  href: string;
  key: "overview" | "cars" | "availability" | "bookings" | "settings";
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", key: "overview", icon: LayoutDashboard },
  { href: "/admin/cars", key: "cars", icon: Car },
  { href: "/admin/availability", key: "availability", icon: CalendarRange },
  { href: "/admin/bookings", key: "bookings", icon: ClipboardList },
  { href: "/admin/settings", key: "settings", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({
  brandName,
  brandLogo,
}: {
  brandName: string;
  brandLogo: string;
}) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4 shrink-0" />
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="space-y-1 border-t pt-3">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="text-muted-foreground w-full justify-start gap-3"
      >
        <Link href="/" target="_blank" onClick={() => setOpen(false)}>
          <ExternalLink className="size-4" />
          {t("viewSite")}
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        disabled={signingOut}
        className="text-muted-foreground hover:text-destructive w-full justify-start gap-3"
      >
        <LogOut className="size-4" />
        {t("signOut")}
      </Button>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="bg-background sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 md:hidden">
        <BrandLogo size="sm" name={brandName} logo={brandLogo} />
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="Menu"
        >
          <Menu className="size-5" />
        </Button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="bg-background absolute inset-y-0 start-0 flex w-72 max-w-[80%] flex-col gap-4 border-e p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <BrandLogo size="sm" name={brandName} logo={brandLogo} />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="size-5" />
              </Button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="bg-background hidden w-64 shrink-0 flex-col gap-4 border-e p-4 md:sticky md:top-0 md:flex md:h-dvh">
        <Link href="/admin" className="flex items-center gap-2 px-2 py-1">
          <BrandLogo size="sm" name={brandName} logo={brandLogo} />
        </Link>
        {nav}
        {footer}
      </aside>
    </>
  );
}
