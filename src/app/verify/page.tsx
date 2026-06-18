import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VerifyForm } from "@/components/VerifyForm";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Подтверждение почты — Jobish" };

export default async function VerifyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.isVerified) redirect("/dashboard");

  // Демо: показываем актуальный код (письма не отправляются)
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Logo />
      <div className="card mt-6 w-full max-w-md p-8" style={{ animation: "var(--animate-fade-up)" }}>
        <h1 className="text-2xl font-bold text-ink">Подтвердите почту</h1>
        <p className="mt-1 text-sm text-slate-500">
          Мы отправили код на <b>{user.email}</b>. Введите его, чтобы получить доступ к платформе.
        </p>
        <div className="mt-6">
          <VerifyForm initialCode={dbUser?.verificationCode ?? undefined} />
        </div>
      </div>
    </div>
  );
}
