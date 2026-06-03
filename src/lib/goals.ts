// Генерация долгосрочных карьерных целей (US9). Детерминированная логика.

export interface GeneratedGoal {
  title: string;
  horizon: string;
  rationale: string;
}

export function generateGoals(
  professionTitle: string,
  experienceYears: number,
): GeneratedGoal[] {
  const isBeginner = experienceYears < 2;
  const goals: GeneratedGoal[] = [];

  if (isBeginner) {
    goals.push({
      title: `Войти в профессию «${professionTitle}» на позицию Junior`,
      horizon: "6–12 месяцев",
      rationale:
        "Освоить базовые навыки трека, собрать портфолио и пройти контрольные тесты для уверенного старта.",
    });
    goals.push({
      title: `Вырасти до уровня Middle в роли «${professionTitle}»`,
      horizon: "2–3 года",
      rationale:
        "Закрепиться в профессии, углубить ключевые компетенции и начать брать самостоятельные задачи.",
    });
  } else {
    goals.push({
      title: `Достичь уровня Middle/Senior в роли «${professionTitle}»`,
      horizon: "1–2 года",
      rationale:
        "Использовать имеющийся опыт для быстрого роста: закрыть пробелы в навыках старших грейдов.",
    });
    goals.push({
      title: `Стать экспертом и наставником в направлении «${professionTitle}»`,
      horizon: "3–5 лет",
      rationale:
        "Развивать soft skills, менторство и стратегическое мышление для перехода на senior/lead-роли.",
    });
  }

  goals.push({
    title: "Сформировать устойчивую привычку развития",
    horizon: "постоянно",
    rationale:
      "Регулярно заходить на платформу, отмечать прогресс по карте и проходить тесты — это удерживает мотивацию.",
  });

  return goals;
}
