"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Check } from "lucide-react";

export function PlanEditor({
  id,
  name,
  period,
  price,
  active,
}: {
  id: string;
  name: string;
  period: string;
  price: number;
  active: boolean;
}) {
  const router = useRouter();
  const [p, setP] = useState(String(price));
  const [a, setA] = useState(active);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setLoading(true);
    setSaved(false);
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "plan_update", id, price: Number(p), active: a }),
    });
    setLoading(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="card flex flex-wrap items-end gap-4 p-5">
      <div className="min-w-32">
        <p className="font-semibold text-ink">{name}</p>
        <p className="text-xs text-slate-400">за {period}</p>
      </div>
      <div>
        <label className="label" htmlFor={`price-${id}`}>Цена, ₽</label>
        <input id={`price-${id}`} type="number" min={0} className="input w-32" value={p} onChange={(e) => setP(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={a} onChange={(e) => setA(e.target.checked)} /> активен
      </label>
      <button onClick={save} disabled={loading} className="btn-primary">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Сохранить
      </button>
      {saved && <span className="inline-flex items-center gap-1 text-sm text-emerald-600"><Check className="h-4 w-4" /> Сохранено</span>}
    </div>
  );
}
