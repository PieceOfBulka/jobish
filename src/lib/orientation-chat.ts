import { prisma } from "./prisma";
import type { ProfessionMatch } from "./orientation";

/** Post orientation results as an assistant message in the user's chat (US5). */
export async function postOrientationToChat(
  userId: string,
  matches: ProfessionMatch[],
  previousMatches?: ProfessionMatch[] | null,
) {
  let session = await prisma.chatSession.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  session ??= await prisma.chatSession.create({
    data: { userId, title: "Профориентация" },
  });

  const lines = matches
    .map((m, i) => `${i + 1}. **${m.title}** — ${m.match}% (${m.rationale})`)
    .join("\n");

  let content =
    `### Результаты профориентационного теста\n\n` +
    `Подходящие профессии (отсортированы по уровню соответствия):\n\n${lines}\n\n` +
    `Откройте карточку профессии и нажмите «Выбрать трек», чтобы построить карту развития.`;

  if (previousMatches?.length) {
    const prev = previousMatches
      .map((m, i) => `${i + 1}. ${m.title} — ${m.match}%`)
      .join("\n");
    content +=
      `\n\n---\n\n**Предыдущий результат (для сравнения):**\n${prev}`;
  }

  await prisma.chatMessage.create({
    data: { sessionId: session.id, role: "assistant", content },
  });

  if (session.title === "Новый диалог") {
    await prisma.chatSession.update({
      where: { id: session.id },
      data: { title: "Профориентация" },
    });
  }

  return session.id;
}
