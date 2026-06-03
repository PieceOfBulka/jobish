// Профориентационный тест (US4, US5) — вопросы и логика скоринга.
// Чистая логика без зависимостей (покрыта unit-тестами).

export type Category = "tech" | "data" | "design" | "product" | "people";

export const CATEGORY_LABELS: Record<Category, string> = {
  tech: "Технологии и разработка",
  data: "Данные и аналитика",
  design: "Дизайн и творчество",
  product: "Продукт и управление",
  people: "Люди и коммуникация",
};

export interface OrientationOption {
  label: string;
  weights: Partial<Record<Category, number>>;
}

export interface OrientationQuestion {
  id: string;
  text: string;
  options: OrientationOption[];
}

export const ORIENTATION_QUESTIONS: OrientationQuestion[] = [
  {
    id: "q1",
    text: "Что вам интереснее всего в работе?",
    options: [
      { label: "Создавать и программировать продукты", weights: { tech: 3 } },
      { label: "Находить закономерности в цифрах", weights: { data: 3 } },
      { label: "Придумывать визуальные решения", weights: { design: 3 } },
      { label: "Организовывать процессы и людей", weights: { product: 2, people: 1 } },
    ],
  },
  {
    id: "q2",
    text: "Какая задача вас скорее увлечёт на выходных?",
    options: [
      { label: "Собрать пет-проект или автоматизировать рутину", weights: { tech: 3 } },
      { label: "Разобрать большой датасет и сделать выводы", weights: { data: 3 } },
      { label: "Перерисовать интерфейс любимого приложения", weights: { design: 3 } },
      { label: "Помочь другу спланировать запуск идеи", weights: { product: 2, people: 1 } },
    ],
  },
  {
    id: "q3",
    text: "Как вы предпочитаете решать проблемы?",
    options: [
      { label: "Логически, через код и алгоритмы", weights: { tech: 2, data: 1 } },
      { label: "Через анализ данных и метрик", weights: { data: 3 } },
      { label: "Через эмпатию к пользователю", weights: { design: 2, people: 1 } },
      { label: "Через переговоры и компромиссы", weights: { people: 3 } },
    ],
  },
  {
    id: "q4",
    text: "Какая обратная связь вас мотивирует сильнее?",
    options: [
      { label: "«Твой код работает быстро и чисто»", weights: { tech: 3 } },
      { label: "«Твой анализ помог принять решение»", weights: { data: 3 } },
      { label: "«Это красиво и удобно»", weights: { design: 3 } },
      { label: "«С тобой приятно работать в команде»", weights: { people: 2, product: 1 } },
    ],
  },
  {
    id: "q5",
    text: "Что вам ближе при работе в команде?",
    options: [
      { label: "Глубоко погрузиться в техническую задачу", weights: { tech: 2, data: 1 } },
      { label: "Отвечать за приоритеты и roadmap продукта", weights: { product: 3 } },
      { label: "Проектировать пользовательский опыт", weights: { design: 3 } },
      { label: "Координировать людей и снимать блокеры", weights: { people: 2, product: 1 } },
    ],
  },
  {
    id: "q6",
    text: "Какой результат приносит вам удовлетворение?",
    options: [
      { label: "Работающая система, которую вы построили", weights: { tech: 3 } },
      { label: "Дашборд, на который смотрит вся команда", weights: { data: 3 } },
      { label: "Продукт, которым приятно пользоваться", weights: { design: 2, product: 1 } },
      { label: "Команда, которая достигла цели вместе", weights: { people: 2, product: 1 } },
    ],
  },
];

// Привязка профессий к категориям (вес = насколько профессия про эту категорию)
export const PROFESSION_AFFINITY: Record<string, Partial<Record<Category, number>>> = {
  "frontend-developer": { tech: 3, design: 1 },
  "data-analyst": { data: 3, tech: 1 },
  "ux-ui-designer": { design: 3, product: 1 },
  "product-manager": { product: 3, people: 2, data: 1 },
  "qa-engineer": { tech: 2, data: 1 },
  "hr-it-specialist": { people: 3, product: 1 },
};

export const PROFESSION_TITLES: Record<string, string> = {
  "frontend-developer": "Frontend-разработчик",
  "data-analyst": "Аналитик данных",
  "ux-ui-designer": "UX/UI-дизайнер",
  "product-manager": "Менеджер продукта",
  "qa-engineer": "QA-инженер",
  "hr-it-specialist": "IT-рекрутер",
};

export type Scores = Record<Category, number>;

/** answers: { questionId: optionIndex } */
export function scoreAnswers(answers: Record<string, number>): Scores {
  const scores: Scores = { tech: 0, data: 0, design: 0, product: 0, people: 0 };
  for (const q of ORIENTATION_QUESTIONS) {
    const idx = answers[q.id];
    if (idx === undefined || idx < 0 || idx >= q.options.length) continue;
    const weights = q.options[idx].weights;
    for (const [cat, w] of Object.entries(weights)) {
      scores[cat as Category] += w ?? 0;
    }
  }
  return scores;
}

export interface ProfessionMatch {
  slug: string;
  title: string;
  match: number; // 0..100
}

/** Возвращает профессии в порядке убывания соответствия (US5). */
export function topMatches(scores: Scores, limit = 10): ProfessionMatch[] {
  const maxPerCat = Math.max(1, ...Object.values(scores));
  const results: ProfessionMatch[] = Object.entries(PROFESSION_AFFINITY).map(
    ([slug, affinity]) => {
      let dot = 0;
      let norm = 0;
      for (const [cat, weight] of Object.entries(affinity)) {
        const s = scores[cat as Category] / maxPerCat; // 0..1
        dot += s * (weight ?? 0);
        norm += weight ?? 0;
      }
      const match = norm > 0 ? Math.round((dot / norm) * 100) : 0;
      return { slug, title: PROFESSION_TITLES[slug] ?? slug, match };
    },
  );
  return results.sort((a, b) => b.match - a.match).slice(0, limit);
}
