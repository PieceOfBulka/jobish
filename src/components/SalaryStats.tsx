"use client";

import { useEffect, useState } from "react";
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

const AREAS = [
  { id: "113", label: "Вся Россия" },
  { id: "1", label: "Москва" },
  { id: "2", label: "Санкт-Петербург" },
];

const rub = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n) + " ₽";

export function SalaryStats({ slug }: { slug: string }) {
  const [area, setArea] = useState("113");
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);

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
          <TrendingUp className="h-4 w-4 text-brand-500" /> Зарплаты: медиана и перцентили
        </p>
        <div className="flex flex-wrap gap-1">
          {AREAS.map((a) => (
            <button
              key={a.id}
              onClick={() => selectArea(a.id)}
              className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
                area === a.id ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка данных…
        </div>
      ) : s ? (
        <>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-3xl font-bold text-ink">{rub(s.median)}</span>
            <span className="pb-1 text-xs text-slate-400">медиана</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Stat label="25-й перцентиль" value={rub(s.p25)} hint="ниже — четверть" />
            <Stat label="75-й перцентиль" value={rub(s.p75)} hint="выше — четверть" />
            <Stat label="90-й перцентиль" value={rub(s.p90)} hint="топ-офферы" />
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Источник: {data?.source}
            {typeof s.count === "number" ? ` · выборка: ${s.count} вакансий` : ""}
          </p>
        </>
      ) : (
        <p className="mt-6 text-sm text-slate-400">Данных по зарплатам пока нет.</p>
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
