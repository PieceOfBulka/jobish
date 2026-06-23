import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Действия админ-панели (US17/19/21/22). Доступ только роли admin (NFR_SC2).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const action = body?.action;
  const ok = () => NextResponse.json({ ok: true });

  switch (action) {
    // US17 — блокировка/разблокировка пользователя
    case "set_blocked": {
      if (body.userId === user.id) {
        return NextResponse.json({ error: "Нельзя заблокировать себя" }, { status: 400 });
      }
      await prisma.user.update({
        where: { id: body.userId },
        data: { isBlocked: Boolean(body.blocked) },
      });
      return ok();
    }
    // US19 — редактирование тарифа
    case "plan_update": {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json({ error: "Некорректная цена" }, { status: 400 });
      }
      await prisma.plan.update({
        where: { id: body.id },
        data: { price, active: Boolean(body.active) },
      });
      return ok();
    }
    // US22 — массовая рассылка
    case "broadcast": {
      const title = String(body.title ?? "").trim();
      const text = String(body.body ?? "").trim();
      if (title.length < 3 || text.length < 3) {
        return NextResponse.json({ error: "Заполните заголовок и текст" }, { status: 400 });
      }
      const segment = ["all", "free", "paid"].includes(body.segment) ? body.segment : "all";
      await prisma.notification.create({ data: { title, body: text, segment } });
      return ok();
    }
    default:
      return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  }
}
