"use client";

import { useMemo, useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useStartup } from "@/components/dashboard/StartupContext";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
import {
  createFounderTaskAction,
  completeTaskAction,
  startTaskAction,
  reopenTaskAction,
} from "@/lib/actions/tasks";
import type { Task, TaskPriority, TaskStatus } from "@/types/roadmap";

export type TasksPageEntry = {
  tasks: Task[];
  roadmapItemTitleById: Record<string, string>;
};

const VIEWS = ["today", "thisWeek", "upcoming", "all"] as const;
type View = (typeof VIEWS)[number];

function isToday(dueDate: string | undefined, nowIso: string): boolean {
  if (!dueDate) return false;
  return new Date(dueDate).toDateString() === new Date(nowIso).toDateString();
}

function isThisWeek(dueDate: string | undefined, nowIso: string): boolean {
  if (!dueDate) return false;
  const diffDays = (new Date(dueDate).getTime() - new Date(nowIso).getTime()) / 86400000;
  return diffDays <= 7;
}

export function TasksView({ dataByStartupId }: { dataByStartupId: Record<string, TasksPageEntry> }) {
  const { activeStartup } = useStartup();
  const entry = dataByStartupId[activeStartup.id];

  const t = useTranslations("dashboard.tasks");
  const tKey = useTranslations();
  const tStatus = useTranslations("dashboard.thisWeek.status");
  const tPriority = useTranslations("dashboard.roadmap.priority");
  const format = useFormatter();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [view, setView] = useState<View>("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [originFilter, setOriginFilter] = useState<"all" | "roadmap" | "founder">("all");
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium");

  const nowIso = useMemo(() => new Date().toISOString(), []);
  const formatDate = (iso: string) => format.dateTime(new Date(iso), { day: "numeric", month: "short" });

  const filtered = useMemo(() => {
    if (!entry) return [];
    let tasks = entry.tasks.filter((task) => task.status !== "cancelled");
    if (view === "today") tasks = tasks.filter((task) => isToday(task.dueDate, nowIso));
    else if (view === "thisWeek") tasks = tasks.filter((task) => isThisWeek(task.dueDate, nowIso));
    else if (view === "upcoming") tasks = tasks.filter((task) => task.dueDate && !isThisWeek(task.dueDate, nowIso));
    if (statusFilter !== "all") tasks = tasks.filter((task) => task.status === statusFilter);
    if (priorityFilter !== "all") tasks = tasks.filter((task) => task.priority === priorityFilter);
    if (originFilter === "roadmap") tasks = tasks.filter((task) => Boolean(task.roadmapItemId));
    if (originFilter === "founder") tasks = tasks.filter((task) => !task.roadmapItemId);
    return tasks;
  }, [entry, view, statusFilter, priorityFilter, originFilter, nowIso]);

  if (!entry) return null;

  const counts = {
    todo: entry.tasks.filter((t2) => t2.status === "todo").length,
    inProgress: entry.tasks.filter((t2) => t2.status === "in_progress").length,
    blocked: entry.tasks.filter((t2) => t2.status === "blocked").length,
    done: entry.tasks.filter((t2) => t2.status === "done").length,
  };

  const handleStart = (taskId: string) => {
    startTransition(async () => {
      await startTaskAction(activeStartup.id, taskId);
      router.refresh();
    });
  };
  const handleComplete = (taskId: string) => {
    startTransition(async () => {
      await completeTaskAction(activeStartup.id, taskId);
      router.refresh();
    });
  };
  const handleReopen = (taskId: string) => {
    startTransition(async () => {
      await reopenTaskAction(activeStartup.id, taskId);
      router.refresh();
    });
  };

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    startTransition(async () => {
      await createFounderTaskAction(activeStartup.id, {
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        dueDate: newDueDate || undefined,
        priority: newPriority,
      });
      setNewTitle("");
      setNewDescription("");
      setNewDueDate("");
      setNewPriority("medium");
      setShowNewTask(false);
      router.refresh();
    });
  };

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{t("pageTitle")}</h1>
          <p className="mt-1.5 text-[13.5px] text-aff-muted">{t("pageSubtitle")}</p>
        </div>
        <Button onClick={() => setShowNewTask((s) => !s)} className="px-4 py-2.5 text-[13px]">
          {t("newTask.cta")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[13px] text-aff-muted">
        <span>{t("summary.todo", { count: counts.todo })}</span>
        <span>{t("summary.inProgress", { count: counts.inProgress })}</span>
        <span>{t("summary.blocked", { count: counts.blocked })}</span>
        <span>{t("summary.done", { count: counts.done })}</span>
      </div>

      {showNewTask ? (
        <DashboardSection title={t("newTask.title")}>
          <div className="flex flex-col gap-3">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={t("newTask.titlePlaceholder")}
              className="rounded-md border border-aff-line bg-transparent px-3 py-2 text-[13.5px] text-aff-text"
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder={t("newTask.descriptionPlaceholder")}
              className="rounded-md border border-aff-line bg-transparent px-3 py-2 text-[13.5px] text-aff-text"
              rows={2}
            />
            <div className="flex flex-wrap gap-3">
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="rounded-md border border-aff-line bg-transparent px-3 py-2 text-[13px] text-aff-text"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                className="rounded-md border border-aff-line bg-transparent px-3 py-2 text-[13px] text-aff-text"
              >
                {(["low", "medium", "high", "critical"] as TaskPriority[]).map((p) => (
                  <option key={p} value={p}>
                    {tPriority(p)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} className="px-4 py-2 text-[13px]">
                {t("newTask.save")}
              </Button>
              <Button onClick={() => setShowNewTask(false)} variant="secondary" className="px-4 py-2 text-[13px]">
                {t("newTask.cancel")}
              </Button>
            </div>
          </div>
        </DashboardSection>
      ) : null}

      <DashboardSection
        title={t("pageTitle")}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-md px-2.5 py-1 text-[12px] font-semibold ${
                  view === v ? "bg-aff-accent/10 text-aff-accent" : "text-aff-muted"
                }`}
              >
                {t(`views.${v}`)}
              </button>
            ))}
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "all")}
            className="rounded-md border border-aff-line bg-transparent px-2 py-1 text-[12px] text-aff-text"
          >
            <option value="all">{t("filters.allStatuses")}</option>
            {(["todo", "in_progress", "blocked", "done"] as TaskStatus[]).map((s) => (
              <option key={s} value={s}>
                {tStatus(s)}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | "all")}
            className="rounded-md border border-aff-line bg-transparent px-2 py-1 text-[12px] text-aff-text"
          >
            <option value="all">{t("filters.allPriorities")}</option>
            {(["low", "medium", "high", "critical"] as TaskPriority[]).map((p) => (
              <option key={p} value={p}>
                {tPriority(p)}
              </option>
            ))}
          </select>
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value as "all" | "roadmap" | "founder")}
            className="rounded-md border border-aff-line bg-transparent px-2 py-1 text-[12px] text-aff-text"
          >
            <option value="all">{t("filters.all")}</option>
            <option value="roadmap">{t("filters.roadmapLinked")}</option>
            <option value="founder">{t("filters.founderCreated")}</option>
          </select>
        </div>

        {filtered.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filtered.map((task) => {
              const linkedTitleKey = task.roadmapItemId ? entry.roadmapItemTitleById[task.roadmapItemId] : undefined;
              return (
                <div key={task.id} className="flex items-start justify-between gap-3 rounded-xl border border-aff-line px-4 py-3">
                  <div>
                    <div className="text-[13.5px] font-semibold text-aff-text">{task.title}</div>
                    {task.description ? <div className="mt-0.5 text-[12.5px] text-aff-muted">{task.description}</div> : null}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-aff-muted">
                      <span>{task.dueDate ? t("card.due", { date: formatDate(task.dueDate) }) : t("card.noDue")}</span>
                      <span>{tPriority(task.priority)}</span>
                      {linkedTitleKey ? <span>{t("card.linkedAction", { title: tKey(linkedTitleKey) })}</span> : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge status={task.status} label={tStatus(task.status)} />
                    <div className="flex gap-1.5">
                      {task.status === "todo" ? (
                        <button
                          type="button"
                          onClick={() => handleStart(task.id)}
                          className="text-[11.5px] font-semibold text-aff-accent hover:text-aff-accent-hover"
                        >
                          {t("card.start")}
                        </button>
                      ) : null}
                      {task.status !== "done" ? (
                        <button
                          type="button"
                          onClick={() => handleComplete(task.id)}
                          className="text-[11.5px] font-semibold text-aff-accent hover:text-aff-accent-hover"
                        >
                          {t("card.complete")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReopen(task.id)}
                          className="text-[11.5px] font-semibold text-aff-muted hover:text-aff-text"
                        >
                          {t("card.reopen")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title={t("empty.title")} body={t("empty.body")} />
        )}
      </DashboardSection>
    </div>
  );
}
