import { describe, expect, it } from "vitest";
import { computeInvestorMatch } from "./matching";
import { buildStartupMatchFacts } from "./thesis";
import { computeIntroductionReadiness } from "./readiness-checklist";
import type { StartupDigitalTwin } from "@/types/digital-twin";
import type { InvestorRecord } from "@/types/investors";

/**
 * Privacy gate (AFF-DASH-10 §47) — asserts that the Investor module's
 * public view models (match output, match-input facts, readiness
 * checklist) never carry cash/runway numbers, private message content,
 * expert notes, or other Community-private data. These are the only three
 * "view model" shapes the Investor UI ever renders from — if none of them
 * can carry forbidden data, the UI cannot leak it either.
 */

function minimalTwin(): StartupDigitalTwin {
  return {
    identity: {
      name: "Demo Co",
      country: "Kenya",
      operatingCountries: [],
      stage: "mvp",
      preferredCurrency: "USD",
    },
    founders: [],
    team: [],
    problem: {},
    product: { coreFeatures: [], launched: false },
    market: { customerSegments: [], geographies: [], competitors: [] },
    businessModel: { types: [], revenueStreams: [], salesChannels: [], keyPartnerships: [] },
    traction: { metrics: [], majorCustomers: [] },
    financials: { currency: "USD", cashBalance: 12345, runwayMonths: 7, monthlyBurn: 900 },
    funding: { status: "raising", previousRounds: [] },
    impact: { enabled: false, sdgs: [], metrics: [] },
    goals: [],
    risks: [],
    milestones: [],
    visibility: {
      identity: "public",
      founders: "public",
      team: "public",
      problem: "public",
      product: "public",
      market: "public",
      businessModel: "public",
      traction: "public",
      financials: "private",
      funding: "private",
      impact: "public",
      goals: "public",
      risks: "private",
      milestones: "public",
    },
    onboarding: { completed: true, currentStep: 10 },
  };
}

const FORBIDDEN_KEY_PATTERN = /cash|runway|burn|message|expertnote|community/i;

function assertNoForbiddenKeys(value: unknown, path = "root") {
  if (value === null || typeof value !== "object") return;
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    expect(FORBIDDEN_KEY_PATTERN.test(key), `forbidden key "${key}" found at ${path}.${key}`).toBe(false);
    assertNoForbiddenKeys(v, `${path}.${key}`);
  }
}

describe("Investor module privacy gate", () => {
  it("buildStartupMatchFacts never carries cash/runway/burn numbers, even though the twin has them", () => {
    const twin = minimalTwin();
    const facts = buildStartupMatchFacts("startup-1", twin, undefined);
    assertNoForbiddenKeys(facts);
    // Sanity: the twin DOES have these numbers, so this is a real filter, not a no-op.
    expect(twin.financials.cashBalance).toBe(12345);
  });

  it("computeInvestorMatch output never carries cash/runway/message/expert-note data", () => {
    const twin = minimalTwin();
    const facts = buildStartupMatchFacts("startup-1", twin, undefined);
    const investor: InvestorRecord = {
      organization: { id: "inv-1", name: "Demo", type: "VC", isDemo: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
      profile: {
        id: "inv-1",
        organizationId: "inv-1",
        thesis: { stages: ["mvp"], industries: [], geographies: [], countries: [], businessModels: [], instruments: [], impactThemes: [] },
        contacts: [],
      },
    };
    const match = computeInvestorMatch(facts, investor);
    assertNoForbiddenKeys(match);
  });

  it("the introduction readiness checklist is boolean-only and never a raw financial figure", () => {
    const result = computeIntroductionReadiness({
      profileCompletionPct: 80,
      hasPitch: true,
      hasFundingRequirement: true,
      dataRoomCompletionPct: 60,
      hasFinancialData: true,
      hasReadinessAssessment: true,
    });
    for (const item of result.items) {
      expect(typeof item.met).toBe("boolean");
    }
    assertNoForbiddenKeys(result);
  });
});
