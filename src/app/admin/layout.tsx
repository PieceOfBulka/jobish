import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { ShieldCheck } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/users", label: "Пользователи" },
  { href: "/admin/plans", label: "Тарифы" },
  { href: "/admin/broadcast", label: "Рассылка" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard"); // NFR_SC2 — доступ по роли

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-slate-100 bg-white">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo href="/admin" />
            <span className="badge bg-brand-50 text-brand-700">
              <ShieldCheck className="h-3.5 w-3.5" /> Админ-панель
            </span>
          </div>
          <Link href="/dashboard" className="btn-ghost">В кабинет</Link>
        </div>
        <nav className="container-page flex gap-1 overflow-x-auto pb-2">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="container-page py-8">{children}</main>
    </div>
  );
}
