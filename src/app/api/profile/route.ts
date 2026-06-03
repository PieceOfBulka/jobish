import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().trim().min(2).optional(),
  currentRole: z.string().trim().max(120).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
  bio: z.string().trim().max(600).optional(),
  resumeFileName: z.string().trim().max(200).optional(),
});

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
  }
  const { name, ...profileData } = parsed.data;

  if (name) {
    await prisma.user.update({ where: { id: userId }, data: { name } });
  }
  await prisma.profile.update({ where: { userId }, data: profileData });

  return NextResponse.json({ ok: true });
}
