import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatUI } from "@/components/ChatUI";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return { title: t("coach") };
}

export default async function CoachPage() {
  const t = await getTranslations("coach");
  const user = (await getCurrentUser())!;
  let session = await prisma.chatSession.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 50 } },
  });
  if (!session) {
    session = await prisma.chatSession.create({
      data: { userId: user.id, title: "Диалог с коучем" },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 50 } },
    });
  }
  const messages = session.messages;

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink sm:text-3xl">{t("title")}</h1>
      <ChatUI
        initial={messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        }))}
        llmEnabled={Boolean(process.env.OPENROUTER_API_KEY)}
      />
    </div>
  );
}
