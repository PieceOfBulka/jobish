import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scoreAnswers, topMatches, hasStrongMatch } from "@/lib/orientation";

const schema = z.object({
  answers: z.record(z.string(), z.number().int().min(0)),
});

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
  }

  const scores = scoreAnswers(parsed.data.answers);
  const matches = topMatches(scores);

  await prisma.orientationResult.upsert({
    where: { userId },
    update: {
      answers: JSON.stringify(parsed.data.answers),
      scores: JSON.stringify(scores),
      topMatches: JSON.stringify(matches),
    },
    create: {
      userId,
      answers: JSON.stringify(parsed.data.answers),
      scores: JSON.stringify(scores),
      topMatches: JSON.stringify(matches),
    },
  });

  return NextResponse.json({
    ok: true,
    scores,
    matches,
    hasStrong: hasStrongMatch(matches),
  });
}
