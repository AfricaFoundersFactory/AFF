/**
 * Deterministic Financial Health Signals — informational only. These are
 * explicitly NOT investment recommendations, valuations, credit scores, or
 * AFF Readiness modifications (nothing here writes to
 * lib/services/readiness.ts — see lib/services/financial-metric-separation.test.ts).
 * Every signal explains WHY with the real numbers behind it via `data`.
 */
import type { FinancialForecast, FinancialPeriod, FinancialSignal, FundingRequirement } from "@/types/financials";
import {
  monthlyExpenses,
  monthlyRevenue,
  netBurn,
  operatingResult,
  periodExpenseTotal,
  revenueGrowth,
  runwayMonths,
} from "./calculations";

const STALE_UPDATE_THRESHOLD_DAYS = 60;

function monthsBetween(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / (1000 * 60 * 60 * 24);
}

function expenseGrowth(periods: FinancialPeriod[]): number | null {
  const sorted = [...periods].sort((a, b) => (a.month < b.month ? -1 : 1));
  if (sorted.length < 2) return null;
  const prev = periodExpenseTotal(sorted[sorted.length - 2]);
  const curr = periodExpenseTotal(sorted[sorted.length - 1]);
  if (prev === 0) return null;
  return (curr - prev) / prev;
}

export function computeFinancialSignals(
  input: {
    periods: FinancialPeriod[];
    cashBalance?: number;
    forecast?: FinancialForecast;
    fundingRequirement?: FundingRequirement;
  },
  nowIso: string,
): FinancialSignal[] {
  const { periods, cashBalance, forecast, fundingRequirement } = input;
  const signals: FinancialSignal[] = [];

  const revenue = monthlyRevenue(periods);
  const expenses = monthlyExpenses(periods);
  const burn = netBurn(revenue, expenses);
  const growth = revenueGrowth(periods);
  const expGrowth = expenseGrowth(periods);
  const runway = runwayMonths(cashBalance ?? null, burn);

  if (growth !== null && growth < 0) {
    signals.push({
      key: "revenue_declining",
      severity: "warning",
      data: { growthPct: Math.round(growth * 1000) / 10 },
    });
  }

  if (growth !== null && expGrowth !== null && expGrowth > growth) {
    signals.push({
      key: "expenses_outpacing_revenue",
      severity: "warning",
      data: {
        revenueGrowthPct: Math.round(growth * 1000) / 10,
        expenseGrowthPct: Math.round(expGrowth * 1000) / 10,
      },
    });
  }

  if (runway.status === "calculated") {
    if (runway.months < 3) {
      signals.push({
        key: "runway_below_3_months",
        severity: "critical",
        data: { months: Math.round(runway.months * 10) / 10 },
      });
    } else if (runway.months < 6) {
      signals.push({
        key: "runway_below_6_months",
        severity: "warning",
        data: { months: Math.round(runway.months * 10) / 10 },
      });
    }
  }

  const latestPeriod = [...periods].sort((a, b) => (a.month < b.month ? 1 : -1))[0];
  if (latestPeriod) {
    const latestIso = `${latestPeriod.month}-01T00:00:00.000Z`;
    const ageDays = monthsBetween(latestIso, nowIso);
    if (ageDays > STALE_UPDATE_THRESHOLD_DAYS) {
      signals.push({
        key: "stale_financial_update",
        severity: "warning",
        data: { lastUpdatedMonth: latestPeriod.month, daysSinceUpdate: Math.round(ageDays) },
      });
    }
  } else {
    signals.push({ key: "stale_financial_update", severity: "info", data: { lastUpdatedMonth: "none" } });
  }

  if (!forecast || forecast.periods.length === 0) {
    signals.push({ key: "no_forecast", severity: "info", data: {} });
  }

  if (fundingRequirement && forecast && forecast.periods.length > 0) {
    const totalForecastedGap = forecast.periods.reduce((sum, p) => {
      const gap = p.projectedExpenses.amount - p.projectedRevenue.amount;
      return sum + Math.max(gap, 0);
    }, 0);
    if (totalForecastedGap > 0 && fundingRequirement.amountSought.amount > totalForecastedGap * 1.5) {
      signals.push({
        key: "funding_exceeds_forecast_need",
        severity: "info",
        data: {
          amountSought: fundingRequirement.amountSought.amount,
          forecastedNeed: Math.round(totalForecastedGap),
        },
      });
    }
  }

  const opResult = operatingResult(revenue, expenses);
  if (opResult !== null && opResult > 0 && growth !== null && growth > 0) {
    signals.push({
      key: "positive_operating_trend",
      severity: "info",
      data: { operatingResult: opResult, growthPct: Math.round(growth * 1000) / 10 },
    });
  }

  return signals;
}
