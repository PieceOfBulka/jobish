import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminAction } from "@/components/AdminAction";

export const metadata = { title: "Админ — Пользователи" };

export default async function AdminUsers() {
  const users = await prisma.user.findMany({
    include: { profile: true, subscription: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Пользователи</h1>
      <p className="mt-1 text-slate-600">
        Просмотр профилей и модерация (US17). Блокировка обновляет доступ к платформе.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 pr-4">Имя / Email</th>
              <th className="py-2 pr-4">Роль</th>
              <th className="py-2 pr-4">Тариф</th>
              <th className="py-2 pr-4">Статус</th>
              <th className="py-2 pr-4">Действие</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100">
                <td className="py-3 pr-4">
                  <Link href={`/admin/users/${u.id}`} className="font-medium text-brand-600 hover:underline">
                    {u.name}
                  </Link>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </td>
                <td className="py-3 pr-4">{u.role}</td>
                <td className="py-3 pr-4">{u.subscription?.plan ?? "free"}</td>
                <td className="py-3 pr-4">
                  {u.isBlocked ? (
                    <span className="badge bg-red-50 text-red-600">заблокирован</span>
                  ) : u.isVerified ? (
                    <span className="badge bg-emerald-50 text-emerald-700">активен</span>
                  ) : (
                    <span className="badge bg-amber-50 text-amber-700">не подтверждён</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  {u.role !== "admin" &&
                    (u.isBlocked ? (
                      <AdminAction payload={{ action: "set_blocked", userId: u.id, blocked: false }} label="Разблокировать" />
                    ) : (
                      <AdminAction payload={{ action: "set_blocked", userId: u.id, blocked: true }} label="Заблокировать" className="btn-outline text-red-600 hover:bg-red-50" />
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
