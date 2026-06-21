import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return { title: t("login") };
}

export default async function LoginPage() {
  const t = await getTranslations("auth");
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <div className="container-page flex justify-center py-16">
      <div className="card w-full max-w-md p-8" style={{ animation: "var(--animate-fade-up)" }}>
        <h1 className="text-2xl font-bold text-ink">{t("welcomeBack")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("loginSubtitle")}</p>
        <div className="mt-6">
          <AuthForm mode="login" />
        </div>
        <p className="mt-6 rounded-lg bg-brand-50 px-3 py-2 text-center text-xs text-brand-700">
          {t("demoAccess")} <b>demo@jobish.ru</b> / <b>Demo1234!</b>
        </p>
      </div>
    </div>
  );
}
