import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "./Logo";
import { LanguageToggle } from "./LanguageToggle";
import { getCurrentUser } from "@/lib/auth";
import { LayoutDashboard } from "lucide-react";

export async function Navbar() {
  const user = await getCurrentUser();
  const t = await getTranslations("nav");

  const NAV_LINKS = [
    { href: "/#features", label: t("features") },
    { href: "/professions", label: t("professions") },
    { href: "/pricing", label: t("pricing") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-lg">
      <nav className="container-page flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo />
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle className="mr-1" />
          {user ? (
            <Link href="/dashboard" className="btn-primary">
              <LayoutDashboard className="h-4 w-4" />
              {t("dashboard")}
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost hidden sm:inline-flex">
                {t("login")}
              </Link>
              <Link href="/register" className="btn-primary">
                {t("register")}
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
