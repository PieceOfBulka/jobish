// Обработка прогресса, переданного через чат (ФТ-7.1–7.5). Чистые функции.

/**
 * Находит навыки из roadmap, упомянутые в сообщении пользователя
 * (например: «прошёл React и TypeScript»). Возвращает названия совпавших навыков.
 */
export function detectCompletedSkills(
  message: string,
  skillNames: string[],
): string[] {
  const text = message.toLowerCase();
  // Признак сообщения о прогрессе — наличие глаголов завершения
  const progressVerb = /(прош|освоил|выучил|изучил|закончил|сделал|завершил|готов|done|выполнил)/i.test(
    text,
  );
  if (!progressVerb) return [];
  return skillNames.filter((name) => {
    const n = name.toLowerCase();
    // Берём первое слово навыка как ключ (например, «React» из «React»)
    const key = n.split(/[\s(]/)[0];
    return key.length >= 2 && text.includes(key);
  });
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
