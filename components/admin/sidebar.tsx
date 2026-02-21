"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";

export function AdminSidebar() {
  const t = useTranslations("admin");

  const navItems = [
    { href: "/admin/dashboard", label: t("dashboard") },
    { href: "/admin/contacts", label: t("contacts") },
    { href: "/admin/companies", label: t("companies") },
    { href: "/admin/enrollments", label: t("enrollments") },
    { href: "/admin/sequences", label: t("sequences") },
    { href: "/admin/reviews", label: t("reviews") },
    { href: "/admin/sparrings", label: t("sparrings") },
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card">
      <div className="p-6 border-b">
        <Link href="/" className="font-display text-lg font-bold text-brand-700">
          Eilers & Friends
        </Link>
        <p className="text-xs text-muted-foreground mt-1">Coach Dashboard</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
