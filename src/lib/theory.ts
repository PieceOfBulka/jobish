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
  /** Максимально возможный балл за вопрос (= question.weight). */
  weight: number;
  /** Полученный балл (0..weight). */
  points: number;
  /** false для scale/text — не участвуют в итоговом проценте. */
  scoreable: boolean;
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
  const scoreable = answers.filter((a) => a.scoreable);
  const totalWeight = scoreable.reduce((s, a) => s + a.weight, 0);
  const earnedWeight = scoreable.reduce((s, a) => s + a.points, 0);
  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  const passed = score >= PASS_THRESHOLD;

  // Агрегируем по темам (только scoreable вопросы)
  const byTopic = new Map<string, { earned: number; max: number }>();
  for (const a of scoreable) {
    const t = byTopic.get(a.topic) ?? { earned: 0, max: 0 };
    t.earned += a.points;
    t.max += a.weight;
    byTopic.set(a.topic, t);
  }
  const weakTopics: string[] = [];
  const strongTopics: string[] = [];
  for (const [topic, { earned, max }] of byTopic) {
    if (max === 0 || earned / max < 0.5) weakTopics.push(topic);
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

// ─── Скоринг multiple-choice ──────────────────────────────────────────────────

/**
 * Частичный зачёт для multiple: вычитаем за неверные выборы.
 * Итог зажат в [0, weight].
 */
export function scoreMultiple(
  selected: number[],
  correctSet: number[],
  totalOptions: number,
  weight: number,
): number {
  const correctSetOf = new Set(correctSet);
  const correctSelected = selected.filter((i) => correctSetOf.has(i)).length;
  const wrongSelected = selected.filter((i) => !correctSetOf.has(i)).length;

  const partial = (correctSelected / correctSet.length) * weight
    - (wrongSelected / totalOptions) * weight;
  return Math.max(0, partial);
}
