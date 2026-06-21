"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle, Lock, Clock } from "lucide-react";

type QuestionType = "single" | "multiple" | "scale" | "text";

interface Question {
  id: string;
  text: string;
  options: string[];
  topic: string;
  type: QuestionType;
  weight: number;
}

type AnswerValue = number | number[] | string;

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
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  function isAnswered(q: Question): boolean {
    const v = answers[q.id];
    if (v === undefined) return false;
    if (q.type === "multiple") return Array.isArray(v) && v.length > 0;
    if (q.type === "text") return typeof v === "string" && v.trim().length > 0;
    return true; // single (number) and scale (number)
  }

  const answeredCount = questions.filter(isAnswered).length;
  const allAnswered = answeredCount === questions.length;
  const dateLocale = locale === "en" ? "en-US" : "ru-RU";

  function setSingle(qId: string, idx: number) {
    setAnswers((a) => ({ ...a, [qId]: idx }));
  }

  function toggleMultiple(qId: string, idx: number) {
    setAnswers((prev) => {
      const cur = (prev[qId] as number[] | undefined) ?? [];
      const next = cur.includes(idx) ? cur.filter((i) => i !== idx) : [...cur, idx];
      return { ...prev, [qId]: next };
    });
  }

  function setScale(qId: string, val: number) {
    setAnswers((a) => ({ ...a, [qId]: val }));
  }

  function setText(qId: string, val: string) {
    setAnswers((a) => ({ ...a, [qId]: val }));
  }

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
              {q.weight !== 1 && (
                <span className="ml-2 text-xs font-normal text-slate-400">×{q.weight}</span>
              )}
            </p>

            {/* single — radio-style buttons (existing behaviour) */}
            {q.type === "single" && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.options.map((o, idx) => {
                  const sel = answers[q.id] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSingle(q.id, idx)}
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
            )}

            {/* multiple — checkbox-style buttons */}
            {q.type === "multiple" && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.options.map((o, idx) => {
                  const selected = (answers[q.id] as number[] | undefined) ?? [];
                  const checked = selected.includes(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleMultiple(q.id, idx)}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition-all ${
                        checked
                          ? "border-brand-500 bg-brand-50 text-brand-800"
                          : "border-slate-200 hover:border-brand-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`grid h-4 w-4 shrink-0 place-items-center rounded border-2 ${checked ? "border-brand-500 bg-brand-500" : "border-slate-300"}`}>
                        {checked && (
                          <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                            <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      {o}
                    </button>
                  );
                })}
              </div>
            )}

            {/* scale — range slider 1-10 */}
            {q.type === "scale" && (
              <div className="mt-4">
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={(answers[q.id] as number | undefined) ?? 5}
                    onChange={(e) => setScale(q.id, Number(e.target.value))}
                    onMouseDown={() => {
                      if (answers[q.id] === undefined) setScale(q.id, 5);
                    }}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-500"
                  />
                  <span className="w-8 shrink-0 text-center text-lg font-bold text-brand-600">
                    {(answers[q.id] as number | undefined) ?? "—"}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-xs text-slate-400">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>
            )}

            {/* text — textarea */}
            {q.type === "text" && (
              <textarea
                className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                rows={4}
                placeholder="Введите ответ..."
                value={(answers[q.id] as string | undefined) ?? ""}
                onChange={(e) => setText(q.id, e.target.value)}
              />
            )}
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
