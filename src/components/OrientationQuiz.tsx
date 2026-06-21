"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ORIENTATION_QUESTIONS,
  MATCH_THRESHOLD,
  randomAnswers,
  type ProfessionMatch,
} from "@/lib/orientation";
import { ArrowRight, ArrowLeft, RotateCcw, Trophy, Loader2, Dice5 } from "lucide-react";

export function OrientationQuiz({ done }: { done: boolean }) {
  const t = useTranslations("orientationPage");
  const tCommon = useTranslations("common");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [matches, setMatches] = useState<ProfessionMatch[] | null>(null);
  const [hasStrong, setHasStrong] = useState(true);
  const [loading, setLoading] = useState(false);

  const q = ORIENTATION_QUESTIONS[step];
  const total = ORIENTATION_QUESTIONS.length;
  const selected = answers[q?.id];
  const isLast = step === total - 1;

  function pick(idx: number) {
    setAnswers((a) => ({ ...a, [q.id]: idx }));
  }

  async function submit(payload: Record<string, number> = answers) {
    setLoading(true);
    const res = await fetch("/api/orientation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: payload }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMatches(data.matches);
      setHasStrong(data.hasStrong);
    }
  }

  function skip() {
    const random = randomAnswers();
    setAnswers(random);
    submit(random);
  }

  function restart() {
    setStep(0);
    setAnswers({});
    setMatches(null);
  }

  // Build a localised rationale from the match score and slug.
  function buildRationale(m: ProfessionMatch): string {
    const cats = Object.entries(
      // re-derive top categories from the slug via profession affinity keys
      // we just show the profession title-level rationale using translation
      {},
    );
    void cats;
    const base = t("rationale.base", { cats: t(`professionTitles.${m.slug}` as Parameters<typeof t>[0]) });
    const detail =
      m.match >= MATCH_THRESHOLD
        ? t("rationale.high", { match: m.match })
        : t("rationale.low", { match: m.match });
    return `${base} ${detail}`;
  }

  if (matches) {
    return (
      <div style={{ animation: "var(--animate-fade-up)" }}>
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <Trophy className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-ink">{t("resultsTitle")}</h2>
            <p className="text-sm text-slate-500">{t("resultsSubtitle")}</p>
          </div>
        </div>
        {!hasStrong && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {t("noStrongMatch")}
          </p>
        )}
        <div className="mt-6 grid gap-4">
          {matches.map((m, i) => (
            <Link
              key={m.slug}
              href={`/professions/${m.slug}`}
              className="card card-hover flex items-start justify-between gap-4 p-5"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm font-bold text-slate-500">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-ink">
                    {t(`professionTitles.${m.slug}` as Parameters<typeof t>[0])}
                    <span className={`ml-2 text-xs font-medium ${m.match >= MATCH_THRESHOLD ? "text-emerald-600" : "text-amber-600"}`}>
                      {m.match}%
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{buildRationale(m)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden h-2 w-20 overflow-hidden rounded-full bg-slate-100 sm:block">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${m.match}%` }} />
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-brand-600" />
              </div>
            </Link>
          ))}
        </div>
        <button onClick={restart} className="btn-ghost mt-6">
          <RotateCcw className="h-4 w-4" /> {t("retake")}
        </button>
      </div>
    );
  }

  const qText = t(`questions.${q?.id}.text` as Parameters<typeof t>[0]);
  const qOptions: string[] = Array.from({ length: q?.options.length ?? 0 }, (_, i) =>
    t(`questions.${q?.id}.options.${i}` as Parameters<typeof t>[0]),
  );

  return (
    <div className="card p-6 sm:p-8" style={{ animation: "var(--animate-fade-up)" }}>
      {done && (
        <p className="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
          {t("alreadyDone")}
        </p>
      )}
      <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
        <span>{t("questionProgress", { current: step + 1, total })}</span>
        <span>{Math.round(((step) / total) * 100)}%</span>
      </div>
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(step / total) * 100}%` }} />
      </div>

      <h2 className="text-lg font-semibold text-ink sm:text-xl">{qText}</h2>
      <div className="mt-5 space-y-3">
        {qOptions.map((label, idx) => (
          <button
            key={idx}
            data-testid="orientation-option"
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
            {label}
          </button>
        ))}
      </div>

      <div className="mt-7 flex items-center justify-between">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="btn-ghost">
          <ArrowLeft className="h-4 w-4" /> {tCommon("back")}
        </button>
        {isLast ? (
          <button onClick={() => submit()} disabled={selected === undefined || loading} className="btn-primary">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("getResult")}
          </button>
        ) : (
          <button onClick={() => setStep((s) => s + 1)} disabled={selected === undefined} className="btn-primary">
            {tCommon("next")} <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-6 border-t border-slate-100 pt-4">
        <button
          onClick={skip}
          disabled={loading}
          data-testid="orientation-skip"
          className="btn-ghost text-slate-500"
        >
          <Dice5 className="h-4 w-4" /> {t("skipDemo")}
        </button>
        <p className="mt-1.5 text-xs text-slate-400">
          {t("skipHelp", { total })}
        </p>
        <p className="mt-3 text-xs text-slate-400">{t("methodology")}</p>
      </div>
    </div>
  );
}
