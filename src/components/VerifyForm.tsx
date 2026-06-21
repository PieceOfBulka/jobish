"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, MailCheck } from "lucide-react";

export function VerifyForm({ initialCode }: { initialCode?: string }) {
  const t = useTranslations("verify");
  const tCommon = useTranslations("common");
  const router = useRouter();
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
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? tCommon("error"));
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function resend() {
    setError(null);
    const res = await fetch("/api/auth/verify", { method: "PUT" });
    const data = await res.json();
    if (res.ok) {
      setDemoCode(data.demoCode);
      setCode(data.demoCode ?? "");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="code">{t("codeLabel")}</label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          className="input tracking-widest"
          placeholder={t("codePlaceholder")}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
      </div>

      {demoCode && (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-center text-sm text-brand-700">
          {t("demoCode", { code: demoCode })}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
        {t("submit")}
      </button>
      <button type="button" onClick={resend} className="btn-ghost w-full">
        {t("resend")}
      </button>
    </form>
  );
}
