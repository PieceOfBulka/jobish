// Логика контролирующих тестов (US7, ФТ-2/7). Чистая логика, покрыта unit-тестами.
// Механика «заморозки» перенесена в Release X.

export const PASS_THRESHOLD = 70; // % правильных для прохождения
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
}

export function gradeAttempt(answers: GradedAnswer[]): AttemptResult {
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

  return { score, passed, weakTopics, strongTopics };
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
