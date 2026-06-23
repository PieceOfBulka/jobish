import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TheoryQuiz } from "@/components/TheoryQuiz";

export default async function TakeTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const test = await prisma.theoryTest.findUnique({
    where: { id },
    include: {
      profession: true,
      questions: { orderBy: { order: "asc" } },
    },
  });
  if (!test) notFound();

  return (
    <div className="container-page max-w-3xl py-8">
      <Link href="/tests" className="text-sm text-slate-500 hover:text-brand-600">
        ← Все тесты
      </Link>
      <div className="mt-4">
        <TheoryQuiz
          testId={id}
          title={test.title}
          questions={test.questions.map((q) => ({
            id: q.id,
            text: q.text,
            options: JSON.parse(q.options),
            topic: q.topic,
          }))}
        />
      </div>
    </div>
  );
}
