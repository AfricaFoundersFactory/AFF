import { describe, expect, it } from "vitest";
import {
  grossMargin,
  monthlyExpenses,
  monthlyRevenue,
  netBurn,
  operatingResult,
  periodExpenseTotal,
  periodRevenueTotal,
  projectForecastCash,
  revenueGrowth,
  runwayMonths,
} from "./calculations";
import type { FinancialPeriod, ForecastPeriod } from "@/types/financials";

function period(month: string, revenue: number, expenses: number, directCosts = 0): FinancialPeriod {
  return {
    id: `p-${month}`,
    startupId: "s1",
    month,
    revenue: revenue > 0 ? [{ id: "r1", label: "Sales", amount: { amount: revenue, currency: "XOF" }, recurring: true }] : [],
    expenses: [
      ...(directCosts > 0 ? [{ id: "e-dc", category: "direct_costs" as const, label: "COGS", amount: { amount: directCosts, currency: "XOF" } }] : []),
      { id: "e1", category: "operations" as const, label: "Rent", amount: { amount: expenses - directCosts, currency: "XOF" } },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("monthlyRevenue / monthlyExpenses", () => {
  it("returns null with no periods", () => {
    expect(monthlyRevenue([])).toBeNull();
    expect(monthlyExpenses([])).toBeNull();
  });

  it("uses the most recent period by month", () => {
    const periods = [period("2026-01", 1000, 500), period("2026-03", 3000, 1500), period("2026-02", 2000, 1000)];
    expect(monthlyRevenue(periods)).toBe(3000);
    expect(monthlyExpenses(periods)).toBe(1500);
  });
});

describe("netBurn", () => {
  it("is null when either input is missing", () => {
    expect(netBurn(null, 500)).toBeNull();
    expect(netBurn(500, null)).toBeNull();
  });

  it("is expenses minus revenue in the normal case", () => {
    expect(netBurn(1000, 4000)).toBe(3000);
  });

  it("never goes negative — profitable months clamp to 0", () => {
    expect(netBurn(5000, 2000)).toBe(0);
  });

  it("is 0 for equal revenue and expenses", () => {
    expect(netBurn(2000, 2000)).toBe(0);
  });
});

describe("runwayMonths", () => {
  it("is unavailable when cash balance is missing", () => {
    expect(runwayMonths(null, 1000)).toEqual({ status: "unavailable", reason: "missing_cash" });
  });

  it("is unavailable when burn is missing", () => {
    expect(runwayMonths(10000, null)).toEqual({ status: "unavailable", reason: "missing_burn" });
  });

  it("is 'sustainable' (never Infinity) when burn is zero", () => {
    expect(runwayMonths(10000, 0)).toEqual({ status: "sustainable" });
  });

  it("computes months for a normal burning case", () => {
    const result = runwayMonths(9000, 3000);
    expect(result).toEqual({ status: "calculated", months: 3 });
  });
});

describe("revenueGrowth", () => {
  it("is null with fewer than two periods", () => {
    expect(revenueGrowth([period("2026-01", 1000, 500)])).toBeNull();
  });

  it("is null when the prior period had zero revenue", () => {
    expect(revenueGrowth([period("2026-01", 0, 500), period("2026-02", 1000, 500)])).toBeNull();
  });

  it("computes growth as a fraction between the two latest periods", () => {
    const growth = revenueGrowth([period("2026-01", 1000, 500), period("2026-02", 1200, 500)]);
    expect(growth).toBeCloseTo(0.2);
  });

  it("computes negative growth (decline)", () => {
    const growth = revenueGrowth([period("2026-01", 1000, 500), period("2026-02", 800, 500)]);
    expect(growth).toBeCloseTo(-0.2);
  });
});

describe("grossMargin", () => {
  it("is null when revenue or direct costs are missing", () => {
    expect(grossMargin(null, 100)).toBeNull();
    expect(grossMargin(1000, null)).toBeNull();
  });

  it("is null when revenue is zero (division by zero guard)", () => {
    expect(grossMargin(0, 0)).toBeNull();
  });

  it("computes margin in the normal case", () => {
    expect(grossMargin(1000, 400)).toBeCloseTo(0.6);
  });
});

describe("operatingResult", () => {
  it("is null when data is missing", () => {
    expect(operatingResult(null, 500)).toBeNull();
  });

  it("is positive when profitable, negative when not", () => {
    expect(operatingResult(5000, 3000)).toBe(2000);
    expect(operatingResult(1000, 3000)).toBe(-2000);
  });
});

describe("periodRevenueTotal / periodExpenseTotal", () => {
  it("sums entries and supports category scoping", () => {
    const p = period("2026-01", 1000, 500, 200);
    expect(periodRevenueTotal(p)).toBe(1000);
    expect(periodExpenseTotal(p)).toBe(500);
    expect(periodExpenseTotal(p, "direct_costs")).toBe(200);
    expect(periodExpenseTotal(p, "operations")).toBe(300);
  });
});

describe("projectForecastCash", () => {
  const periods: ForecastPeriod[] = [
    { id: "f1", month: "2026-05", projectedRevenue: { amount: 1000, currency: "XOF" }, projectedExpenses: { amount: 1500, currency: "XOF" }, assumptions: [] },
    { id: "f2", month: "2026-06", projectedRevenue: { amount: 1200, currency: "XOF" }, projectedExpenses: { amount: 1500, currency: "XOF" }, assumptions: [] },
  ];

  it("returns null projections when there is no starting cash and no override", () => {
    const result = projectForecastCash(undefined, periods);
    expect(result[0].projectedCash).toBeNull();
    expect(result[1].projectedCash).toBeNull();
  });

  it("accumulates deterministically from a starting cash balance", () => {
    const result = projectForecastCash(10000, periods);
    expect(result[0].projectedCash).toBe(9500);
    expect(result[1].projectedCash).toBe(9200);
  });

  it("resets the running base on an explicit founder override", () => {
    const withOverride: ForecastPeriod[] = [
      { ...periods[0], projectedCashBalance: { amount: 20000, currency: "XOF" } },
      periods[1],
    ];
    const result = projectForecastCash(10000, withOverride);
    expect(result[0].projectedCash).toBe(20000);
    expect(result[1].projectedCash).toBe(19700);
  });
});
