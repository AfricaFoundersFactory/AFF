import { describe, expect, it } from "vitest";
import {
  buildFounderDeclaredNeed,
  deriveDataRoomGapNeeds,
  deriveFinancialSignalNeeds,
  derivePitchGapNeeds,
  deriveReadinessGapNeeds,
  deriveRoadmapItemNeeds,
} from "./needs";
import type { DimensionResult, ReadinessAssessment } from "@/types/readiness-engine";
import type { FinancialSignal } from "@/types/financials";
import type { PitchReadinessResult, PitchSection, PitchVersion } from "@/types/pitch";
import type { DataRoomChecklist } from "@/types/data-room";
import type { Roadmap } from "@/types/roadmap";

function dimension(overrides: Partial<DimensionResult>): DimensionResult {
  return {
    dimension: "fundraising",
    score: 40,
    previousScore: null,
    confidence: 50,
    status: "weak",
    weight: 1,
    criteria: [],
    strengths: [],
    gaps: [],
    potentialImprovement: 0,
    ...overrides,
  };
}

function assessment(dimensions: DimensionResult[]): ReadinessAssessment {
  return {
    id: "a1",
    startupId: "startup-x",
    version: 1,
    frameworkVersion: "AFF_READINESS_V1",
    status: "completed",
    startupStageAtAssessment: "mvp",
    businessModelAtAssessment: [],
    startedAt: "2026-01-01T00:00:00.000Z",
    completedAt: "2026-01-02T00:00:00.000Z",
    overallScore: 40,
    overallConfidence: 50,
    dimensions,
    answers: [],
    evidenceSnapshot: [],
  };
}

describe("deriveReadinessGapNeeds", () => {
  it("derives a need for a weak dimension, mapped to its expertise category", () => {
    const needs = deriveReadinessGapNeeds("startup-x", assessment([dimension({ dimension: "fundraising", score: 40 })]));
    expect(needs).toHaveLength(1);
    expect(needs[0].sourceType).toBe("READINESS_GAP");
    expect(needs[0].sourceId).toBe("fundraising");
    expect(needs[0].category).toBe("FUNDRAISING");
    expect(needs[0].urgency).toBe("HIGH");
  });

  it("ignores strong dimensions and null scores", () => {
    const needs = deriveReadinessGapNeeds(
      "startup-x",
      assessment([dimension({ dimension: "product", score: 90 }), dimension({ dimension: "team", score: null })]),
    );
    expect(needs).toHaveLength(0);
  });

  it("returns nothing when there is no assessment", () => {
    expect(deriveReadinessGapNeeds("startup-x", undefined)).toEqual([]);
  });
});

describe("deriveFinancialSignalNeeds", () => {
  it("maps a runway signal to a FUNDRAISING need with severity-derived urgency", () => {
    const signals: FinancialSignal[] = [{ key: "runway_below_3_months", severity: "critical", data: { months: 2 } }];
    const needs = deriveFinancialSignalNeeds("startup-x", signals, "2026-01-01T00:00:00.000Z");
    expect(needs).toHaveLength(1);
    expect(needs[0].category).toBe("FUNDRAISING");
    expect(needs[0].urgency).toBe("CRITICAL");
    expect(needs[0].sourceType).toBe("FINANCIAL_SIGNAL");
  });

  it("never derives a need from a positive signal", () => {
    const signals: FinancialSignal[] = [{ key: "positive_operating_trend", severity: "info", data: {} }];
    expect(deriveFinancialSignalNeeds("startup-x", signals, "2026-01-01T00:00:00.000Z")).toEqual([]);
  });
});

function pitchSection(type: PitchSection["type"]): PitchSection {
  return { id: type, type, content: "", keyPoints: [], sourceReferences: [], status: "draft", order: 1, required: true };
}

