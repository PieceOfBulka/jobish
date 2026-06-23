"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ORIENTATION_QUESTIONS,
  MATCH_THRESHOLD,
  randomAnswers,
  type ProfessionMatch,
} from "@/lib/orientation";
import { ArrowRight, ArrowLeft, RotateCcw, Trophy, Loader2, Dice5, Route, Check } from "lucide-react";

export function OrientationQuiz({ done }: { done: boolean }) {
  const t = useTranslations("orientationPage");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [matches, setMatches] = useState<ProfessionMatch[] | null>(null);
  const [hasStrong, setHasStrong] = useState(true);
  const [loading, setLoading] = useState(false);
  const [trackLoading, setTrackLoading] = useState<string | null>(null);
  const [trackChosen, setTrackChosen] = useState<string | null>(null);

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
    setTrackChosen(null);
  }

  async function chooseTrack(slug: string) {
    setTrackLoading(slug);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.ok) {
        setTrackChosen(slug);
        router.refresh();
      }
    } finally {
      setTrackLoading(null);
    }
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
          {matches.map((m, i) => {
            const isChosen = trackChosen === m.slug;
            const isLoadingThis = trackLoading === m.slug;
            return (
              <div key={m.slug} className="card p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm font-bold text-slate-500">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-ink">
                        {t(`professionTitles.${m.slug}` as Parameters<typeof t>[0])}
                      </p>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${m.match >= MATCH_THRESHOLD ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {m.match}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full transition-all ${m.match >= MATCH_THRESHOLD ? "bg-emerald-500" : "bg-brand-500"}`} style={{ width: `${m.match}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">{buildRationale(m)}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => chooseTrack(m.slug)}
                    disabled={isLoadingThis || !!trackChosen}
                    className={`btn-primary flex-1 sm:flex-none ${isChosen ? "bg-emerald-600 border-emerald-600" : ""}`}
                  >
                    {isLoadingThis ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isChosen ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Route className="h-4 w-4" />
                    )}
                    {isChosen ? t("trackChosen") : t("chooseTrack")}
                  </button>
                  <Link href={`/professions/${m.slug}`} className="btn-ghost">
                    {t("viewAnalytics")} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
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
