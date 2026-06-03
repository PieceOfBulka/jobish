import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth";
import { generateRoadmap } from "@/lib/roadmap";

const schema = z.object({ slug: z.string().min(1) });

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
  }

  try {
    const roadmap = await generateRoadmap(userId, parsed.data.slug);
    return NextResponse.json({ ok: true, roadmapId: roadmap.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 },
    );
  }
}
