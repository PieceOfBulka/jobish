"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, TrendingUp } from "lucide-react";

interface Summary {
  count: number;
  min: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
  max: number;
}
interface Resp {
  source: string;
  live: boolean;
  area: string;
  summary: Summary | null;
}

const AREA_KEYS = [
  { id: "113", key: "allRussia" as const },
  { id: "1", key: "moscow" as const },
  { id: "2", key: "spb" as const },
];

export function SalaryStats({ slug }: { slug: string }) {
  const t = useTranslations("salary");
  const locale = useLocale();
  const [area, setArea] = useState("113");
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);

  const numberLocale = locale === "en" ? "en-US" : "ru-RU";
  const rub = (n: number) =>
    new Intl.NumberFormat(numberLocale, { maximumFractionDigits: 0 }).format(n) + " ₽";

  useEffect(() => {
    let alive = true;
    fetch(`/api/market/salary?slug=${encodeURIComponent(slug)}&area=${area}`)
      .then((r) => r.json())
      .then((d: Resp) => {
        if (alive) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [slug, area]);

  function selectArea(id: string) {
    if (id === area) return;
    setLoading(true);
    setArea(id);
  }

  const s = data?.summary;

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <TrendingUp className="h-4 w-4 text-brand-500" /> {t("title")}
        </p>
        <div className="flex flex-wrap gap-1">
          {AREA_KEYS.map((a) => (
            <button
              key={a.id}
              onClick={() => selectArea(a.id)}
              className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
                area === a.id ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t(a.key)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> {t("loading")}
        </div>
      ) : s ? (
        <>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-3xl font-bold text-ink">{rub(s.median)}</span>
            <span className="pb-1 text-xs text-slate-400">{t("median")}</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Stat label={t("p25")} value={rub(s.p25)} hint={t("p25hint")} />
            <Stat label={t("p75")} value={rub(s.p75)} hint={t("p75hint")} />
            <Stat label={t("p90")} value={rub(s.p90)} hint={t("p90hint")} />
          </div>
          <p className="mt-4 text-xs text-slate-400">
            {t("source", { source: data?.source ?? "" })}
            {typeof s.count === "number" ? t("sample", { count: s.count }) : ""}
          </p>
        </>
      ) : (
        <p className="mt-6 text-sm text-slate-400">{t("noData")}</p>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-sm font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-slate-500">{label}</p>
      <p className="text-[10px] text-slate-400">{hint}</p>
    </div>
  );
}
