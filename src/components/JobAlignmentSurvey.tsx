"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ClipboardList } from "lucide-react";
import { ALIGNMENT_QUESTIONS, type AlignmentResult } from "@/lib/job-alignment";

export function JobAlignmentSurvey({
  initialResult,
  currentPosition,
}: {
  initialResult: AlignmentResult | null;
  currentPosition: string | null;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<AlignmentResult | null>(initialResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const missing = ALIGNMENT_QUESTIONS.some((q) => !answers[q.id]);
    if (missing) {
      setError("Оцените все 5 пунктов по шкале от 1 до 5");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/job-alignment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Ошибка");
      return;
    }
    setResult(data.result);
    router.refresh();
  }

  if (result) {
    const color =
      result.score >= 80
        ? "text-emerald-600"
        : result.score >= 60
          ? "text-amber-600"
          : "text-red-600";
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-brand-600" />
          <h2 className="font-semibold text-ink">Соответствие работы целям</h2>
        </div>
        <p className={`mt-3 text-3xl font-bold ${color}`}>{result.score}%</p>
        <p className="mt-2 text-sm text-slate-600">{result.summary}</p>
        {currentPosition && (
          <p className="mt-2 text-xs text-slate-400">Текущая должность: {currentPosition}</p>
        )}
        <h3 className="mt-4 text-sm font-semibold text-ink">Рекомендации</h3>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
          {result.recommendations.map((r) => (
            <li key={r} className="flex items-start gap-2">
              <span className="text-brand-500">•</span> {r}
            </li>
          ))}
        </ul>
        <button
          onClick={() => {
            setResult(null);
            setAnswers({});
          }}
          className="btn-outline mt-4"
        >
          Пройти заново
        </button>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-brand-600" />
        <h2 className="font-semibold text-ink">Диагностика: работа и цели</h2>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Оцените каждый пункт от 1 (совсем не согласен) до 5 (полностью согласен).
      </p>

      <div className="mt-5 space-y-5">
        {ALIGNMENT_QUESTIONS.map((q) => (
          <div key={q.id}>
            <p className="text-sm font-medium text-ink">
              <span className="text-xs text-brand-600">{q.category} · </span>
              {q.text}
            </p>
            <div className="mt-2 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: n }))}
                  className={`grid h-9 w-9 place-items-center rounded-lg border text-sm font-medium transition-colors ${
                    answers[q.id] === n
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 text-slate-500 hover:border-brand-300"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button onClick={submit} disabled={loading} className="btn-primary mt-5">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Получить отчёт
      </button>
    </div>
  );
}
