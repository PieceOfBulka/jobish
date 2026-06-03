// Логика ежедневной привычки/стрика (мотивация, ФТ-7). Чистая функция.

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

const DAY = 24 * 60 * 60 * 1000;

/** Возвращает новое значение стрика по последнему визиту. */
export function nextStreak(
  current: number,
  lastVisit: Date | null,
  now: Date = new Date(),
): number {
  if (!lastVisit) return 1;
  const diffDays = Math.round((startOfDay(now) - startOfDay(lastVisit)) / DAY);
  if (diffDays <= 0) return Math.max(current, 1); // тот же день
  if (diffDays === 1) return current + 1; // следующий день
  return 1; // пропуск — сброс
}

/** Был ли визит уже сегодня. */
export function visitedToday(lastVisit: Date | null, now: Date = new Date()): boolean {
  if (!lastVisit) return false;
  return startOfDay(lastVisit) === startOfDay(now);
}
