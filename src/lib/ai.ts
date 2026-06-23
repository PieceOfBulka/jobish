// AI-коуч Jobish. Реальный вызов OpenRouter при наличии ключа,
// иначе — детерминированный мок-движок (работает без сети/ключей).
// См. docs/architecture.md (152-ФЗ: для прода заменить на GigaChat/YandexGPT).

export type ChatRole = "user" | "assistant" | "system";
export interface ChatTurn {
  role: ChatRole;
  content: string;
}

export interface CoachContext {
  userName?: string;
  targetProfession?: string;
  experienceMonths?: number;
  marketData?: string; // живые данные hh.ru (инструмент коуча)
}

export function isLlmEnabled(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

const CAREER_TOPIC_RE =
  /карьер|професс|работ|навык|skill|стек|технолог|компетенц|цел|план|развит|роадмап|roadmap|траектор|зарплат|ваканс|резюме|cv|собесед|интервью|тест|грейд|джун|мидл|сеньор|junior|middle|senior|профориент|специальност|обучен|курс|стаж|портфолио|оффер|рынок|востребован|выгор|сменить|увол|айти|разработ|программ|аналит|дизайн|менеджер|devops|frontend|backend|фронтенд|бэкенд|привет|здравств|добрый|хай|начать|старт|помог|jobish/i;

export function isCareerRelated(text: string): boolean {
  return CAREER_TOPIC_RE.test(text);
}

function offTopicReply(ctx: CoachContext): string {
  return (
    `Я — карьерный коуч Jobish и помогаю только с профессиями, навыками, развитием и рынком труда${ctx.targetProfession ? " (сейчас ваш трек — «" + ctx.targetProfession + "»)" : ""}. ` +
    `С чем разберёмся в карьере?`
  );
}

function systemPrompt(ctx: CoachContext): string {
  const parts = [
    "Ты — Jobish AI, эмпатичный карьерный коуч-консультант.",
    "Помогаешь как начинающим, так и опытным специалистам: профориентация, карьерные цели, навыки, выбор пути развития.",
    "Отвечай ТОЛЬКО на темы карьеры, профессий, навыков, обучения, рынка труда и развития в Jobish. На сторонние вопросы (общие знания, факты вне карьеры, развлечения и т.п.) НЕ давай ответ по сути — вежливо откажи в одном предложении и предложи помощь с карьерой.",
    "Отвечай на русском, по делу и кратко. По умолчанию 2–4 предложения; развёрнутый ответ со списками давай только когда пользователь явно просит детали или план.",
    "Если пользователь просто здоровается или пишет короткую реплику без конкретного запроса — ответь одним-двумя предложениями и задай уточняющий вопрос, не вываливай большой текст.",
    "У тебя есть данные платформы и рынка (ниже в контексте). Отвечай конкретикой — называй зарплаты по грейдам, число вакансий, компании прямо в ответе. НИКОГДА не проси пользователя «посмотреть в разделе» — вся информация уже у тебя, выдавай её сам.",
    "Если конкретных данных по запросу нет в контексте — честно скажи об этом и предложи помощь, но не отправляй в другие разделы.",
  ];
  if (ctx.userName) parts.push(`Имя пользователя: ${ctx.userName}.`);
  if (ctx.targetProfession)
    parts.push(`Целевая профессия пользователя: ${ctx.targetProfession}.`);
  if (typeof ctx.experienceMonths === "number")
    parts.push(`Опыт работы: ${ctx.experienceMonths} мес.`);
  if (ctx.marketData)
    parts.push(
      `Инструмент рынка труда вернул свежие данные — используй их в ответе: ${ctx.marketData}`,
    );
  return parts.join(" ");
}

const MODEL = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct";

export async function coachReply(
  history: ChatTurn[],
  ctx: CoachContext = {},
): Promise<{ content: string; source: "llm" | "mock" }> {
  if (isLlmEnabled()) {
    try {
      const content = await callOpenRouter(history, ctx);
      return { content, source: "llm" };
    } catch (e) {
      console.error("OpenRouter error, fallback to mock:", e);
    }
  }
  return { content: mockReply(history, ctx), source: "mock" };
}

async function callOpenRouter(
  history: ChatTurn[],
  ctx: CoachContext,
): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://jobish.local",
      "X-Title": "Jobish AI Coach",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt(ctx) },
        ...history.map((t) => ({ role: t.role, content: t.content })),
      ],
      temperature: 0.6,
      max_tokens: 500,
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Пустой ответ модели");
  return content.trim();
}

// ─────────────── Мок-движок ───────────────
// Детерминированные, но осмысленные ответы по ключевым словам.

