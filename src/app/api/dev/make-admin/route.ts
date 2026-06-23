import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Dev-only endpoint — promotes a user to admin by email.
// Disabled in production.
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const user = await prisma.user.update({
    where: { email },
    data: { role: "admin" },
  });
  return NextResponse.json({ ok: true, id: user.id, role: user.role });
}
