import { describe, expect, it } from "vitest";
import { explainOpportunityMatch, matchOpportunities, type OpportunityMatchContext } from "./matching";
import type { Opportunity } from "@/types/opportunity";

function opp(overrides: Partial<Opportunity>): Opportunity {
  return {
    id: "o1",
    title: "Demo Program",
    organization: "Demo Org",
    description: { en: "en", fr: "fr" },
    type: "ACCELERATOR",
    countries: [],
    regions: [],
    industries: [],
    startupStages: [],
    languages: ["en", "fr"],
    requirements: [],
    status: "OPEN",
    source: "DEMO",
    isDemo: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const ctx: OpportunityMatchContext = {
  country: "Côte d'Ivoire",
  operatingCountries: ["Senegal"],
  industry: "AgriTech",
  stage: "early_traction",
  businessModelTypes: ["marketplace"],
};

describe("explainOpportunityMatch", () => {
  it("never returns a score or percentage field — only reasons", () => {
    const reasons = explainOpportunityMatch(opp({}), ctx);
    for (const r of reasons) {
      expect(r).not.toHaveProperty("score");
      expect(r).not.toHaveProperty("matchPct");
      expect(r).not.toHaveProperty("percentage");
    }
  });

  it("matches on country when opportunity lists it", () => {
    const reasons = explainOpportunityMatch(opp({ countries: ["Côte d'Ivoire"] }), ctx);
    expect(reasons.find((r) => r.key === "geography_match")).toBeDefined();
  });

  it("honestly reports a geography mismatch", () => {
    const reasons = explainOpportunityMatch(opp({ countries: ["Kenya"] }), ctx);
    expect(reasons.find((r) => r.key === "geography_mismatch")).toBeDefined();
  });

  it("reports a stage mismatch for growth-only opportunities", () => {
    const reasons = explainOpportunityMatch(opp({ startupStages: ["growth"] }), ctx);
    expect(reasons.find((r) => r.key === "stage_mismatch")).toBeDefined();
  });

  it("matches industry case-insensitively", () => {
    const reasons = explainOpportunityMatch(opp({ industries: ["agritech"] }), ctx);
    expect(reasons.find((r) => r.key === "industry_match")).toBeDefined();
  });
});

describe("matchOpportunities", () => {
  it("is deterministic and sorted by match-reason count, not a score", () => {
    const strong = opp({ id: "strong", countries: ["Côte d'Ivoire"], industries: ["AgriTech"], startupStages: ["early_traction"] });
    const weak = opp({ id: "weak", countries: ["Kenya"], startupStages: ["growth"] });
    const run1 = matchOpportunities([weak, strong], ctx);
    const run2 = matchOpportunities([weak, strong], ctx);
    expect(run1.map((m) => m.opportunity.id)).toEqual(run2.map((m) => m.opportunity.id));
    expect(run1[0].opportunity.id).toBe("strong");
  });
});
