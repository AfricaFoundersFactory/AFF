import { describe, expect, it } from "vitest";
import { computePriority, isQuickWin, getQuickWins } from "./prioritization";
import type { RoadmapItem } from "@/types/roadmap";

describe("computePriority", () => {
  it("is deterministic — identical inputs always produce identical output", () => {
    const input = {
      criterionStatus: "weak" as const,
      importance: "critical" as const,
      weight: 0.8,
      confidence: 30,
      effort: "short" as const,
    };
    const a = computePriority(input);
    const b = computePriority({ ...input });
    expect(a).toEqual(b);
  });

  it("ranks a critical-importance weak criterion above a low-importance developing one", () => {
    const high = computePriority({ criterionStatus: "weak", importance: "critical", effort: "medium" });
    const low = computePriority({ criterionStatus: "developing", importance: "low", effort: "medium" });
    const rank = { critical: 4, high: 3, medium: 2, low: 1 };
    expect(rank[high.priority]).toBeGreaterThan(rank[low.priority]);
  });

  it("never exposes a raw numeric score, only tier + reasons", () => {
    const result = computePriority({ criterionStatus: "weak", importance: "high", effort: "short" });
    expect(Object.keys(result).sort()).toEqual(["priority", "priorityReasons"]);
  });

  it("includes a supportsGoal reason when the item supports an active goal", () => {
    const result = computePriority({ supportsActiveGoal: true, goalId: "goal-1", effort: "short" });
    expect(result.priorityReasons.some((r) => r.startsWith("supportsGoal"))).toBe(true);
  });
});

describe("isQuickWin / getQuickWins", () => {
  it("classifies high/medium impact + quick/short effort as a quick win", () => {
    expect(isQuickWin({ impact: "high", effort: "quick" })).toBe(true);
    expect(isQuickWin({ impact: "medium", effort: "short" })).toBe(true);
    expect(isQuickWin({ impact: "low", effort: "quick" })).toBe(false);
    expect(isQuickWin({ impact: "high", effort: "long" })).toBe(false);
  });

  it("getQuickWins excludes done and cancelled items", () => {
    const items: RoadmapItem[] = [
      { id: "1", title: "a", status: "todo", impact: "high", effort: "quick" },
      { id: "2", title: "b", status: "done", impact: "high", effort: "quick" },
      { id: "3", title: "c", status: "cancelled", impact: "high", effort: "quick" },
      { id: "4", title: "d", status: "todo", impact: "low", effort: "long" },
    ];
    const wins = getQuickWins({ items });
    expect(wins.map((i) => i.id)).toEqual(["1"]);
  });
});
