import { describe, expect, it } from "vitest";
import { detectAllocationMode, validateAllocation } from "./funding";
import type { UseOfFundsAllocation } from "@/types/financials";

const amountSought = { amount: 100000, currency: "XOF" };

function pctRow(category: UseOfFundsAllocation["category"], percentage: number): UseOfFundsAllocation {
  return { id: category, category, percentage };
}
function amountRow(category: UseOfFundsAllocation["category"], amount: number): UseOfFundsAllocation {
  return { id: category, category, amount: { amount, currency: "XOF" } };
}

describe("detectAllocationMode", () => {
  it("detects empty, percentage, amount and mixed modes", () => {
    expect(detectAllocationMode([])).toBe("empty");
    expect(detectAllocationMode([pctRow("product", 50)])).toBe("percentage");
    expect(detectAllocationMode([amountRow("product", 500)])).toBe("amount");
    expect(detectAllocationMode([pctRow("product", 50), amountRow("hiring", 500)])).toBe("mixed");
  });
});

describe("validateAllocation", () => {
  it("rejects an empty allocation", () => {
    const result = validateAllocation([], amountSought);
    expect(result.valid).toBe(false);
    expect(result.mode).toBe("empty");
  });

  it("rejects mixed percentage/amount rows", () => {
    const result = validateAllocation([pctRow("product", 50), amountRow("hiring", 500)], amountSought);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("mixed_modes");
  });

  it("accepts percentages summing to exactly 100", () => {
    const result = validateAllocation(
      [pctRow("product", 40), pctRow("hiring", 35), pctRow("marketing", 25)],
      amountSought,
    );
    expect(result.valid).toBe(true);
  });

  it("rejects percentages that don't sum to 100", () => {
    const result = validateAllocation([pctRow("product", 40), pctRow("hiring", 35)], amountSought);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("percentage_mismatch");
  });

  it("accepts amounts summing to the amount sought", () => {
    const result = validateAllocation([amountRow("product", 60000), amountRow("hiring", 40000)], amountSought);
    expect(result.valid).toBe(true);
  });

  it("rejects amounts that don't sum to the amount sought", () => {
    const result = validateAllocation([amountRow("product", 60000), amountRow("hiring", 10000)], amountSought);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("amount_mismatch");
  });

  it("tolerates floating point rounding within epsilon", () => {
    const result = validateAllocation([pctRow("product", 33.33), pctRow("hiring", 33.33), pctRow("marketing", 33.34)], amountSought);
    expect(result.valid).toBe(true);
  });
});
