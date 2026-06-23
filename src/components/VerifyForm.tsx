"use client";

import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";

export function VerifyForm({ initialCode }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | undefined>(initialCode);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Ошибка");
      return;
    }
    window.location.assign("/dashboard");
  }

  async function resend() {
    setError(null);
    const res = await fetch("/api/auth/verify", { method: "PUT", credentials: "same-origin" });
    const data = await res.json();
    if (res.ok) {
      setDemoCode(data.demoCode);
      setCode(data.demoCode ?? "");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="code">Код подтверждения</label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          className="input tracking-widest"
          placeholder="6-значный код"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
      </div>

      {demoCode && (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-center text-sm text-brand-700">
          Демо-режим: письмо не отправляется. Ваш код: <b>{demoCode}</b>
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
        Подтвердить почту
      </button>
      <button type="button" onClick={resend} className="btn-ghost w-full">
        Отправить код повторно
      </button>
    </form>
  );
}
