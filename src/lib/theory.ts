// Логика контролирующих тестов и механики "заморозки" (US7, ФТ-4).
// Чистая логика, покрыта unit-тестами.

export const PASS_THRESHOLD = 70; // % правильных для прохождения
export const FREEZE_HOURS = 24; // период заморозки при неудаче
export const LOW_SCORE = 50; // порог «неуспешного» теста (ФТ-7.8)

/** Нужно ли снизить сложность следующего теста (ФТ-7.8: <50%). */
export function shouldLowerDifficulty(score: number): boolean {
  return score < LOW_SCORE;
}

/** Размер персонального теста по сложности (ФТ-7.7: 1–10 вопросов). */
export function personalTestSize(lowered: boolean): number {
  return lowered ? 3 : 5;
}

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

/** Краткий вывод по результату теста (ФТ-2.4). */
export function buildConclusion(
  score: number,
  passed: boolean,
  weakTopics: string[],
): string {
  if (passed && weakTopics.length === 0) {
    return `Отличный результат — ${score}%. Вы уверенно владеете темами теста, можно двигаться дальше по карте развития.`;
  }
  if (passed) {
    return `Хороший результат — ${score}%. Тест пройден, но стоит повторить: ${weakTopics.join(", ")}.`;
  }
  if (weakTopics.length > 0) {
    return `Результат ${score}%. Сосредоточьтесь на слабых темах: ${weakTopics.join(", ")} — и попробуйте снова.`;
  }
  return `Результат ${score}%. Рекомендуем повторить материал и пройти тест ещё раз.`;
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
