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
}

export function isLlmEnabled(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

function systemPrompt(ctx: CoachContext): string {
  const parts = [
    "Ты — Jobish AI, эмпатичный карьерный коуч-консультант.",
    "Помогаешь как начинающим, так и опытным специалистам: профориентация, карьерные цели, навыки, выбор пути развития.",
    "Отвечай на русском, по делу, поддерживающе и структурированно. Используй короткие абзацы и списки.",
    "Не выдумывай точных зарплат и вакансий — для цифр отсылай к разделу «Аналитика рынка».",
  ];
  if (ctx.userName) parts.push(`Имя пользователя: ${ctx.userName}.`);
  if (ctx.targetProfession)
    parts.push(`Целевая профессия пользователя: ${ctx.targetProfession}.`);
  if (typeof ctx.experienceMonths === "number")
    parts.push(`Опыт работы: ${ctx.experienceMonths} мес.`);
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
      temperature: 0.7,
      max_tokens: 700,
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
      `Здравствуйте${c.userName ? ", " + c.userName : ""}! Я Jobish AI — ваш карьерный коуч. ` +
      `Расскажите, что для вас сейчас важнее: выбрать направление, понять нужные навыки или составить план развития?`,
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
      `Навыки удобно делить на hard (технические) и soft (коммуникация, мышление). ` +
      `${c.targetProfession ? "Для «" + c.targetProfession + "» " : ""}рекомендую открыть раздел «Профессии» — там разбивка по грейдам (junior/middle/senior). ` +
      `Хотите, отмечу, какие навыки стоит подтянуть в первую очередь?`,
  },
  {
    match: /зарплат|деньг|доход|ваканс|рынок|востребован/i,
    reply: () =>
      `Актуальные цифры по зарплатам, числу вакансий и топ-компаниям смотрите в разделе «Аналитика рынка» — там данные с указанием источника. ` +
      `А я помогу понять, какой грейд вам реалистично достижим в ближайшие месяцы. Расскажете про текущий опыт?`,
  },
  {
    match: /тест|экзамен|провер|заморозк/i,
    reply: () =>
      `Теоретический тест покажет сильные и слабые темы. Если не наберёте проходной балл — включится «заморозка» на сутки (это не наказание, а пауза, чтобы подтянуть материал). ` +
      `Разморозить можно доп. попыткой. Готовы попробовать?`,
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
  return (
    `Спасибо, что поделились${ctx.userName ? ", " + ctx.userName : ""}. ` +
    `Чтобы дать полезный совет, уточните: какая у вас цель и где вы сейчас находитесь в карьере? ` +
    `Могу помочь с выбором направления, набором навыков, картой развития или анализом текущей работы.\n\n` +
    `_(Ответ сгенерирован демо-движком. Подключите OPENROUTER_API_KEY для живой модели.)_`
  );
}
