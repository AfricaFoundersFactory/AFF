import { describe, expect, it } from "vitest";
import { recommendResources } from "./recommendation";
import type { Resource } from "@/types/resources";

function res(overrides: Partial<Resource>): Resource {
  return {
    id: "res-a",
    title: { en: "T", fr: "T" },
    description: { en: "d", fr: "d" },
    category: "FUNDRAISING",
    format: "CHECKLIST",
    stages: ["mvp"],
    origin: "AFF_RESOURCE",
    languages: ["en", "fr"],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("recommendResources", () => {
  it("recommends a fundraising resource with a readiness-gap reason when fundraising is weak", () => {
    const results = recommendResources([res({})], { stage: "mvp", weakDimensions: ["fundraising"] });
    expect(results).toHaveLength(1);
    expect(results[0].reasons[0].kind).toBe("READINESS_GAP");
    expect(results[0].reasons[0].labelKey).not.toMatch(/%|score/i);
  });

  it("does not recommend a resource whose category has no matching signal", () => {
    const results = recommendResources([res({ category: "LEGAL" })], { stage: "mvp", weakDimensions: ["fundraising"] });
    expect(results).toHaveLength(0);
  });

  it("recommends from a pitch gap category", () => {
    const results = recommendResources([res({ category: "PITCH" })], {
      stage: "mvp",
      weakDimensions: [],
      pitchGapCategories: ["PITCH"],
    });
    expect(results[0].reasons.some((r) => r.kind === "PITCH_GAP")).toBe(true);
  });

  it("recommends from a financial signal", () => {
    const results = recommendResources([res({ category: "FINANCE" })], {
      stage: "mvp",
      weakDimensions: [],
      financialSignalKeys: ["runway_below_3_months"],
    });
    expect(results[0].reasons.some((r) => r.kind === "FINANCIAL_SIGNAL")).toBe(true);
  });

  it("is deterministic across repeated calls", () => {
    const resources = [res({ id: "b", category: "FUNDRAISING" }), res({ id: "a", category: "FUNDRAISING" })];
    const run1 = recommendResources(resources, { stage: "mvp", weakDimensions: ["fundraising"] });
    const run2 = recommendResources(resources, { stage: "mvp", weakDimensions: ["fundraising"] });
    expect(run1.map((r) => r.resource.id)).toEqual(run2.map((r) => r.resource.id));
  });
});
