"use client";

import { useState } from "react";
import { ExternalLink, Circle, CircleDot, CheckCircle2, Trophy } from "lucide-react";

type Status = "not_started" | "in_progress" | "done";

interface Step {
  id: string;
  skillName: string;
  status: string;
  materialTitle: string | null;
  materialUrl: string | null;
}
interface Stage {
  id: string;
  title: string;
  steps: Step[];
}

const NEXT: Record<Status, Status> = {
  not_started: "in_progress",
  in_progress: "done",
  done: "not_started",
};

const STATUS_META: Record<Status, { label: string; icon: typeof Circle; cls: string }> = {
  not_started: { label: "Начать", icon: Circle, cls: "text-slate-300" },
  in_progress: { label: "В процессе", icon: CircleDot, cls: "text-amber-500" },
  done: { label: "Освоено", icon: CheckCircle2, cls: "text-emerald-500" },
};

export function RoadmapView({ title, stages: initial }: { title: string; stages: Stage[] }) {
  const [stages, setStages] = useState(initial);

  const allSteps = stages.flatMap((s) => s.steps);
  const done = allSteps.filter((s) => s.status === "done").length;
  const progress = allSteps.length ? Math.round((done / allSteps.length) * 100) : 0;

  async function cycle(stepId: string) {
    let newStatus: Status = "not_started";
    setStages((prev) =>
      prev.map((stage) => ({
        ...stage,
        steps: stage.steps.map((s) => {
          if (s.id !== stepId) return s;
          newStatus = NEXT[s.status as Status];
          return { ...s, status: newStatus };
        }),
      })),
    );
    await fetch("/api/roadmap/step", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepId, status: newStatus }),
    });
  }

  return (
    <div>
      {/* Motivational block (US3) */}
      <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h1 className="text-xl font-bold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {done} из {allSteps.length} навыков освоено
          </p>
        </div>
        <div className="flex items-center gap-4">
          {progress === 100 && (
            <span className="badge bg-emerald-50 text-emerald-700">
              <Trophy className="h-3.5 w-3.5" /> Трек завершён!
            </span>
          )}
          <div className="relative grid h-16 w-16 place-items-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" stroke="#eef2ff" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="16" fill="none" stroke="#4f46e5" strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(progress / 100) * 100.5} 100.5`}
              />
            </svg>
            <span className="text-sm font-bold text-brand-700">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Stages */}
      <div className="mt-6 space-y-6">
        {stages.map((stage, si) => {
          const stageDone = stage.steps.filter((s) => s.status === "done").length;
          return (
            <div key={stage.id} className="card p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                  {si + 1}
                </span>
                <h2 className="font-semibold text-ink">{stage.title}</h2>
                <span className="ml-auto text-xs text-slate-400">
                  {stageDone}/{stage.steps.length}
                </span>
              </div>
              <ul className="mt-4 space-y-2">
                {stage.steps.map((step) => {
                  const meta = STATUS_META[step.status as Status];
                  const Icon = meta.icon;
                  return (
                    <li key={step.id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5">
                      <button
                        onClick={() => cycle(step.id)}
                        title={`Статус: ${meta.label} (нажмите, чтобы изменить)`}
                        className="shrink-0"
                        aria-label={`Изменить статус навыка ${step.skillName}`}
                      >
                        <Icon className={`h-6 w-6 ${meta.cls}`} />
                      </button>
                      <span className={`flex-1 text-sm ${step.status === "done" ? "text-slate-400 line-through" : "text-ink"}`}>
                        {step.skillName}
                      </span>
                      {step.materialUrl && (
                        <a
                          href={step.materialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{step.materialTitle ?? "Материал"}</span>
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
