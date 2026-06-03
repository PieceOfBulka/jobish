// Логика контролирующих тестов и механики "заморозки" (US7, ФТ-4).
// Чистая логика, покрыта unit-тестами.

export const PASS_THRESHOLD = 70; // % правильных для прохождения
export const FREEZE_HOURS = 24; // период заморозки при неудаче

export interface GradedAnswer {
  questionId: string;
  topic: string;
  correct: boolean;
}

export interface AttemptResult {
  score: number; // 0..100
  passed: boolean;
  weakTopics: string[];
  strongTopics: string[];
  frozenUntil: Date | null;
}

export function gradeAttempt(
  answers: GradedAnswer[],
  now: Date = new Date(),
): AttemptResult {
  const total = answers.length;
  const correctCount = answers.filter((a) => a.correct).length;
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const passed = score >= PASS_THRESHOLD;

  const byTopic = new Map<string, { ok: number; total: number }>();
  for (const a of answers) {
    const t = byTopic.get(a.topic) ?? { ok: 0, total: 0 };
    t.total += 1;
    if (a.correct) t.ok += 1;
    byTopic.set(a.topic, t);
  }
  const weakTopics: string[] = [];
  const strongTopics: string[] = [];
  for (const [topic, { ok, total: t }] of byTopic) {
    if (ok / t < 0.5) weakTopics.push(topic);
    else strongTopics.push(topic);
  }

  const frozenUntil = passed
    ? null
    : new Date(now.getTime() + FREEZE_HOURS * 60 * 60 * 1000);

  return { score, passed, weakTopics, strongTopics, frozenUntil };
}

/** Можно ли проходить тест сейчас (учитывая заморозку и доп. попытки). */
export function canRetake(
  frozenUntil: Date | null,
  extraTries: number,
  now: Date = new Date(),
): boolean {
  if (!frozenUntil) return true;
  if (now >= frozenUntil) return true;
  return extraTries > 0;
}

export function freezeRemainingMs(
  frozenUntil: Date | null,
  now: Date = new Date(),
): number {
  if (!frozenUntil) return 0;
  return Math.max(0, frozenUntil.getTime() - now.getTime());
}
