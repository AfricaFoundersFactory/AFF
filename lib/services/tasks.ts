/**
 * Task service boundary — full CRUD, same in-memory Map + startupId-scoped
 * pattern as lib/services/digital-twin.ts. Never lets one startup's
 * mutation affect another's entries (see lib/services/tasks.test.ts for the
 * isolation assertion).
 *
 * Nothing here calls into lib/services/readiness.ts's score-mutating
 * functions: completing a task can, at most, be evidence a founder later
 * feeds into a NEW assessment — it never touches a score directly.
 */
import { randomUUID } from "crypto";
import type { Task, TaskPriority, TaskStatus } from "@/types/roadmap";
import { demoWeekTasksByStartup } from "@/lib/demo";

const store = new Map<string, Task[]>();

function tasksFor(startupId: string): Task[] {
  return store.get(startupId) ?? [];
}

function save(startupId: string, tasks: Task[]) {
  store.set(startupId, tasks);
}

export type TaskFilters = {
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
  roadmapLinked?: boolean; // true = only tasks with a roadmapItemId, false = only founder-created/standalone
  dueBefore?: string;
  dueAfter?: string;
};

export function getTasksForStartup(startupId: string, filters?: TaskFilters): Task[] {
  let tasks = tasksFor(startupId);
  if (!filters) return tasks;

  if (filters.status) tasks = tasks.filter((t) => t.status === filters.status);
  if (filters.priority) tasks = tasks.filter((t) => t.priority === filters.priority);
  if (filters.category) tasks = tasks.filter((t) => t.category === filters.category);
  if (filters.roadmapLinked === true) tasks = tasks.filter((t) => Boolean(t.roadmapItemId));
  if (filters.roadmapLinked === false) tasks = tasks.filter((t) => !t.roadmapItemId);
  if (filters.dueBefore) tasks = tasks.filter((t) => t.dueDate && t.dueDate <= filters.dueBefore!);
  if (filters.dueAfter) tasks = tasks.filter((t) => t.dueDate && t.dueDate >= filters.dueAfter!);

  return tasks;
}

export function getTask(startupId: string, taskId: string): Task | undefined {
  return tasksFor(startupId).find((t) => t.id === taskId);
}

function requireTask(startupId: string, taskId: string): Task {
  const task = getTask(startupId, taskId);
  if (!task) throw new Error(`No task "${taskId}" found for startup "${startupId}"`);
  return task;
}

export function createTask(
  startupId: string,
  input: {
    title: string;
    description?: string;
    category?: string;
    priority?: TaskPriority;
    dueDate?: string;
    estimatedEffort?: Task["estimatedEffort"];
    roadmapItemId?: string;
    goalId?: string;
    sourceType?: Task["sourceType"];
    createdBy?: Task["createdBy"];
    linkedModule?: string;
  },
  nowIso: string,
): Task {
  const task: Task = {
    id: randomUUID(),
    startupId,
    title: input.title,
    description: input.description,
    category: input.category ?? "general",
    status: "todo",
    priority: input.priority ?? "medium",
    dueDate: input.dueDate,
    linkedModule: input.linkedModule ?? "tasks",
    estimatedEffort: input.estimatedEffort,
    roadmapItemId: input.roadmapItemId,
    goalId: input.goalId,
    dependencies: [],
    sourceType: input.sourceType ?? (input.createdBy === "FOUNDER" ? "FOUNDER_CREATED" : "AFF_PROGRAM"),
    createdBy: input.createdBy ?? "FOUNDER",
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  save(startupId, [...tasksFor(startupId), task]);
  return task;
}

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  todo: ["in_progress", "blocked", "done", "cancelled"],
  in_progress: ["todo", "blocked", "done", "cancelled"],
  blocked: ["todo", "in_progress", "done", "cancelled"],
  done: ["todo"], // reopening
  cancelled: ["todo"],
};

function assertValidTransition(from: TaskStatus, to: TaskStatus) {
  if (from === to) return;
  if (!VALID_TRANSITIONS[from].includes(to)) {
    throw new Error(`Cannot transition task from "${from}" to "${to}"`);
  }
}

export function updateTask(startupId: string, taskId: string, patch: Partial<Task>, nowIso: string): Task {
  const existing = requireTask(startupId, taskId);
  if (patch.status && patch.status !== existing.status) {
    assertValidTransition(existing.status, patch.status);
  }
  const updated: Task = { ...existing, ...patch, id: existing.id, startupId, updatedAt: nowIso };
  save(
    startupId,
    tasksFor(startupId).map((t) => (t.id === taskId ? updated : t)),
  );
  return updated;
}

export function deleteTask(startupId: string, taskId: string): void {
  requireTask(startupId, taskId);
  save(
    startupId,
    tasksFor(startupId).filter((t) => t.id !== taskId),
  );
}

export function completeTask(startupId: string, taskId: string, nowIso: string): Task {
  const existing = requireTask(startupId, taskId);
  assertValidTransition(existing.status, "done");
  return updateTask(startupId, taskId, { status: "done", completedAt: nowIso }, nowIso);
}

export function reopenTask(startupId: string, taskId: string, nowIso: string): Task {
  const existing = requireTask(startupId, taskId);
  assertValidTransition(existing.status, "todo");
  return updateTask(startupId, taskId, { status: "todo", completedAt: undefined }, nowIso);
}

export function startTask(startupId: string, taskId: string, nowIso: string): Task {
  const existing = requireTask(startupId, taskId);
  assertValidTransition(existing.status, "in_progress");
  return updateTask(startupId, taskId, { status: "in_progress", startedAt: existing.startedAt ?? nowIso }, nowIso);
}

/** Test-only reset hook so isolated tests don't leak state across files. */
export function __resetTaskStoreForTests() {
  store.clear();
}

// ---------------------------------------------------------------------------
// Seed: give every demo startup its existing lib/demo/tasks.ts "this week"
// tasks as real, mutable AFF-created tasks, so the Tasks/Command Center
// experience isn't empty on first load. These are ordinary tasks from here
// on — completing one goes through the same completeTask() path as any
// founder-created task.
// ---------------------------------------------------------------------------
{
  const seedIso = new Date().toISOString();
  for (const [startupId, tasks] of Object.entries(demoWeekTasksByStartup)) {
    save(
      startupId,
      tasks.map((t) => ({
        ...t,
        startupId,
        dependencies: t.dependencies ?? [],
        sourceType: t.sourceType ?? "AFF_PROGRAM",
        createdBy: t.createdBy ?? "AFF",
        createdAt: t.createdAt ?? seedIso,
        updatedAt: t.updatedAt ?? seedIso,
      })),
    );
  }
}
