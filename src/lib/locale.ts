export const LOCALES = ["ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ru";
export const LANG_STORAGE_KEY = "lang";
export const LANG_COOKIE_KEY = "lang";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "ru" || value === "en";
}

export function detectBrowserLocale(): Locale {
  if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("en")) {
    return "en";
  }
  return DEFAULT_LOCALE;
}

export function setLangCookie(locale: Locale) {
  document.cookie = `${LANG_COOKIE_KEY}=${locale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
}

export function getLangCookie(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE_KEY}=([^;]*)`));
  const value = match?.[1];
  return isLocale(value) ? value : null;
}
