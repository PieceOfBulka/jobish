import Link from "next/link";
import { Fish } from "lucide-react";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-bold text-ink">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-[0_4px_14px_rgba(79,70,229,0.35)]">
        <Fish className="h-5 w-5" strokeWidth={2.4} />
      </span>
      <span className="text-lg tracking-tight">
        Job<span className="text-brand-600">ish</span>
      </span>
    </Link>
  );
}
