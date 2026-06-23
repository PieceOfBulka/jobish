import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROFESSION_TITLES } from "@/lib/orientation";
import {
  ALIGNMENT_QUESTIONS,
  evaluateAlignment,
  type AlignmentResult,
} from "@/lib/job-alignment";

const schema = z.object({
  answers: z.record(z.string(), z.number().int().min(1).max(5)),
});

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const profile = await prisma.profile.findUnique({ where: { userId } });
  let result: AlignmentResult | null = null;
  if (profile?.jobAlignmentResult) {
    try {
      result = JSON.parse(profile.jobAlignmentResult) as AlignmentResult;
    } catch {
      result = null;
    }
  }

  return NextResponse.json({
    questions: ALIGNMENT_QUESTIONS,
    result,
    currentPosition: profile?.currentPosition ?? null,
  });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Заполните все пункты опроса (1–5)" }, { status: 400 });
  }

  const profile = await prisma.profile.findUnique({ where: { userId } });
  const targetTitle = profile?.targetProfession
    ? (PROFESSION_TITLES[profile.targetProfession] ?? profile.targetProfession)
    : null;

  const result = evaluateAlignment(
    parsed.data.answers,
    profile?.currentPosition,
    targetTitle,
  );

  await prisma.profile.update({
    where: { userId },
    data: { jobAlignmentResult: JSON.stringify(result) },
  });

  return NextResponse.json({ ok: true, result });
}