function pitchVersion(): PitchVersion {
  return {
    id: "v1",
    workspaceId: "w1",
    startupId: "startup-x",
    version: 1,
    title: "V1",
    status: "draft",
    sections: [pitchSection("fundraising_ask")],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("derivePitchGapNeeds", () => {
  it("maps a weak ask_clarity dimension to a FUNDRAISING need", () => {
    const readiness: PitchReadinessResult = {
      score: 40,
      confidence: 50,
      dimensions: [{ key: "ask_clarity", score: 20 }],
      computedAt: "2026-01-01T00:00:00.000Z",
    };
    const needs = derivePitchGapNeeds("startup-x", pitchVersion(), readiness);
    expect(needs).toHaveLength(1);
    expect(needs[0].sourceType).toBe("PITCH_GAP");
    expect(needs[0].category).toBe("FUNDRAISING");
    expect(needs[0].urgency).toBe("CRITICAL");
  });

  it("returns nothing when there is no active pitch version", () => {
    expect(derivePitchGapNeeds("startup-x", undefined, undefined)).toEqual([]);
  });
});

describe("deriveDataRoomGapNeeds", () => {
  it("maps a missing legal/corporate document to a governance need", () => {
    const checklist: DataRoomChecklist = {
      startupId: "startup-x",
      stage: "mvp",
      items: [
        {
          requirement: { key: "certificate_of_incorporation", category: "corporate", titleKey: "certificateOfIncorporation", stages: ["mvp"] },
          status: "missing",
        },
      ],
    };
    const needs = deriveDataRoomGapNeeds("startup-x", checklist, "2026-01-01T00:00:00.000Z");
    expect(needs).toHaveLength(1);
    expect(needs[0].sourceType).toBe("DATA_ROOM_GAP");
    expect(needs[0].category).toBe("GOVERNANCE");
  });

  it("ignores documents that are already available", () => {
    const checklist: DataRoomChecklist = {
      startupId: "startup-x",
      stage: "mvp",
      items: [
        {
          requirement: { key: "forecast", category: "finance", titleKey: "forecast", stages: ["mvp"] },
          status: "available",
        },
      ],
    };
    expect(deriveDataRoomGapNeeds("startup-x", checklist, "2026-01-01T00:00:00.000Z")).toEqual([]);
  });
});

describe("deriveRoadmapItemNeeds", () => {
  it("maps a high-priority open go-to-market-shaped roadmap item to GO_TO_MARKET", () => {
    const roadmap: Roadmap = {
      id: "r1",
      startupId: "startup-x",
      progressPct: 0,
      completedCount: 0,
      inProgressCount: 0,
      remainingCount: 1,
      items: [
        {
          id: "item-1",
          title: "Expand distribution",
          status: "todo",
          category: "traction",
          priority: "high",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      milestones: [],
    };
    const needs = deriveRoadmapItemNeeds("startup-x", roadmap);
    expect(needs).toHaveLength(1);
    expect(needs[0].sourceType).toBe("ROADMAP_ITEM");
    expect(needs[0].category).toBe("GO_TO_MARKET");
    expect(needs[0].urgency).toBe("HIGH");
  });

  it("ignores done/cancelled and low/medium priority items", () => {
    const roadmap: Roadmap = {
      id: "r1",
      startupId: "startup-x",
      progressPct: 0,
      completedCount: 1,
      inProgressCount: 0,
      remainingCount: 0,
      items: [
        { id: "item-1", title: "Done item", status: "done", priority: "critical" },
        { id: "item-2", title: "Low priority", status: "todo", priority: "low" },
      ],
      milestones: [],
    };
    expect(deriveRoadmapItemNeeds("startup-x", roadmap)).toEqual([]);
  });
});

describe("buildFounderDeclaredNeed", () => {
  it("always succeeds even with only a category and title (no live data required)", () => {
    const need = buildFounderDeclaredNeed("startup-x", { category: "PRODUCT", title: "Need product help" }, "2026-01-01T00:00:00.000Z");
    expect(need.sourceType).toBe("FOUNDER_DECLARED");
    expect(need.status).toBe("OPEN");
    expect(need.category).toBe("PRODUCT");
  });
});
