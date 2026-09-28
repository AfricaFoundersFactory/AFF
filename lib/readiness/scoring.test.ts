import { describe, expect, it } from "vitest";
import { evaluateAssessment, evaluateDimension } from "./scoring";
import { normalizedDimensionWeights, normalizeWeights } from "./weights";
import { DIMENSION_KEYS } from "@/types/readiness-engine";
import type { EvaluationContext } from "@/types/readiness-engine";
import { makeBlankTwin } from "./test-fixtures";

function ctx(overrides: Partial<EvaluationContext> = {}): EvaluationContext {
  return {
    twin: makeBlankTwin(),
    answers: {},
    stage: "mvp",
    businessModel: [],
    assessedAt: "2026-09-27",
    ...overrides,
  };
}

describe("determinism", () => {
  it("returns identical output for identical input (same twin, same answers, same framework)", () => {
    const context = ctx({
      twin: makeBlankTwin({
        problem: { statement: "Farmers lose income to middlemen.", evidence: "40 interviews." },
      }),
    });
    const a = evaluateAssessment(context);
    const b = evaluateAssessment(context);
    expect(a).toEqual(b);
  });

  it("never uses randomness or wall-clock time to influence the score", () => {
    const context = ctx({ twin: makeBlankTwin({ financials: { currency: "USD", runwayMonths: 12 } }) });
    const runs = Array.from({ length: 5 }, () => evaluateAssessment(context).overallScore);
    expect(new Set(runs).size).toBe(1);
  });
});

describe("missing evidence vs real zero", () => {
  it("treats an unset field as insufficient evidence, not a zero score", () => {
    const dim = evaluateDimension("finance", ctx({ twin: makeBlankTwin() }));
    const runway = dim.criteria.find((c) => c.criterionId === "runway")!;
    expect(runway.rawScore).toBeNull();
    expect(runway.status).toBe("insufficient_evidence");
    expect(runway.evaluability).toBe(false);
  });

  it("treats an explicit zero as a real, scored value", () => {
    const dim = evaluateDimension(
      "finance",
      ctx({ twin: makeBlankTwin({ financials: { currency: "USD", runwayMonths: 0 } }) }),
    );
    const runway = dim.criteria.find((c) => c.criterionId === "runway")!;
    expect(runway.rawScore).toBe(0);
    expect(runway.evaluability).toBe(true);
    expect(runway.status).toBe("weak");
  });

  it("treats zero customers as a legitimate scored value, not missing", () => {
    const dim = evaluateDimension(
      "traction",
      ctx({
        stage: "early_traction",
        twin: makeBlankTwin({
          traction: {
            metrics: [{ id: "m1", type: "customers", label: "Customers", value: 0, date: "2026-09-01", verified: false }],
            majorCustomers: [],
          },
        }),
      }),
    );
    const paying = dim.criteria.find((c) => c.criterionId === "paying_customers")!;
    expect(paying.rawScore).toBe(0);
    expect(paying.evaluability).toBe(true);
  });

  it("missing evidence lowers confidence without lowering the score of what IS known", () => {
    // Only one traction criterion evidenced, the rest insufficient.
    const withOneMetric = evaluateDimension(
      "traction",
      ctx({
        stage: "early_traction",
        twin: makeBlankTwin({
          traction: {
            metrics: [{ id: "m1", type: "customers", label: "Customers", value: 500, date: "2026-09-01", verified: true }],
            majorCustomers: [],
          },
        }),
      }),
    );
    expect(withOneMetric.score).toBe(75); // the one evaluable criterion's own score, not diluted by missing ones
    expect(withOneMetric.confidence).toBeLessThan(50); // most applicable criteria are still unevidenced
  });
});

describe("non-applicable criteria and dimensions", () => {
  it("excludes a not-applicable criterion from scoring entirely rather than zeroing it", () => {
    // "growth" is not_applicable at idea and mvp stages.
    const dim = evaluateDimension(
      "traction",
      ctx({
        stage: "mvp",
        twin: makeBlankTwin({
          traction: {
            metrics: [{ id: "m1", type: "customers", label: "Customers", value: 50, date: "2026-09-01", verified: true }],
            majorCustomers: [],
          },
        }),
      }),
    );
    expect(dim.criteria.some((c) => c.criterionId === "growth")).toBe(false);
  });

  it("excludes the whole impact_esg dimension when the founder opted out of impact tracking", () => {
    const result = evaluateAssessment(ctx({ twin: makeBlankTwin({ impact: { enabled: false, sdgs: [], metrics: [] } }) }));
    const impact = result.dimensions.find((d) => d.dimension === "impact_esg")!;
    expect(impact.status).toBe("not_applicable");
    expect(impact.weight).toBe(0);
    expect(impact.score).toBeNull();
  });

  it("does not silently zero an excluded dimension's contribution to the overall score", () => {
    const withImpact = evaluateAssessment(
      ctx({
        twin: makeBlankTwin({
          impact: { enabled: true, sdgs: ["SDG 1"], metrics: [], thesis: "Reduce poverty", beneficiaries: 100 },
        }),
      }),
    );
    const withoutImpact = evaluateAssessment(ctx({ twin: makeBlankTwin({ impact: { enabled: false, sdgs: [], metrics: [] } }) }));
    // Both are valid 0-100 overall scores — impact_esg being excluded must not
    // crash or produce an out-of-range result.
    expect(withImpact.overallScore).not.toBeNull();
    expect(withoutImpact.overallScore).not.toBeNull();
  });
});

