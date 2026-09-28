import { describe, expect, it } from "vitest";
import { computeFinancialSignals } from "./signals";
import type { FinancialPeriod } from "@/types/financials";

const NOW = "2026-09-28T00:00:00.000Z";

function period(month: string, revenue: number, expenses: number): FinancialPeriod {
  return {
    id: `p-${month}`,
    startupId: "s1",
    month,
    revenue: [{ id: "r1", label: "Sales", amount: { amount: revenue, currency: "XOF" }, recurring: true }],
    expenses: [{ id: "e1", category: "operations", label: "Opex", amount: { amount: expenses, currency: "XOF" } }],
    createdAt: NOW,
    updatedAt: NOW,
  };
}

describe("computeFinancialSignals", () => {
  it("flags declining revenue", () => {
    const signals = computeFinancialSignals(
      { periods: [period("2026-07", 1000, 500), period("2026-08", 700, 500)] },
      NOW,
    );
    expect(signals.some((s) => s.key === "revenue_declining")).toBe(true);
  });

  it("flags critical runway below 3 months", () => {
    const signals = computeFinancialSignals(
      { periods: [period("2026-08", 1000, 5000)], cashBalance: 8000 },
      NOW,
    );
    const runwaySignal = signals.find((s) => s.key === "runway_below_3_months");
    expect(runwaySignal).toBeDefined();
    expect(runwaySignal!.severity).toBe("critical");
    expect(runwaySignal!.data.months).toBeCloseTo(2, 0);
  });

  it("flags warning runway between 3 and 6 months", () => {
    const signals = computeFinancialSignals(
      { periods: [period("2026-08", 1000, 3000)], cashBalance: 8000 },
      NOW,
    );
    expect(signals.some((s) => s.key === "runway_below_6_months")).toBe(true);
    expect(signals.some((s) => s.key === "runway_below_3_months")).toBe(false);
  });

  it("never flags any runway signal when the startup is not burning cash", () => {
    const signals = computeFinancialSignals(
      { periods: [period("2026-08", 5000, 2000)], cashBalance: 8000 },
      NOW,
    );
    expect(signals.some((s) => s.key.startsWith("runway_below"))).toBe(false);
  });

  it("flags no_forecast when there is no forecast", () => {
    const signals = computeFinancialSignals({ periods: [period("2026-08", 1000, 500)] }, NOW);
    expect(signals.some((s) => s.key === "no_forecast")).toBe(true);
  });

  it("flags a stale financial update when the latest period is old", () => {
    const signals = computeFinancialSignals({ periods: [period("2026-01", 1000, 500)] }, NOW);
    expect(signals.some((s) => s.key === "stale_financial_update")).toBe(true);
  });

  it("flags stale_financial_update as info with no periods at all", () => {
    const signals = computeFinancialSignals({ periods: [] }, NOW);
    const s = signals.find((sig) => sig.key === "stale_financial_update");
    expect(s).toBeDefined();
    expect(s!.severity).toBe("info");
  });

  it("returns no data-dependent signals (other than the always-present ones) when there's nothing alarming", () => {
    const signals = computeFinancialSignals(
      { periods: [period("2026-08", 5000, 2000), period("2026-09", 6000, 2200)], cashBalance: 100000 },
      NOW,
    );
    expect(signals.some((s) => s.key === "revenue_declining")).toBe(false);
    expect(signals.some((s) => s.key.startsWith("runway_below"))).toBe(false);
    expect(signals.some((s) => s.key === "positive_operating_trend")).toBe(true);
  });

  it("flags funding_exceeds_forecast_need when the ask is well above the forecasted gap", () => {
    const signals = computeFinancialSignals(
      {
        periods: [period("2026-08", 1000, 2000)],
        cashBalance: 10000,
        forecast: {
          id: "f1",
          startupId: "s1",
          periods: [
            {
              id: "fp1",
              month: "2026-09",
              projectedRevenue: { amount: 1000, currency: "XOF" },
              projectedExpenses: { amount: 2000, currency: "XOF" },
              assumptions: [],
            },
          ],
          createdAt: NOW,
          updatedAt: NOW,
        },
        fundingRequirement: {
          id: "fr1",
          startupId: "s1",
          amountSought: { amount: 1000000, currency: "XOF" },
          instrument: "equity",
          allocation: [],
          status: "raising",
          createdAt: NOW,
          updatedAt: NOW,
        },
      },
      NOW,
    );
    expect(signals.some((s) => s.key === "funding_exceeds_forecast_need")).toBe(true);
  });
});
