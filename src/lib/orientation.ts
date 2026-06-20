// Профориентационный тест (US4, US5, ФТ-2.1) — вопросы и логика скоринга.
// Чистая логика без зависимостей (покрыта unit-тестами).
//
// Методология: вопросы адаптированы под IT-направления на основе модели
// профессиональных интересов Дж. Голланда (RIASEC) и публичной методики
// O*NET Interest Profiler (Министерство труда США, public domain).
// Пять направлений ≈ срез RIASEC под IT: tech (Realistic+Investigative),
// data (Investigative+Conventional), design (Artistic), product (Enterprising),
// people (Social).

// Краткая ссылка на методологию для отображения в UI.
export const ORIENTATION_METHODOLOGY =
  "Методика основана на модели профессиональных интересов Дж. Голланда (RIASEC) " +
  "и публичной методике O*NET Interest Profiler (Министерство труда США).";

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
  {
    id: "q7",
    text: "Какой проект вы бы выбрали на хакатоне?",
    options: [
      { label: "Написать backend-сервис с нуля", weights: { tech: 3 } },
      { label: "Построить ML-модель на данных соревнования", weights: { data: 3 } },
      { label: "Сделать запоминающийся визуальный прототип", weights: { design: 3 } },
      { label: "Собрать команду и распределить роли", weights: { product: 2, people: 1 } },
    ],
  },
  {
    id: "q8",
    text: "Что вам интереснее изучать в свободное время?",
    options: [
      { label: "Новый язык программирования или фреймворк", weights: { tech: 3 } },
      { label: "Методы статистики и работы с данными", weights: { data: 3 } },
      { label: "Принципы типографики и композиции", weights: { design: 3 } },
      { label: "Психологию переговоров и лидерства", weights: { people: 3 } },
    ],
  },
  {
    id: "q9",
    text: "Какую роль вы чаще занимаете в групповом проекте?",
    options: [
      { label: "Пишу основную техническую часть", weights: { tech: 3 } },
      { label: "Считаю метрики и проверяю гипотезы", weights: { data: 3 } },
      { label: "Отвечаю за внешний вид и подачу", weights: { design: 3 } },
      { label: "Слежу за сроками и договорённостями", weights: { product: 2, people: 1 } },
    ],
  },
  {
    id: "q10",
    text: "Что вас раздражает в работе сильнее всего?",
    options: [
      { label: "Неоптимальный, медленный код", weights: { tech: 3 } },
      { label: "Решения, принятые без данных", weights: { data: 3 } },
      { label: "Неудобный, уродливый интерфейс", weights: { design: 3 } },
      { label: "Несогласованность в команде", weights: { people: 2, product: 1 } },
    ],
  },
  {
    id: "q11",
    text: "О чём вам приятнее читать профессиональные статьи?",
    options: [
      { label: "Архитектура систем и алгоритмы", weights: { tech: 3 } },
      { label: "Кейсы аналитики и A/B-тесты", weights: { data: 3 } },
      { label: "Тренды дизайна и UX-исследования", weights: { design: 3 } },
      { label: "Управление продуктом и стратегия", weights: { product: 3 } },
    ],
  },
  {
    id: "q12",
    text: "Какая «суперсила» вам ближе?",
    options: [
      { label: "Разобраться в любой технологии", weights: { tech: 3 } },
      { label: "Увидеть закономерность в хаосе цифр", weights: { data: 3 } },
      { label: "Сделать сложное красивым и понятным", weights: { design: 3 } },
      { label: "Объединять людей вокруг цели", weights: { people: 2, product: 1 } },
    ],
  },
  {
    id: "q13",
    text: "За что вас чаще хвалят?",
    options: [
      { label: "За технические решения", weights: { tech: 3 } },
      { label: "За точность и внимательность к деталям", weights: { data: 2, tech: 1 } },
      { label: "За вкус и аккуратность", weights: { design: 3 } },
      { label: "За умение договариваться", weights: { people: 3 } },
    ],
  },
  {
    id: "q14",
    text: "Какой курс вы бы прошли первым?",
    options: [
      { label: "«Промышленная разработка на Python»", weights: { tech: 3 } },
      { label: "«Аналитика данных и SQL»", weights: { data: 3 } },
      { label: "«UX/UI-дизайн с нуля»", weights: { design: 3 } },
      { label: "«Управление IT-продуктом»", weights: { product: 3 } },
    ],
  },
  {
    id: "q15",
    text: "Что для вас «хорошо сделанная работа»?",
    options: [
      { label: "Надёжная, масштабируемая система", weights: { tech: 3 } },
      { label: "Вывод, подтверждённый данными", weights: { data: 3 } },
      { label: "Решение, которым приятно пользоваться", weights: { design: 2, product: 1 } },
      { label: "Довольные команда и клиент", weights: { people: 2, product: 1 } },
    ],
  },
  {
    id: "q16",
    text: "Где вам комфортнее всего?",
    options: [
      { label: "Наедине со сложной задачей и кодом", weights: { tech: 3 } },
      { label: "В таблицах, дашбордах и графиках", weights: { data: 3 } },
      { label: "В графическом редакторе", weights: { design: 3 } },
      { label: "На встречах и в общении с людьми", weights: { people: 3 } },
    ],
  },
  {
    id: "q17",
    text: "Какую задачу возьмёте охотнее?",
    options: [
      { label: "Починить баг в проде", weights: { tech: 3 } },
      { label: "Найти причину падения метрики", weights: { data: 3 } },
      { label: "Переработать экран оформления заказа", weights: { design: 2, product: 1 } },
      { label: "Согласовать требования между отделами", weights: { product: 2, people: 1 } },
    ],
  },
  {
    id: "q18",
    text: "Что вам ближе в продукте?",
    options: [
      { label: "Как он устроен внутри", weights: { tech: 3 } },
      { label: "Какие цифры он показывает", weights: { data: 3 } },
      { label: "Как он выглядит и ощущается", weights: { design: 3 } },
      { label: "Какую ценность он несёт пользователю", weights: { product: 3 } },
    ],
  },
  {
    id: "q19",
    text: "Какое достижение порадовало бы вас больше?",
    options: [
      { label: "Ускорил систему вдвое", weights: { tech: 3 } },
      { label: "Нашёл инсайт, изменивший стратегию", weights: { data: 3 } },
      { label: "Редизайн поднял конверсию", weights: { design: 2, product: 1 } },
      { label: "Запустил продукт вместе с командой", weights: { product: 2, people: 1 } },
    ],
  },
  {
    id: "q20",
    text: "Какой набор инструментов интереснее освоить?",
    options: [
      { label: "Docker, Git, CI/CD", weights: { tech: 3 } },
      { label: "SQL, Python, BI-системы", weights: { data: 3 } },
      { label: "Figma, инструменты прототипирования", weights: { design: 3 } },
      { label: "Jira, roadmap-инструменты", weights: { product: 3 } },
    ],
  },
  {
    id: "q21",
    text: "Что вы скорее заметите в приложении первым?",
    options: [
      { label: "Скорость и стабильность", weights: { tech: 3 } },
      { label: "Какие данные оно собирает", weights: { data: 3 } },
      { label: "Дизайн и анимации", weights: { design: 3 } },
      { label: "Насколько оно решает мою задачу", weights: { product: 2, people: 1 } },
    ],
  },
  {
    id: "q22",
    text: "На что вы опираетесь, принимая решение?",
    options: [
      { label: "На техническую реализуемость", weights: { tech: 2, product: 1 } },
      { label: "На цифры и аналитику", weights: { data: 3 } },
      { label: "На ощущение и эстетику", weights: { design: 3 } },
      { label: "На мнение людей и команды", weights: { people: 3 } },
    ],
  },
  {
    id: "q23",
    text: "Какая встреча вам не в тягость?",
    options: [
      { label: "Технический дизайн-ревью", weights: { tech: 3 } },
      { label: "Разбор метрик и дашбордов", weights: { data: 3 } },
      { label: "Обсуждение макетов", weights: { design: 3 } },
      { label: "Разговор один на один с человеком", weights: { people: 3 } },
    ],
  },
  {
    id: "q24",
    text: "Что вы хотели бы автоматизировать в первую очередь?",
    options: [
      { label: "Деплой и тестирование", weights: { tech: 3 } },
      { label: "Сбор и обработку отчётов", weights: { data: 3 } },
      { label: "Генерацию однотипных макетов", weights: { design: 2, tech: 1 } },
      { label: "Координацию задач команды", weights: { product: 2, people: 1 } },
    ],
  },
  {
    id: "q25",
    text: "Какой фидбэк для вас ценнее?",
    options: [
      { label: "«Технически безупречно»", weights: { tech: 3 } },
      { label: "«Выводы точны и обоснованы»", weights: { data: 3 } },
      { label: "«Выглядит и работает превосходно»", weights: { design: 3 } },
      { label: "«Ты отлично ведёшь за собой людей»", weights: { people: 3 } },
    ],
  },
  {
    id: "q26",
    text: "Что вам ближе в обучении?",
    options: [
      { label: "Разобрать, как всё работает под капотом", weights: { tech: 3 } },
      { label: "Проверить гипотезу экспериментом", weights: { data: 3 } },
      { label: "Взять красивый пример и улучшить его", weights: { design: 3 } },
      { label: "Обсудить и применить на практике с другими", weights: { people: 2, product: 1 } },
    ],
  },
  {
    id: "q27",
    text: "Кем вы хотели бы стать через 5 лет?",
    options: [
      { label: "Сильным инженером / архитектором", weights: { tech: 3 } },
      { label: "Ведущим аналитиком / data scientist", weights: { data: 3 } },
      { label: "Лид-дизайнером", weights: { design: 3 } },
      { label: "Руководителем продукта / команды", weights: { product: 2, people: 1 } },
    ],
  },
  {
    id: "q28",
    text: "Что мотивирует вас в задаче сильнее?",
    options: [
      { label: "Техническая сложность", weights: { tech: 3 } },
      { label: "Возможность найти истину в данных", weights: { data: 3 } },
      { label: "Свобода творчества", weights: { design: 3 } },
      { label: "Влияние на людей и бизнес", weights: { product: 2, people: 1 } },
    ],
  },
  {
    id: "q29",
    text: "Какой блог или канал вы бы вели?",
    options: [
      { label: "Про код и архитектуру", weights: { tech: 3 } },
      { label: "Про данные и визуализацию", weights: { data: 3 } },
      { label: "Про дизайн и насмотренность", weights: { design: 3 } },
      { label: "Про продукт и карьеру", weights: { product: 2, people: 1 } },
    ],
  },
  {
    id: "q30",
    text: "Что для вас важнее всего в результате?",
    options: [
      { label: "Чистая, продуманная архитектура", weights: { tech: 3 } },
      { label: "Измеримый, доказанный результат", weights: { data: 2, product: 1 } },
      { label: "Безупречный пользовательский опыт", weights: { design: 2, product: 1 } },
      { label: "Счастливые пользователи и команда", weights: { people: 2, product: 1 } },
    ],
  },
];

