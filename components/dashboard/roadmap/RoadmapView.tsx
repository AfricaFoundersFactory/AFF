"use client";

import { useMemo, useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useStartup } from "@/components/dashboard/StartupContext";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ButtonLink, Button } from "@/components/ui/Button";
import { computeRoadmapProgress, isReadyToComplete } from "@/lib/roadmap/progress";
import { isQuickWin } from "@/lib/roadmap/prioritization";
import {
  generateRoadmapAction,
  updateRoadmapItemStatusAction,
  dismissRoadmapItemAction,
} from "@/lib/actions/roadmap";
import type { Roadmap, RoadmapItem, Task, TaskPriority } from "@/types/roadmap";
import type { ReassessmentSuggestion } from "@/lib/roadmap/reassessment";
import { reassessAction } from "@/lib/actions/readiness";

export type RoadmapPageEntry = {
  roadmap: Roadmap | undefined;
  tasks: Task[];
  quickWins: RoadmapItem[];
  topPriorities: RoadmapItem[];
  hasCompletedAssessment: boolean;
  reassessment: ReassessmentSuggestion;
};

const PRIORITY_FILTERS = ["all", "critical", "high", "inProgress", "completed"] as const;
type PriorityFilter = (typeof PRIORITY_FILTERS)[number];

function priorityTone(priority: TaskPriority | undefined): string {
  switch (priority) {
    case "critical":
      return "text-red-400";
    case "high":
      return "text-amber-400";
    case "medium":
      return "text-aff-cyan";
    default:
      return "text-aff-muted";
  }
}

