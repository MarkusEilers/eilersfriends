import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/lib/i18n/routing";

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
      {children}
    </NextIntlClientProvider>
  );
}
