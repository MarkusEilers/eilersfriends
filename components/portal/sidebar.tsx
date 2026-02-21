"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";

export function PortalSidebar() {
  const t = useTranslations("portal");

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card">
      <div className="p-6 border-b">
        <Link href="/" className="font-display text-lg font-bold text-brand-700">
          Eilers & Friends
        </Link>
        <p className="text-xs text-muted-foreground mt-1">Teilnehmer-Portal</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Link
          href="/portal/dashboard"
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
        >
          {t("myPrograms")}
        </Link>
        <Link
          href="/portal/profile"
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors text-muted-foreground"
        >
          Profil
        </Link>
      </nav>
    </aside>
  );
}
