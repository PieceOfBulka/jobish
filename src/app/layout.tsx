import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { LocaleBootstrap } from "@/components/LocaleBootstrap";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("siteTitle"),
    description: t("siteDescription"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} h-full`}>
      {/* suppressHydrationWarning: браузерные расширения добавляют атрибуты
          к <body> (напр. data-gptw) до гидратации React — это не наша рассинхронизация. */}
      <body className="min-h-full" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <LocaleBootstrap />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
