import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatUI } from "@/components/ChatUI";

export const metadata = { title: "AI-коуч — Jobish" };

export default async function CoachPage() {
  const user = (await getCurrentUser())!;
  const sessions = await prisma.chatSession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });

  // Сообщения самой свежей сессии (если есть)
  const activeId = sessions[0]?.id ?? null;
  const messages = activeId
    ? await prisma.chatMessage.findMany({
        where: { sessionId: activeId },
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true },
      })
    : [];

  return (
    <div className="container-page py-6">
      <h1 className="text-2xl font-bold text-ink">AI-коуч</h1>
      <p className="mb-3 mt-1 text-sm text-slate-500">
        История диалогов сохраняется — переключайтесь между чатами или создавайте новые.
      </p>
      <ChatUI
        initialSessions={sessions}
        initialSessionId={activeId}
        initialMessages={messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        }))}
      />
    </div>
  );
}
