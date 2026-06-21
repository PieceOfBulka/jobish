import { getTranslations } from "next-intl/server";
import { SupportForm } from "@/components/SupportForm";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return { title: t("support") };
}

export default async function SupportPage() {
  const t = await getTranslations("support");
  return (
    <div className="container-page max-w-xl py-16">
      <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{t("title")}</h1>
      <p className="mt-3 text-slate-600">{t("subtitle")}</p>
      <div className="mt-8">
        <SupportForm />
      </div>
    </div>
  );
}
