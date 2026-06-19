"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FORMAT_LABELS, EMPLOYMENT_LABELS } from "@/lib/vacancies";

interface Option { slug: string; title: string }

export function VacancyFilters({
  professions,
  cities,
}: {
  professions: Option[];
  cities: string[];
}) {
  const router = useRouter();
  const sp = useSearchParams();

  function apply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const [k, v] of fd.entries()) {
      if (String(v).trim()) params.set(k, String(v));
    }
    router.push(`/vacancies?${params.toString()}`);
  }

  function reset() {
    router.push("/vacancies");
  }

  return (
    <form onSubmit={apply} className="card grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label className="label" htmlFor="professionSlug">Профессия</label>
        <select id="professionSlug" name="professionSlug" defaultValue={sp.get("professionSlug") ?? ""} className="input">
          <option value="">Любая</option>
          {professions.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="city">Город</label>
        <select id="city" name="city" defaultValue={sp.get("city") ?? ""} className="input">
          <option value="">Любой</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="company">Компания</label>
        <input id="company" name="company" defaultValue={sp.get("company") ?? ""} className="input" placeholder="Поиск по названию" />
      </div>
      <div>
        <label className="label" htmlFor="format">Формат</label>
        <select id="format" name="format" defaultValue={sp.get("format") ?? ""} className="input">
          <option value="">Любой</option>
          {Object.entries(FORMAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="salaryFrom">ЗП от, ₽</label>
        <input id="salaryFrom" name="salaryFrom" type="number" min={0} defaultValue={sp.get("salaryFrom") ?? ""} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="salaryTo">ЗП до, ₽</label>
        <input id="salaryTo" name="salaryTo" type="number" min={0} defaultValue={sp.get("salaryTo") ?? ""} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="experienceMax">Опыт до, лет</label>
        <input id="experienceMax" name="experienceMax" type="number" min={0} max={20} defaultValue={sp.get("experienceMax") ?? ""} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="employment">Занятость</label>
        <select id="employment" name="employment" defaultValue={sp.get("employment") ?? ""} className="input">
          <option value="">Любая</option>
          {Object.entries(EMPLOYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
        <button type="submit" className="btn-primary">Применить фильтры</button>
        <button type="button" onClick={reset} className="btn-ghost">Сбросить</button>
      </div>
    </form>
  );
}
