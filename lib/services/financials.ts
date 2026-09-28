/**
 * Financial Command Center service boundary — the only place a
 * FinancialProfile (periods, cash position, forecast, funding requirement)
 * is created, read or mutated. Same in-memory Map<startupId, ...> pattern
 * self-seeding demo data as lib/services/roadmap.ts / lib/services/pitch.ts.
 *
 * Nothing here ever calls lib/services/readiness.ts's score-mutating
 * functions, and no function here writes to Pitch Readiness either — see
 * lib/services/financial-metric-separation.test.ts. Read-only accessors are
 * exposed for Digital Twin / Pitch Lab / Roadmap to consume this data
 * WITHOUT duplicating it as a second source of truth (spec part M).
 */
import { randomUUID } from "crypto";
import type {
  CashPosition,
  FinancialForecast,
  FinancialPeriod,
  FinancialProfile,
  FinancialSignal,
  ForecastPeriod,
  FundingRequirement,
  UseOfFundsAllocation,
} from "@/types/financials";
import type { FundingInstrument, FundingStatus } from "@/types/digital-twin";
import { listStartupIds } from "@/lib/services/digital-twin";
import {
  grossMargin,
  monthlyExpenses,
  monthlyRevenue,
  netBurn,
  operatingResult,
  periodExpenseTotal,
  revenueGrowth,
  runwayMonths,
  type RunwayResult,
} from "@/lib/financials/calculations";
import { computeFinancialSignals } from "@/lib/financials/signals";

const store = new Map<string, FinancialProfile>();

function blankProfile(startupId: string, currency: string): FinancialProfile {
  return { startupId, currency, periods: [] };
}

