import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gradeAttempt, canRetake, type GradedAnswer } from "@/lib/theory";

const schema = z.object({
  testId: z.string().min(1),
  answers: z.record(z.string(), z.number().int().min(0)),
});

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
    include: { questions: true },
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

  const graded: GradedAnswer[] = test.questions.map((q) => ({
    questionId: q.id,
    topic: q.topic,
    correct: answers[q.id] === q.correct,
  }));
  const result = gradeAttempt(graded);

  // Если была доступная доп. попытка из-за заморозки — расходуем её
  let extraTries = 0;
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

  return NextResponse.json({
    ok: true,
    score: result.score,
    passed: result.passed,
    weakTopics: result.weakTopics,
    strongTopics: result.strongTopics,
    frozenUntil: result.frozenUntil,
    total: test.questions.length,
    correctCount: graded.filter((g) => g.correct).length,
  });
}
