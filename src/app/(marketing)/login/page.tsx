import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";
import { DEMO_ACCOUNT } from "@/lib/demo-account";

export const metadata = { title: "Вход — Jobish" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sso_error?: string }>;
}) {
  if (await getCurrentUser()) redirect("/dashboard");
  const params = await searchParams;
  return (
    <div className="container-page flex justify-center py-16">
      <div className="card w-full max-w-md p-8" style={{ animation: "var(--animate-fade-up)" }}>
        <h1 className="text-2xl font-bold text-ink">С возвращением</h1>
        <p className="mt-1 text-sm text-slate-500">
          Войдите, чтобы продолжить развитие.
        </p>
        <div className="mt-6">
          <AuthForm
            mode="login"
            demoCredentials={DEMO_ACCOUNT}
            ssoError={params.sso_error ?? null}
          />
        </div>
        <p className="mt-6 rounded-lg bg-brand-50 px-3 py-2 text-center text-xs text-brand-700">
          Демо-доступ: <b>{DEMO_ACCOUNT.email}</b> / <b>{DEMO_ACCOUNT.password}</b>
          <br />
          <span className="text-brand-600">Аккаунт с профориентацией, картой развития и историей коуча.</span>
        </p>
      </div>
    </div>
  );
}
