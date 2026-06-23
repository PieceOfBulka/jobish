// Long-term career goals (US9). Context-aware deterministic generation.

export interface GeneratedGoal {
  title: string;
  horizon: string;
  rationale: string;
}

export interface GoalContext {
  professionTitle: string;
  experienceMonths: number;
  currentPosition?: string | null;
  roadmapDone: number;
  roadmapTotal: number;
  nextSkill?: string | null;
  inProgressSkills: string[];
  weakTopics: string[];
  /** Rotates wording on explicit refresh (0, 1, 2, …). */
  variant?: number;
}

function shortTermGoal(ctx: GoalContext): GeneratedGoal {
  const {
    professionTitle,
    experienceMonths,
    roadmapDone,
    roadmapTotal,
    nextSkill,
    inProgressSkills,
    weakTopics,
    variant = 0,
  } = ctx;
  const v = ((variant % 3) + 3) % 3;
  const pct =
    roadmapTotal > 0 ? Math.round((roadmapDone / roadmapTotal) * 100) : 0;
  const isBeginner = experienceMonths < 24;

  if (pct >= 85) {
    const titles = [
      `Подготовиться к собеседованиям на «${professionTitle}»`,
      `Собрать кейсы и пройти mock-интервью по «${professionTitle}»`,
      `Закрыть оставшиеся пробелы перед выходом на рынок`,
    ];
    return {
      title: titles[v],
      horizon: "1–3 месяца",
      rationale:
        `По карте развития освоено ${pct}% навыков (${roadmapDone}/${roadmapTotal}). ` +
        `Сфокусируйтесь на презентации опыта и отработке типовых вопросов работодателей.`,
    };
  }

  if (pct >= 45) {
    const titles = [
      `Углубить практику в «${professionTitle}» до уверенного Middle`,
      `Собрать портфолио-проекты по «${professionTitle}»`,
      weakTopics.length
        ? `Подтянуть слабые темы: ${weakTopics.slice(0, 3).join(", ")}`
        : `Закрепить навыки среднего уровня в «${professionTitle}»`,
    ];
    const rationales = [
      `Прогресс по карте — ${pct}%. Следующий фокус: ${nextSkill ?? "углубление в трек"}.`,
      `Уже ${roadmapDone} навыков отмечено как освоенные — оформите 1–2 сильных проекта для резюме.`,
      weakTopics.length
        ? `По тестам отстают темы: ${weakTopics.join(", ")}. Закройте их до перехода к следующему этапу.`
        : `Продолжайте отмечать прогресс на карте — сейчас в работе: ${inProgressSkills.join(", ") || "базовые навыки"}.`,
    ];
    return {
      title: titles[v],
      horizon: "6–12 месяцев",
      rationale: rationales[v],
    };
  }

  if (isBeginner) {
    const titles = [
      `Войти в профессию «${professionTitle}» на позицию Junior`,
      `Освоить базовый стек «${professionTitle}» и первые pet-проекты`,
      `Пройти карту развития до уровня уверенного джуна`,
    ];
    return {
      title: titles[v],
      horizon: "6–12 месяцев",
      rationale:
        `Старт с нуля или небольшим опытом (${experienceMonths} мес.). ` +
        `Первый шаг на карте: «${nextSkill ?? "базовые навыки трека"}».`,
    };
  }

  const titles = [
    `Достичь уровня Middle в роли «${professionTitle}»`,
    `Перейти на следующий грейд в «${professionTitle}» с опорой на опыт`,
    `Закрыть пробелы senior-уровня в «${professionTitle}»`,
  ];
  return {
    title: titles[v],
    horizon: "1–2 года",
    rationale:
      `Опыт ${experienceMonths} мес. — можно ускорить рост. ` +
      `Прогресс по карте: ${pct}%${nextSkill ? `, в приоритете «${nextSkill}»` : ""}.`,
  };
}

function midTermGoal(ctx: GoalContext): GeneratedGoal {
  const { professionTitle, experienceMonths, currentPosition, variant = 0 } = ctx;
  const v = ((variant % 3) + 3) % 3;
  const isBeginner = experienceMonths < 24;
  const grade = currentPosition?.trim();

  if (isBeginner) {
    const titles = [
      `Вырасти до уровня Middle в роли «${professionTitle}»`,
      `Стать самостоятельным специалистом «${professionTitle}»`,
      `Выйти на стабильный доход в профессии «${professionTitle}»`,
    ];
    return {
      title: titles[v],
      horizon: "2–3 года",
      rationale:
        "После входа в профессию — углубить ключевые компетенции и брать задачи без постоянного менторства.",
    };
  }

  const titles = [
    `Стать экспертом и наставником в «${professionTitle}»`,
    `Перейти на Senior/Lead в «${professionTitle}»`,
    grade
      ? `Развить карьеру от «${grade}» к Lead в «${professionTitle}»`
      : `Занять senior-позицию в «${professionTitle}»`,
  ];
  return {
    title: titles[v],
    horizon: "3–5 лет",
    rationale:
      "Развивать soft skills, менторство и стратегическое мышление для перехода на старшие роли.",
  };
}

function habitGoal(ctx: GoalContext): GeneratedGoal {
  const { roadmapDone, roadmapTotal, variant = 0 } = ctx;
  const v = ((variant % 3) + 3) % 3;
  const rationales = [
    "Регулярно заходите на платформу, отмечайте прогресс по карте и проходите тесты — это удерживает мотивацию.",
    `Сейчас на карте ${roadmapDone}/${roadmapTotal} навыков — фиксируйте каждый шаг в чате с коучем.`,
    "Еженедельно выделяйте время на обучение и обновляйте цели по мере роста.",
  ];
  const titles = [
    "Сформировать устойчивую привычку развития",
    "Держать ритм обучения и обновлять прогресс",
    "Регулярно сверять цели с картой развития",
  ];
  return {
    title: titles[v],
    horizon: "постоянно",
    rationale: rationales[v],
  };
}

function longTermGoal(ctx: GoalContext): GeneratedGoal {
  const { professionTitle, currentPosition, variant = 0 } = ctx;
  const v = ((variant % 3) + 3) % 3;
  const titles = [
    `Занять экспертную позицию в «${professionTitle}» через 5–7 лет`,
    `Построить устойчивую карьеру в «${professionTitle}» с влиянием на отрасль`,
    currentPosition
      ? `Вырости от «${currentPosition}» до лидерской роли в «${professionTitle}»`
      : `Стать признанным специалистом в «${professionTitle}»`,
  ];
  return {
    title: titles[v],
    horizon: "5–10 лет",
    rationale:
      "Долгосрочная траектория: накопление экспертизы, репутации и стратегических навыков для перехода на senior/lead уровень.",
  };
}

export function generateGoals(ctx: GoalContext): GeneratedGoal[] {
  return [shortTermGoal(ctx), midTermGoal(ctx), longTermGoal(ctx), habitGoal(ctx)];
}
