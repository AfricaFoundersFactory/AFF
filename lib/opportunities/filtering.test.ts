import { describe, expect, it } from "vitest";
import { filterOpportunities } from "./filtering";
import type { Opportunity } from "@/types/opportunity";

function opp(overrides: Partial<Opportunity>): Opportunity {
  return {
    id: "o1",
    title: "Demo Program",
    organization: "Demo Org",
    description: { en: "growth accelerator", fr: "accélérateur" },
    type: "ACCELERATOR",
    countries: ["Kenya"],
    regions: [],
    industries: ["FinTech"],
    startupStages: ["mvp"],
    languages: ["en"],
    remoteAllowed: false,
    requirements: [],
    status: "OPEN",
    source: "DEMO",
    isDemo: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("filterOpportunities", () => {
  it("filters by type, country, industry, stage, language and remote", () => {
    const opportunities = [opp({ id: "a" }), opp({ id: "b", type: "GRANT", countries: ["Nigeria"], industries: ["AgriTech"], startupStages: ["growth"], languages: ["fr"], remoteAllowed: true })];

    expect(filterOpportunities(opportunities, { type: "GRANT" }).map((o) => o.id)).toEqual(["b"]);
    expect(filterOpportunities(opportunities, { country: "Kenya" }).map((o) => o.id)).toEqual(["a"]);
    expect(filterOpportunities(opportunities, { industry: "AgriTech" }).map((o) => o.id)).toEqual(["b"]);
    expect(filterOpportunities(opportunities, { stage: "mvp" }).map((o) => o.id)).toEqual(["a"]);
    expect(filterOpportunities(opportunities, { language: "fr" }).map((o) => o.id)).toEqual(["b"]);
    expect(filterOpportunities(opportunities, { remoteOnly: true }).map((o) => o.id)).toEqual(["b"]);
  });

  it("searches title/organization/description case-insensitively", () => {
    const opportunities = [opp({ id: "a", title: "Solar Fund" })];
    expect(filterOpportunities(opportunities, { search: "solar" }).map((o) => o.id)).toEqual(["a"]);
    expect(filterOpportunities(opportunities, { search: "nonexistent" })).toHaveLength(0);
  });
});
