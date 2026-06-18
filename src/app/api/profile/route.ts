import { NextRequest, NextResponse } from "next/server";
import { getUserId, destroySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  validateFullName,
  validateTelegram,
  validateAge,
  validateExperienceMonths,
  GRADE_LEVELS,
  CURRENT_POSITIONS,
  PREPARATION_LEVELS,
} from "@/lib/validation";

// ФТ-1.3 — редактирование профиля (наполнение по логической модели v2)
export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const b = await req.json().catch(() => null);
  if (!b || typeof b !== "object") {
    return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
  }

  // ── Валидация ──
  if (b.name !== undefined) {
    const c = validateFullName(String(b.name));
    if (!c.ok) return NextResponse.json({ error: c.error }, { status: 400 });
  }
  if (b.telegramNick) {
    const c = validateTelegram(String(b.telegramNick));
    if (!c.ok) return NextResponse.json({ error: c.error }, { status: 400 });
  }
  const age = b.age === "" || b.age == null ? null : Number(b.age);
  const ageCheck = validateAge(age);
  if (!ageCheck.ok) return NextResponse.json({ error: ageCheck.error }, { status: 400 });

  const months = Number(b.experienceMonths ?? 0);
  const mCheck = validateExperienceMonths(months);
  if (!mCheck.ok) return NextResponse.json({ error: mCheck.error }, { status: 400 });

  if (b.gradeLevel && !GRADE_LEVELS.includes(b.gradeLevel)) {
    return NextResponse.json({ error: "Неверный уровень образования" }, { status: 400 });
  }
  if (b.currentPosition && !CURRENT_POSITIONS.includes(b.currentPosition)) {
    return NextResponse.json({ error: "Неверная должность" }, { status: 400 });
  }
  if (b.preparationLevel && !PREPARATION_LEVELS.includes(b.preparationLevel)) {
    return NextResponse.json({ error: "Неверный уровень подготовки" }, { status: 400 });
  }

  const salary =
    b.salaryExpectation === "" || b.salaryExpectation == null
      ? null
      : Number(b.salaryExpectation);

  if (b.name) {
    await prisma.user.update({ where: { id: userId }, data: { name: String(b.name).trim() } });
  }

  await prisma.profile.update({
    where: { userId },
    data: {
      telegramNick: b.telegramNick || null,
      age,
      experienceMonths: months,
      educationPlace: b.educationPlace || null,
      gradeLevel: b.gradeLevel || null,
      currentSpecialty: b.currentSpecialty || null,
      currentPosition: b.currentPosition || null,
      preparationLevel: b.preparationLevel || null,
      salaryExpectation: salary,
      skills: Array.isArray(b.skills) ? JSON.stringify(b.skills) : undefined,
      desiredSpheres: Array.isArray(b.desiredSpheres) ? JSON.stringify(b.desiredSpheres) : undefined,
      bio: b.bio ?? undefined,
      resumeFileName: b.resumeFileName ?? undefined,
    },
  });

  return NextResponse.json({ ok: true });
}

// NFR_SC3 — удаление персональных данных по запросу пользователя
export async function DELETE() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  await prisma.user.delete({ where: { id: userId } }); // каскадно удаляет профиль, чаты, и т.д.
  await destroySession();
  return NextResponse.json({ ok: true });
}
