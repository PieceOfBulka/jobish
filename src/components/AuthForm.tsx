"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Что-то пошло не так");
        setLoading(false);
        return;
      }
      router.push(data.needsVerification ? "/verify" : "/dashboard");
      router.refresh();
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {mode === "register" && (
        <div>
          <label className="label" htmlFor="name">Имя</label>
          <input id="name" name="name" className="input" placeholder="Как к вам обращаться" autoComplete="name" required />
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" placeholder="you@example.com" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Пароль</label>
        <input id="password" name="password" type="password" className="input" placeholder="••••••••" autoComplete={mode === "login" ? "current-password" : "new-password"} required />
        {mode === "register" && (
          <p className="mt-1 text-xs text-slate-400">
            Более 8 символов, буквы, цифры и спецсимвол.
          </p>
        )}
      </div>
      {mode === "register" && (
        <div>
          <label className="label" htmlFor="passwordConfirm">Повторите пароль</label>
          <input id="passwordConfirm" name="passwordConfirm" type="password" className="input" placeholder="••••••••" autoComplete="new-password" required />
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "login" ? "Войти" : "Создать аккаунт"}
      </button>

      <p className="text-center text-sm text-slate-500">
        {mode === "login" ? (
          <>Нет аккаунта?{" "}<Link href="/register" className="font-medium text-brand-600 hover:underline">Зарегистрироваться</Link></>
        ) : (
          <>Уже есть аккаунт?{" "}<Link href="/login" className="font-medium text-brand-600 hover:underline">Войти</Link></>
        )}
      </p>
    </form>
  );
}
