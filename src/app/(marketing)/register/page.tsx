import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return { title: t("register") };
}

export default async function RegisterPage() {
  const t = await getTranslations("auth");
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <div className="container-page flex justify-center py-16">
      <div className="card w-full max-w-md p-8" style={{ animation: "var(--animate-fade-up)" }}>
        <h1 className="text-2xl font-bold text-ink">{t("createAccountTitle")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("registerSubtitle")}</p>
        <div className="mt-6">
          <AuthForm mode="register" />
        </div>
      </div>
    </div>
  );
}
