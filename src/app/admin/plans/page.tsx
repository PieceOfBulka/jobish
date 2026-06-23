import { prisma } from "@/lib/prisma";
import { PlanEditor } from "@/components/PlanEditor";

export const metadata = { title: "Админ — Тарифы" };

export default async function AdminPlans() {
  const plans = await prisma.plan.findMany({ orderBy: { sort: "asc" } });
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Управление тарифами</h1>
      <p className="mt-1 text-slate-600">Редактирование цен и доступности тарифов (US19).</p>
      <div className="mt-6 space-y-3">
        {plans.map((p) => (
          <PlanEditor key={p.id} id={p.id} name={p.name} period={p.period} price={p.price} active={p.active} />
        ))}
      </div>
    </div>
  );
}
