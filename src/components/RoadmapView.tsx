"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ExternalLink, Circle, CircleDot, CheckCircle2, Trophy,
  Pencil, Plus, Trash2, ChevronUp, ChevronDown, Save, X, ArrowRight, RefreshCw,
} from "lucide-react";
import { stepHint, type SkillType, type Grade } from "@/lib/roadmap-content";

type Status = "not_started" | "in_progress" | "done";

interface Step {
  id: string;
  skillName: string;
  skillType: string | null;
  status: string;
  materialTitle: string | null;
  materialUrl: string | null;
  materialAuthor: string | null;
  materialType: string | null;
  materialDuration: number | null;
  materialRating: number | null;
  estimateHours: number | null;
}
interface Stage { id: string; title: string; description: string | null; steps: Step[] }

const STAGE_GRADES: Grade[] = ["junior", "middle", "senior"];

const NEXT: Record<Status, Status> = {
  not_started: "in_progress",
  in_progress: "done",
  done: "not_started",
};

const STATUS_ICONS: Record<Status, { icon: typeof Circle; cls: string }> = {
  not_started: { icon: Circle, cls: "text-slate-300" },
  in_progress: { icon: CircleDot, cls: "text-amber-500" },
  done: { icon: CheckCircle2, cls: "text-emerald-500" },
};

