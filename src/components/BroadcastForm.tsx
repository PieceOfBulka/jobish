"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Check } from "lucide-react";

export function BroadcastForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDone(false);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "broadcast", ...Object.fromEntries(fd.entries()) }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Ошибка");
      return;
    }
    setDone(true);
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div>
        <label className="label" htmlFor="title">Заголовок</label>
        <input id="title" name="title" className="input" required minLength={3} />
      </div>
      <div>
        <label className="label" htmlFor="body">Текст</label>
        <textarea id="body" name="body" className="input min-h-28 resize-y" required minLength={3} />
      </div>
      <div>
        <label className="label" htmlFor="segment">Сегмент получателей</label>
        <select id="segment" name="segment" className="input" defaultValue="all">
          <option value="all">Все пользователи</option>
          <option value="free">Бесплатный тариф</option>
          <option value="paid">Платные тарифы</option>
        </select>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Отправить рассылку
        </button>
        {done && <span className="inline-flex items-center gap-1 text-sm text-emerald-600"><Check className="h-4 w-4" /> Отправлено</span>}
      </div>
    </form>
  );
}
