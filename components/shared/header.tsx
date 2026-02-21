"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";

export function Header() {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold text-brand-700">
            Eilers & Friends
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/programs"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("programs")}
          </Link>
          <Link
            href="/frameworks"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("frameworks")}
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("blog")}
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("about")}
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("contact")}
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {/* Language Switcher placeholder */}
          {/* Auth button placeholder */}
        </div>
      </div>
    </header>
  );
}
