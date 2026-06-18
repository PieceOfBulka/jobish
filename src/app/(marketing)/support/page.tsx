import { SupportForm } from "@/components/SupportForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Поддержка — Jobish" };

export default async function SupportPage() {
  const user = await getCurrentUser();
  return (
    <div className="container-page max-w-xl py-16">
      <h1 className="text-3xl font-bold tracking-tight text-ink">Поддержка</h1>
      <p className="mt-3 text-slate-600">
        Опишите проблему или вопрос — ответим на вашу почту в течение 24 часов.
      </p>
      <div className="mt-8">
        <SupportForm defaultEmail={user?.email ?? ""} />
      </div>
    </div>
  );
}
