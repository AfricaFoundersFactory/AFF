// Financial Command Center domain model (AFF-DASH-06).
//
// Deliberately supports startups at very different maturity levels: an
// idea-stage founder may have zero periods and only a funding requirement;
// a growth-stage founder has months of history, a forecast and a funding
// ask. Every "how much / how long" number is OPTIONAL upstream and is only
// ever computed downstream (lib/financials/calculations.ts) when enough
// inputs exist — never invented, never defaulted to 0.
//
// Money always uses MonetaryAmount (types/common.ts) — never a formatted
// string. This file intentionally reuses FundingInstrument/FundingStatus
// from types/digital-twin.ts rather than redefining them, and
// FundingRequirement below extends the SAME facts already modeled by
// StartupFunding (targetRaise/useOfFunds/instrument/status) instead of
// creating a second, competing source of truth — see FundingRequirement.
import type { MonetaryAmount } from "./common";
import type { FundingInstrument, FundingStatus } from "./digital-twin";

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

export type ExpenseCategory = "direct_costs" | "payroll" | "marketing" | "operations" | "other";

export type RevenueEntry = {
  id: string;
  label: string;
  amount: MonetaryAmount;
  recurring: boolean;
};

export type ExpenseEntry = {
  id: string;
  category: ExpenseCategory;
  label: string;
  amount: MonetaryAmount;
};

// One founder-maintained monthly snapshot. Not bookkeeping — a management
// summary a founder fills in themselves, once a month.
export type FinancialPeriod = {
  id: string;
  startupId: string;
  month: string; // "YYYY-MM"
  revenue: RevenueEntry[];
  expenses: ExpenseEntry[];
  cashClosingBalance?: MonetaryAmount;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

// Current cash on hand, as of a specific date — distinct from a period's
// closing balance, which is historical. This is "right now".
export type CashPosition = {
  asOfDate: string;
  balance: MonetaryAmount;
};

// A single computed metric result. `value === null` (with `unavailableReason`
// set) is a first-class, expected state — never fabricated precision.
export type FinancialMetric = {
  key: string;
  value: number | null;
  currency?: string;
  unavailableReason?: string;
};

// ---------------------------------------------------------------------------
// Forecast — founder-entered numbers + deterministic cash projection only.
// No AI/LLM, no opaque modeling.
// ---------------------------------------------------------------------------

export type FinancialAssumption = {
  id: string;
  text: string;
};

export type ForecastPeriod = {
  id: string;
  month: string; // "YYYY-MM"
  projectedRevenue: MonetaryAmount;
  projectedExpenses: MonetaryAmount;
  // Optional founder override; when absent, the UI derives a projected cash
  // trajectory deterministically from the prior month's cash + this month's
  // projected revenue/expenses (see lib/financials/calculations.ts).
  projectedCashBalance?: MonetaryAmount;
  assumptions: FinancialAssumption[];
};

export type FinancialForecast = {
  id: string;
  startupId: string;
  startingCashBalance?: MonetaryAmount;
  periods: ForecastPeriod[];
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Funding requirement — references/extends StartupFunding's facts rather
// than duplicating them. Digital Twin's StartupFunding already models
// status/targetRaise/instrument/useOfFunds as narrative; this adds the
// structured "ask" a founder builds for fundraising purposes (target date,
// runway extension, categorized allocation).
// ---------------------------------------------------------------------------

export type UseOfFundsCategory =
  | "product"
  | "hiring"
  | "sales"
  | "marketing"
  | "operations"
  | "expansion"
  | "equipment"
  | "regulatory"
  | "working_capital"
  | "other";

// Exactly one of percentage/amount is the "source of truth" per allocation
// row; validation (lib/financials/funding.ts) checks totals for whichever
// mode the founder used, and refuses to silently mix them into one total.
export type UseOfFundsAllocation = {
  id: string;
  category: UseOfFundsCategory;
  percentage?: number;
  amount?: MonetaryAmount;
  note?: string;
};

export type FundingRequirement = {
  id: string;
  startupId: string;
  amountSought: MonetaryAmount;
  instrument: FundingInstrument;
  targetDate?: string;
  intendedRunwayExtensionMonths?: number;
  allocation: UseOfFundsAllocation[];
  status: FundingStatus;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Root aggregate
// ---------------------------------------------------------------------------

export type FinancialProfile = {
  startupId: string;
  currency: string;
  cashPosition?: CashPosition;
  periods: FinancialPeriod[]; // oldest first
  forecast?: FinancialForecast;
  fundingRequirement?: FundingRequirement;
  updatedAt?: string;
};

// ---------------------------------------------------------------------------
// Health signals — informational only. Never a score, never a credit
// assessment, never an AFF Readiness input. See lib/financials/signals.ts.
// ---------------------------------------------------------------------------

export type FinancialSignalSeverity = "info" | "warning" | "critical";

export type FinancialSignalKey =
  | "revenue_declining"
  | "expenses_outpacing_revenue"
  | "runway_below_3_months"
  | "runway_below_6_months"
  | "stale_financial_update"
  | "no_forecast"
  | "funding_exceeds_forecast_need"
  | "positive_operating_trend";

export type FinancialSignal = {
  key: FinancialSignalKey;
  severity: FinancialSignalSeverity;
  // Machine-readable numbers backing the message, so the UI (or a test) can
  // render/assert the SAME numbers quoted in the message — never a
  // free-floating claim.
  data: Record<string, number | string>;
};
