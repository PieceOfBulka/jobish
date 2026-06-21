"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Upload, Check, Trash2 } from "lucide-react";
import { GRADE_LEVELS, CURRENT_POSITIONS, PREPARATION_LEVELS } from "@/lib/validation";

export interface ProfileData {
  name: string;
  telegramNick: string;
  age: string;
  experienceMonths: string;
  educationPlace: string;
  gradeLevel: string;
  currentSpecialty: string;
  currentPosition: string;
  preparationLevel: string;
  salaryExpectation: string;
  skills: string;
  bio: string;
  resumeFileName: string | null;
}

export function ProfileForm({ initial }: { initial: ProfileData }) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resumeStatus, setResumeStatus] = useState<{ type: "ok" | "warn" | "error"; message: string } | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  function set<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function uploadResume(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingResume(true);
    setResumeStatus(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/resume", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setResumeStatus({ type: "error", message: data.error ?? "Ошибка загрузки" });
      } else {
        set("resumeFileName", data.fileName);
        if (data.warning) {
          setResumeStatus({ type: "warn", message: data.warning });
        } else if (data.resumeText === "extracted") {
          setResumeStatus({ type: "ok", message: "Резюме загружено и прочитано — коуч учтёт его при ответах." });
        } else {
          setResumeStatus({ type: "ok", message: "Файл сохранён." });
        }
      }
    } catch {
      setResumeStatus({ type: "error", message: "Не удалось загрузить файл." });
    } finally {
      setUploadingResume(false);
      e.target.value = "";
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        experienceMonths: Number(form.experienceMonths || 0),
        skills: form.skills
          ? form.skills.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? tCommon("error"));
      return;
    }
    setSaved(true);
    router.refresh();
  }

  async function deleteAccount() {
    if (!confirm(t("deleteConfirm"))) return;
    setDeleting(true);
    const res = await fetch("/api/profile", { method: "DELETE" });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={save} className="card space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t("fullName")}</label>
          <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div>
          <label className="label">{t("telegram")}</label>
          <input className="input" value={form.telegramNick} onChange={(e) => set("telegramNick", e.target.value)} placeholder={t("telegramPlaceholder")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">{t("preparationLevel")}</label>
          <select className="input" value={form.preparationLevel} onChange={(e) => set("preparationLevel", e.target.value)}>
            <option value="">{tCommon("dash")}</option>
            {PREPARATION_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t("currentPosition")}</label>
          <select className="input" value={form.currentPosition} onChange={(e) => set("currentPosition", e.target.value)}>
            <option value="">{tCommon("dash")}</option>
            {CURRENT_POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="experienceMonths">{t("experienceMonths")}</label>
          <input id="experienceMonths" type="number" min={0} max={1000} className="input" value={form.experienceMonths} onChange={(e) => set("experienceMonths", e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="educationPlace">{t("education")}</label>
          <input id="educationPlace" className="input" value={form.educationPlace} onChange={(e) => set("educationPlace", e.target.value)} placeholder={t("educationPlaceholder")} />
        </div>
        <div>
          <label className="label">{t("educationLevel")}</label>
          <select className="input" value={form.gradeLevel} onChange={(e) => set("gradeLevel", e.target.value)}>
            <option value="">{tCommon("dash")}</option>
            {GRADE_LEVELS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t("currentSpecialty")}</label>
          <input className="input" value={form.currentSpecialty} onChange={(e) => set("currentSpecialty", e.target.value)} placeholder={t("specialtyPlaceholder")} />
        </div>
        <div>
          <label className="label">{t("salaryExpectation")}</label>
          <input type="number" min={0} className="input" value={form.salaryExpectation} onChange={(e) => set("salaryExpectation", e.target.value)} placeholder={t("salaryPlaceholder")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t("age")}</label>
          <input type="number" min={0} max={150} className="input" value={form.age} onChange={(e) => set("age", e.target.value)} />
        </div>
        <div>
          <label className="label">{t("resume")}</label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm text-slate-500 hover:border-brand-400">
            {uploadingResume ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {form.resumeFileName || t("chooseFile")}
            <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={uploadResume} disabled={uploadingResume} />
          </label>
          {resumeStatus && (
            <p className={`mt-1 text-xs ${resumeStatus.type === "error" ? "text-red-600" : resumeStatus.type === "warn" ? "text-amber-600" : "text-emerald-600"}`}>
              {resumeStatus.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="skills">{t("skills")}</label>
        <input id="skills" className="input" value={form.skills} onChange={(e) => set("skills", e.target.value)} placeholder={t("skillsPlaceholder")} />
      </div>

      <div>
        <label className="label">{t("about")}</label>
        <textarea className="input min-h-24 resize-y" value={form.bio} onChange={(e) => set("bio", e.target.value)} maxLength={600} />
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {tCommon("save")}
        </button>
        {saved && <span className="inline-flex items-center gap-1 text-sm text-emerald-600"><Check className="h-4 w-4" /> {tCommon("saved")}</span>}
        <button type="button" onClick={deleteAccount} disabled={deleting} className="btn-ghost ml-auto text-red-600 hover:bg-red-50">
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {t("deleteAccount")}
        </button>
      </div>
    </form>
  );
}
