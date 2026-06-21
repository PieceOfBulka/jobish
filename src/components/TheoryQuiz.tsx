"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle, Lock, Clock } from "lucide-react";

interface Question {
  id: string;
  text: string;
  options: string[];
  topic: string;
}

interface Result {
  score: number;
  passed: boolean;
  weakTopics: string[];
  strongTopics: string[];
  frozenUntil: string | null;
  total: number;
  correctCount: number;
  conclusion: string;
  recommendations: { title: string; url: string; provider: string }[];
}

export function TheoryQuiz({
  testId,
  title,
  questions,
}: {
  testId: string;
  title: string;
  questions: Question[];
}) {
  const t = useTranslations("tests");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;
  const dateLocale = locale === "en" ? "en-US" : "ru-RU";

  async function submit() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/tests/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testId, answers }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? tCommon("error"));
      return;
    }
    setResult(data);
    router.refresh();
  }

  if (result) {
    const frozenUntil = result.frozenUntil ? new Date(result.frozenUntil) : null;
    const statusText = result.passed ? t("passedExclaim") : t("needImprovement");
    return (
      <div className="card p-8 text-center" style={{ animation: "var(--animate-fade-up)" }}>
        <span className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${result.passed ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
          {result.passed ? <CheckCircle2 className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
        </span>
        <h2 className="mt-4 text-2xl font-bold text-ink">{result.score}%</h2>
        <p className="text-slate-600">
          {t("resultSummary", {
            correct: result.correctCount,
            total: result.total,
            status: statusText,
          })}
        </p>

        {result.strongTopics.length > 0 && (
          <div className="mt-5 text-left">
            <p className="text-sm font-medium text-emerald-700">{t("strongTopics")}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {result.strongTopics.map((topic) => (
                <span key={topic} className="badge bg-emerald-50 text-emerald-700">{topic}</span>
              ))}
            </div>
          </div>
        )}
        {result.weakTopics.length > 0 && (
          <div className="mt-4 text-left">
            <p className="text-sm font-medium text-amber-700">{t("weakTopics")}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {result.weakTopics.map((topic) => (
                <span key={topic} className="badge bg-amber-50 text-amber-700">{topic}</span>
              ))}
            </div>
          </div>
        )}

        <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-left text-sm text-slate-600">
          {result.conclusion}
        </p>

        {result.recommendations.length > 0 && (
          <div className="mt-4 text-left">
            <p className="text-sm font-medium text-ink">{t("recommendations")}</p>
            <ul className="mt-2 space-y-1.5">
              {result.recommendations.map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-brand-600 hover:underline">
                    {r.title} <span className="text-xs text-slate-400">· {r.provider}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!result.passed && frozenUntil && (
          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            <Lock className="h-4 w-4" />
            {t("frozenUntil", {
              date: frozenUntil.toLocaleString(dateLocale, {
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              }),
            })}
          </div>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <Link href="/tests" className="btn-outline">{t("toTestsList")}</Link>
          <Link href="/roadmap" className="btn-primary">{t("toRoadmap")}</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">{title}</h1>
        <span className="text-sm text-slate-500">
          <Clock className="mr-1 inline h-4 w-4" />
          {answeredCount}/{questions.length}
        </span>
      </div>

      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={q.id} className="card p-6">
            <p className="font-medium text-ink">
              {qi + 1}. {q.text}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {q.options.map((o, idx) => {
                const sel = answers[q.id] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: idx }))}
                    className={`rounded-xl border px-4 py-2.5 text-left text-sm transition-all ${
                      sel
                        ? "border-brand-500 bg-brand-50 text-brand-800"
                        : "border-slate-200 hover:border-brand-300 hover:bg-slate-50"
                    }`}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <button onClick={submit} disabled={!allAnswered || loading} className="btn-primary mt-6 w-full sm:w-auto">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("finish")}
      </button>
      {!allAnswered && (
        <p className="mt-2 text-sm text-slate-400">{t("answerAll")}</p>
      )}
    </div>
  );
}