export function RoadmapView({ dataByStartupId }: { dataByStartupId: Record<string, RoadmapPageEntry> }) {
  const { activeStartup } = useStartup();
  const entry = dataByStartupId[activeStartup.id];

  const t = useTranslations("dashboard.roadmap");
  const tKey = useTranslations();
  const tStatus = useTranslations("dashboard.thisWeek.status");
  const tDim = useTranslations("dashboard.readiness.dimensions");
  const format = useFormatter();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [filter, setFilter] = useState<PriorityFilter>("all");
  const [dimensionFilter, setDimensionFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDate = (iso: string) => format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const resolveTitle = (item: RoadmapItem) => (item.titleKey ? tKey(item.titleKey) : item.title);
  const resolveDescription = (item: RoadmapItem) => (item.descriptionKey ? tKey(item.descriptionKey) : item.description ?? "");

  const filteredItems = useMemo(() => {
    if (!entry?.roadmap) return [];
    let items = entry.roadmap.items.filter((i) => i.status !== "cancelled");
    if (filter === "critical") items = items.filter((i) => i.priority === "critical");
    else if (filter === "high") items = items.filter((i) => i.priority === "high");
    else if (filter === "inProgress") items = items.filter((i) => i.status === "in_progress");
    else if (filter === "completed") items = items.filter((i) => i.status === "done");
    if (dimensionFilter !== "all") items = items.filter((i) => i.readinessDimension === dimensionFilter);
    return items;
  }, [entry, filter, dimensionFilter]);

  if (!entry) return null;

  const handleGenerate = () => {
    startTransition(async () => {
      await generateRoadmapAction(activeStartup.id);
      router.refresh();
    });
  };

  const handleReassess = () => {
    startTransition(async () => {
      await reassessAction(activeStartup.id);
      router.refresh();
    });
  };

  const handleStatusChange = (itemId: string, status: RoadmapItem["status"]) => {
    startTransition(async () => {
      await updateRoadmapItemStatusAction(activeStartup.id, itemId, status);
      router.refresh();
    });
  };

  const handleDismiss = (itemId: string) => {
    startTransition(async () => {
      await dismissRoadmapItemAction(activeStartup.id, itemId);
      router.refresh();
    });
  };

  if (!entry.hasCompletedAssessment) {
    return (
      <div className="mx-auto max-w-[900px]">
        <DashboardSection title={t("pageTitle")}>
          <p className="mb-1 text-[15px] font-semibold text-aff-text">{t("needsAssessmentTitle")}</p>
          <p className="mb-5 text-[13.5px] text-aff-muted">{t("needsAssessmentBody")}</p>
          <ButtonLink href="/dashboard/readiness/assessment" className="px-4 py-2.5 text-[13.5px]">
            {t("needsAssessmentCta")}
          </ButtonLink>
        </DashboardSection>
      </div>
    );
  }

  if (!entry.roadmap) {
    return (
      <div className="mx-auto max-w-[900px]">
        <DashboardSection title={t("pageTitle")}>
          <p className="mb-1 text-[15px] font-semibold text-aff-text">{t("noRoadmapTitle")}</p>
          <p className="mb-5 text-[13.5px] text-aff-muted">{t("noRoadmapBody")}</p>
          <Button onClick={handleGenerate} className="px-4 py-2.5 text-[13.5px]">
            {t("generateButton")}
          </Button>
        </DashboardSection>
      </div>
    );
  }

  const { roadmap, tasks, quickWins, topPriorities, reassessment } = entry;
  const progress = computeRoadmapProgress(roadmap);
  const dimensionsPresent = Array.from(new Set(roadmap.items.map((i) => i.readinessDimension).filter(Boolean))) as string[];

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{t("pageTitle")}</h1>
          <p className="mt-1.5 text-[13.5px] text-aff-muted">{t("pageSubtitle")}</p>
        </div>
        <Button onClick={handleGenerate} variant="secondary" className="px-4 py-2.5 text-[13px]">
          {t("regenerateButton")}
        </Button>
      </div>

      {reassessment.shouldSuggest ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-aff-line-strong bg-aff-bg2 px-5 py-4">
          <div>
            <p className="text-[13.5px] font-semibold text-aff-text">{t("reassessBanner.title")}</p>
            <p className="text-[12.5px] text-aff-muted">
              {t("reassessBanner.body", { count: reassessment.completedGapItemsSinceLastAssessment })}
            </p>
          </div>
          <Button onClick={handleReassess} className="px-4 py-2.5 text-[13px]">
            {t("reassessBanner.cta")}
          </Button>
        </div>
      ) : null}

      <DashboardSection title={t("pageTitle")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ProgressCard
            pct={progress.pct}
            completedLabel={t("progress.completed", { count: progress.completedCount })}
            inProgressLabel={t("progress.inProgress", { count: progress.inProgressCount })}
            remainingLabel={t("progress.remaining", { count: progress.remainingCount })}
          />
          <div className="shrink-0 text-right text-[12.5px] text-aff-muted">
            <div>{t("versionLabel", { version: roadmap.version ?? 1 })}</div>
            <div>{t("basedOnAssessment", { version: roadmap.sourceAssessmentId?.split("-v").pop() ?? "1" })}</div>
            <div>{t("lastUpdated", { date: roadmap.updatedAt ? formatDate(roadmap.updatedAt) : "" })}</div>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection title={t("priorities.title")}>
        {topPriorities.length > 0 ? (
          <div className="flex flex-col gap-3">
            {topPriorities.map((item) => (
              <RoadmapItemCard
                key={item.id}
                item={item}
                tasks={tasks}
                resolveTitle={resolveTitle}
                resolveDescription={resolveDescription}
                tKey={tKey}
                t={t}
                tDim={tDim}
                tStatus={tStatus}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                onStatusChange={handleStatusChange}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-aff-muted">{t("priorities.empty")}</p>
        )}
      </DashboardSection>

      <DashboardSection title={t("quickWins.title")}>
        <p className="mb-3 text-[12.5px] text-aff-muted">{t("quickWins.subtitle")}</p>
        {quickWins.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quickWins.map((item) => (
              <div key={item.id} className="rounded-xl border border-aff-line px-4 py-3">
                <span className="mb-1 inline-block rounded-full bg-aff-accent/10 px-2 py-0.5 text-[11px] font-semibold text-aff-accent">
                  {t("quickWins.badge")}
                </span>
                <div className="text-[13.5px] font-semibold text-aff-text">{resolveTitle(item)}</div>
                <div className="text-[12px] text-aff-muted">{item.estimatedDuration}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-aff-muted">{t("quickWins.empty")}</p>
        )}
      </DashboardSection>

      <DashboardSection
        title={t("allActions.title")}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as PriorityFilter)}
              className="rounded-md border border-aff-line bg-transparent px-2 py-1 text-[12px] text-aff-text"
            >
              {PRIORITY_FILTERS.map((f) => (
                <option key={f} value={f}>
                  {t(`allActions.filters.${f}`)}
                </option>
              ))}
            </select>
            <select
              value={dimensionFilter}
              onChange={(e) => setDimensionFilter(e.target.value)}
              className="rounded-md border border-aff-line bg-transparent px-2 py-1 text-[12px] text-aff-text"
            >
              <option value="all">{t("allActions.filters.allDimensions")}</option>
              {dimensionsPresent.map((d) => (
                <option key={d} value={d}>
                  {tDim(`${d}.label`)}
                </option>
              ))}
            </select>
          </div>
        }
      >
        {filteredItems.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filteredItems.map((item) => (
              <RoadmapItemCard
                key={item.id}
                item={item}
                tasks={tasks}
                resolveTitle={resolveTitle}
                resolveDescription={resolveDescription}
                tKey={tKey}
                t={t}
                tDim={tDim}
                tStatus={tStatus}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                onStatusChange={handleStatusChange}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        ) : (
          <EmptyState title={t("allActions.empty")} />
        )}
      </DashboardSection>
    </div>
  );
}

function RoadmapItemCard({
  item,
  tasks,
  resolveTitle,
  resolveDescription,
  tKey,
  t,
  tDim,
  tStatus,
  expanded,
  onToggle,
  onStatusChange,
  onDismiss,
}: {
  item: RoadmapItem;
  tasks: Task[];
  resolveTitle: (item: RoadmapItem) => string;
  resolveDescription: (item: RoadmapItem) => string;
  tKey: ReturnType<typeof useTranslations>;
  t: ReturnType<typeof useTranslations>;
  tDim: ReturnType<typeof useTranslations>;
  tStatus: ReturnType<typeof useTranslations>;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (itemId: string, status: RoadmapItem["status"]) => void;
  onDismiss: (itemId: string) => void;
}) {
  const linkedTasks = tasks.filter((task) => item.taskIds?.includes(task.id));
  const readyToComplete = isReadyToComplete(item, tasks);
  const quickWin = isQuickWin(item);

  return (
    <div className="rounded-xl border border-aff-line px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={onToggle} className="flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[11.5px] font-semibold uppercase tracking-[0.04em] ${priorityTone(item.priority)}`}>
              {item.priority ? t(`priority.${item.priority}`) : null}
            </span>
            {quickWin ? (
              <span className="rounded-full bg-aff-accent/10 px-2 py-0.5 text-[10.5px] font-semibold text-aff-accent">
                {t("quickWins.badge")}
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-[14px] font-semibold text-aff-text">{resolveTitle(item)}</div>
          {item.readinessDimension ? (
            <div className="mt-0.5 text-[12px] text-aff-muted">{tDim(`${item.readinessDimension}.label`)}</div>
          ) : null}
        </button>
        <StatusBadge status={item.status} label={tStatus(item.status)} />
      </div>

      {expanded ? (
        <div className="mt-3 flex flex-col gap-2.5 border-t border-aff-line pt-3 text-[13px]">
          <p className="text-aff-text">{resolveDescription(item)}</p>

          {item.priorityReasons && item.priorityReasons.length > 0 ? (
            <div>
              <div className="text-[11.5px] font-semibold tracking-[0.04em] text-aff-muted">{t("detail.whyThisMatters")}</div>
              <ul className="mt-1 list-disc pl-4 text-aff-text">
                {item.priorityReasons.map((reason) => {
                  const key = reason.split("::")[0];
                  return <li key={reason}>{t(`reasons.${key}` as never)}</li>;
                })}
              </ul>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2 text-[12.5px] text-aff-muted sm:grid-cols-4">
            {item.impact ? (
              <div>
                <div className="font-semibold text-aff-text">{t("detail.effort")}</div>
                {item.effort ? t(`effort.${item.effort}`) : null}
              </div>
            ) : null}
            {item.estimatedDuration ? (
              <div>
                <div className="font-semibold text-aff-text">{t("detail.estimatedDuration")}</div>
                {item.estimatedDuration}
              </div>
            ) : null}
            {item.sourceType ? (
              <div className="col-span-2">
                <div className="font-semibold text-aff-text">{t("detail.source")}</div>
                {t(`sourceLabels.${item.sourceType}` as never)}
              </div>
            ) : null}
          </div>

          {item.evidenceRequirement ? (
            <div>
              <div className="text-[11.5px] font-semibold tracking-[0.04em] text-aff-muted">{t("detail.evidenceExpected")}</div>
              <p className="text-aff-text">{tKey(item.evidenceRequirement as never)}</p>
            </div>
          ) : null}

          {linkedTasks.length > 0 ? (
            <div>
              <div className="text-[11.5px] font-semibold tracking-[0.04em] text-aff-muted">{t("detail.tasksChecklist")}</div>
              <ul className="mt-1 flex flex-col gap-1">
                {linkedTasks.map((task) => (
                  <li key={task.id} className="flex items-center gap-2 text-aff-text">
                    <span>{task.status === "done" ? "✓" : "○"}</span>
                    {task.title}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {item.dependencies && item.dependencies.length > 0 ? (
            <div>
              <div className="text-[11.5px] font-semibold tracking-[0.04em] text-aff-muted">{t("detail.dependencies")}</div>
              <p className="text-aff-text">{item.dependencies.length}</p>
            </div>
          ) : null}

          <div className="mt-1 flex flex-wrap gap-2">
            {item.status === "todo" ? (
              <Button onClick={() => onStatusChange(item.id, "in_progress")} className="px-3 py-2 text-[12.5px]">
                {t("detail.startAction")}
              </Button>
            ) : null}
            {readyToComplete ? (
              <Button onClick={() => onStatusChange(item.id, "done")} className="px-3 py-2 text-[12.5px]">
                {t("detail.markComplete")}
              </Button>
            ) : null}
            {item.status !== "done" ? (
              <Button onClick={() => onDismiss(item.id)} variant="secondary" className="px-3 py-2 text-[12.5px]">
                {t("detail.dismiss")}
              </Button>
            ) : null}
          </div>
          {readyToComplete ? <p className="text-[12px] text-aff-accent">{t("detail.readyToComplete")}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
