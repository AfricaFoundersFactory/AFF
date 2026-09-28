import { describe, expect, it } from "vitest";
import { computeRoadmapProgress, isReadyToComplete } from "./progress";
import type { RoadmapItem, Task } from "@/types/roadmap";

function items(statuses: RoadmapItem["status"][]): RoadmapItem[] {
  return statuses.map((status, i) => ({ id: `i${i}`, title: `item ${i}`, status }));
}

describe("computeRoadmapProgress", () => {
  it("computes pct = completed / total, excluding cancelled items from the total", () => {
    // 2 done, 1 in_progress, 1 todo, 1 cancelled (excluded) => total = 4, completed = 2 => 50%
    const roadmap = { items: items(["done", "done", "in_progress", "todo", "cancelled"]) };
    const result = computeRoadmapProgress(roadmap);
    expect(result.totalCount).toBe(4);
    expect(result.completedCount).toBe(2);
    expect(result.inProgressCount).toBe(1);
    expect(result.remainingCount).toBe(1);
    expect(result.pct).toBe(50);
  });

  it("returns 0% for an empty or fully-dismissed roadmap", () => {
    expect(computeRoadmapProgress({ items: [] }).pct).toBe(0);
    expect(computeRoadmapProgress({ items: items(["cancelled", "cancelled"]) }).pct).toBe(0);
  });
});

describe("isReadyToComplete", () => {
  it("suggests completion once all linked tasks are done, without auto-completing", () => {
    const tasks: Task[] = [
      { id: "t1", title: "a", category: "x", status: "done", priority: "low", linkedModule: "roadmap" },
      { id: "t2", title: "b", category: "x", status: "done", priority: "low", linkedModule: "roadmap" },
    ];
    const item: RoadmapItem = { id: "i1", title: "i", status: "in_progress", taskIds: ["t1", "t2"] };
    expect(isReadyToComplete(item, tasks)).toBe(true);
    // The item's own status is untouched — the caller/founder must still act.
    expect(item.status).toBe("in_progress");
  });

  it("is not ready when a linked task is still open", () => {
    const tasks: Task[] = [
      { id: "t1", title: "a", category: "x", status: "done", priority: "low", linkedModule: "roadmap" },
      { id: "t2", title: "b", category: "x", status: "todo", priority: "low", linkedModule: "roadmap" },
    ];
    const item: RoadmapItem = { id: "i1", title: "i", status: "in_progress", taskIds: ["t1", "t2"] };
    expect(isReadyToComplete(item, tasks)).toBe(false);
  });

  it("is never ready when the item has no linked tasks at all", () => {
    const item: RoadmapItem = { id: "i1", title: "i", status: "todo", taskIds: [] };
    expect(isReadyToComplete(item, [])).toBe(false);
  });
});
