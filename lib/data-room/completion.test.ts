import { describe, expect, it } from "vitest";
import { computeDataRoomCompletion } from "./completion";
import type { DataRoomChecklist, DocumentRequirement } from "@/types/data-room";

function req(key: string): DocumentRequirement {
  return { key, category: "other", titleKey: key, stages: ["idea", "mvp", "early_traction", "growth", "scale"] };
}

describe("computeDataRoomCompletion", () => {
  it("matches the spec's worked example: 18 required, 12 available, 2 outdated, 4 missing -> 12/18", () => {
    const items: DataRoomChecklist["items"] = [
      ...Array.from({ length: 12 }, (_, i) => ({ requirement: req(`available-${i}`), status: "available" as const })),
      ...Array.from({ length: 2 }, (_, i) => ({ requirement: req(`outdated-${i}`), status: "outdated" as const })),
      ...Array.from({ length: 4 }, (_, i) => ({ requirement: req(`missing-${i}`), status: "missing" as const })),
    ];
    const checklist: DataRoomChecklist = { startupId: "s1", stage: "growth", items };
    const completion = computeDataRoomCompletion(checklist);
    expect(completion.requiredTotal).toBe(18);
    expect(completion.availableCount).toBe(12);
    expect(completion.outdatedCount).toBe(2);
    expect(completion.missingCount).toBe(4);
    expect(completion.completionPct).toBeCloseTo(12 / 18);
  });

  it("counts verified documents as available", () => {
    const checklist: DataRoomChecklist = {
      startupId: "s1",
      stage: "idea",
      items: [{ requirement: req("a"), status: "verified" }],
    };
    expect(computeDataRoomCompletion(checklist).availableCount).toBe(1);
  });

  it("returns 0% (not NaN) when there are no required documents", () => {
    const checklist: DataRoomChecklist = { startupId: "s1", stage: "idea", items: [] };
    expect(computeDataRoomCompletion(checklist).completionPct).toBe(0);
  });

  it("buckets draft and needs_review documents distinctly from available", () => {
    const checklist: DataRoomChecklist = {
      startupId: "s1",
      stage: "idea",
      items: [
        { requirement: req("a"), status: "draft" },
        { requirement: req("b"), status: "needs_review" },
      ],
    };
    const completion = computeDataRoomCompletion(checklist);
    expect(completion.availableCount).toBe(0);
    expect(completion.missingCount).toBe(1); // draft
    expect(completion.needsReviewCount).toBe(1);
  });
});
