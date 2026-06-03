import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Вход — Jobish" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <div className="container-page flex justify-center py-16">
      <div className="card w-full max-w-md p-8" style={{ animation: "var(--animate-fade-up)" }}>
        <h1 className="text-2xl font-bold text-ink">С возвращением</h1>
        <p className="mt-1 text-sm text-slate-500">
          Войдите, чтобы продолжить развитие.
        </p>
        <div className="mt-6">
          <AuthForm mode="login" />
        </div>
        <p className="mt-6 rounded-lg bg-brand-50 px-3 py-2 text-center text-xs text-brand-700">
          Демо-доступ: <b>demo@jobish.ru</b> / <b>demo1234</b>
        </p>
      </div>
    </div>
  );
}
