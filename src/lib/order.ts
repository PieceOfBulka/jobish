// Переупорядочивание элементов конструктора roadmap (ФТ-4.3). Чистая логика.

export interface Ordered {
  id: string;
  order: number;
}

/**
 * Перемещает элемент вверх/вниз, возвращая пары (id, новый order),
 * которые нужно сохранить. Если перемещение невозможно — пустой массив.
 */
export function moveInOrder<T extends Ordered>(
  items: T[],
  id: string,
  dir: "up" | "down",
): { id: string; order: number }[] {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((i) => i.id === id);
  if (idx === -1) return [];
  const swapIdx = dir === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= sorted.length) return [];

  const a = sorted[idx];
  const b = sorted[swapIdx];
  return [
    { id: a.id, order: b.order },
    { id: b.id, order: a.order },
  ];
}

/** Следующий порядковый номер для добавления в конец. */
export function nextOrder(items: Ordered[]): number {
  return items.length === 0 ? 0 : Math.max(...items.map((i) => i.order)) + 1;
}