export function RoadmapView({
  roadmapId, title, currentStatus, targetStatus, stages,
}: {
  roadmapId: string;
  title: string;
  currentStatus: string | null;
  targetStatus: string | null;
  stages: Stage[];
}) {
  const t = useTranslations("roadmap");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newStage, setNewStage] = useState("");
  const [cur, setCur] = useState(currentStatus ?? "");
  const [tgt, setTgt] = useState(targetStatus ?? "");

  const statusLabels: Record<Status, string> = {
    not_started: t("statusStart"),
    in_progress: t("statusInProgress"),
    done: t("statusDone"),
  };

  const allSteps = stages.flatMap((s) => s.steps);
  const done = allSteps.filter((s) => s.status === "done").length;
  const progress = allSteps.length ? Math.round((done / allSteps.length) * 100) : 0;
  const nextStepId = allSteps.find((s) => s.status !== "done")?.id ?? null;

  async function post(payload: Record<string, unknown>) {
    setBusy(true);
    await fetch("/api/roadmap/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div>
      <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h1 className="text-xl font-bold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("skillsProgress", { done, total: allSteps.length })}</p>
        </div>
        <div className="flex items-center gap-4">
          {progress === 100 && (
            <span className="badge bg-emerald-50 text-emerald-700"><Trophy className="h-3.5 w-3.5" /> {t("trackComplete")}</span>
          )}
          <div className="relative grid h-16 w-16 place-items-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" stroke="#eef2ff" strokeWidth="3" />
              <circle cx="18" cy="18" r="16" fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(progress / 100) * 100.5} 100.5`} />
            </svg>
            <span className="text-sm font-bold text-brand-700">{progress}%</span>
          </div>
          {!edit && (
            <button
              onClick={() => post({ action: "refresh_roadmap", roadmapId })}
              disabled={busy}
              className="btn-ghost"
              title={t("refreshTitle")}
            >
              <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> {t("refresh")}
            </button>
          )}
          <button onClick={() => setEdit((e) => !e)} className={edit ? "btn-primary" : "btn-outline"}>
            {edit ? <><X className="h-4 w-4" /> {tCommon("done")}</> : <><Pencil className="h-4 w-4" /> {t("constructor")}</>}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1 text-xs text-slate-500">
        <span>{t("legendIntro")}</span>
        <span className="inline-flex items-center gap-1.5"><Circle className="h-4 w-4 text-slate-300" /> {t("statusNotStarted")}</span>
        <span className="inline-flex items-center gap-1.5"><CircleDot className="h-4 w-4 text-amber-500" /> {t("statusInProgress")}</span>
        <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t("statusDone")}</span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-brand-700">{t("currentStatus")}</h3>
          {edit ? (
            <textarea className="input mt-2 min-h-28 resize-y" value={cur} onChange={(e) => setCur(e.target.value)} />
          ) : (
            <p className="mt-2 text-sm text-slate-600">{currentStatus ?? tCommon("dash")}</p>
          )}
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-accent-600">{t("targetStatus")}</h3>
          {edit ? (
            <textarea className="input mt-2 min-h-28 resize-y" value={tgt} onChange={(e) => setTgt(e.target.value)} />
          ) : (
            <p className="mt-2 text-sm text-slate-600">{targetStatus ?? tCommon("dash")}</p>
          )}
        </div>
      </div>
      {edit && (
        <button onClick={() => post({ action: "set_meta", roadmapId, currentStatus: cur, targetStatus: tgt })} disabled={busy} className="btn-outline mt-3">
          <Save className="h-4 w-4" /> {t("saveStatuses")}
        </button>
      )}

      <div className="mt-6 space-y-6">
        {stages.map((stage, si) => {
          const stageDone = stage.steps.filter((s) => s.status === "done").length;
          return (
            <div key={stage.id} className="card p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">{si + 1}</span>
                {edit ? (
                  <StageRename initial={stage.title} onSave={(stageTitle) => post({ action: "rename_stage", stageId: stage.id, title: stageTitle })} />
                ) : (
                  <h2 className="font-semibold text-ink">{stage.title}</h2>
                )}
                <span className="ml-auto text-xs text-slate-400">{stageDone}/{stage.steps.length}</span>
                {edit && (
                  <button onClick={() => post({ action: "delete_stage", stageId: stage.id })} disabled={busy} className="text-red-500 hover:text-red-600" aria-label={t("deleteStage")}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {stage.description && (
                <p className="mt-2 text-sm text-slate-500">{stage.description}</p>
              )}
              {stage.steps.length > 0 && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-400 transition-all"
                    style={{ width: `${Math.round((stageDone / stage.steps.length) * 100)}%` }}
                  />
                </div>
              )}

              <ul className="mt-4 space-y-2">
                {stage.steps.map((step) => {
                  const status = step.status as Status;
                  const meta = STATUS_ICONS[status];
                  const Icon = meta.icon;
                  const label = statusLabels[status];
                  const isNext = step.id === nextStepId;
                  const grade: Grade = STAGE_GRADES[si] ?? "senior";
                  return (
                    <li key={step.id} className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${isNext ? "border-brand-300 bg-brand-50/40" : "border-slate-100"}`}>
                      <button onClick={() => post({ action: "set_status", stepId: step.id, status: NEXT[status] })} disabled={busy} title={t("statusLabel", { label })} className="mt-0.5 shrink-0" aria-label={t("changeSkillStatus", { skillName: step.skillName })}>
                        <Icon className={`h-6 w-6 ${meta.cls}`} />
                      </button>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-sm ${step.status === "done" ? "text-slate-400 line-through" : "text-ink"}`}>{step.skillName}</span>
                          {step.skillType && (
                            <span className={`badge ${step.skillType === "soft" ? "bg-violet-50 text-violet-700" : "bg-sky-50 text-sky-700"}`}>
                              {step.skillType === "soft" ? "soft" : "hard"}
                            </span>
                          )}
                          {isNext && (
                            <span className="badge bg-brand-100 text-brand-700"><ArrowRight className="h-3 w-3" /> {t("nextStep")}</span>
                          )}
                        </div>
                        {step.skillType && step.status !== "done" && (
                          <p className="mt-0.5 text-xs text-slate-400">{stepHint(step.skillType as SkillType, grade)}</p>
                        )}
                        {step.materialUrl ? (
                          <a href={step.materialUrl} target="_blank" rel="noopener noreferrer" className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-brand-600 hover:underline">
                            <ExternalLink className="h-3 w-3" /> {step.materialTitle ?? t("materialFallback")}
                            <span className="text-slate-400">
                              {step.materialType ? `· ${step.materialType}` : ""}
                              {step.materialAuthor ? ` · ${step.materialAuthor}` : ""}
                              {step.estimateHours ? t("hoursEstimate", { hours: step.estimateHours }) : ""}
                            </span>
                          </a>
                        ) : (
                          <p className="mt-1 text-xs text-slate-400">
                            {step.estimateHours
                              ? t("materialNotSet", { hours: step.estimateHours })
                              : t("materialFallback")}
                            {!edit && t("addViaConstructor")}
                          </p>
                        )}
                      </div>
                      {edit && (
                        <div className="flex shrink-0 items-center gap-1">
                          <button onClick={() => post({ action: "move_step", stepId: step.id, dir: "up" })} disabled={busy} className="text-slate-400 hover:text-ink" aria-label={t("moveUp")}><ChevronUp className="h-4 w-4" /></button>
                          <button onClick={() => post({ action: "move_step", stepId: step.id, dir: "down" })} disabled={busy} className="text-slate-400 hover:text-ink" aria-label={t("moveDown")}><ChevronDown className="h-4 w-4" /></button>
                          <button onClick={() => post({ action: "delete_step", stepId: step.id })} disabled={busy} className="text-red-500 hover:text-red-600" aria-label={t("deleteSkill")}><Trash2 className="h-4 w-4" /></button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              {edit && (
                <AddStep onAdd={(skillName) => post({ action: "add_step", stageId: stage.id, skillName })} />
              )}
            </div>
          );
        })}
      </div>

      {edit && (
        <div className="card mt-6 flex items-center gap-2 p-4">
          <input className="input" placeholder={t("newStagePlaceholder")} value={newStage} onChange={(e) => setNewStage(e.target.value)} />
          <button onClick={() => { if (newStage.trim()) { post({ action: "add_stage", roadmapId, title: newStage }); setNewStage(""); } }} disabled={busy} className="btn-primary shrink-0">
            <Plus className="h-4 w-4" /> {t("stage")}
          </button>
        </div>
      )}
    </div>
  );
}

function StageRename({ initial, onSave }: { initial: string; onSave: (t: string) => void }) {
  const t = useTranslations("roadmap");
  const [val, setVal] = useState(initial);
  return (
    <div className="flex flex-1 items-center gap-2">
      <input className="input py-1.5" value={val} onChange={(e) => setVal(e.target.value)} aria-label={t("stageNameLabel", { name: initial })} />
      <button onClick={() => onSave(val)} className="btn-ghost shrink-0 p-1.5" aria-label={t("saveStageName")}><Save className="h-4 w-4" /></button>
    </div>
  );
}

function AddStep({ onAdd }: { onAdd: (skill: string) => void }) {
  const t = useTranslations("roadmap");
  const [val, setVal] = useState("");
  return (
    <div className="mt-3 flex items-center gap-2">
      <input className="input py-1.5" placeholder={t("addSkillPlaceholder")} value={val} onChange={(e) => setVal(e.target.value)} />
      <button onClick={() => { if (val.trim()) { onAdd(val); setVal(""); } }} className="btn-outline shrink-0"><Plus className="h-4 w-4" /> {t("skill")}</button>
    </div>
  );
}
