"use client";

import { useEffect, useState } from "react";
import { SSO_UI_PROVIDERS, LAST_SSO_KEY } from "@/components/SsoIcons";
import type { SsoProvider } from "@/lib/sso-core";

function readLastSso(): SsoProvider | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)jobish_last_sso=(google|vk|yandex)(?:;|$)/);
  if (match) return match[1] as SsoProvider;
  const saved = localStorage.getItem(LAST_SSO_KEY);
  if (saved === "google" || saved === "vk" || saved === "yandex") {
    return saved;
  }
  return null;
}

export function SsoButtons({ ssoError }: { ssoError?: string | null }) {
  const [lastUsed, setLastUsed] = useState<SsoProvider | null>(null);

  useEffect(() => {
    setLastUsed(readLastSso());
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-sm text-slate-500">Войти с помощью</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {SSO_UI_PROVIDERS.map(({ code, label, Icon }) => {
          const isLast = lastUsed === code;
          return (
            <a
              key={code}
              href={`/api/auth/sso/${code}`}
              className={`flex items-center justify-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-slate-50 ${
                isLast
                  ? "border-brand-500 ring-1 ring-brand-500/25"
                  : "border-slate-200"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </a>
          );
        })}
      </div>

      {ssoError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {ssoError}
        </p>
      )}

      <p className="text-center text-sm text-slate-500">или продолжить с email</p>
    </div>
  );
}
