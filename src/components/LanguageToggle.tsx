"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LANG_STORAGE_KEY,
  setLangCookie,
  type Locale,
} from "@/lib/locale";

export function LanguageToggle({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const router = useRouter();

  function switchTo(next: Locale) {
    if (next === locale) return;
    localStorage.setItem(LANG_STORAGE_KEY, next);
    setLangCookie(next);
    router.refresh();
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-sm font-medium text-slate-500",
        className,
      )}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => switchTo("ru")}
        className={cn(
          "rounded px-1.5 py-0.5 transition-colors hover:text-brand-700",
          locale === "ru" && "text-brand-700",
        )}
      >
        RU
      </button>
      <span className="text-slate-300" aria-hidden>
        |
      </span>
      <button
        type="button"
        onClick={() => switchTo("en")}
        className={cn(
          "rounded px-1.5 py-0.5 transition-colors hover:text-brand-700",
          locale === "en" && "text-brand-700",
        )}
      >
        EN
      </button>
    </div>
  );
}
