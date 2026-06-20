import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchHhSalarySummary, HH_AREAS } from "@/lib/hh";
import { salarySummary, modelSalarySample } from "@/lib/salary-stats";

// Зарплатная статистика по профессии и региону (ФТ-3.1): медиана/перцентили.
// Источник — официальный hh.ru API; при недоступности — оценка по сид-данным.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") ?? "";
  const area = req.nextUrl.searchParams.get("area") ?? "113";
  const areaId = HH_AREAS.some((a) => a.id === area) ? area : "113";

  const profession = await prisma.profession.findUnique({
    where: { slug },
    include: { market: true },
  });
  if (!profession || !profession.market) {
    return NextResponse.json({ error: "Профессия не найдена" }, { status: 404 });
  }

  // 1) Пытаемся получить живые данные hh.ru
  const live = await fetchHhSalarySummary(profession.title, areaId);
  if (live) {
    return NextResponse.json({ source: "hh.ru (официальный API)", live: true, area: areaId, summary: live });
  }

  // 2) Фолбэк — моделируем распределение из опорных зарплат сид-данных
  const fallback = salarySummary(
    modelSalarySample(
      profession.market.salaryJunior,
      profession.market.salaryMiddle,
      profession.market.salarySenior,
    ),
  );
  return NextResponse.json({
    source: "Оценка по демо-данным (hh.ru API недоступен)",
    live: false,
    area: areaId,
    summary: fallback,
  });
}
