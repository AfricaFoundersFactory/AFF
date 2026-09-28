import { describe, expect, it } from "vitest";
import { generateRoadmap, MissingAssessmentError } from "./generator";
import { makeBlankTwin } from "@/lib/readiness/test-fixtures";
import type { CriterionResult, DimensionResult, ReadinessAssessment } from "@/types/readiness-engine";
import type { StartupDigitalTwin } from "@/types/digital-twin";

function criterion(id: string, dimension: DimensionResult["dimension"], status: CriterionResult["status"]): CriterionResult {
  return {
    criterionId: id,
    dimension,
    status,
    rawScore: status === "weak" ? 25 : status === "insufficient_evidence" ? null : 75,
    normalizedScore: status === "weak" ? 25 : null,
    weight: 0.5,
    confidence: status === "insufficient_evidence" ? 20 : 60,
    evaluability: status !== "insufficient_evidence",
    evidence: [],
    missingEvidence: [],
    explanationKey: "x",
    improvementHintKey: "x",
  };
}

function dimensionResult(dimension: DimensionResult["dimension"], criteria: CriterionResult[]): DimensionResult {
  return {
    dimension,
    score: 50,
    previousScore: null,
    confidence: 50,
    status: "developing",
    weight: 1,
    criteria,
    strengths: [],
    gaps: criteria.filter((c) => c.status === "weak" || c.status === "insufficient_evidence").map((c) => c.criterionId),
    potentialImprovement: 10,
  };
}

function assessment(dimensions: DimensionResult[], version = 1): ReadinessAssessment {
  return {
    id: `startup-test-v${version}`,
    startupId: "startup-test",
    version,
    frameworkVersion: "AFF_READINESS_V1",
    status: "completed",
    startupStageAtAssessment: "mvp",
    businessModelAtAssessment: [],
    startedAt: "2026-01-01T00:00:00.000Z",
    completedAt: "2026-01-02T00:00:00.000Z",
    overallScore: 50,
    overallConfidence: 50,
    dimensions,
    answers: [],
    evidenceSnapshot: [],
  };
}

function twinWithGoals(overrides: Partial<StartupDigitalTwin> = {}): StartupDigitalTwin {
  return makeBlankTwin({ identity: { ...makeBlankTwin().identity, stage: "mvp" }, ...overrides });
}

describe("generateRoadmap", () => {
  it("throws MissingAssessmentError and never fabricates a roadmap when there is no completed assessment", () => {
    const twin = twinWithGoals();
    expect(() => generateRoadmap("startup-test", { latestAssessment: undefined, digitalTwin: twin }, "2026-01-01")).toThrow(
      MissingAssessmentError,
    );
  });

  it("maps a weak traction/retention gap and an insufficient-evidence finance/forecasting gap to their catalog actions", () => {
    const dims = [
      dimensionResult("traction", [criterion("retention", "traction", "weak")]),
      dimensionResult("finance", [criterion("forecasting", "finance", "insufficient_evidence")]),
    ];
    const roadmap = generateRoadmap(
      "startup-test",
      { latestAssessment: assessment(dims), digitalTwin: twinWithGoals() },
      "2026-01-03",
    );
    const criteria = roadmap.items.map((i) => i.readinessCriterion);
    expect(criteria).toContain("retention");
    expect(criteria).toContain("forecasting");
    const retentionItem = roadmap.items.find((i) => i.readinessCriterion === "retention")!;
    expect(retentionItem.titleKey).toBe("dashboard.roadmap.catalog.measure_retention.title");
    expect(retentionItem.sourceType).toBe("READINESS_GAP");
  });

  it("skips a gap criterion that has no deterministic catalog entry, rather than guessing", () => {
    const dims = [dimensionResult("problem_market", [criterion("market_sizing", "problem_market", "weak")])];
    const roadmap = generateRoadmap(
      "startup-test",
      { latestAssessment: assessment(dims), digitalTwin: twinWithGoals() },
      "2026-01-03",
    );
    expect(roadmap.items.some((i) => i.readinessCriterion === "market_sizing")).toBe(false);
  });

  it("includes a mapped goal-relevant action for a fundraising goal, but never invents one for an unmapped 'other' goal", () => {
    const twin = twinWithGoals({
      goals: [
        {
          id: "goal-fund",
          title: "Raise a seed round",
          category: "fundraising",
          status: "in_progress",
          progressPct: 10,
        },
        {
          id: "goal-other",
          title: "Something unrelated",
          category: "other",
          status: "in_progress",
          progressPct: 0,
        },
      ],
    });
    const roadmap = generateRoadmap("startup-test", { latestAssessment: assessment([]), digitalTwin: twin }, "2026-01-03");
    const goalItems = roadmap.items.filter((i) => i.sourceType === "FOUNDER_GOAL");
    expect(goalItems.some((i) => i.goalId === "goal-fund")).toBe(true);
    expect(goalItems.some((i) => i.goalId === "goal-other")).toBe(false);
  });

  it("is deterministic: identical inputs produce the same set of criteria, priorities and statuses (ignoring generated ids)", () => {
    const dims = [dimensionResult("traction", [criterion("retention", "traction", "weak")])];
    const input = { latestAssessment: assessment(dims), digitalTwin: twinWithGoals() };
    const a = generateRoadmap("startup-test", input, "2026-01-03");
    const b = generateRoadmap("startup-test", input, "2026-01-03");
    const strip = (r: typeof a) =>
      r.items.map((i) => ({ criterion: i.readinessCriterion, priority: i.priority, status: i.status, titleKey: i.titleKey }));
    expect(strip(a)).toEqual(strip(b));
  });

  it("carries forward an existing active item for the same gap instead of duplicating it on regeneration", () => {
    const dims = [dimensionResult("traction", [criterion("retention", "traction", "weak")])];
    const v1 = generateRoadmap("startup-test", { latestAssessment: assessment(dims, 1), digitalTwin: twinWithGoals() }, "2026-01-03");
    const v2 = generateRoadmap(
      "startup-test",
      { latestAssessment: assessment(dims, 1), digitalTwin: twinWithGoals(), previousRoadmap: v1 },
      "2026-01-10",
    );
    const retentionItems = v2.items.filter((i) => i.readinessCriterion === "retention");
    expect(retentionItems).toHaveLength(1);
    expect(retentionItems[0].id).toBe(v1.items.find((i) => i.readinessCriterion === "retention")!.id);
    expect(v2.version).toBe(2);
  });

  it("preserves founder-created items and already-completed items across regeneration", () => {
    const dims = [dimensionResult("traction", [criterion("retention", "traction", "weak")])];
    const v1 = generateRoadmap("startup-test", { latestAssessment: assessment(dims, 1), digitalTwin: twinWithGoals() }, "2026-01-03");
    const founderItem = {
      id: "founder-1",
      title: "My own thing",
      status: "todo" as const,
      sourceType: "FOUNDER_CREATED" as const,
    };
    const completedItem = { ...v1.items[0], status: "done" as const };
    const withExtras = { ...v1, items: [...v1.items.filter((i) => i.id !== v1.items[0].id), completedItem, founderItem] };

    const v2 = generateRoadmap(
      "startup-test",
      { latestAssessment: assessment(dims, 1), digitalTwin: twinWithGoals(), previousRoadmap: withExtras },
      "2026-01-10",
    );
    expect(v2.items.some((i) => i.id === "founder-1")).toBe(true);
    expect(v2.items.some((i) => i.id === completedItem.id && i.status === "done")).toBe(true);
  });
});
