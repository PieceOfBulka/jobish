import { getTranslations } from "next-intl/server";
import { Logo } from "./Logo";
import Link from "next/link";

export async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="container-page grid gap-8 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-slate-500">{t("tagline")}</p>
          <p className="mt-4 text-xs text-slate-400">{t("disclaimer")}</p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-ink">{t("product")}</h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li><Link href="/professions" className="hover:text-brand-700">{t("professions")}</Link></li>
            <li><Link href="/pricing" className="hover:text-brand-700">{t("pricing")}</Link></li>
            <li><Link href="/register" className="hover:text-brand-700">{t("register")}</Link></li>
            <li><Link href="/support" className="hover:text-brand-700">{t("support")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-ink">{t("segments")}</h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li>{t("segmentGraduates")}</li>
            <li>{t("segmentCareerChange")}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="container-page flex h-14 items-center justify-between text-xs text-slate-400">
          <span>© {new Date().getFullYear()} Jobish</span>
          <span>{t("madeWithCare")}</span>
        </div>
      </div>
    </footer>
  );
}
