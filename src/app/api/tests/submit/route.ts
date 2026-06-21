import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  gradeAttempt,
  canRetake,
  buildConclusion,
  shouldLowerDifficulty,
  scoreMultiple,
  type GradedAnswer,
} from "@/lib/theory";

export interface AttemptPayload {
  score: number;
  passed: boolean;
  weakTopics: string[];
  strongTopics: string[];
  total: number;
  correctCount: number;
  conclusion: string;
  recommendations: { title: string; url: string; provider: string }[];
  testTitle: string;
  completedAt: string;
}

const answerValue = z.union([
  z.number().int().min(0),          // single (option index) or scale (1-10)
  z.array(z.number().int().min(0)), // multiple (option indices)
  z.string(),                       // text
]);

const schema = z.object({
  testId: z.string().min(1),
  answers: z.record(z.string(), answerValue),
});

type AnswerValue = z.infer<typeof answerValue>;

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
  }
  const { testId, answers } = parsed.data;

  const test = await prisma.theoryTest.findUnique({
    where: { id: testId },
    include: { questions: true, profession: { include: { materials: true } } },
  });
  if (!test) return NextResponse.json({ error: "Тест не найден" }, { status: 404 });

  // Проверяем заморозку по последней попытке
  const last = await prisma.theoryAttempt.findFirst({
    where: { userId, testId },
    orderBy: { createdAt: "desc" },
  });
  if (last && !canRetake(last.frozenUntil, last.extraTries)) {
    return NextResponse.json(
      { error: "Тест заморожен. Дождитесь окончания или используйте доп. попытку." },
      { status: 403 },
    );
  }

  const graded: GradedAnswer[] = test.questions.map((q) => {
    const raw: AnswerValue | undefined = answers[q.id];
    const weight = q.weight;
    const qType = q.type ?? "single";

    if (qType === "scale" || qType === "text") {
      return { questionId: q.id, topic: q.topic, weight, points: 0, scoreable: false };
    }

    if (qType === "multiple") {
      const selected = Array.isArray(raw) ? raw : [];
      const correctSet: number[] = q.correctOptions
        ? (JSON.parse(q.correctOptions) as number[])
        : [q.correct];
      const totalOptions = (JSON.parse(q.options) as unknown[]).length;
      const points = scoreMultiple(selected, correctSet, totalOptions, weight);
      return { questionId: q.id, topic: q.topic, weight, points, scoreable: true };
    }

    // single (default)
    const selectedIdx = typeof raw === "number" ? raw : -1;
    const points = selectedIdx === q.correct ? weight : 0;
    return { questionId: q.id, topic: q.topic, weight, points, scoreable: true };
  });

  const result = gradeAttempt(graded);

  // Если была доступная доп. попытка из-за заморозки — расходуем её
  const extraTries = 0;
  if (last && last.frozenUntil && last.frozenUntil > new Date() && last.extraTries > 0) {
    await prisma.theoryAttempt.update({
      where: { id: last.id },
      data: { extraTries: last.extraTries - 1 },
    });
  }

  await prisma.theoryAttempt.create({
    data: {
      userId,
      testId,
      score: result.score,
      passed: result.passed,
      weakTopics: JSON.stringify(result.weakTopics),
      frozenUntil: result.frozenUntil,
      extraTries,
    },
  });

  // ФТ-7.8 — при <50% снижаем сложность будущих тестов; при успехе снимаем
  await prisma.profile.update({
    where: { userId },
    data: {
      lowerDifficulty: shouldLowerDifficulty(result.score) ? true : result.passed ? false : undefined,
    },
  });

  // ФТ-2.4 — рекомендации курсов (приоритет материалам по слабым темам)
  const materials = test.profession.materials;
  const weakSet = new Set(result.weakTopics.map((t) => t.toLowerCase()));
  const ranked = [...materials].sort((a, b) => {
    const aw = weakSet.has(a.skillName.toLowerCase()) ? 0 : 1;
    const bw = weakSet.has(b.skillName.toLowerCase()) ? 0 : 1;
    return aw - bw;
  });
  const recommendations = ranked.slice(0, 3).map((m) => ({
    title: m.title,
    url: m.url,
    provider: m.provider,
  }));

  // correctCount — только для scoreable single/multiple (exact match = full weight earned)
  const scoreableGraded = graded.filter((g) => g.scoreable);
  const correctCount = scoreableGraded.filter((g) => g.points >= g.weight).length;
  const conclusion = buildConclusion(result.score, result.passed, result.weakTopics);

  // Сохраняем предыдущую попытку до создания новой (для сравнения)
  const prevAttempt = await prisma.testAttempt.findFirst({
    where: { userId, testId },
    orderBy: { completedAt: "desc" },
  });
  const previousResult = prevAttempt
    ? (JSON.parse(prevAttempt.resultPayload) as AttemptPayload)
    : null;

  // Создаём запись истории (append-only, никогда не перезаписываем)
  const payload: AttemptPayload = {
    score: result.score,
    passed: result.passed,
    weakTopics: result.weakTopics,
    strongTopics: result.strongTopics,
    total: scoreableGraded.length,
    correctCount,
    conclusion,
    recommendations,
    testTitle: test.title,
    completedAt: new Date().toISOString(),
  };
  const newAttemptRecord = await prisma.testAttempt.create({
    data: {
      userId,
      testId,
      resultPayload: JSON.stringify(payload),
    },
  });

  return NextResponse.json({
    ok: true,
    attemptId: newAttemptRecord.id,
    previousResult,
    score: result.score,
    passed: result.passed,
    weakTopics: result.weakTopics,
    strongTopics: result.strongTopics,
    frozenUntil: result.frozenUntil,
    total: scoreableGraded.length,
    correctCount,
    conclusion,
    recommendations,
  });
}