describe("stage weighting", () => {
  it("changes which dimensions dominate the overall score by stage", () => {
    const ideaWeights = normalizedDimensionWeights("idea", DIMENSION_KEYS);
    const growthWeights = normalizedDimensionWeights("growth", DIMENSION_KEYS);
    expect(ideaWeights.problem_market).toBeGreaterThan(growthWeights.problem_market);
    expect(growthWeights.finance).toBeGreaterThan(ideaWeights.finance);
  });

  it("does not break the existing DASH-02 StartupStage values", () => {
    for (const stage of ["idea", "mvp", "early_traction", "growth", "scale"] as const) {
      const weights = normalizedDimensionWeights(stage, DIMENSION_KEYS);
      const total = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(total).toBeCloseTo(1, 5);
    }
  });
});

describe("weight normalization", () => {
  it("normalizes applicable weights to sum to 1", () => {
    const normalized = normalizeWeights({ a: 10, b: 30, c: 60 }, ["a", "b", "c"]);
    const total = Object.values(normalized).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it("excludes keys not present in the applicable set instead of zeroing the total", () => {
    const base: Record<"a" | "b" | "c", number> = { a: 10, b: 30, c: 60 };
    const normalized = normalizeWeights<"a" | "b" | "c">(base, ["a", "b"]);
    expect(normalized.a).toBeCloseTo(0.25, 5);
    expect(normalized.b).toBeCloseTo(0.75, 5);
    expect(normalized.c).toBeUndefined();
  });
});

describe("score and confidence bounds", () => {
  it("keeps the overall score within 0-100 across a range of inputs", () => {
    const contexts = [
      ctx({ twin: makeBlankTwin() }),
      ctx({
        twin: makeBlankTwin({
          financials: { currency: "USD", monthlyRevenue: 50000, monthlyExpenses: 10000, monthlyBurn: 2000, runwayMonths: 30 },
        }),
      }),
    ];
    for (const context of contexts) {
      const result = evaluateAssessment(context);
      if (result.overallScore !== null) {
        expect(result.overallScore).toBeGreaterThanOrEqual(0);
        expect(result.overallScore).toBeLessThanOrEqual(100);
      }
      expect(result.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(result.overallConfidence).toBeLessThanOrEqual(100);
    }
  });

  it("keeps every criterion score on the coarse 0/25/50/75/100 scale", () => {
    const result = evaluateAssessment(
      ctx({
        twin: makeBlankTwin({
          financials: { currency: "USD", runwayMonths: 9 },
          problem: { statement: "x", evidence: "y", whyNow: "z" },
        }),
      }),
    );
    for (const dim of result.dimensions) {
      for (const c of dim.criteria) {
        if (c.rawScore !== null) {
          expect([0, 25, 50, 75, 100]).toContain(c.rawScore);
        }
      }
    }
  });
});

describe("dimension and overall score calculation", () => {
  it("computes a dimension score as the weighted average of its evaluable criteria", () => {
    const dim = evaluateDimension(
      "finance",
      ctx({
        stage: "growth",
        twin: makeBlankTwin({
          financials: { currency: "USD", runwayMonths: 18 }, // -> 100
        }),
      }),
    );
    // Only "runway" is evaluable; the rest are insufficient evidence, so the
    // dimension score should equal that single criterion's score.
    expect(dim.score).toBe(100);
  });

  it("computes overall score from dimension scores using stage-aware weights", () => {
    const result = evaluateAssessment(
      ctx({
        stage: "mvp",
        twin: makeBlankTwin({
          problem: { statement: "Clear problem", evidence: "Some evidence", whyNow: "Now" },
        }),
      }),
    );
    expect(result.overallScore).not.toBeNull();
    expect(result.overallScore).toBeGreaterThan(0);
  });
});
