"use server";

/**
 * Server Action boundary for the Financial Command Center — the only way
 * client components create/mutate a financial period, cash position,
 * forecast or funding requirement. Delegates to lib/services/financials.ts
 * and revalidates the dashboard routes on success, exactly like
 * lib/actions/roadmap.ts.
 */
import { revalidatePath } from "next/cache";
import * as financialsService from "@/lib/services/financials";
import { isNonEmpty } from "@/lib/validation";
import type { CashPosition, FinancialPeriod, FinancialProfile, ForecastPeriod, UseOfFundsAllocation } from "@/types/financials";
import type { FundingInstrument, FundingStatus } from "@/types/digital-twin";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function nowIso(): string {
  return new Date().toISOString();
}

function revalidateDashboard() {
  revalidatePath("/[locale]/dashboard", "layout");
}

function guard<T>(fn: () => T): Result<T> {
  try {
    const data = fn();
    revalidateDashboard();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function upsertPeriodAction(
  startupId: string,
  input: Omit<FinancialPeriod, "id" | "startupId" | "createdAt" | "updatedAt"> & { id?: string },
): Promise<Result<FinancialProfile>> {
  if (!isNonEmpty(input.month)) return { ok: false, error: "validation" };
  return guard(() => financialsService.upsertPeriod(startupId, input, nowIso()));
}

export async function removePeriodAction(startupId: string, periodId: string): Promise<Result<FinancialProfile>> {
  if (!isNonEmpty(periodId)) return { ok: false, error: "validation" };
  return guard(() => financialsService.removePeriod(startupId, periodId));
}

export async function setCashPositionAction(startupId: string, cashPosition: CashPosition): Promise<Result<FinancialProfile>> {
  return guard(() => financialsService.setCashPosition(startupId, cashPosition));
}

export async function setForecastAction(
  startupId: string,
  input: { startingCashBalance?: CashPosition["balance"]; periods: ForecastPeriod[] },
): Promise<Result<FinancialProfile>> {
  return guard(() => financialsService.setForecast(startupId, input, nowIso()));
}

export async function setFundingRequirementAction(
  startupId: string,
  input: {
    amountSought: CashPosition["balance"];
    instrument: FundingInstrument;
    targetDate?: string;
    intendedRunwayExtensionMonths?: number;
    allocation: UseOfFundsAllocation[];
    status: FundingStatus;
  },
): Promise<Result<FinancialProfile>> {
  return guard(() => financialsService.setFundingRequirement(startupId, input, nowIso()));
}