/**
 * Случайные ответы на все вопросы — для демо-кнопки «Пропустить опрос».
 * Возвращает валидную карту { questionId: optionIndex }.
 */
export function randomAnswers(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const q of ORIENTATION_QUESTIONS) {
    out[q.id] = Math.floor(Math.random() * q.options.length);
  }
  return out;
}

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
  rationale: string; // краткое обоснование (ФТ-2.2)
}

// Порог соответствия (ФТ-2.2): профессии выше него считаются «явным совпадением»
export const MATCH_THRESHOLD = 70;
// Максимум профессий в отчёте (ФТ-2.2: «не более пяти»)
export const MAX_MATCHES = 5;

function rationaleFor(
  affinity: Partial<Record<Category, number>>,
  match: number,
): string {
  const cats = Object.entries(affinity)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 2)
    .map(([c]) => CATEGORY_LABELS[c as Category]);
  const base = `Соответствие вашим ответам по направлениям: ${cats.join(", ")}.`;
  if (match >= MATCH_THRESHOLD) return `${base} Высокий уровень совпадения (${match}%).`;
  return `${base} Рекомендация носит ориентировочный характер (${match}%).`;
}

/**
 * Возвращает до MAX_MATCHES профессий в порядке убывания соответствия (US5, ФТ-2.2).
 * Каждая запись содержит % соответствия и краткое обоснование.
 */
export function topMatches(scores: Scores, limit = MAX_MATCHES): ProfessionMatch[] {
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
      return {
        slug,
        title: PROFESSION_TITLES[slug] ?? slug,
        match,
        rationale: rationaleFor(affinity, match),
      };
    },
  );
  return results
    .sort((a, b) => b.match - a.match)
    .slice(0, Math.min(limit, MAX_MATCHES));
}

/** Есть ли хотя бы одна профессия выше порога (ФТ-2.2). */
export function hasStrongMatch(matches: ProfessionMatch[]): boolean {
  return matches.some((m) => m.match >= MATCH_THRESHOLD);
}
