"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserX, UserCheck } from "lucide-react";

export function AdminBlockButton({ userId, isBlocked }: { userId: string; isBlocked: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(isBlocked);

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBlocked: !blocked }),
    });
    setLoading(false);
    if (res.ok) {
      setBlocked((b) => !b);
      router.refresh();
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      data-testid="admin-block-btn"
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
        blocked
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
      }`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : blocked ? (
        <UserCheck className="h-4 w-4" />
      ) : (
        <UserX className="h-4 w-4" />
      )}
      {blocked ? "Разблокировать" : "Заблокировать"}
    </button>
  );
}
