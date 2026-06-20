// Зарплатная статистика (ФТ-3.1): медиана и перцентили. Чистые функции,
// без зависимостей — покрыты unit-тестами. Используются и для live-данных hh.ru,
// и для сид-фолбэка.

export interface SalarySummary {
  count: number;
  min: number;
  p25: number;
  median: number; // p50
  p75: number;
  p90: number;
  max: number;
}

/**
 * Перцентиль по методу линейной интерполяции (как numpy «linear»).
 * @param sorted отсортированный по возрастанию массив (не пустой)
 * @param p доля 0..1
 */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  if (sorted.length === 1) return sorted[0];
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const frac = idx - lo;
  return sorted[lo] * (1 - frac) + sorted[hi] * frac;
}

/** Сводка по выборке зарплат. Возвращает null, если данных нет. */
export function salarySummary(values: number[]): SalarySummary | null {
  const clean = values.filter((v) => Number.isFinite(v) && v > 0);
  if (clean.length === 0) return null;
  const sorted = [...clean].sort((a, b) => a - b);
  return {
    count: sorted.length,
    min: sorted[0],
    p25: Math.round(percentile(sorted, 0.25)),
    median: Math.round(percentile(sorted, 0.5)),
    p75: Math.round(percentile(sorted, 0.75)),
    p90: Math.round(percentile(sorted, 0.9)),
    max: sorted[sorted.length - 1],
  };
}

/**
 * Моделирует правдоподобную выборку зарплат из трёх опорных точек
 * (junior/middle/senior) — для сид-фолбэка, когда live-данные недоступны.
 * Детерминирован (без random), чтобы результат был стабильным и тестируемым.
 */
export function modelSalarySample(
  junior: number,
  middle: number,
  senior: number,
): number[] {
  // Веса грейдов на рынке: джунов и мидлов больше, чем сеньоров.
  const anchors: { value: number; weight: number }[] = [
    { value: junior, weight: 5 },
    { value: (junior + middle) / 2, weight: 4 },
    { value: middle, weight: 6 },
    { value: (middle + senior) / 2, weight: 4 },
    { value: senior, weight: 3 },
    { value: Math.round(senior * 1.25), weight: 1 }, // редкие топовые офферы
  ];
  const sample: number[] = [];
  for (const a of anchors) {
    for (let i = 0; i < a.weight; i++) sample.push(Math.round(a.value));
  }
  return sample;
}
