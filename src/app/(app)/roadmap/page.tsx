import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoadmapView } from "@/components/RoadmapView";
import { Map } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return { title: t("roadmap") };
}

export default async function RoadmapPage() {
  const t = await getTranslations("roadmap");
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
          <h1 className="mt-4 text-xl font-bold text-ink">{t("emptyTitle")}</h1>
          <p className="mt-2 text-sm text-slate-600">{t("emptyText")}</p>
          <Link href="/professions" className="btn-primary mt-6">
            {t("chooseTrack")}
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
