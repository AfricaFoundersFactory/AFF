import type { StartupDigitalTwin } from "@/types/digital-twin";

/**
 * A minimal, mostly-empty Digital Twin for engine unit tests — deliberately
 * has almost no data filled in, so tests can add exactly the fields they
 * care about and know everything else is genuinely absent (insufficient
 * evidence), not an unrelated stray value.
 */
export function makeBlankTwin(overrides: Partial<StartupDigitalTwin> = {}): StartupDigitalTwin {
  const base: StartupDigitalTwin = {
    identity: {
      name: "Test Co",
      country: "Kenya",
      operatingCountries: [],
      stage: "idea",
      preferredCurrency: "USD",
    },
    founders: [],
    team: [],
    problem: {},
    product: { coreFeatures: [], launched: false },
    market: { customerSegments: [], geographies: [], competitors: [] },
    businessModel: { types: [], revenueStreams: [], salesChannels: [], keyPartnerships: [] },
    traction: { metrics: [], majorCustomers: [] },
    financials: { currency: "USD" },
    funding: { status: "not_raising", previousRounds: [] },
    impact: { enabled: false, sdgs: [], metrics: [] },
    goals: [],
    risks: [],
    milestones: [],
    visibility: {
      identity: "public",
      founders: "aff_team",
      team: "aff_team",
      problem: "public",
      product: "public",
      market: "investors",
      businessModel: "investors",
      traction: "investors",
      financials: "private",
      funding: "investors",
      impact: "public",
      goals: "aff_team",
      risks: "private",
      milestones: "public",
    },
    onboarding: { completed: false, currentStep: 1 },
  };

  return { ...base, ...overrides };
}
