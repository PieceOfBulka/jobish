"use client";

import Link from "next/link";
import type { Badge, Reminder } from "@/lib/motivation";
import { Bell, Award, Lock } from "lucide-react";

function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <li
      className={`rounded-xl border px-3 py-2.5 ${
        badge.earned
          ? "border-amber-200 bg-amber-50/80"
          : "border-slate-100 bg-slate-50/80"
      }`}
    >
      <div className="flex items-start gap-2">
        <span className={`text-lg leading-none ${badge.earned ? "" : "opacity-40"}`}>
          {badge.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={`text-sm font-medium ${
                badge.earned ? "text-amber-900" : "text-slate-500"
              }`}
            >
              {badge.title}
            </p>
            {!badge.earned && (
              <Lock className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
            )}
          </div>
          <p className={`mt-0.5 text-xs ${badge.earned ? "text-amber-800/80" : "text-slate-400"}`}>
            {badge.description}
          </p>
        </div>
      </div>
    </li>
  );
}

export function MotivationBlock({
  badges,
  reminders,
}: {
  badges: Badge[];
  reminders: Reminder[];
}) {
  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);

  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-ink">Мотивация и награды</h2>
      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-ink">Награды</h3>
            <span className="ml-auto text-xs text-slate-400">
              {earned.length}/{badges.length}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            За достижения на платформе. Серые — ещё не получены.
          </p>

          {earned.length > 0 && (
            <>
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-amber-700">
                Получено
              </p>
              <ul className="mt-2 space-y-2">
                {earned.map((b) => (
                  <BadgeCard key={b.id} badge={b} />
                ))}
              </ul>
            </>
          )}

          {locked.length > 0 && (
            <>
              <p className={`text-xs font-medium uppercase tracking-wide text-slate-400 ${earned.length > 0 ? "mt-4" : "mt-4"}`}>
                {earned.length > 0 ? "Ещё можно получить" : "Как получить"}
              </p>
              <ul className="mt-2 space-y-2">
                {locked.map((b) => (
                  <BadgeCard key={b.id} badge={b} />
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-brand-600" />
            <h3 className="font-semibold text-ink">Напоминания</h3>
          </div>
          {reminders.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {reminders.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-2.5 text-sm text-slate-700"
                >
                  {r.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Всё отлично — вы на правильном пути. Продолжайте в том же духе!
            </p>
          )}
          <Link href="/coach" className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline">
            Обсудить с AI-коучем →
          </Link>
        </div>
      </div>
    </section>
  );
}
