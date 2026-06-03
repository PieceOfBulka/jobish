"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, Check } from "lucide-react";

interface Props {
  name: string;
  currentRole: string;
  experienceYears: number;
  bio: string;
  resumeFileName: string | null;
}

export function ProfileForm(initial: Props) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof Props>(key: K, value: Props[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        currentRole: form.currentRole,
        experienceYears: Number(form.experienceYears),
        bio: form.bio,
        resumeFileName: form.resumeFileName ?? "",
      }),
    });
    setLoading(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <form onSubmit={save} className="card space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Имя</label>
          <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required minLength={2} />
        </div>
        <div>
          <label className="label">Текущая должность</label>
          <input className="input" value={form.currentRole} onChange={(e) => set("currentRole", e.target.value)} placeholder="Напр. Студент, Junior-аналитик" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Опыт работы (лет)</label>
          <input type="number" min={0} max={60} className="input" value={form.experienceYears} onChange={(e) => set("experienceYears", Number(e.target.value) as Props["experienceYears"])} />
        </div>
        <div>
          <label className="label">Резюме (демо-загрузка)</label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm text-slate-500 hover:border-brand-400">
            <Upload className="h-4 w-4" />
            {form.resumeFileName || "Выбрать файл (PDF/DOCX)"}
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => set("resumeFileName", e.target.files?.[0]?.name ?? null)}
            />
          </label>
        </div>
      </div>
      <div>
        <label className="label">О себе</label>
        <textarea className="input min-h-24 resize-y" value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Коротко о ваших интересах и целях" maxLength={600} />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Сохранить
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
            <Check className="h-4 w-4" /> Сохранено
          </span>
        )}
      </div>
    </form>
  );
}
