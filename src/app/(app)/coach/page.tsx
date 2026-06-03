import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isLlmEnabled } from "@/lib/ai";
import { ChatUI } from "@/components/ChatUI";

export const metadata = { title: "AI-коуч — Jobish" };

export default async function CoachPage() {
  const user = (await getCurrentUser())!;
  const session = await prisma.chatSession.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  const initial = (session?.messages ?? []).map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  return (
    <div className="container-page py-6">
      <h1 className="text-2xl font-bold text-ink">AI-коуч</h1>
      <ChatUI initial={initial} llmEnabled={isLlmEnabled()} />
    </div>
  );
}
