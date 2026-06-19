import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { personalTestSize } from "@/lib/theory";

// ФТ-7.7 — генерация персонального теста на основе roadmap/целевой профессии.
export async function POST() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile?.targetProfession) {
    return NextResponse.json(
      { error: "Сначала выберите трек развития." },
      { status: 400 },
    );
  }

  const profession = await prisma.profession.findUnique({
    where: { slug: profile.targetProfession },
    include: { theoryTests: { where: { isPersonal: false }, include: { questions: true } } },
  });
  const base = profession?.theoryTests[0];
  if (!base || base.questions.length === 0) {
    return NextResponse.json({ error: "Нет вопросов для генерации" }, { status: 400 });
  }

  // Размер зависит от сложности (ФТ-7.8): после неудачи — проще/короче
  const size = personalTestSize(profile.lowerDifficulty);
  const picked = [...base.questions]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(size, base.questions.length));

  // Пересоздаём единственный персональный тест пользователя
  await prisma.theoryTest.deleteMany({
    where: { ownerId: userId, isPersonal: true },
  });

  const test = await prisma.theoryTest.create({
    data: {
      professionId: profession!.id,
      title: `Персональный тест: ${profession!.title}`,
      topic: "Персональный",
      ownerId: userId,
      isPersonal: true,
      questions: {
        create: picked.map((q, i) => ({
          text: q.text,
          options: q.options,
          correct: q.correct,
          topic: q.topic,
          order: i,
        })),
      },
    },
  });

  return NextResponse.json({ ok: true, testId: test.id });
}
