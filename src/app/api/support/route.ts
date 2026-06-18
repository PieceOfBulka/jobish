import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/validation";

// NFR_SP3 — обращение в поддержку
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null);
  const email = String(b?.email ?? "").trim();
  const subject = String(b?.subject ?? "").trim();
  const message = String(b?.message ?? "").trim();

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Некорректный email" }, { status: 400 });
  }
  if (subject.length < 3) {
    return NextResponse.json({ error: "Укажите тему (от 3 символов)" }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json({ error: "Сообщение слишком короткое" }, { status: 400 });
  }

  await prisma.supportTicket.create({ data: { email, subject, message } });
  return NextResponse.json({ ok: true });
}
