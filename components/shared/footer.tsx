"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <span className="font-display text-lg font-bold text-brand-700">
              Eilers & Friends
            </span>
            <p className="mt-2 text-sm text-muted-foreground">
              Unternimm Dich
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold mb-3">Navigation</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/programs" className="hover:text-foreground">
                  Programme
                </Link>
              </li>
              <li>
                <Link href="/frameworks" className="hover:text-foreground">
                  Frameworks
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-foreground">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground">
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-3">Rechtliches</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/legal/imprint" className="hover:text-foreground">
                  {t("imprint")}
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-foreground">
                  {t("privacy")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold mb-3">{t("newsletter")}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {t("newsletterCta")}
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="E-Mail"
                className="flex-1 px-3 py-2 text-sm rounded-md border bg-background"
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors"
              >
                {t("subscribe")}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          {t("copyright", { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}
