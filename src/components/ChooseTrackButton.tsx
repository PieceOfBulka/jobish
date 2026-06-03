"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function choose() {
    if (!isAuthed) {
      router.push("/register");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    if (res.ok) {
      router.push("/roadmap");
      router.refresh();
    } else {
      setLoading(false);
    }
  }

  return (
    <button onClick={choose} className="btn-primary" disabled={loading || isCurrent}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Route className="h-4 w-4" />}
      {isCurrent ? "Это ваш текущий трек" : "Выбрать как трек развития"}
    </button>
  );
}
