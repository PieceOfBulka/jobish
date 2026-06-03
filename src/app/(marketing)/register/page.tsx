import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Регистрация — Jobish" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <div className="container-page flex justify-center py-16">
      <div className="card w-full max-w-md p-8" style={{ animation: "var(--animate-fade-up)" }}>
        <h1 className="text-2xl font-bold text-ink">Создайте аккаунт</h1>
        <p className="mt-1 text-sm text-slate-500">
          Базовый доступ — бесплатно. Карта данных не нужна.
        </p>
        <div className="mt-6">
          <AuthForm mode="register" />
        </div>
      </div>
    </div>
  );
}
