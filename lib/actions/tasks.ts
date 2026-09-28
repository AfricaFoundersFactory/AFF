"use server";

/**
 * Server Action boundary for Tasks — the only way client components create,
 * edit, complete or delete tasks. Delegates to lib/services/tasks.ts and
 * revalidates the dashboard routes on success.
 */
import { revalidatePath } from "next/cache";
import * as taskService from "@/lib/services/tasks";
import { isNonEmpty, isValidDate } from "@/lib/validation";
import type { Task, TaskPriority } from "@/types/roadmap";

export type TaskActionResult = { ok: true; task: Task } | { ok: false; error: string };
export type VoidTaskActionResult = { ok: true } | { ok: false; error: string };

function nowIso(): string {
  return new Date().toISOString();
}

function revalidateDashboard() {
  revalidatePath("/[locale]/dashboard", "layout");
}

function guard(fn: () => Task): TaskActionResult {
  try {
    const task = fn();
    revalidateDashboard();
    return { ok: true, task };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

function guardVoid(fn: () => void): VoidTaskActionResult {
  try {
    fn();
    revalidateDashboard();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function createFounderTaskAction(
  startupId: string,
  input: { title: string; description?: string; dueDate?: string; priority?: TaskPriority; category?: string },
): Promise<TaskActionResult> {
  if (!isNonEmpty(input.title)) return { ok: false, error: "validation" };
  if (input.dueDate && !isValidDate(input.dueDate)) return { ok: false, error: "validation" };
  return guard(() => taskService.createTask(startupId, { ...input, createdBy: "FOUNDER" }, nowIso()));
}

export async function updateTaskAction(startupId: string, taskId: string, patch: Partial<Task>): Promise<TaskActionResult> {
  if (!isNonEmpty(taskId)) return { ok: false, error: "validation" };
  return guard(() => taskService.updateTask(startupId, taskId, patch, nowIso()));
}

export async function completeTaskAction(startupId: string, taskId: string): Promise<TaskActionResult> {
  return guard(() => taskService.completeTask(startupId, taskId, nowIso()));
}

export async function reopenTaskAction(startupId: string, taskId: string): Promise<TaskActionResult> {
  return guard(() => taskService.reopenTask(startupId, taskId, nowIso()));
}

export async function startTaskAction(startupId: string, taskId: string): Promise<TaskActionResult> {
  return guard(() => taskService.startTask(startupId, taskId, nowIso()));
}

export async function deleteTaskAction(startupId: string, taskId: string): Promise<VoidTaskActionResult> {
  return guardVoid(() => taskService.deleteTask(startupId, taskId));
}
