import { prisma } from "@/lib/prisma";
import { BroadcastForm } from "@/components/BroadcastForm";

export const metadata = { title: "Админ — Рассылка" };

const SEGMENT: Record<string, string> = { all: "Все", free: "Бесплатный", paid: "Платные" };

export default async function AdminBroadcast() {
  const sent = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-ink">Массовая рассылка</h1>
      <p className="mt-1 text-slate-600">
        Создайте уведомление для пользователей с сегментацией (US22). Демо-режим:
        сообщение сохраняется и показывается пользователям в кабинете.
      </p>
      <div className="mt-6">
        <BroadcastForm />
      </div>

      {sent.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold text-ink">Последние рассылки</h2>
          <ul className="mt-3 space-y-2">
            {sent.map((n) => (
              <li key={n.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">{n.title}</p>
                  <span className="badge bg-slate-100 text-slate-600">{SEGMENT[n.segment]}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{n.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
