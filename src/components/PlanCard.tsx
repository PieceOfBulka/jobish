"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import type { Plan } from "@/lib/plans";
import { formatRub } from "@/lib/utils";

export function PlanCard({
  plan,
  isAuthed,
  currentPlan,
}: {
  plan: Plan;
  isAuthed: boolean;
  currentPlan?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const isCurrent = currentPlan === plan.id;

  async function subscribe() {
    if (!isAuthed) {
      router.push("/register");
      return;
    }
    if (plan.id === "free" || isCurrent) return;
    setLoading(true);
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: plan.id }),
    });
    setLoading(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
      setTimeout(() => setDone(false), 2500);
    }
  }

  return (
    <div
      className={`card relative flex flex-col p-6 ${
        plan.highlight ? "ring-2 ring-brand-500" : ""
      }`}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
          Популярный
        </span>
      )}
      <h3 className="text-lg font-semibold text-ink">{plan.name}</h3>
      <p className="mt-2">
        <span className="text-3xl font-extrabold text-ink">
          {plan.price === 0 ? "0 ₽" : formatRub(plan.price)}
        </span>
        <span className="text-sm text-slate-500"> / {plan.period}</span>
      </p>
      <ul className="mt-5 flex-1 space-y-2.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={subscribe}
        disabled={loading || isCurrent || plan.id === "free"}
        className={`mt-6 ${plan.highlight ? "btn-primary" : "btn-outline"} w-full`}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isCurrent
          ? "Текущий тариф"
          : done
            ? "Оформлено ✓"
            : plan.id === "free"
              ? "Включён по умолчанию"
              : "Оформить (демо)"}
      </button>
    </div>
  );
}
