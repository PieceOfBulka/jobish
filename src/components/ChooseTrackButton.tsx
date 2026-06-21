"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Route } from "lucide-react";

export function ChooseTrackButton({
  slug,
  isAuthed,
  isCurrent,
}: {
  slug: string;
  isAuthed: boolean;
  isCurrent: boolean;
}) {
  const t = useTranslations("professions");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose() {
    if (!isAuthed) {
      router.push("/register");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.ok) {
        router.push("/roadmap");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.error ?? t("trackError"));
    } catch {
      setError(t("networkError"));
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-stretch gap-1">
      <button onClick={choose} className="btn-primary" disabled={loading || isCurrent}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Route className="h-4 w-4" />}
        {isCurrent ? t("currentTrack") : t("chooseTrack")}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
