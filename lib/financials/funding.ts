/**
 * Pure validation for a Funding Requirement's use-of-funds allocation.
 * Founders can allocate by percentage OR by absolute amount per category —
 * never both mixed into one total, since that would silently misrepresent
 * what "100%" means. This module only validates; it never invents a
 * missing allocation row.
 */
import type { MonetaryAmount } from "@/types/common";
import type { UseOfFundsAllocation } from "@/types/financials";

const EPSILON = 0.01; // tolerate floating point rounding, not real gaps

export type AllocationMode = "percentage" | "amount" | "empty" | "mixed";

export function detectAllocationMode(allocation: UseOfFundsAllocation[]): AllocationMode {
  if (allocation.length === 0) return "empty";
  const hasPct = allocation.some((a) => a.percentage !== undefined);
  const hasAmount = allocation.some((a) => a.amount !== undefined);
  if (hasPct && hasAmount) return "mixed";
  if (hasPct) return "percentage";
  if (hasAmount) return "amount";
  return "empty";
}

export type AllocationValidationResult =
  | { valid: true; mode: AllocationMode; totalPct?: number; totalAmount?: number }
  | { valid: false; mode: AllocationMode; reason: "mixed_modes" | "percentage_mismatch" | "amount_mismatch" | "empty"; totalPct?: number; totalAmount?: number };

/**
 * Validates that a use-of-funds allocation sums correctly against the
 * amount actually sought:
 *  - percentage mode: percentages must sum to 100 (within EPSILON)
 *  - amount mode: amounts must sum to amountSought.amount (within EPSILON)
 *  - mixing both modes in the same allocation is rejected outright — the
 *    founder must pick one consistent representation.
 */
export function validateAllocation(
  allocation: UseOfFundsAllocation[],
  amountSought: MonetaryAmount,
): AllocationValidationResult {
  const mode = detectAllocationMode(allocation);

  if (mode === "empty") return { valid: false, mode, reason: "empty" };
  if (mode === "mixed") return { valid: false, mode, reason: "mixed_modes" };

  if (mode === "percentage") {
    const totalPct = allocation.reduce((sum, a) => sum + (a.percentage ?? 0), 0);
    const valid = Math.abs(totalPct - 100) <= EPSILON;
    return valid ? { valid: true, mode, totalPct } : { valid: false, mode, reason: "percentage_mismatch", totalPct };
  }

  // mode === "amount"
  const totalAmount = allocation.reduce((sum, a) => sum + (a.amount?.amount ?? 0), 0);
  const valid = Math.abs(totalAmount - amountSought.amount) <= EPSILON;
  return valid ? { valid: true, mode, totalAmount } : { valid: false, mode, reason: "amount_mismatch", totalAmount };
}
