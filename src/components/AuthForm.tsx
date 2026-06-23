"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { SsoButtons } from "@/components/SsoButtons";

export function AuthForm({
  mode,
  demoCredentials,
  ssoError,
}: {
  mode: "login" | "register";
  demoCredentials?: { email: string; password: string };
  ssoError?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loginWith(payload: Record<string, FormDataEntryValue>) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Что-то пошло не так");
        setLoading(false);
        return;
      }
      window.location.assign(data.needsVerification ? "/verify" : "/dashboard");
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await loginWith(Object.fromEntries(form.entries()));
  }

  async function onDemoLogin() {
    if (!demoCredentials) return;
    await loginWith({
      email: demoCredentials.email,
      password: demoCredentials.password,
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <SsoButtons ssoError={ssoError} />
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

      {mode === "login" && demoCredentials && (
        <button
          type="button"
          onClick={onDemoLogin}
          className="btn-ghost w-full border border-brand-100 text-brand-700"
          disabled={loading}
        >
          Войти в демо-аккаунт
        </button>
      )}

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
