"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Target,
  Sparkles,
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
} from "lucide-react";

interface Goal {
  id?: string;
  title: string;
  horizon: string;
  rationale: string;
}

const HORIZON_PRESETS = [
  "1–3 месяца",
  "6–12 месяцев",
  "1–2 года",
  "2–3 года",
  "3–5 лет",
  "5–10 лет",
  "постоянно",
];

const EMPTY_GOAL: Goal = { title: "", horizon: "", rationale: "" };

function GoalForm({
  value,
  onChange,
  onSave,
  onCancel,
  saving,
  saveLabel = "Сохранить",
}: {
  value: Goal;
  onChange: (g: Goal) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  saveLabel?: string;
}) {
  return (
    <div className="space-y-3">
      <input
        className="input"
        placeholder="Название цели"
        value={value.title}
        onChange={(e) => onChange({ ...value, title: e.target.value })}
      />
      <div>
        <input
          className="input"
          placeholder="Горизонт (например, 1–2 года)"
          value={value.horizon}
          onChange={(e) => onChange({ ...value, horizon: e.target.value })}
          list="goal-horizons"
        />
        <datalist id="goal-horizons">
          {HORIZON_PRESETS.map((h) => (
            <option key={h} value={h} />
          ))}
        </datalist>
      </div>
      <textarea
        className="input min-h-20 resize-y"
        placeholder="Почему эта цель важна и как к ней прийти"
        value={value.rationale}
        onChange={(e) => onChange({ ...value, rationale: e.target.value })}
      />
      <div className="flex gap-2">
        <button type="button" onClick={onSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saveLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className="btn-ghost">
          <X className="h-4 w-4" /> Отмена
        </button>
      </div>
    </div>
  );
}

export function GoalsSection({
  initial,
  hasTrack,
}: {
  initial: Goal[];
  hasTrack: boolean;
}) {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshVariant, setRefreshVariant] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Goal>(EMPTY_GOAL);
  const [adding, setAdding] = useState(false);
  const [manualEdit, setManualEdit] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    const variant = goals.length > 0 ? refreshVariant + 1 : 0;
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variant }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Ошибка");
      return;
    }
    setGoals(data.goals);
    setRefreshVariant(variant);
    setManualEdit(false);
    setEditingId(null);
    setAdding(false);
    router.refresh();
  }

  function startEdit(goal: Goal) {
    if (!goal.id) return;
    setEditingId(goal.id);
    setDraft({ ...goal });
    setAdding(false);
    setError(null);
  }

  function startAdd() {
    setAdding(true);
    setEditingId(null);
    setDraft({ ...EMPTY_GOAL });
    setError(null);
  }

  async function saveEdit() {
    if (!editingId) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, ...draft }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Ошибка сохранения");
      return;
    }
    setGoals((list) => list.map((g) => (g.id === editingId ? data.goal : g)));
    setEditingId(null);
    setManualEdit(true);
    router.refresh();
  }

  async function saveNew() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", ...draft }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Ошибка создания");
      return;
    }
    setGoals((list) => [...list, data.goal]);
    setAdding(false);
    setManualEdit(true);
    router.refresh();
  }

  async function removeGoal(id: string) {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Ошибка удаления");
      return;
    }
    setGoals((list) => list.filter((g) => g.id !== id));
    if (editingId === id) setEditingId(null);
    router.refresh();
  }

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-brand-600" />
          <h2 className="font-semibold text-ink">Карьерные цели</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={startAdd} disabled={loading} className="btn-outline">
            <Plus className="h-4 w-4" /> Добавить
          </button>
          <button onClick={generate} disabled={loading || !hasTrack} className="btn-outline">
            {loading && !editingId && !adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {goals.length ? "Сгенерировать заново" : "Сгенерировать"}
          </button>
        </div>
      </div>

      {!hasTrack && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Для автогенерации пройдите профориентацию или выберите трек. Цели можно добавить и
          отредактировать вручную.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {manualEdit && goals.length > 0 && (
        <p className="mt-2 text-xs text-slate-400">Изменения сохранены вручную.</p>
      )}
      {!manualEdit && goals.length > 0 && hasTrack && (
        <p className="mt-2 text-xs text-slate-400">
          Нажмите карандаш, чтобы отредактировать цель, или «Добавить» для своей формулировки.
        </p>
      )}

      {adding && (
        <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/40 p-4">
          <p className="mb-3 text-sm font-medium text-ink">Новая цель</p>
          <GoalForm
            value={draft}
            onChange={setDraft}
            onSave={saveNew}
            onCancel={() => setAdding(false)}
            saving={loading}
            saveLabel="Добавить цель"
          />
        </div>
      )}

      {goals.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {goals.map((g, i) => (
            <li key={g.id ?? i} className="rounded-xl border border-slate-100 p-4">
              {editingId === g.id ? (
                <GoalForm
                  value={draft}
                  onChange={setDraft}
                  onSave={saveEdit}
                  onCancel={() => setEditingId(null)}
                  saving={loading}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-ink">{g.title}</p>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="badge bg-brand-50 text-brand-700">{g.horizon}</span>
                      {g.id && (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(g)}
                            disabled={loading}
                            className="text-slate-400 hover:text-brand-600"
                            aria-label="Редактировать цель"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeGoal(g.id!)}
                            disabled={loading}
                            className="text-slate-400 hover:text-red-500"
                            aria-label="Удалить цель"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{g.rationale}</p>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        !adding && (
          <p className="mt-4 text-sm text-slate-500">
            Целей пока нет. Добавьте вручную или сгенерируйте на основе трека и опыта.
          </p>
        )
      )}
    </div>
  );
}