const KEYWORD_REPLIES: { match: RegExp; reply: (ctx: CoachContext) => string }[] = [
  {
    match: /привет|здравств|добрый|хай|начать|старт/i,
    reply: (c) =>
      `Здравствуйте${c.userName ? ", " + c.userName : ""}! Я Jobish AI. Чем помочь — выбрать направление, разобрать навыки или составить план развития?`,
  },
  {
    match: /цел|план|развит|роадмап|roadmap|траектор/i,
    reply: (c) =>
      `Отличный запрос про развитие${c.targetProfession ? " в направлении «" + c.targetProfession + "»" : ""}. ` +
      `Предлагаю двигаться так:\n\n1. Зафиксируем долгосрочную цель (горизонт 3–5 лет).\n2. Разобьём её на навыки и этапы — это ваша карта развития (roadmap).\n3. К каждому навыку подберём материалы и контрольный тест.\n\nС чего начнём — сформулируем цель вместе?`,
  },
  {
    match: /навык|skill|стек|технолог|компетенц|hard|soft/i,
    reply: (c) =>
      (c.marketData ? c.marketData + " " : "") +
      `Навыки делятся на hard (технические) и soft (коммуникация, мышление)${c.targetProfession ? " — для «" + c.targetProfession + "»" : ""}. ` +
      `Скажите ваш текущий уровень (или какой грейд цель) — и я перечислю конкретные навыки, которые стоит подтянуть в первую очередь.`,
  },
  {
    match: /зарплат|зп |ден[ьге]|зараб|доход|оклад|ваканс|рынок|востребован|грейд|джун|мидл|сеньор|junior|middle|senior/i,
    reply: (c) =>
      c.marketData
        ? `${c.marketData} Подсказать, какой грейд для вас реалистично достижим в ближайшие месяцы и какие навыки для этого подтянуть?`
        : `Чтобы назвать конкретные цифры по зарплатам и вакансиям, выберите целевую профессию (трек развития)${c.targetProfession ? "" : ""} — тогда я дам зарплаты по грейдам, спрос и топ-компании прямо здесь. Какая профессия вас интересует?`,
  },
  {
    match: /резюме|cv|резюмешк/i,
    reply: () =>
      `Давайте разберём резюме. Я смотрю на 4 блока:\n\n1. Заголовок и желаемая позиция — конкретны ли они.\n2. Опыт — глаголы действия и измеримые результаты.\n3. Навыки — релевантны ли вакансии.\n4. Проекты — есть ли пет-проекты/портфолио.\n\nЗагрузите резюме в профиле и пришлите, что хотите улучшить — пройдёмся по пунктам.`,
  },
  {
    match: /собесед|интервью|interview|оффер|вопросы на/i,
    reply: () =>
      `Подготовимся к собеседованию. План:\n\n1. Самопрезентация (2 минуты о себе).\n2. Технические вопросы по вашему треку.\n3. Поведенческие вопросы (STAR-метод).\n4. Ваши вопросы работодателю.\n\nС чего начнём — потренируем рассказ о себе или разберём типичные технические вопросы?`,
  },
  {
    match: /тест|экзамен|провер/i,
    reply: () =>
      `Контрольный тест покажет сильные и слабые темы по вашему профилю, а успешная сдача автоматически отметит этап на карте развития. ` +
      `Можно пройти общий тест в разделе «Тесты» или сгенерировать персональный по вашему треку. Готовы попробовать?`,
  },
  {
    match: /работ|увол|менять|сменить|тупик|выгор|устал/i,
    reply: () =>
      `Понимаю, смена работы — непростой шаг. Давайте оценим текущую позицию по параметрам: интерес, доход, рост, команда, баланс. ` +
      `Ответьте по шкале 1–5 на каждый — и я помогу понять, стоит ли менять направление или достаточно скорректировать роль.`,
  },
];

function mockReply(history: ChatTurn[], ctx: CoachContext): string {
  const lastUser = [...history].reverse().find((t) => t.role === "user");
  const text = lastUser?.content ?? "";
  for (const rule of KEYWORD_REPLIES) {
    if (rule.match.test(text)) return rule.reply(ctx);
  }
  if (!isCareerRelated(text)) return offTopicReply(ctx);
  return (
    `Чтобы дать точный совет, уточните вашу цель и текущую ситуацию в карьере${ctx.userName ? ", " + ctx.userName : ""}. ` +
    `Могу помочь с выбором направления, набором навыков по грейдам, картой развития, анализом рынка и зарплат или разбором текущей работы. С чего начнём?`
  );
}
