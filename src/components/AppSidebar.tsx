"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquareHeart,
  Compass,
  Map,
  ClipboardCheck,
  Briefcase,
  Target,
  User,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const LINKS = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/coach", label: "AI-коуч", icon: MessageSquareHeart },
  { href: "/orientation", label: "Профориентация", icon: Compass },
  { href: "/roadmap", label: "Карта развития", icon: Map },
  { href: "/vacancies", label: "Вакансии", icon: Briefcase },
  { href: "/tests", label: "Тесты", icon: ClipboardCheck },
  { href: "/goals", label: "Карьерные цели", icon: Target },
  { href: "/profile", label: "Профиль", icon: User },
];

export function AppSidebar({ name, plan, role }: { name: string; plan: string; role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const planLabel: Record<string, string> = {
    free: "Базовый",
    start: "Старт",
    optimal: "Оптимальный",
    pro: "Про",
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3 lg:hidden">
        <Logo href="/dashboard" />
        <button onClick={() => setOpen(true)} className="btn-ghost p-2" aria-label="Открыть меню">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-slate-100 bg-white transition-transform lg:sticky lg:top-0 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <Logo href="/dashboard" />
          <button onClick={() => setOpen(false)} className="btn-ghost p-1.5 lg:hidden" aria-label="Закрыть меню">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl bg-brand-600 px-3 py-2.5 text-sm font-medium text-white"
            >
              <ShieldCheck className="h-5 w-5" /> Админ-панель
            </Link>
          )}
          {LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-ink",
                )}
              >
                <l.icon className="h-5 w-5" />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-slate-100 p-3">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="mb-2 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 transition-colors hover:bg-brand-50"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white">
              {name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink">{name}</span>
              <span className="block text-xs text-slate-500">Тариф: {planLabel[plan] ?? plan}</span>
            </span>
          </Link>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600">
            <LogOut className="h-5 w-5" />
            Выйти
          </button>
        </div>
      </aside>
    </>
  );
}
