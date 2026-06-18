import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppSidebar } from "@/components/AppSidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.isBlocked) redirect("/login");
  if (!user.isVerified) redirect("/verify"); // ФТ-1.6

  return (
    <div className="flex min-h-screen bg-canvas lg:flex-row">
      <AppSidebar name={user.name} plan={user.plan} />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
