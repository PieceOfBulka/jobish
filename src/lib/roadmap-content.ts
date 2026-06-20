// Контент карты развития (ФТ-4) — чистые хелперы без зависимостей.
// Делают карту «развёрнутой и понятной»: осмысленные описания этапов,
// пояснения к навыкам и реалистичные оценки времени. Покрыто unit-тестами.

export type Grade = "junior" | "middle" | "senior";
export type SkillType = "hard" | "soft";

export interface StageInfo {
  key: Grade;
  title: string;
  /** Краткий итог этапа — что пользователь сможет делать после него. */
  outcome: string;
}

export const GRADE_STAGES: StageInfo[] = [
  {
    key: "junior",
    title: "Junior — фундамент",
    outcome:
      "освоить базовые навыки, собрать первые учебные проекты и претендовать на стажировку или junior-позицию",
  },
  {
    key: "middle",
    title: "Middle — уверенный специалист",
    outcome:
      "самостоятельно решать рабочие задачи, отвечать за свой участок и претендовать на позиции уровня Middle",
  },
  {
    key: "senior",
    title: "Senior — экспертиза",
    outcome:
      "принимать архитектурные решения, влиять на продукт и наставлять других — уровень Senior и выше",
  },
];

/**
 * Описание этапа: что осваивается и какой результат.
 * Параметризовано профессией и навыками этого этапа.
 */
export function stageDescription(
  grade: Grade,
  professionTitle: string,
  skillNames: string[],
): string {
  const info = GRADE_STAGES.find((s) => s.key === grade);
  const outcome = info?.outcome ?? "освоить ключевые навыки этапа";
  if (skillNames.length === 0) {
    return `Этап профессии «${professionTitle}». Цель — ${outcome}.`;
  }
  const list = skillNames.join(", ");
  return `Здесь вы освоите: ${list}. Цель этапа — ${outcome}.`;
}

/** Короткое пояснение к навыку «зачем он» — по типу и грейду. */
export function stepHint(type: SkillType | null, grade: Grade): string {
  if (type === "soft") {
    const byGrade: Record<Grade, string> = {
      junior: "Гибкий навык: помогает влиться в команду и расти быстрее.",
      middle: "Гибкий навык: усиливает самостоятельность и доверие коллег.",
      senior: "Гибкий навык: основа лидерства и влияния на результат.",
    };
    return byGrade[grade];
  }
  // hard (или неизвестный тип — трактуем как технический)
  const byGrade: Record<Grade, string> = {
    junior: "Базовый технический навык — нужен, чтобы начать решать реальные задачи.",
    middle: "Профильный навык уровня Middle — для самостоятельной работы.",
    senior: "Продвинутый навык — отличает эксперта и открывает senior-задачи.",
  };
  return byGrade[grade];
}

/** Реалистичная оценка времени освоения навыка (часы) по типу и грейду. */
export function estimateForSkill(type: SkillType | null, grade: Grade): number {
  // soft-навыки осваиваются на практике и обычно требуют меньше «учебных» часов
  const hard: Record<Grade, number> = { junior: 24, middle: 40, senior: 60 };
  const soft: Record<Grade, number> = { junior: 12, middle: 18, senior: 24 };
  return (type === "soft" ? soft : hard)[grade];
}
