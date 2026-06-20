import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jobish — карьерный коуч-консультант",
  description:
    "Персонализированный путь профессионального развития: AI-коуч, карта развития, тесты и аналитика рынка труда.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${inter.variable} h-full`}>
      {/* suppressHydrationWarning: браузерные расширения добавляют атрибуты
          к <body> (напр. data-gptw) до гидратации React — это не наша рассинхронизация. */}
      <body className="min-h-full" suppressHydrationWarning>{children}</body>
    </html>
  );
}
