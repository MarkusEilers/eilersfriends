import type { Metadata } from "next";

export const dynamic = 'force-dynamic';
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/lib/i18n/routing";
import Navigation from "@/components/shared/navigation";
import Footer from "@/components/shared/footer";
import CookieBanner from "@/components/shared/cookie-banner";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: {
    default: "Eilers & Friends | Unternimm Dich",
    template: "%s | Eilers & Friends",
  },
  description:
    "Coaching-Programme für nachhaltiges Wachstum. Von der Vertriebsexzellenz bis zur Führungskompetenz.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <Navigation />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
      <CookieBanner />
    </NextIntlClientProvider>
  );
}
