"use client";

import { useState } from "react";
import Link from "next/link";
import { ORIENTATION_QUESTIONS, type ProfessionMatch } from "@/lib/orientation";
import { ArrowRight, ArrowLeft, RotateCcw, Trophy, Loader2 } from "lucide-react";

export function OrientationQuiz({ done }: { done: boolean }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [matches, setMatches] = useState<ProfessionMatch[] | null>(null);
  const [loading, setLoading] = useState(false);

  const q = ORIENTATION_QUESTIONS[step];
  const total = ORIENTATION_QUESTIONS.length;
  const selected = answers[q?.id];
  const isLast = step === total - 1;

  function pick(idx: number) {
    setAnswers((a) => ({ ...a, [q.id]: idx }));
  }

  async function submit() {
    setLoading(true);
    const res = await fetch("/api/orientation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setMatches(data.matches);
  }

  function restart() {
    setStep(0);
    setAnswers({});
    setMatches(null);
  }

  if (matches) {
    return (
      <div style={{ animation: "var(--animate-fade-up)" }}>
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <Trophy className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-ink">Ваши подходящие профессии</h2>
            <p className="text-sm text-slate-500">
              Отсортированы по уровню соответствия. Откройте карточку и выберите трек.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {matches.map((m, i) => (
            <Link
              key={m.slug}
              href={`/professions/${m.slug}`}
              className="card card-hover flex items-center justify-between p-5"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-sm font-bold text-slate-500">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-ink">{m.title}</p>
                  <p className="text-xs text-slate-500">соответствие {m.match}%</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden h-2 w-20 overflow-hidden rounded-full bg-slate-100 sm:block">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${m.match}%` }} />
                </div>
                <ArrowRight className="h-4 w-4 text-brand-600" />
              </div>
            </Link>
          ))}
        </div>
        <button onClick={restart} className="btn-ghost mt-6">
          <RotateCcw className="h-4 w-4" /> Пройти заново
        </button>
      </div>
    );
  }

  return (
    <div className="card p-6 sm:p-8" style={{ animation: "var(--animate-fade-up)" }}>
      {done && (
        <p className="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
          Вы уже проходили тест. Можно пройти заново и обновить рекомендации.
        </p>
      )}
      <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
        <span>Вопрос {step + 1} из {total}</span>
        <span>{Math.round(((step) / total) * 100)}%</span>
      </div>
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(step / total) * 100}%` }} />
      </div>

      <h2 className="text-lg font-semibold text-ink sm:text-xl">{q.text}</h2>
      <div className="mt-5 space-y-3">
        {q.options.map((o, idx) => (
          <button
            key={idx}
            onClick={() => pick(idx)}
            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-all ${
              selected === idx
                ? "border-brand-500 bg-brand-50 text-brand-800"
                : "border-slate-200 hover:border-brand-300 hover:bg-slate-50"
            }`}
          >
            <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${selected === idx ? "border-brand-500 bg-brand-500" : "border-slate-300"}`}>
              {selected === idx && <span className="h-2 w-2 rounded-full bg-white" />}
            </span>
            {o.label}
          </button>
        ))}
      </div>

      <div className="mt-7 flex items-center justify-between">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="btn-ghost">
          <ArrowLeft className="h-4 w-4" /> Назад
        </button>
        {isLast ? (
          <button onClick={submit} disabled={selected === undefined || loading} className="btn-primary">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Узнать результат
          </button>
        ) : (
          <button onClick={() => setStep((s) => s + 1)} disabled={selected === undefined} className="btn-primary">
            Далее <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
