"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  skills: string; // через запятую
  bio: string;
  resumeFileName: string | null;
}

export function ProfileForm(initial: ProfileData) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  function set<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
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
      setError(data.error ?? "Ошибка");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  async function deleteAccount() {
    if (!confirm("Удалить аккаунт и все персональные данные безвозвратно?")) return;
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
          <label className="label">ФИО *</label>
          <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div>
          <label className="label">Telegram (опц.)</label>
          <input className="input" value={form.telegramNick} onChange={(e) => set("telegramNick", e.target.value)} placeholder="@username" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Уровень подготовки *</label>
          <select className="input" value={form.preparationLevel} onChange={(e) => set("preparationLevel", e.target.value)}>
            <option value="">—</option>
            {PREPARATION_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Текущая должность</label>
          <select className="input" value={form.currentPosition} onChange={(e) => set("currentPosition", e.target.value)}>
            <option value="">—</option>
            {CURRENT_POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="experienceMonths">Опыт (месяцев)</label>
          <input id="experienceMonths" type="number" min={0} max={1000} className="input" value={form.experienceMonths} onChange={(e) => set("experienceMonths", e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="educationPlace">Образование (вуз/колледж)</label>
          <input id="educationPlace" className="input" value={form.educationPlace} onChange={(e) => set("educationPlace", e.target.value)} placeholder="НИУ ВШЭ" />
        </div>
        <div>
          <label className="label">Уровень образования</label>
          <select className="input" value={form.gradeLevel} onChange={(e) => set("gradeLevel", e.target.value)}>
            <option value="">—</option>
            {GRADE_LEVELS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Текущая специальность</label>
          <input className="input" value={form.currentSpecialty} onChange={(e) => set("currentSpecialty", e.target.value)} placeholder="Напр. Разработчик" />
        </div>
        <div>
          <label className="label">Зарплатные ожидания (₽, опц.)</label>
          <input type="number" min={0} className="input" value={form.salaryExpectation} onChange={(e) => set("salaryExpectation", e.target.value)} placeholder="150000" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Возраст (опц.)</label>
          <input type="number" min={0} max={150} className="input" value={form.age} onChange={(e) => set("age", e.target.value)} />
        </div>
        <div>
          <label className="label">Резюме (демо-загрузка, PDF/DOCX ≤10МБ)</label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm text-slate-500 hover:border-brand-400">
            <Upload className="h-4 w-4" />
            {form.resumeFileName || "Выбрать файл"}
            <input type="file" accept=".pdf,.doc,.docx" className="hidden"
              onChange={(e) => set("resumeFileName", e.target.files?.[0]?.name ?? null)} />
          </label>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="skills">Навыки (теги через запятую)</label>
        <input id="skills" className="input" value={form.skills} onChange={(e) => set("skills", e.target.value)} placeholder="JavaScript, SQL, ООП" />
      </div>

      <div>
        <label className="label">О себе</label>
        <textarea className="input min-h-24 resize-y" value={form.bio} onChange={(e) => set("bio", e.target.value)} maxLength={600} />
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Сохранить
        </button>
        {saved && <span className="inline-flex items-center gap-1 text-sm text-emerald-600"><Check className="h-4 w-4" /> Сохранено</span>}
        <button type="button" onClick={deleteAccount} disabled={deleting} className="btn-ghost ml-auto text-red-600 hover:bg-red-50">
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Удалить аккаунт и данные
        </button>
      </div>
    </form>
  );
}
