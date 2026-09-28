import { describe, expect, it } from "vitest";
import { computeInvestorMatch, sortInvestorMatches, type StartupMatchFacts } from "./matching";
import type { InvestmentThesis, InvestorRecord } from "@/types/investors";

function thesis(overrides: Partial<InvestmentThesis> = {}): InvestmentThesis {
  return {
    stages: [],
    industries: [],
    geographies: [],
    countries: [],
    businessModels: [],
    instruments: [],
    impactThemes: [],
    ...overrides,
  };
}

function investor(id: string, name: string, t: InvestmentThesis): InvestorRecord {
  return {
    organization: {
      id,
      name,
      type: "VC",
      isDemo: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    profile: { id, organizationId: id, thesis: t, contacts: [] },
  };
}

function startup(overrides: Partial<StartupMatchFacts> = {}): StartupMatchFacts {
  return {
    startupId: "startup-1",
    countries: [],
    businessModels: [],
    impactEnabled: false,
    impactThemes: [],
    ...overrides,
  };
}

describe("computeInvestorMatch", () => {
  it("returns STAGE_MATCH when the startup stage is in the thesis stages", () => {
    const match = computeInvestorMatch(startup({ stage: "early_traction" }), investor("i1", "Alpha", thesis({ stages: ["early_traction"] })));
    expect(match.substantiveReasons).toContain("STAGE_MATCH");
    expect(match.mismatches).not.toContain("STAGE_MISMATCH");
  });

  it("returns STAGE_MISMATCH when the startup stage is outside the thesis stages", () => {
    const match = computeInvestorMatch(startup({ stage: "idea" }), investor("i1", "Alpha", thesis({ stages: ["growth", "scale"] })));
    expect(match.mismatches).toContain("STAGE_MISMATCH");
    expect(match.substantiveReasons).not.toContain("STAGE_MATCH");
    expect(match.recommended).toBe(false);
  });

  it("returns INDUSTRY_MATCH on case-insensitive industry overlap", () => {
    const match = computeInvestorMatch(startup({ industry: "AgriTech" }), investor("i1", "Alpha", thesis({ industries: ["agritech", "fintech"] })));
    expect(match.substantiveReasons).toContain("INDUSTRY_MATCH");
  });

  it("returns GEOGRAPHY_MATCH on country overlap", () => {
    const match = computeInvestorMatch(startup({ countries: ["Côte d'Ivoire"] }), investor("i1", "Alpha", thesis({ countries: ["Côte d'Ivoire", "Senegal"] })));
    expect(match.substantiveReasons).toContain("GEOGRAPHY_MATCH");
  });

  it("returns GEOGRAPHY_MISMATCH when both sides have countries but no overlap", () => {
    const match = computeInvestorMatch(startup({ countries: ["Kenya"] }), investor("i1", "Alpha", thesis({ countries: ["Nigeria", "Ghana"] })));
    expect(match.mismatches).toContain("GEOGRAPHY_MISMATCH");
  });

  it("does not manufacture a geography match/mismatch when investor countries are unknown", () => {
    const match = computeInvestorMatch(startup({ countries: ["Kenya"] }), investor("i1", "Alpha", thesis({ geographies: ["East Africa"] })));
    expect(match.substantiveReasons).not.toContain("GEOGRAPHY_MATCH");
    expect(match.mismatches).not.toContain("GEOGRAPHY_MISMATCH");
  });

  it("returns TICKET_OVERLAP when the funding requirement falls within the thesis ticket range", () => {
    const match = computeInvestorMatch(
      startup({ fundingRequirement: { amount: 300_000, currency: "USD" } }),
      investor("i1", "Alpha", thesis({ ticketMin: { amount: 100_000, currency: "USD" }, ticketMax: { amount: 500_000, currency: "USD" } })),
    );
    expect(match.substantiveReasons).toContain("TICKET_OVERLAP");
  });

  it("returns TICKET_MISMATCH when the funding requirement falls outside the thesis ticket range (same currency)", () => {
    const match = computeInvestorMatch(
      startup({ fundingRequirement: { amount: 50_000, currency: "USD" } }),
      investor("i1", "Alpha", thesis({ ticketMin: { amount: 500_000, currency: "USD" } })),
    );
    expect(match.mismatches).toContain("TICKET_MISMATCH");
  });

  it("returns TICKET_COMPARISON_UNAVAILABLE when currencies differ, never a fabricated comparison", () => {
    const match = computeInvestorMatch(
      startup({ fundingRequirement: { amount: 300_000, currency: "XOF" } }),
      investor("i1", "Alpha", thesis({ ticketMin: { amount: 100_000, currency: "USD" } })),
    );
    expect(match.mismatches).toContain("TICKET_COMPARISON_UNAVAILABLE");
    expect(match.substantiveReasons).not.toContain("TICKET_OVERLAP");
  });

  it("returns no ticket reason when either side lacks ticket data", () => {
    const noRequirement = computeInvestorMatch(startup(), investor("i1", "Alpha", thesis({ ticketMin: { amount: 1, currency: "USD" } })));
    expect(noRequirement.substantiveReasons).not.toContain("TICKET_OVERLAP");
    expect(noRequirement.mismatches).not.toContain("TICKET_MISMATCH");
    expect(noRequirement.mismatches).not.toContain("TICKET_COMPARISON_UNAVAILABLE");

    const noThesisTicket = computeInvestorMatch(startup({ fundingRequirement: { amount: 1, currency: "USD" } }), investor("i1", "Alpha", thesis()));
    expect(noThesisTicket.substantiveReasons).not.toContain("TICKET_OVERLAP");
    expect(noThesisTicket.mismatches).not.toContain("TICKET_MISMATCH");
  });

  it("returns INSTRUMENT_MATCH / INSTRUMENT_MISMATCH appropriately", () => {
    const match = computeInvestorMatch(
      startup({ fundingRequirement: { amount: 1, currency: "USD", instrument: "safe" } }),
      investor("i1", "Alpha", thesis({ instruments: ["safe", "equity"] })),
    );
    expect(match.substantiveReasons).toContain("INSTRUMENT_MATCH");

    const mismatch = computeInvestorMatch(
      startup({ fundingRequirement: { amount: 1, currency: "USD", instrument: "grant" } }),
      investor("i1", "Alpha", thesis({ instruments: ["equity"] })),
    );
    expect(mismatch.mismatches).toContain("INSTRUMENT_MISMATCH");
  });

  it("returns IMPACT_MATCH only as a supplementary reason, and only when impact is opted in", () => {
    const optedIn = computeInvestorMatch(
      startup({ impactEnabled: true, impactThemes: ["Financial Inclusion"] }),
      investor("i1", "Alpha", thesis({ impactThemes: ["financial inclusion"] })),
    );
    expect(optedIn.supplementaryReasons).toContain("IMPACT_MATCH");
    expect(optedIn.substantiveReasons).not.toContain("IMPACT_MATCH" as never);

    const optedOut = computeInvestorMatch(
      startup({ impactEnabled: false, impactThemes: ["Financial Inclusion"] }),
      investor("i1", "Alpha", thesis({ impactThemes: ["financial inclusion"] })),
    );
    expect(optedOut.supplementaryReasons).not.toContain("IMPACT_MATCH");
  });

  it("never lets a supplementary reason compensate for a stage mismatch", () => {
    const match = computeInvestorMatch(
      startup({ stage: "idea", impactEnabled: true, impactThemes: ["Climate"] }),
      investor("i1", "Alpha", thesis({ stages: ["scale"], impactThemes: ["climate"] })),
    );
    expect(match.supplementaryReasons).toContain("IMPACT_MATCH");
    expect(match.recommended).toBe(false);
  });

  it("handles missing data gracefully with no reasons and no mismatches", () => {
    const match = computeInvestorMatch(startup(), investor("i1", "Alpha", thesis()));
    expect(match.substantiveReasons).toEqual([]);
    expect(match.supplementaryReasons).toEqual([]);
    expect(match.mismatches).toEqual([]);
    expect(match.recommended).toBe(false);
  });

  it("never exposes a percentage, score, or probability field", () => {
    const match = computeInvestorMatch(startup({ stage: "growth" }), investor("i1", "Alpha", thesis({ stages: ["growth"] })));
    const keys = Object.keys(match);
    expect(keys).toEqual(["investorId", "startupId", "substantiveReasons", "supplementaryReasons", "mismatches", "recommended"]);
    for (const key of keys) {
      expect(key.toLowerCase()).not.toMatch(/score|percent|probability/);
    }
  });
});

describe("sortInvestorMatches", () => {
  it("orders deterministically by substantive weight, then reason count, then name, then id", () => {
    const s = startup({ stage: "growth", industry: "fintech", countries: ["Kenya"] });
    const investorA = investor("z-investor", "Zeta Capital", thesis({ stages: ["growth"], industries: ["fintech"] }));
    const investorB = investor("a-investor", "Alpha Capital", thesis({ stages: ["growth"] }));
    const investorC = investor("m-investor", "Mid Capital", thesis({ stages: ["growth"] }));

    const matches = [investorA, investorB, investorC].map((inv) => computeInvestorMatch(s, inv));
    const investorsById = new Map([investorA, investorB, investorC].map((inv) => [inv.organization.id, inv]));
    const sorted = sortInvestorMatches(matches, investorsById);

    // investorA has 2 substantive reasons (stage+industry) so it wins outright.
    expect(sorted[0].investorId).toBe("z-investor");
    // investorB and investorC tie on weight/count; break by name (Alpha < Mid).
    expect(sorted[1].investorId).toBe("a-investor");
    expect(sorted[2].investorId).toBe("m-investor");

    // Re-running produces the exact same order (determinism).
    const sortedAgain = sortInvestorMatches(matches, investorsById);
    expect(sortedAgain.map((m) => m.investorId)).toEqual(sorted.map((m) => m.investorId));
  });
});
