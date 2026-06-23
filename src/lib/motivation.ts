// Motivation system: badges, rewards, reminders (US3, ФТ-7).

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
}

export interface Reminder {
  id: string;
  message: string;
  type: "progress" | "streak" | "test" | "goals";
}

export function computeBadges(params: {
  streakDays: number;
  roadmapProgress: number;
  testsPassed: number;
  orientationDone: boolean;
  goalsSet: boolean;
}): Badge[] {
  const { streakDays, roadmapProgress, testsPassed, orientationDone, goalsSet } = params;
  return [
    {
      id: "first-step",
      title: "Первый шаг",
      description: "Пройдите профориентационный тест на странице «Профориентация»",
      icon: "🧭",
      earned: orientationDone,
    },
    {
      id: "streak-3",
      title: "На волне",
      description: "Заходите на платформу 3 дня подряд (стрик на дашборде)",
      icon: "🔥",
      earned: streakDays >= 3,
    },
    {
      id: "streak-7",
      title: "Привычка",
      description: "Поддерживайте стрик 7 дней подряд без пропусков",
      icon: "⚡",
      earned: streakDays >= 7,
    },
    {
      id: "half-track",
      title: "Полпути",
      description: "Отметьте как освоенные 50% навыков на карте развития",
      icon: "🎯",
      earned: roadmapProgress >= 50,
    },
    {
      id: "track-done",
      title: "Трек завершён",
      description: "Завершите все навыки на карте развития (100%)",
      icon: "🏆",
      earned: roadmapProgress >= 100,
    },
    {
      id: "test-master",
      title: "Теоретик",
      description: "Успешно сдайте хотя бы один теоретический тест",
      icon: "📚",
      earned: testsPassed >= 1,
    },
    {
      id: "goals-set",
      title: "С целью",
      description: "Добавьте или сгенерируйте карьерные цели в разделе «Карьерные цели»",
      icon: "🎖️",
      earned: goalsSet,
    },
  ];
}

export function buildReminders(params: {
  visitedToday: boolean;
  roadmapProgress: number;
  hasRoadmap: boolean;
  lastTestDaysAgo: number | null;
  goalsSet: boolean;
}): Reminder[] {
  const reminders: Reminder[] = [];
  if (params.hasRoadmap && params.roadmapProgress < 100 && !params.visitedToday) {
    reminders.push({
      id: "daily-visit",
      message: "Зайдите сегодня на платформу и отметьте прогресс по карте — это поддержит ваш стрик.",
      type: "streak",
    });
  }
  if (params.hasRoadmap && params.roadmapProgress < 50) {
    reminders.push({
      id: "roadmap-progress",
      message: "Продолжайте карту развития: отмечайте освоенные навыки или расскажите о прогрессе AI-коучу.",
      type: "progress",
    });
  }
  if (params.lastTestDaysAgo !== null && params.lastTestDaysAgo > 14) {
    reminders.push({
      id: "retake-test",
      message: "Прошло больше двух недель с последнего теста — проверьте знания и обновите слабые темы.",
      type: "test",
    });
  }
  if (!params.goalsSet) {
    reminders.push({
      id: "set-goals",
      message: "Сформулируйте карьерные цели — они помогут удерживать фокус на долгосрочном развитии.",
      type: "goals",
    });
  }
  return reminders;
}