/** "YYYY-MM" for `offset` months after a "YYYY-MM" base month. */
function addMonths(base: string, offset: number): string {
  const [y, m] = base.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function requireProfile(startupId: string): FinancialProfile {
  const profile = store.get(startupId);
  if (!profile) throw new Error(`No financial profile found for startup "${startupId}"`);
  return profile;
}

function save(startupId: string, profile: FinancialProfile): FinancialProfile {
  store.set(startupId, { ...profile, updatedAt: new Date().toISOString() });
  return store.get(startupId)!;
}

/** Read accessor — creates a blank profile on first read so every startup has one, without ever fabricating financial facts. */
export function getFinancialProfile(startupId: string, defaultCurrency = "XOF"): FinancialProfile {
  const existing = store.get(startupId);
  if (existing) return existing;
  return save(startupId, blankProfile(startupId, defaultCurrency));
}

// ---------------------------------------------------------------------------
// Periods
// ---------------------------------------------------------------------------

export function upsertPeriod(
  startupId: string,
  input: Omit<FinancialPeriod, "id" | "startupId" | "createdAt" | "updatedAt"> & { id?: string },
  nowIso: string,
): FinancialProfile {
  const profile = getFinancialProfile(startupId);
  const existingIndex = profile.periods.findIndex((p) => p.id === input.id || p.month === input.month);
  const period: FinancialPeriod = {
    id: input.id ?? (existingIndex >= 0 ? profile.periods[existingIndex].id : randomUUID()),
    startupId,
    month: input.month,
    revenue: input.revenue,
    expenses: input.expenses,
    cashClosingBalance: input.cashClosingBalance,
    notes: input.notes,
    createdAt: existingIndex >= 0 ? profile.periods[existingIndex].createdAt : nowIso,
    updatedAt: nowIso,
  };
  const periods =
    existingIndex >= 0
      ? profile.periods.map((p, i) => (i === existingIndex ? period : p))
      : [...profile.periods, period];
  return save(startupId, { ...profile, periods });
}

export function removePeriod(startupId: string, periodId: string): FinancialProfile {
  const profile = requireProfile(startupId);
  return save(startupId, { ...profile, periods: profile.periods.filter((p) => p.id !== periodId) });
}

// ---------------------------------------------------------------------------
// Cash position
// ---------------------------------------------------------------------------

export function setCashPosition(startupId: string, cashPosition: CashPosition): FinancialProfile {
  const profile = getFinancialProfile(startupId);
  return save(startupId, { ...profile, cashPosition });
}

// ---------------------------------------------------------------------------
// Forecast
// ---------------------------------------------------------------------------

export function setForecast(
  startupId: string,
  input: { startingCashBalance?: FinancialForecast["startingCashBalance"]; periods: ForecastPeriod[] },
  nowIso: string,
): FinancialProfile {
  const profile = getFinancialProfile(startupId);
  const forecast: FinancialForecast = {
    id: profile.forecast?.id ?? randomUUID(),
    startupId,
    startingCashBalance: input.startingCashBalance,
    periods: input.periods,
    createdAt: profile.forecast?.createdAt ?? nowIso,
    updatedAt: nowIso,
  };
  return save(startupId, { ...profile, forecast });
}

// ---------------------------------------------------------------------------
// Funding requirement
// ---------------------------------------------------------------------------

export function setFundingRequirement(
  startupId: string,
  input: {
    amountSought: FundingRequirement["amountSought"];
    instrument: FundingInstrument;
    targetDate?: string;
    intendedRunwayExtensionMonths?: number;
    allocation: UseOfFundsAllocation[];
    status: FundingStatus;
  },
  nowIso: string,
): FinancialProfile {
  const profile = getFinancialProfile(startupId);
  const fundingRequirement: FundingRequirement = {
    id: profile.fundingRequirement?.id ?? randomUUID(),
    startupId,
    ...input,
    createdAt: profile.fundingRequirement?.createdAt ?? nowIso,
    updatedAt: nowIso,
  };
  return save(startupId, { ...profile, fundingRequirement });
}

// ---------------------------------------------------------------------------
// Derived read model for the Command Center / Financials page — computes
// everything fresh from the current profile every time (never cached/
// stored), so it can never drift from the underlying facts.
// ---------------------------------------------------------------------------

export type FinancialSnapshot = {
  currency: string;
  cashBalance: number | null;
  monthlyRevenue: number | null;
  monthlyExpenses: number | null;
  netBurn: number | null;
  runway: RunwayResult;
  revenueGrowth: number | null;
  grossMargin: number | null;
  operatingResult: number | null;
  lastUpdatedAt: string | undefined;
  signals: FinancialSignal[];
};

export function getFinancialSnapshot(startupId: string, nowIso: string): FinancialSnapshot {
  const profile = getFinancialProfile(startupId);
  const revenue = monthlyRevenue(profile.periods);
  const expenses = monthlyExpenses(profile.periods);
  const burn = netBurn(revenue, expenses);
  const cashBalance = profile.cashPosition?.balance.amount ?? null;
  const latestPeriod = [...profile.periods].sort((a, b) => (a.month < b.month ? 1 : -1))[0];
  // Gross margin needs an explicit direct-cost figure, not just "any
  // expenses recorded" — a period with zero direct_costs entries counts as
  // 0 direct cost (a real, if unusual, fact), while no period at all means
  // "no data" (null).
  const directCosts = latestPeriod ? periodExpenseTotal(latestPeriod, "direct_costs") : null;

  return {
    currency: profile.currency,
    cashBalance,
    monthlyRevenue: revenue,
    monthlyExpenses: expenses,
    netBurn: burn,
    runway: runwayMonths(cashBalance, burn),
    revenueGrowth: revenueGrowth(profile.periods),
    grossMargin: grossMargin(revenue, directCosts),
    operatingResult: operatingResult(revenue, expenses),
    lastUpdatedAt: profile.cashPosition?.asOfDate ?? latestPeriod?.updatedAt,
    signals: computeFinancialSignals(
      { periods: profile.periods, cashBalance: cashBalance ?? undefined, forecast: profile.forecast, fundingRequirement: profile.fundingRequirement },
      nowIso,
    ),
  };
}

/**
 * Minimal read accessor for Pitch Lab (spec part M) — exposes just enough
 * for a future Pitch Lab section to reference real financial/funding facts
 * without deep coupling. Nothing in lib/pitch/* calls this yet; it exists
 * so a later batch CAN wire it up.
 */
export function getFinancialFactsForPitch(startupId: string) {
  const profile = getFinancialProfile(startupId);
  const snapshot = getFinancialSnapshot(startupId, new Date().toISOString());
  return {
    monthlyRevenue: snapshot.monthlyRevenue,
    runway: snapshot.runway,
    fundingRequirement: profile.fundingRequirement,
  };
}

/**
 * Read-only signal export for a future Roadmap generation step (spec part
 * M): "at most expose a service-layer read function that a later roadmap
 * generation step COULD consume, but do not wire it up to actually create
 * tasks". Nothing calls this from lib/services/roadmap.ts in this batch.
 */
export function getFinancialGapsForRoadmap(startupId: string): FinancialSignal[] {
  return getFinancialSnapshot(startupId, new Date().toISOString()).signals;
}

/** Test-only reset hook so isolated tests don't leak state across files. */
export function __resetFinancialsStoreForTests() {
  store.clear();
}

// ---------------------------------------------------------------------------
// Seed: materially different financial states for the two demo startups,
// consistent with lib/services/roadmap.ts / lib/services/pitch.ts (Wakama =
// mature, Solari = early stage). Built via the same functions a founder's
// own actions would call. This lives here (not lib/demo/financials.ts) as
// an intentional deviation matching the pitch.ts/roadmap.ts precedent.
// ---------------------------------------------------------------------------
function seedDemoFinancials() {
  const seedIso = new Date().toISOString();

  if (listStartupIds().includes("startup-wakama") && !store.has("startup-wakama")) {
    const currency = "XOF";
    const months = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08"];
    const revenues = [8_200_000, 9_100_000, 9_800_000, 11_200_000, 12_050_000];
    const payrolls = [4_500_000, 4_500_000, 4_800_000, 5_200_000, 5_200_000];
    months.forEach((month, i) => {
      upsertPeriod(
        "startup-wakama",
        {
          month,
          revenue: [{ id: randomUUID(), label: "Aggregation fees", amount: { amount: revenues[i], currency }, recurring: true }],
          expenses: [
            { id: randomUUID(), category: "direct_costs", label: "Logistics & sourcing", amount: { amount: Math.round(revenues[i] * 0.4), currency } },
            { id: randomUUID(), category: "payroll", label: "Team payroll", amount: { amount: payrolls[i], currency } },
            { id: randomUUID(), category: "marketing", label: "Field marketing", amount: { amount: 600_000, currency } },
            { id: randomUUID(), category: "operations", label: "Operations & overhead", amount: { amount: 900_000, currency } },
          ],
          cashClosingBalance: { amount: 38_000_000 + i * 1_500_000, currency },
        },
        seedIso,
      );
    });
    setCashPosition("startup-wakama", { asOfDate: seedIso, balance: { amount: 45_500_000, currency } });
    setForecast(
      "startup-wakama",
      {
        startingCashBalance: { amount: 45_500_000, currency },
        periods: Array.from({ length: 12 }, (_, i) => {
          const revenue = 12_500_000 + i * 500_000;
          const expenses = 10_800_000 + i * 350_000;
          return {
            id: randomUUID(),
            month: addMonths("2026-09", i),
            projectedRevenue: { amount: revenue, currency },
            projectedExpenses: { amount: expenses, currency },
            assumptions:
              i === 2
                ? [{ id: randomUUID(), text: "Hire a sales manager in month 3." }]
                : i === 5
                  ? [{ id: randomUUID(), text: "Launch second aggregation hub, acquire ~20 new farmer partners/month." }]
                  : [],
          };
        }),
      },
      seedIso,
    );
    setFundingRequirement(
      "startup-wakama",
      {
        amountSought: { amount: 250_000_000, currency },
        instrument: "equity",
        targetDate: "2027-01-31",
        intendedRunwayExtensionMonths: 18,
        allocation: [
          { id: randomUUID(), category: "expansion", percentage: 40 },
          { id: randomUUID(), category: "hiring", percentage: 25 },
          { id: randomUUID(), category: "marketing", percentage: 15 },
          { id: randomUUID(), category: "working_capital", percentage: 20 },
        ],
        status: "raising",
      },
      seedIso,
    );
  }

  if (listStartupIds().includes("startup-solari") && !store.has("startup-solari")) {
    const currency = "XOF";
    // Early stage: a single short, honest history of pre-revenue estimated
    // costs — never fabricated revenue.
    upsertPeriod(
      "startup-solari",
      {
        month: "2026-08",
        revenue: [],
        expenses: [
          { id: randomUUID(), category: "operations", label: "Cloud & tooling", amount: { amount: 120_000, currency } },
          { id: randomUUID(), category: "other", label: "Legal setup", amount: { amount: 300_000, currency } },
        ],
      },
      seedIso,
    );
    setCashPosition("startup-solari", { asOfDate: seedIso, balance: { amount: 1_800_000, currency } });
    setFundingRequirement(
      "startup-solari",
      {
        amountSought: { amount: 20_000_000, currency },
        instrument: "safe",
        intendedRunwayExtensionMonths: 12,
        allocation: [
          { id: randomUUID(), category: "product", percentage: 60 },
          { id: randomUUID(), category: "regulatory", percentage: 15 },
          { id: randomUUID(), category: "other", percentage: 25 },
        ],
        status: "raising",
      },
      seedIso,
    );
    // Deliberately no forecast yet — the "no forecast" signal and the
    // honest missing-data UI states must actually fire for this startup.
  }
}
seedDemoFinancials();
