"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface Option { slug: string; title: string }

export function VacancyFilters({
  professions,
  cities,
}: {
  professions: Option[];
  cities: string[];
}) {
  const t = useTranslations("vacancies");
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

  const formatKeys = ["remote", "hybrid", "office"] as const;
  const employmentKeys = ["full", "part", "project"] as const;

  return (
    <form onSubmit={apply} className="card grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label className="label" htmlFor="professionSlug">{t("profession")}</label>
        <select id="professionSlug" name="professionSlug" defaultValue={sp.get("professionSlug") ?? ""} className="input">
          <option value="">{t("anyF")}</option>
          {professions.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="city">{t("city")}</label>
        <select id="city" name="city" defaultValue={sp.get("city") ?? ""} className="input">
          <option value="">{t("anyM")}</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="company">{t("company")}</label>
        <input id="company" name="company" defaultValue={sp.get("company") ?? ""} className="input" placeholder={t("searchPlaceholder")} />
      </div>
      <div>
        <label className="label" htmlFor="format">{t("formatLabel")}</label>
        <select id="format" name="format" defaultValue={sp.get("format") ?? ""} className="input">
          <option value="">{t("anyM")}</option>
          {formatKeys.map((k) => <option key={k} value={k}>{t(`format.${k}`)}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="salaryFrom">{t("salaryFrom")}</label>
        <input id="salaryFrom" name="salaryFrom" type="number" min={0} defaultValue={sp.get("salaryFrom") ?? ""} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="salaryTo">{t("salaryTo")}</label>
        <input id="salaryTo" name="salaryTo" type="number" min={0} defaultValue={sp.get("salaryTo") ?? ""} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="experienceMax">{t("experienceMax")}</label>
        <input id="experienceMax" name="experienceMax" type="number" min={0} max={20} defaultValue={sp.get("experienceMax") ?? ""} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="employment">{t("employmentLabel")}</label>
        <select id="employment" name="employment" defaultValue={sp.get("employment") ?? ""} className="input">
          <option value="">{t("anyF")}</option>
          {employmentKeys.map((k) => <option key={k} value={k}>{t(`employment.${k}`)}</option>)}
        </select>
      </div>
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
        <button type="submit" className="btn-primary">{t("applyFilters")}</button>
        <button type="button" onClick={reset} className="btn-ghost">{t("reset")}</button>
      </div>
    </form>
  );
}
