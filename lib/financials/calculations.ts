/**
 * Pure, deterministic financial calculation engine — the ONLY place these
 * formulas live (never duplicated in a React component). Every function
 * returns `null`/a discriminated "unavailable" result instead of inventing
 * a number when the underlying data doesn't exist. See AFF-DASH-06 spec
 * part C for the exact rules each function implements.
 */
import type { ExpenseEntry, FinancialPeriod, ForecastPeriod } from "@/types/financials";
import type { MonetaryAmount } from "@/types/common";

function sum(amounts: MonetaryAmount[]): number {
  return amounts.reduce((total, a) => total + a.amount, 0);
}

/** Total revenue recorded for one period. */
export function periodRevenueTotal(period: FinancialPeriod): number {
  return sum(period.revenue.map((r) => r.amount));
}

/** Total expenses recorded for one period, optionally scoped to one category. */
export function periodExpenseTotal(period: FinancialPeriod, category?: ExpenseEntry["category"]): number {
  const entries = category ? period.expenses.filter((e) => e.category === category) : period.expenses;
  return sum(entries.map((e) => e.amount));
}

function latestPeriod(periods: FinancialPeriod[]): FinancialPeriod | undefined {
  if (periods.length === 0) return undefined;
  return [...periods].sort((a, b) => (a.month < b.month ? 1 : -1))[0];
}

/** Most recent month's total revenue, or null when there is no financial history yet. */
export function monthlyRevenue(periods: FinancialPeriod[]): number | null {
  const period = latestPeriod(periods);
  return period ? periodRevenueTotal(period) : null;
}

/** Most recent month's total expenses, or null when there is no financial history yet. */
export function monthlyExpenses(periods: FinancialPeriod[]): number | null {
  const period = latestPeriod(periods);
  return period ? periodExpenseTotal(period) : null;
}

/**
 * netBurn = max(monthlyExpenses - monthlyRevenue, 0).
 * Never negative — a startup earning more than it spends has zero burn
 * (its surplus is a separate, positive "operating result", not "negative
 * burn"). Returns null when either input is missing.
 */
export function netBurn(revenue: number | null, expenses: number | null): number | null {
  if (revenue === null || expenses === null) return null;
  return Math.max(expenses - revenue, 0);
}

export type RunwayResult =
  | { status: "unavailable"; reason: "missing_cash" | "missing_burn" }
  | { status: "sustainable" } // netBurn <= 0: not burning cash, so "runway" as a countdown doesn't apply
  | { status: "calculated"; months: number };

/**
 * runwayMonths = cashBalance / netBurn — but NEVER returns Infinity. If
 * netBurn <= 0 the startup isn't burning cash, which is a qualitatively
 * different, better state than "very long runway": we return an explicit
 * `sustainable` result instead of a number. If either input is missing we
 * return `unavailable` with a reason, so the UI can render the exact
 * honest copy the spec requires (e.g. "add your current cash balance").
 */
export function runwayMonths(cashBalance: number | null, burn: number | null): RunwayResult {
  if (cashBalance === null) return { status: "unavailable", reason: "missing_cash" };
  if (burn === null) return { status: "unavailable", reason: "missing_burn" };
  if (burn <= 0) return { status: "sustainable" };
  return { status: "calculated", months: cashBalance / burn };
}

/**
 * Revenue growth between the two most recent periods, as a fraction
 * (0.2 = +20%). Null when there are fewer than two periods, or when the
 * prior period's revenue was 0 (growth from zero is undefined, not
 * "infinite%").
 */
export function revenueGrowth(periods: FinancialPeriod[]): number | null {
  const sorted = [...periods].sort((a, b) => (a.month < b.month ? -1 : 1));
  if (sorted.length < 2) return null;
  const prev = periodRevenueTotal(sorted[sorted.length - 2]);
  const curr = periodRevenueTotal(sorted[sorted.length - 1]);
  if (prev === 0) return null;
  return (curr - prev) / prev;
}

/**
 * Gross margin = (revenue - directCosts) / revenue. Only exists when BOTH
 * revenue and direct-cost data exist, and revenue is non-zero (division by
 * zero is undefined, not 0% or 100%).
 */
export function grossMargin(revenue: number | null, directCosts: number | null): number | null {
  if (revenue === null || directCosts === null) return null;
  if (revenue === 0) return null;
  return (revenue - directCosts) / revenue;
}

/** Operating result (revenue - expenses) for the most recent period. Positive = profit, negative = loss. Null if data is missing. */
export function operatingResult(revenue: number | null, expenses: number | null): number | null {
  if (revenue === null || expenses === null) return null;
  return revenue - expenses;
}

/**
 * Deterministic cash projection for a forecast: each month's projected
 * closing cash = previous closing cash + that month's projected revenue -
 * that month's projected expenses, UNLESS the founder supplied an explicit
 * override for that month (projectedCashBalance), in which case theirs
 * wins and becomes the new running base. No smoothing, no AI — pure
 * founder-input arithmetic.
 */
export function projectForecastCash(
  startingCash: number | undefined,
  periods: ForecastPeriod[],
): Array<{ month: string; projectedCash: number | null }> {
  let running = startingCash ?? null;
  return periods.map((p) => {
    if (p.projectedCashBalance) {
      running = p.projectedCashBalance.amount;
      return { month: p.month, projectedCash: running };
    }
    if (running === null) return { month: p.month, projectedCash: null };
    running = running + p.projectedRevenue.amount - p.projectedExpenses.amount;
    return { month: p.month, projectedCash: running };
  });
}
