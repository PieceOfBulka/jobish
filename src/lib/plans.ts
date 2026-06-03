export interface Plan {
  id: "free" | "start" | "optimal" | "pro";
  name: string;
  price: number;
  period: string;
  highlight?: boolean;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Базовый",
    price: 0,
    period: "навсегда",
    features: [
      "Профориентационный тест",
      "Карта развития по треку",
      "До 10 сообщений коучу в день",
      "Базовая аналитика рынка",
    ],
  },
  {
    id: "start",
    name: "Старт",
    price: 199,
    period: "неделя",
    features: [
      "Безлимит сообщений коучу",
      "Все контрольные тесты",
      "Разморозка тестов",
      "Полная аналитика рынка",
    ],
  },
  {
    id: "optimal",
    name: "Оптимальный",
    price: 399,
    period: "месяц",
    highlight: true,
    features: [
      "Всё из «Старт»",
      "Приоритетные ответы коуча",
      "Расширенные рекомендации материалов",
      "История диалогов без ограничений",
    ],
  },
  {
    id: "pro",
    name: "Про",
    price: 999,
    period: "3 месяца",
    features: [
      "Всё из «Оптимальный»",
      "Максимальная выгода на период",
      "Ранний доступ к новым функциям",
      "Поддержка в приоритете",
    ],
  },
];
