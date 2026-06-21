"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Check } from "lucide-react";

export function SupportForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const t = useTranslations("support");
  const tCommon = useTranslations("common");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? tCommon("error"));
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Check className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-xl font-bold text-ink">{t("successTitle")}</h2>
        <p className="mt-2 text-sm text-slate-600">{t("successText")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div>
        <label className="label" htmlFor="email">{t("emailLabel")}</label>
        <input id="email" name="email" type="email" className="input" defaultValue={defaultEmail} required />
      </div>
      <div>
        <label className="label" htmlFor="subject">{t("subjectLabel")}</label>
        <input id="subject" name="subject" className="input" required minLength={3} />
      </div>
      <div>
        <label className="label" htmlFor="message">{t("messageLabel")}</label>
        <textarea id="message" name="message" className="input min-h-32 resize-y" required minLength={10} />
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("submit")}
      </button>
    </form>
  );
}
