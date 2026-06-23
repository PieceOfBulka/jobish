import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { UserX, UserCheck, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { profile: true, subscription: true },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-ink">Пользователи платформы</h1>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Имя / Email</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Роль</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Тариф</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Статус</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Регистрация</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {u.subscription?.plan ?? "free"}
                </td>
                <td className="px-4 py-3">
                  {u.isBlocked ? (
                    <span className="flex items-center gap-1 text-xs text-red-600">
                      <UserX className="h-3.5 w-3.5" /> Заблокирован
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-emerald-600">
                      <UserCheck className="h-3.5 w-3.5" /> Активен
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {new Date(u.createdAt).toLocaleDateString("ru")}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                  >
                    <Eye className="h-3.5 w-3.5" /> Профиль
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="px-4 py-8 text-center text-slate-400">Пользователей нет</p>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Всего: {users.length} пользователей
      </p>
    </div>
  );
}
