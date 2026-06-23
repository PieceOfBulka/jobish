import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  scoreAnswers,
  topMatches,
  hasStrongMatch,
  type ProfessionMatch,
} from "@/lib/orientation";
import { postOrientationToChat } from "@/lib/orientation-chat";
import { autoGenerateGoalsForUser } from "@/lib/goals-service";

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

  const existing = await prisma.orientationResult.findUnique({
    where: { userId },
  });
  let previousMatches: ProfessionMatch[] | null = null;
  if (existing?.topMatches) {
    try {
      previousMatches = JSON.parse(existing.topMatches) as ProfessionMatch[];
    } catch {
      previousMatches = null;
    }
  }

  await prisma.orientationResult.upsert({
    where: { userId },
    update: {
      answers: JSON.stringify(parsed.data.answers),
      scores: JSON.stringify(scores),
      topMatches: JSON.stringify(matches),
      previousTopMatches: existing?.topMatches ?? null,
    },
    create: {
      userId,
      answers: JSON.stringify(parsed.data.answers),
      scores: JSON.stringify(scores),
      topMatches: JSON.stringify(matches),
    },
  });

  const chatSessionId = await postOrientationToChat(
    userId,
    matches,
    previousMatches,
  );
  await autoGenerateGoalsForUser(userId);

  return NextResponse.json({
    ok: true,
    scores,
    matches,
    previousMatches,
    hasStrong: hasStrongMatch(matches),
    chatSessionId,
  });
}
