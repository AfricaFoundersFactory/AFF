/**
 * Roadmap progress engine — the ONLY source of "Roadmap Progress" anywhere
 * in the app. Never conflate this with the Readiness score (0-100 from
 * lib/readiness/scoring.ts) or Profile Completion (%,
 * lib/services/profile-completion.ts): all three are separate metrics and
 * must stay visibly distinct wherever shown together (e.g. Command Center).
 *
 * Formula (exact):
 *   total          = items where status !== "cancelled" ("cancelled" is the
 *                    roadmap-item equivalent of DISMISSED in the spec — see
 *                    types/roadmap.ts's status-vocab reconciliation note)
 *   completedCount = items where status === "done" (spec: COMPLETED)
 *   inProgressCount= items where status === "in_progress"
 *   remainingCount = total - completedCount - inProgressCount
 *   pct            = total === 0 ? 0 : round(completedCount / total * 100)
 */
import type { Roadmap, RoadmapItem, Task } from "@/types/roadmap";

export type RoadmapProgress = {
  pct: number;
  completedCount: number;
  inProgressCount: number;
  remainingCount: number;
  totalCount: number;
};

export function computeRoadmapProgress(roadmap: Pick<Roadmap, "items">): RoadmapProgress {
  const active = roadmap.items.filter((i) => i.status !== "cancelled");
  const completedCount = active.filter((i) => i.status === "done").length;
  const inProgressCount = active.filter((i) => i.status === "in_progress").length;
  const totalCount = active.length;
  const remainingCount = Math.max(0, totalCount - completedCount - inProgressCount);
  const pct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  return { pct, completedCount, inProgressCount, remainingCount, totalCount };
}

/** Analogous exclusion rule for tasks: CANCELLED tasks never count toward totals. */
export function computeTaskCounts(tasks: Task[]) {
  const active = tasks.filter((t) => t.status !== "cancelled");
  return {
    total: active.length,
    done: active.filter((t) => t.status === "done").length,
    inProgress: active.filter((t) => t.status === "in_progress").length,
    todo: active.filter((t) => t.status === "todo").length,
    blocked: active.filter((t) => t.status === "blocked").length,
  };
}

/**
 * Action-item completion rule: "suggest, don't auto-complete". An item
 * becomes eligible for a founder-facing "Mark complete" affordance once
 * every one of its linked tasks is DONE — but its own status never flips
 * automatically. This is deliberate: only the founder marking it complete
 * is allowed to change roadmap-item state, preserving founder agency and
 * keeping "roadmap progress" a transparent, founder-controlled number
 * rather than something the system silently advances on their behalf.
 */
export function isReadyToComplete(item: RoadmapItem, tasks: Task[]): boolean {
  if (item.status === "done" || item.status === "cancelled") return false;
  const linked = tasks.filter((t) => item.taskIds?.includes(t.id));
  if (linked.length === 0) return false;
  return linked.every((t) => t.status === "done" || t.status === "cancelled");
}
