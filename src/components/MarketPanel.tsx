"use client";

import type { MarketPanelData } from "@/lib/market";
import { demandBadgeClass, demandLabel } from "@/lib/market";
import { formatRub } from "@/lib/utils";
import { SalaryChart } from "./SalaryChart";
import { Briefcase, TrendingUp } from "lucide-react";

const GRADES = [
  { key: "salaryJunior" as const, label: "Junior" },
  { key: "salaryMiddle" as const, label: "Middle" },
  { key: "salarySenior" as const, label: "Senior" },
];

export function MarketPanel({ data }: { data: MarketPanelData }) {
  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-4 overflow-y-auto xl:flex">
      <div className="card p-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-brand-600" />
          <h2 className="font-semibold text-ink">Аналитика рынка</h2>
        </div>
        <p className="mt-1 text-sm font-medium text-brand-700">{data.title}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`badge ${demandBadgeClass(data.demandLevel)}`}>
            {demandLabel(data.demandLevel)}
          </span>
          <span className="badge bg-slate-100 text-slate-600">
            {new Intl.NumberFormat("ru-RU").format(data.openVacancies)} вакансий
          </span>
        </div>
      </div>

      <div className="card p-4">
        <p className="text-sm font-semibold text-ink">Зарплаты по грейдам</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {GRADES.map((g) => (
            <div key={g.key}>
              <p className="text-xs text-slate-500">{g.label}</p>
              <p className="mt-0.5 text-sm font-bold text-ink">{formatRub(data[g.key])}</p>
            </div>
          ))}
        </div>
        {data.salaryTrend && data.salaryTrend.length > 0 && (
          <div className="mt-3">
            <p className="mb-1 text-xs text-slate-500">Динамика (6 мес.)</p>
            <SalaryChart data={data.salaryTrend} />
          </div>
        )}
      </div>

      {data.topCompanies.length > 0 && (
        <div className="card p-4">
          <p className="text-sm font-semibold text-ink">Топ-компании</p>
          <ul className="mt-3 space-y-2">
            {data.topCompanies.slice(0, 5).map((c) => (
              <li key={c.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-700">
                  <Briefcase className="h-3.5 w-3.5 text-brand-500" /> {c.name}
                </span>
                {c.salary != null && (
                  <span className="font-medium text-ink">{formatRub(c.salary)}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.liveSummary && (
        <div className="card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">hh.ru (live)</p>
          <p className="mt-2 text-sm text-slate-600">{data.liveSummary}</p>
        </div>
      )}
    </aside>
  );
}
