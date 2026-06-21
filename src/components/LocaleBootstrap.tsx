"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_LOCALE,
  LANG_STORAGE_KEY,
  detectBrowserLocale,
  getLangCookie,
  isLocale,
  setLangCookie,
  type Locale,
} from "@/lib/locale";

export function LocaleBootstrap() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    const cookie = getLangCookie();

    let locale: Locale;
    if (isLocale(stored)) {
      locale = stored;
    } else {
      locale = detectBrowserLocale();
      localStorage.setItem(LANG_STORAGE_KEY, locale);
    }

    if (cookie !== locale) {
      setLangCookie(locale);
      router.refresh();
      return;
    }

    if (!stored) {
      localStorage.setItem(LANG_STORAGE_KEY, locale);
      if (locale !== DEFAULT_LOCALE) {
        router.refresh();
      }
    }
  }, [router]);

  return null;
}
