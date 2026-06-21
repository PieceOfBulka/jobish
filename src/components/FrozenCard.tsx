"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Lock, CreditCard, PlayCircle, Loader2 } from "lucide-react";

export function FrozenCard({ testId, frozenUntil }: { testId: string; frozenUntil: string }) {
  const t = useTranslations("tests");
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const until = new Date(frozenUntil);
  const dateLocale = locale === "en" ? "en-US" : "ru-RU";

  async function unfreeze(method: "purchase" | "ad") {
    setLoading(method);
    const res = await fetch("/api/tests/unfreeze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testId, method }),
    });
    setLoading(null);
    if (res.ok) router.refresh();
  }

  const formattedDate = until.toLocaleString(dateLocale, {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="card mx-auto max-w-lg p-8 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-500">
        <Lock className="h-7 w-7" />
      </span>
      <h1 className="mt-4 text-xl font-bold text-ink">{t("frozenTitle")}</h1>
      <p className="mt-2 text-sm text-slate-600">
        {t("frozenBody", { date: formattedDate })}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button onClick={() => unfreeze("purchase")} disabled={loading !== null} className="btn-primary">
          {loading === "purchase" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          {t("buyAttempt")}
        </button>
        <button onClick={() => unfreeze("ad")} disabled={loading !== null} className="btn-outline">
          {loading === "ad" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
          {t("watchAd")}
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-400">{t("frozenDemoNote")}</p>
      <Link href="/roadmap" className="btn-ghost mt-4">{t("backToRoadmap")}</Link>
    </div>
  );
}
