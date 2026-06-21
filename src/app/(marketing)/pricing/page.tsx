import { getTranslations } from "next-intl/server";
import { PLANS } from "@/lib/plans";
import { PlanCard } from "@/components/PlanCard";
import { getCurrentUser } from "@/lib/auth";
import { Info } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return { title: t("pricing") };
}

export default async function PricingPage() {
  const t = await getTranslations("pricing");
  const user = await getCurrentUser();
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{t("title")}</h1>
        <p className="mt-3 text-slate-600">{t("subtitle")}</p>
      </div>

      <div className="mx-auto mt-6 flex max-w-2xl items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
        <Info className="h-4 w-4 shrink-0" />
        {t("demoNote")}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => (
          <PlanCard key={p.id} plan={p} isAuthed={Boolean(user)} currentPlan={user?.plan} />
        ))}
      </div>
    </div>
  );
}
