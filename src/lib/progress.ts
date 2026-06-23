// Обработка прогресса, переданного через чат (ФТ-7.1–7.5). Чистые функции.

/**
 * Находит навыки из roadmap, упомянутые в сообщении пользователя
 * (например: «прошёл React и TypeScript»). Возвращает названия совпавших навыков.
 */
const COMPLETED_VERB =
  /(прош|освоил|выучил|изучил|закончил|сделал|завершил|готов|done|выполнил)/i;
const IN_PROGRESS_VERB =
  /(изучаю|учу|прохожу|начал|делаю|работаю над|в процессе|in progress)/i;

function matchSkillNames(text: string, skillNames: string[]): string[] {
  return skillNames.filter((name) => {
    const key = name.toLowerCase().split(/[\s(]/)[0];
    return key.length >= 2 && text.includes(key);
  });
}

export function detectCompletedSkills(
  message: string,
  skillNames: string[],
): string[] {
  const text = message.toLowerCase();
  if (!COMPLETED_VERB.test(text)) return [];
  return matchSkillNames(text, skillNames);
}

export function detectInProgressSkills(
  message: string,
  skillNames: string[],
): string[] {
  const text = message.toLowerCase();
  if (!IN_PROGRESS_VERB.test(text)) return [];
  const completed = detectCompletedSkills(message, skillNames);
  return matchSkillNames(text, skillNames).filter((s) => !completed.includes(s));
}

export interface SkillProgressUpdate {
  completed: string[];
  inProgress: string[];
}

export function detectSkillProgress(
  message: string,
  skillNames: string[],
): SkillProgressUpdate {
  return {
    completed: detectCompletedSkills(message, skillNames),
    inProgress: detectInProgressSkills(message, skillNames),
  };
}

/** Мотивационный блок после обновления roadmap (ФТ-7.3 / ФТ-7.5). */
export function motivationalBlock(
  done: number,
  total: number,
  nextSkill?: string,
): string {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const head =
    pct >= 100
      ? "🎉 Поздравляю — вы прошли весь трек!"
      : pct >= 50
        ? "Отличный темп — вы уже прошли больше половины!"
        : "Хорошее начало — каждый шаг приближает вас к цели!";
  const next =
    nextSkill && pct < 100
      ? ` Следующий шаг: «${nextSkill}».`
      : "";
  return `${head} Прогресс по карте: ${pct}% (${done}/${total}).${next}`;
}

/** Краткий «карьерный портрет» по прогрессу и тестам (ФТ-7.4). */
export function buildCareerPortrait(params: {
  targetTitle?: string;
  doneSkills: number;
  totalSkills: number;
  strongTopics: string[];
  weakTopics: string[];
}): string {
  const { targetTitle, doneSkills, totalSkills, strongTopics, weakTopics } = params;
  const parts: string[] = [];
  if (targetTitle) parts.push(`Цель: ${targetTitle}.`);
  parts.push(`Освоено навыков: ${doneSkills}/${totalSkills}.`);
  if (strongTopics.length) parts.push(`Сильные темы: ${strongTopics.join(", ")}.`);
  if (weakTopics.length) parts.push(`Зоны роста: ${weakTopics.join(", ")}.`);
  return parts.join(" ");
}
