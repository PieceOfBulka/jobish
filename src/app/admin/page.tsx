import { prisma } from "@/lib/prisma";
import { Users, Megaphone, CreditCard } from "lucide-react";

export const metadata = { title: "Админ — Обзор" };

export default async function AdminOverview() {
  const [users, blocked, notifications, plans] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isBlocked: true } }),
    prisma.notification.count(),
    prisma.plan.count(),
  ]);

  const cards = [
    { icon: Users, label: "Пользователей", value: users, hint: `${blocked} заблокировано` },
    { icon: Megaphone, label: "Рассылок", value: notifications, hint: "отправлено всего" },
    { icon: CreditCard, label: "Тарифов", value: plans, hint: "управление монетизацией" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Обзор платформы</h1>
      <p className="mt-1 text-slate-600">Ключевые метрики и быстрый доступ к модерации.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <c.icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-2xl font-bold text-ink">{c.value}</p>
            <p className="text-sm font-medium text-ink">{c.label}</p>
            <p className="text-xs text-slate-400">{c.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
