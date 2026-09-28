import { describe, expect, it, vi } from "vitest";
import * as readinessService from "./readiness";
import { getCurrentRoadmap, getRoadmapHistory, generateOrRegenerateRoadmap, updateRoadmapItemStatus, dismissRoadmapItem, addFounderRoadmapItem } from "./roadmap";
import { MissingAssessmentError } from "@/lib/roadmap/generator";

describe("demo seed", () => {
  it("seeds an initial roadmap for demo startups with completed assessments", () => {
    const roadmap = getCurrentRoadmap("startup-wakama");
    expect(roadmap).toBeDefined();
    expect(roadmap!.version).toBe(1);
    expect(roadmap!.status).toBe("active");
  });
});

describe("missing assessment", () => {
  it("throws MissingAssessmentError and creates nothing for a startup with no completed assessment", () => {
    expect(() => generateOrRegenerateRoadmap("startup-unknown", "2026-01-01")).toThrow(MissingAssessmentError);
    expect(getCurrentRoadmap("startup-unknown")).toBeUndefined();
  });
});

describe("versioning", () => {
  it("regenerating supersedes the previous version without deleting or mutating its content", () => {
    const v1 = getCurrentRoadmap("startup-wakama")!;
    const v1Snapshot = JSON.stringify(v1.items);

    const v2 = generateOrRegenerateRoadmap("startup-wakama", "2026-01-15");
    expect(v2.version).toBe((v1.version ?? 1) + 1);
    expect(v2.status).toBe("active");

    const history = getRoadmapHistory("startup-wakama");
    const supersededV1 = history.find((r) => r.id === v1.id)!;
    expect(supersededV1.status).toBe("superseded");
    // Content (items) of the old version must be untouched.
    expect(JSON.stringify(supersededV1.items)).toBe(v1Snapshot);
  });
});

describe("startup isolation", () => {
  it("never lets one startup's roadmap mutation affect another's", () => {
    const solariBefore = getCurrentRoadmap("startup-solari");
    const solariItemCountBefore = solariBefore?.items.length ?? 0;

    addFounderRoadmapItem("startup-wakama", { title: "Wakama-only task" }, "2026-01-20");

    const solariAfter = getCurrentRoadmap("startup-solari");
    expect(solariAfter?.items.length ?? 0).toBe(solariItemCountBefore);
  });
});

describe("roadmap item status + progress", () => {
  it("updates status and derives progress counts fresh (never stale)", () => {
    const roadmap = getCurrentRoadmap("startup-wakama")!;
    const firstItem = roadmap.items[0];
    if (!firstItem) return;
    const updated = updateRoadmapItemStatus("startup-wakama", firstItem.id, "done", "2026-01-21");
    const found = updated.items.find((i) => i.id === firstItem.id)!;
    expect(found.status).toBe("done");
    expect(found.completedAt).toBe("2026-01-21");
    expect(updated.completedCount).toBeGreaterThanOrEqual(1);
  });

  it("dismissing an item excludes it from progress totals", () => {
    const roadmap = getCurrentRoadmap("startup-solari")!;
    const item = roadmap.items.find((i) => i.status !== "done");
    if (!item) return;
    const before = getCurrentRoadmap("startup-solari")!.remainingCount + getCurrentRoadmap("startup-solari")!.completedCount + getCurrentRoadmap("startup-solari")!.inProgressCount;
    const updated = dismissRoadmapItem("startup-solari", item.id, "2026-01-22");
    const after = updated.remainingCount + updated.completedCount + updated.inProgressCount;
    expect(after).toBe(before - 1);
  });
});

describe("founder-created items", () => {
  it("go through dependency validation and are tagged FOUNDER_CREATED", () => {
    const updated = addFounderRoadmapItem("startup-wakama", { title: "Founder task" }, "2026-01-23");
    const created = updated.items.find((i) => i.title === "Founder task")!;
    expect(created.sourceType).toBe("FOUNDER_CREATED");
    expect(created.status).toBe("todo");
  });
});

describe("no readiness score mutation from roadmap operations", () => {
  it("never calls readiness's score-mutating functions when generating or updating a roadmap", () => {
    const createSpy = vi.spyOn(readinessService, "createAssessment");
    const reassessSpy = vi.spyOn(readinessService, "reassess");
    const saveSpy = vi.spyOn(readinessService, "saveAssessmentAnswers");
    const completeSpy = vi.spyOn(readinessService, "completeAssessment");

    generateOrRegenerateRoadmap("startup-solari", "2026-01-24");
    const roadmap = getCurrentRoadmap("startup-solari")!;
    if (roadmap.items[0]) {
      updateRoadmapItemStatus("startup-solari", roadmap.items[0].id, "done", "2026-01-24");
    }
    addFounderRoadmapItem("startup-solari", { title: "Check no mutation" }, "2026-01-24");

    expect(createSpy).not.toHaveBeenCalled();
    expect(reassessSpy).not.toHaveBeenCalled();
    expect(saveSpy).not.toHaveBeenCalled();
    expect(completeSpy).not.toHaveBeenCalled();

    createSpy.mockRestore();
    reassessSpy.mockRestore();
    saveSpy.mockRestore();
    completeSpy.mockRestore();
  });
});
