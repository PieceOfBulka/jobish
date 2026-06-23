// Structured job alignment survey (US10).

export interface AlignmentQuestion {
  id: string;
  text: string;
  category: string;
}

export const ALIGNMENT_QUESTIONS: AlignmentQuestion[] = [
  {
    id: "growth",
    text: "Моя текущая работа даёт возможности для профессионального роста",
    category: "Рост",
  },
  {
    id: "skills",
    text: "Я использую и развиваю навыки, которые важны для моих карьерных целей",
    category: "Навыки",
  },
  {
    id: "salary",
    text: "Мой доход соответствует моему уровню и ожиданиям",
    category: "Компенсация",
  },
  {
    id: "interest",
    text: "Мне интересны задачи, которыми я занимаюсь на работе",
    category: "Мотивация",
  },
  {
    id: "balance",
    text: "У меня достаточно времени и энергии для обучения и развития вне работы",
    category: "Баланс",
  },
];

export interface AlignmentResult {
  answers: Record<string, number>;
  score: number;
  summary: string;
  recommendations: string[];
  createdAt: string;
}

function categoryScore(answers: Record<string, number>, id: string): number {
  return answers[id] ?? 0;
}

export function evaluateAlignment(
  answers: Record<string, number>,
  currentPosition?: string | null,
  targetProfession?: string | null,
): AlignmentResult {
  const values = ALIGNMENT_QUESTIONS.map((q) => answers[q.id]).filter(
    (v) => typeof v === "number" && v >= 1 && v <= 5,
  );
  const score =
    values.length > 0
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 20)
      : 0;

  const weak: string[] = [];
  for (const q of ALIGNMENT_QUESTIONS) {
    const v = categoryScore(answers, q.id);
    if (v > 0 && v <= 2) weak.push(q.category);
  }

  let summary: string;
  if (score >= 80) {
    summary =
      "Высокое соответствие: текущая работа хорошо поддерживает ваши карьерные цели. " +
      "Сфокусируйтесь на углублении экспертизы и долгосрочном росте внутри роли.";
  } else if (score >= 60) {
    summary =
      "Умеренное соответствие: есть сильные стороны, но отдельные зоны требуют внимания. " +
      "Имеет смысл обсудить с коучем точечные шаги улучшения.";
  } else if (score >= 40) {
    summary =
      "Низкое соответствие: текущая работа частично расходится с целями. " +
      "Рекомендуем составить план развития навыков и оценить варианты смены роли.";
  } else {
    summary =
      "Критическое расхождение: работа слабо поддерживает ваши карьерные цели. " +
      "Стоит рассмотреть смену направления или активный поиск новой позиции.";
  }

  const recommendations: string[] = [];
  if (weak.includes("Рост")) {
    recommendations.push("Обсудите с руководителем план развития или возьмите менторство на платформе.");
  }
  if (weak.includes("Навыки")) {
    recommendations.push(
      `Подтяните навыки по карте развития${targetProfession ? ` «${targetProfession}»` : ""} и отметьте прогресс в чате.`,
    );
  }
  if (weak.includes("Компенсация")) {
    recommendations.push("Сверьте ожидания по зарплате с аналитикой рынка — спросите коуча о вилках по грейдам.");
  }
  if (weak.includes("Мотивация")) {
    recommendations.push("Попробуйте pet-проект или смену задач внутри команды, чтобы вернуть интерес.");
  }
  if (weak.includes("Баланс")) {
    recommendations.push("Выделите фиксированное время на обучение (например, 3 часа в неделю) и держите стрик на платформе.");
  }
  if (currentPosition && recommendations.length === 0 && score < 80) {
    recommendations.push(
      `Оцените, насколько роль «${currentPosition}» ведёт к желаемой позиции, и обновите карьерные цели.`,
    );
  }
  if (recommendations.length === 0) {
    recommendations.push("Продолжайте отслеживать прогресс и пересматривайте цели раз в квартал.");
  }

  return {
    answers,
    score,
    summary,
    recommendations,
    createdAt: new Date().toISOString(),
  };
}
