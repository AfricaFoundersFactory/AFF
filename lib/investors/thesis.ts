/**
 * Builds the narrow StartupMatchFacts shape the matching engine consumes,
 * from canonical Digital Twin + Financials data only (§12). Never reads
 * Community/expert/message data. Pure/deterministic — no persistence here.
 */
import type { StartupDigitalTwin } from "@/types/digital-twin";
import type { FundingRequirement } from "@/types/financials";
import type { StartupMatchFacts } from "./matching";

export function buildStartupMatchFacts(
  startupId: string,
  twin: StartupDigitalTwin,
  fundingRequirement: FundingRequirement | undefined,
): StartupMatchFacts {
  const countries = Array.from(new Set([twin.identity.country, ...twin.identity.operatingCountries].filter((c): c is string => Boolean(c?.trim()))));

  return {
    startupId,
    stage: twin.identity.stage,
    industry: twin.identity.industry,
    countries,
    businessModels: twin.businessModel.types,
    impactEnabled: twin.impact.enabled,
    impactThemes: twin.impact.sdgs,
    fundingRequirement: fundingRequirement
      ? {
          amount: fundingRequirement.amountSought.amount,
          currency: fundingRequirement.amountSought.currency,
          instrument: fundingRequirement.instrument,
        }
      : undefined,
  };
}
