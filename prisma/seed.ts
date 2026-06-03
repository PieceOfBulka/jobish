import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

type SkillSeed = { name: string; type: "hard" | "soft"; grade: "junior" | "middle" | "senior" };
type MaterialSeed = { skillName: string; title: string; url: string; provider: string; isFree?: boolean };
type QuestionSeed = { text: string; options: string[]; correct: number; topic: string };

interface ProfSeed {
  slug: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  skills: SkillSeed[];
  market: {
    demandLevel: string;
    openVacancies: number;
    salary: [number, number, number]; // junior, middle, senior
    topCompanies: { name: string; salary: number; hiring: string }[];
  };
  materials: MaterialSeed[];
  test: { title: string; topic: string; questions: QuestionSeed[] };
}

function trend(base: [number, number, number]) {
  // 6 месяцев плавного роста для графика
  const months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн"];
  return months.map((m, i) => ({
    month: m,
    junior: Math.round(base[0] * (0.94 + i * 0.012)),
    middle: Math.round(base[1] * (0.94 + i * 0.012)),
    senior: Math.round(base[2] * (0.94 + i * 0.012)),
  }));
}

const PROFESSIONS: ProfSeed[] = [
  {
    slug: "frontend-developer",
    title: "Frontend-разработчик",
    category: "Разработка",
    summary: "Создаёт пользовательские интерфейсы веб-приложений.",
    description:
      "Frontend-разработчик отвечает за визуальную часть продукта: вёрстку, интерактив, производительность интерфейса. Работает в связке с дизайнерами и бэкенд-разработчиками. Высокий спрос на рынке, низкий порог входа для старта, но требуется постоянное обучение.",
    skills: [
      { name: "HTML и CSS", type: "hard", grade: "junior" },
      { name: "JavaScript (ES6+)", type: "hard", grade: "junior" },
      { name: "React", type: "hard", grade: "middle" },
      { name: "TypeScript", type: "hard", grade: "middle" },
      { name: "Архитектура и оптимизация", type: "hard", grade: "senior" },
      { name: "Коммуникация в команде", type: "soft", grade: "junior" },
      { name: "Самостоятельность и поиск решений", type: "soft", grade: "middle" },
      { name: "Менторство", type: "soft", grade: "senior" },
    ],
    market: {
      demandLevel: "высокая",
      openVacancies: 12400,
      salary: [80000, 180000, 320000],
      topCompanies: [
        { name: "Яндекс", salary: 300000, hiring: "активно" },
        { name: "VK", salary: 270000, hiring: "активно" },
        { name: "Тинькофф", salary: 290000, hiring: "активно" },
      ],
    },
    materials: [
      { skillName: "HTML и CSS", title: "HTML Academy: Основы", url: "https://htmlacademy.ru/", provider: "HTML Academy" },
      { skillName: "JavaScript (ES6+)", title: "learn.javascript.ru", url: "https://learn.javascript.ru/", provider: "learn.js" },
      { skillName: "React", title: "React — официальная документация", url: "https://react.dev/learn", provider: "react.dev" },
      { skillName: "TypeScript", title: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/", provider: "TS" },
    ],
    test: {
      title: "Основы Frontend",
      topic: "Frontend",
      questions: [
        { text: "Какой тег создаёт гиперссылку в HTML?", options: ["<link>", "<a>", "<href>", "<url>"], correct: 1, topic: "HTML" },
        { text: "Что делает свойство display: flex?", options: ["Скрывает элемент", "Включает флекс-контейнер", "Делает текст жирным", "Создаёт таблицу"], correct: 1, topic: "CSS" },
        { text: "Какой метод массива создаёт новый массив из результатов функции?", options: ["forEach", "map", "filter", "reduce"], correct: 1, topic: "JavaScript" },
        { text: "Что такое JSX?", options: ["База данных", "Синтаксис разметки в React", "CSS-препроцессор", "HTTP-метод"], correct: 1, topic: "React" },
        { text: "Какой хук React хранит локальное состояние?", options: ["useEffect", "useState", "useMemo", "useRef"], correct: 1, topic: "React" },
      ],
    },
  },
  {
    slug: "data-analyst",
    title: "Аналитик данных",
    category: "Аналитика",
    summary: "Превращает данные в решения для бизнеса.",
    description:
      "Аналитик данных собирает, очищает и интерпретирует данные, строит дашборды и помогает командам принимать решения. Нужны SQL, статистика и навык рассказывать истории по данным. Профессия с понятным карьерным треком и широким спросом.",
    skills: [
      { name: "SQL", type: "hard", grade: "junior" },
      { name: "Excel / Google Sheets", type: "hard", grade: "junior" },
      { name: "Python (pandas)", type: "hard", grade: "middle" },
      { name: "Визуализация (BI-инструменты)", type: "hard", grade: "middle" },
      { name: "Статистика и A/B-тесты", type: "hard", grade: "senior" },
      { name: "Критическое мышление", type: "soft", grade: "junior" },
      { name: "Сторителлинг по данным", type: "soft", grade: "middle" },
      { name: "Влияние на стейкхолдеров", type: "soft", grade: "senior" },
    ],
    market: {
      demandLevel: "высокая",
      openVacancies: 8600,
      salary: [70000, 150000, 280000],
      topCompanies: [
        { name: "Сбер", salary: 260000, hiring: "активно" },
        { name: "Авито", salary: 240000, hiring: "активно" },
        { name: "Ozon", salary: 230000, hiring: "умеренно" },
      ],
    },
    materials: [
      { skillName: "SQL", title: "Stepik: Интерактивный SQL", url: "https://stepik.org/course/63054", provider: "Stepik" },
      { skillName: "Python (pandas)", title: "pandas — getting started", url: "https://pandas.pydata.org/docs/getting_started/", provider: "pandas" },
      { skillName: "Визуализация (BI-инструменты)", title: "Основы дашбордов", url: "https://datalens.yandex/", provider: "DataLens" },
      { skillName: "Статистика и A/B-тесты", title: "Основы статистики (Stepik)", url: "https://stepik.org/course/76", provider: "Stepik" },
    ],
    test: {
      title: "Основы аналитики данных",
      topic: "Data",
      questions: [
        { text: "Какой оператор SQL выбирает данные?", options: ["INSERT", "SELECT", "UPDATE", "DELETE"], correct: 1, topic: "SQL" },
        { text: "Что делает GROUP BY?", options: ["Сортирует строки", "Группирует строки для агрегации", "Удаляет дубликаты строк", "Соединяет таблицы"], correct: 1, topic: "SQL" },
        { text: "Какая мера НЕ является мерой центра распределения?", options: ["Среднее", "Медиана", "Мода", "Дисперсия"], correct: 3, topic: "Статистика" },
        { text: "Что показывает p-value в A/B-тесте?", options: ["Размер выборки", "Вероятность увидеть результат при верной H0", "Прибыль", "Конверсию"], correct: 1, topic: "Статистика" },
        { text: "Какая библиотека Python — для табличных данных?", options: ["NumPy", "pandas", "Flask", "Pillow"], correct: 1, topic: "Python" },
      ],
    },
  },
  {
    slug: "ux-ui-designer",
    title: "UX/UI-дизайнер",
    category: "Дизайн",
    summary: "Проектирует удобные и красивые интерфейсы.",
    description:
      "UX/UI-дизайнер исследует пользователей, проектирует сценарии и создаёт визуальный язык продукта. Сочетает аналитику (UX) и эстетику (UI). Важны эмпатия, насмотренность и умение защищать решения.",
    skills: [
      { name: "Figma", type: "hard", grade: "junior" },
      { name: "Основы UX-исследований", type: "hard", grade: "junior" },
      { name: "Дизайн-системы", type: "hard", grade: "middle" },
      { name: "Прототипирование", type: "hard", grade: "middle" },
      { name: "Продуктовое мышление", type: "hard", grade: "senior" },
      { name: "Эмпатия к пользователю", type: "soft", grade: "junior" },
      { name: "Презентация решений", type: "soft", grade: "middle" },
      { name: "Работа с заказчиком", type: "soft", grade: "senior" },
    ],
    market: {
      demandLevel: "средняя",
      openVacancies: 4200,
      salary: [65000, 140000, 250000],
      topCompanies: [
        { name: "Яндекс", salary: 240000, hiring: "умеренно" },
        { name: "Тинькофф", salary: 230000, hiring: "активно" },
        { name: "Wildberries", salary: 200000, hiring: "умеренно" },
      ],
    },
    materials: [
      { skillName: "Figma", title: "Figma — официальные туториалы", url: "https://help.figma.com/", provider: "Figma" },
      { skillName: "Основы UX-исследований", title: "Nielsen Norman Group", url: "https://www.nngroup.com/articles/", provider: "NN/g" },
      { skillName: "Дизайн-системы", title: "Material Design Guidelines", url: "https://m3.material.io/", provider: "Google" },
      { skillName: "Прототипирование", title: "Прототипы в Figma", url: "https://help.figma.com/hc/en-us/categories/360002051613", provider: "Figma" },
    ],
    test: {
      title: "Основы UX/UI",
      topic: "Design",
      questions: [
        { text: "Что описывает UX?", options: ["Только цвета", "Опыт взаимодействия пользователя", "Серверную логику", "Цену продукта"], correct: 1, topic: "UX" },
        { text: "Что такое user flow?", options: ["Поток данных в БД", "Путь пользователя по продукту", "Анимация загрузки", "Список багов"], correct: 1, topic: "UX" },
        { text: "Зачем нужна дизайн-система?", options: ["Для единообразия и переиспользования", "Для хранения паролей", "Для деплоя", "Для аналитики"], correct: 0, topic: "UI" },
        { text: "Что важно при выборе контраста текста?", options: ["Доступность (a11y)", "Размер файла", "Скорость сети", "Версия браузера"], correct: 0, topic: "UI" },
        { text: "Что такое прототип?", options: ["Финальный код", "Интерактивная модель интерфейса", "База клиентов", "Маркетинговый план"], correct: 1, topic: "UX" },
      ],
    },
  },
  {
    slug: "product-manager",
    title: "Менеджер продукта",
    category: "Менеджмент",
    summary: "Отвечает за ценность и развитие продукта.",
    description:
      "Продакт-менеджер определяет, что и зачем делает команда: формирует стратегию, приоритезирует задачи, работает с метриками и стейкхолдерами. Нужны системное мышление, коммуникация и понимание данных.",
    skills: [
      { name: "Работа с метриками (юнит-экономика)", type: "hard", grade: "junior" },
      { name: "Customer Development", type: "hard", grade: "junior" },
      { name: "Приоритизация и roadmap", type: "hard", grade: "middle" },
      { name: "Анализ данных (SQL базово)", type: "hard", grade: "middle" },
      { name: "Продуктовая стратегия", type: "hard", grade: "senior" },
      { name: "Коммуникация", type: "soft", grade: "junior" },
      { name: "Лидерство без власти", type: "soft", grade: "middle" },
      { name: "Переговоры со стейкхолдерами", type: "soft", grade: "senior" },
    ],
    market: {
      demandLevel: "средняя",
      openVacancies: 5300,
      salary: [90000, 200000, 380000],
      topCompanies: [
        { name: "Ozon", salary: 350000, hiring: "активно" },
        { name: "Яндекс", salary: 360000, hiring: "умеренно" },
        { name: "Авито", salary: 330000, hiring: "активно" },
      ],
    },
    materials: [
      { skillName: "Работа с метриками (юнит-экономика)", title: "Юнит-экономика: основы", url: "https://gopractice.ru/", provider: "GoPractice" },
      { skillName: "Customer Development", title: "CustDev: интервью с пользователями", url: "https://www.svyatoslav.biz/", provider: "Blog" },
      { skillName: "Приоритизация и roadmap", title: "RICE и фреймворки приоритизации", url: "https://www.productplan.com/glossary/rice-scoring-model/", provider: "ProductPlan" },
      { skillName: "Продуктовая стратегия", title: "Good Product Strategy", url: "https://svpg.com/articles/", provider: "SVPG" },
    ],
    test: {
      title: "Основы продакт-менеджмента",
      topic: "Product",
      questions: [
        { text: "Что такое MVP?", options: ["Максимально дорогой продукт", "Минимально жизнеспособный продукт", "Маркетинговый план", "Метрика выручки"], correct: 1, topic: "Продукт" },
        { text: "Что измеряет retention?", options: ["Удержание пользователей", "Стоимость серверов", "Размер команды", "Скорость кода"], correct: 0, topic: "Метрики" },
        { text: "Зачем нужен Customer Development?", options: ["Чтобы писать код", "Чтобы проверять гипотезы о потребностях", "Чтобы нанимать", "Чтобы верстать"], correct: 1, topic: "Исследования" },
        { text: "Что такое roadmap продукта?", options: ["Карта офиса", "План развития продукта во времени", "Список багов", "Бюджет на рекламу"], correct: 1, topic: "Продукт" },
        { text: "Какой фреймворк используют для приоритизации?", options: ["RICE", "HTTP", "REST", "SQL"], correct: 0, topic: "Приоритизация" },
      ],
    },
  },
  {
    slug: "qa-engineer",
    title: "QA-инженер",
    category: "Разработка",
    summary: "Обеспечивает качество и стабильность продукта.",
    description:
      "QA-инженер проектирует тест-кейсы, находит баги и автоматизирует проверки. Хороший вход в IT с возможностью роста в автоматизацию. Важны внимательность, системность и базовое программирование.",
    skills: [
      { name: "Теория тестирования", type: "hard", grade: "junior" },
      { name: "Написание тест-кейсов", type: "hard", grade: "junior" },
      { name: "API-тестирование (Postman)", type: "hard", grade: "middle" },
      { name: "Автотесты (Playwright/Selenium)", type: "hard", grade: "middle" },
      { name: "CI/CD и стратегия тестирования", type: "hard", grade: "senior" },
      { name: "Внимательность к деталям", type: "soft", grade: "junior" },
      { name: "Коммуникация с разработчиками", type: "soft", grade: "middle" },
      { name: "Выстраивание процессов QA", type: "soft", grade: "senior" },
    ],
    market: {
      demandLevel: "высокая",
      openVacancies: 6100,
      salary: [60000, 130000, 240000],
      topCompanies: [
        { name: "Тинькофф", salary: 220000, hiring: "активно" },
        { name: "VK", salary: 200000, hiring: "умеренно" },
        { name: "Сбер", salary: 210000, hiring: "активно" },
      ],
    },
    materials: [
      { skillName: "Теория тестирования", title: "ISTQB Foundation (RU)", url: "https://www.istqb.org/", provider: "ISTQB" },
      { skillName: "API-тестирование (Postman)", title: "Postman Learning Center", url: "https://learning.postman.com/", provider: "Postman" },
      { skillName: "Автотесты (Playwright/Selenium)", title: "Playwright Docs", url: "https://playwright.dev/", provider: "Playwright" },
      { skillName: "Написание тест-кейсов", title: "Гайд по тест-кейсам", url: "https://www.guru99.com/test-case.html", provider: "Guru99" },
    ],
    test: {
      title: "Основы тестирования",
      topic: "QA",
      questions: [
        { text: "Что такое баг?", options: ["Новая фича", "Отклонение от ожидаемого поведения", "Сервер", "Тест-кейс"], correct: 1, topic: "Теория" },
        { text: "Что описывает тест-кейс?", options: ["Шаги, данные и ожидаемый результат", "Зарплату", "Архитектуру", "Цвет кнопки"], correct: 0, topic: "Теория" },
        { text: "Какой HTTP-метод обычно создаёт ресурс?", options: ["GET", "POST", "DELETE", "HEAD"], correct: 1, topic: "API" },
        { text: "Что такое регрессионное тестирование?", options: ["Проверка, что старое не сломалось", "Найм QA", "Деплой", "Только ручной тест"], correct: 0, topic: "Теория" },
        { text: "Инструмент для автотестов UI:", options: ["Playwright", "pandas", "Figma", "Kong"], correct: 0, topic: "Автоматизация" },
      ],
    },
  },
  {
    slug: "hr-it-specialist",
    title: "IT-рекрутер",
    category: "HR",
    summary: "Подбирает и нанимает специалистов в IT.",
    description:
      "IT-рекрутер ищет и оценивает кандидатов, ведёт коммуникацию и закрывает вакансии. Нужны коммуникабельность, понимание IT-ролей и навык работы с воронкой найма. Низкий технический порог входа, высокая роль soft skills.",
    skills: [
      { name: "Поиск кандидатов (sourcing)", type: "hard", grade: "junior" },
      { name: "Проведение интервью", type: "hard", grade: "junior" },
      { name: "Понимание IT-ролей и стека", type: "hard", grade: "middle" },
      { name: "Работа с ATS и воронкой", type: "hard", grade: "middle" },
      { name: "Аналитика найма", type: "hard", grade: "senior" },
      { name: "Коммуникабельность", type: "soft", grade: "junior" },
      { name: "Эмпатия и оценка людей", type: "soft", grade: "middle" },
      { name: "Управление ожиданиями нанимающих", type: "soft", grade: "senior" },
    ],
    market: {
      demandLevel: "средняя",
      openVacancies: 3400,
      salary: [55000, 110000, 200000],
      topCompanies: [
        { name: "Яндекс", salary: 190000, hiring: "умеренно" },
        { name: "VK", salary: 170000, hiring: "умеренно" },
        { name: "Ozon", salary: 180000, hiring: "активно" },
      ],
    },
    materials: [
      { skillName: "Поиск кандидатов (sourcing)", title: "Boolean search для рекрутера", url: "https://amazinghiring.ru/", provider: "Blog" },
      { skillName: "Проведение интервью", title: "Структурированное интервью", url: "https://hbr.org/", provider: "HBR" },
      { skillName: "Понимание IT-ролей и стека", title: "Кто есть кто в IT", url: "https://habr.com/ru/", provider: "Habr" },
      { skillName: "Аналитика найма", title: "Метрики рекрутинга", url: "https://www.aihr.com/", provider: "AIHR" },
    ],
    test: {
      title: "Основы IT-рекрутинга",
      topic: "HR",
      questions: [
        { text: "Что такое sourcing?", options: ["Активный поиск кандидатов", "Увольнение", "Расчёт зарплаты", "Деплой"], correct: 0, topic: "Подбор" },
        { text: "Что такое ATS?", options: ["Система управления кандидатами", "Язык программирования", "База вакансий ЦБ", "Тип теста"], correct: 0, topic: "Инструменты" },
        { text: "Кто такой Backend-разработчик?", options: ["Делает серверную логику", "Рисует логотипы", "Ведёт бухгалтерию", "Пишет тексты"], correct: 0, topic: "IT-роли" },
        { text: "Что важно в структурированном интервью?", options: ["Одинаковые вопросы и критерии", "Случайные вопросы", "Только резюме", "Только тест"], correct: 0, topic: "Интервью" },
        { text: "Метрика времени закрытия вакансии:", options: ["Time to hire", "CTR", "RPS", "TTL"], correct: 0, topic: "Метрики" },
      ],
    },
  },
];

async function main() {
  console.log("🌱 Засеваю базу...");

  // Чистка (идемпотентность)
  await prisma.theoryAttempt.deleteMany();
  await prisma.theoryQuestion.deleteMany();
  await prisma.theoryTest.deleteMany();
  await prisma.learningMaterial.deleteMany();
  await prisma.marketAnalytics.deleteMany();
  await prisma.professionSkill.deleteMany();
  await prisma.profession.deleteMany();

  for (const p of PROFESSIONS) {
    const profession = await prisma.profession.create({
      data: {
        slug: p.slug,
        title: p.title,
        category: p.category,
        summary: p.summary,
        description: p.description,
        skills: {
          create: p.skills.map((s, i) => ({
            name: s.name,
            type: s.type,
            grade: s.grade,
            order: i,
          })),
        },
        market: {
          create: {
            demandLevel: p.market.demandLevel,
            openVacancies: p.market.openVacancies,
            salaryJunior: p.market.salary[0],
            salaryMiddle: p.market.salary[1],
            salarySenior: p.market.salary[2],
            salaryTrend: JSON.stringify(trend(p.market.salary)),
            topCompanies: JSON.stringify(p.market.topCompanies),
            source: "Демо-данные на основе агрегаторов (актуальность: Q2 2026)",
          },
        },
        materials: {
          create: p.materials.map((m) => ({
            skillName: m.skillName,
            title: m.title,
            url: m.url,
            provider: m.provider,
            isFree: m.isFree ?? true,
          })),
        },
      },
    });

    await prisma.theoryTest.create({
      data: {
        professionId: profession.id,
        title: p.test.title,
        topic: p.test.topic,
        questions: {
          create: p.test.questions.map((q, i) => ({
            text: q.text,
            options: JSON.stringify(q.options),
            correct: q.correct,
            topic: q.topic,
            order: i,
          })),
        },
      },
    });
    console.log(`  ✓ ${p.title}`);
  }

  // Демо-пользователь
  const email = "demo@jobish.ru";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        name: "Демо Пользователь",
        passwordHash: await bcrypt.hash("demo1234", 10),
        profile: { create: { experienceYears: 1, currentRole: "Студент" } },
        subscription: { create: { plan: "free" } },
      },
    });
    console.log("  ✓ Демо-пользователь demo@jobish.ru / demo1234");
  }

  console.log("✅ Готово.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
