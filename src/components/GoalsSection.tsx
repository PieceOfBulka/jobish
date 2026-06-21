"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Target, Sparkles } from "lucide-react";

interface Goal {
  id?: string;
  title: string;
  horizon: string;
  rationale: string;
}

export function GoalsSection({
  initial,
  hasTrack,
}: {
  initial: Goal[];
  hasTrack: boolean;
}) {
  const t = useTranslations("goals");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/goals", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? tCommon("error"));
      return;
    }
    setGoals(data.goals);
    router.refresh();
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-brand-600" />
          <h2 className="font-semibold text-ink">{t("title")}</h2>
        </div>
        <button onClick={generate} disabled={loading || !hasTrack} className="btn-outline">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {goals.length ? tCommon("update") : t("generate")}
        </button>
      </div>

      {!hasTrack && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {t("selectTrackWarning")}
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {goals.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {goals.map((g, i) => (
            <li key={g.id ?? i} className="rounded-xl border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-ink">{g.title}</p>
                <span className="badge shrink-0 bg-brand-50 text-brand-700">{g.horizon}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{g.rationale}</p>
            </li>
          ))}
        </ul>
      ) : (
        hasTrack && (
          <p className="mt-4 text-sm text-slate-500">{t("empty")}</p>
        )
      )}
    </div>
  );
}
