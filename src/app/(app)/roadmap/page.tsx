import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoadmapView } from "@/components/RoadmapView";
import { Map } from "lucide-react";

export const metadata = { title: "Карта развития — Jobish" };

export default async function RoadmapPage() {
  const user = (await getCurrentUser())!;
  const roadmap = await prisma.roadmap.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      stages: {
        orderBy: { order: "asc" },
        include: { steps: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!roadmap) {
    return (
      <div className="container-page py-8">
        <div className="card mx-auto max-w-lg p-10 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <Map className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-ink">Карта развития пуста</h1>
          <p className="mt-2 text-sm text-slate-600">
            Выберите профессию-трек — мы автоматически построим персональную
            карту навыков по грейдам.
          </p>
          <Link href="/professions" className="btn-primary mt-6">
            Выбрать трек развития
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-8">
      <RoadmapView
        roadmapId={roadmap.id}
        title={roadmap.title}
        currentStatus={roadmap.currentStatus}
        targetStatus={roadmap.targetStatus}
        stages={roadmap.stages}
      />
    </div>
  );
}
