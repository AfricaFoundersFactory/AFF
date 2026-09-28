/**
 * Stage-aware Data Room checklist catalog. A requirement only applies to
 * the stages listed in `stages` — an idea-stage startup is never shown
 * (or penalized for lacking) a Series-A-only document like previous
 * investment docs or a cap table.
 */
import type { StartupStage } from "@/types/common";
import type { DataRoomChecklist, DataRoomDocument, DocumentRequirement } from "@/types/data-room";

const ALL_STAGES: StartupStage[] = ["idea", "mvp", "early_traction", "growth", "scale"];
const FROM_MVP: StartupStage[] = ["mvp", "early_traction", "growth", "scale"];
const FROM_TRACTION: StartupStage[] = ["early_traction", "growth", "scale"];
const GROWTH_AND_SCALE: StartupStage[] = ["growth", "scale"];

export const DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  // Corporate
  { key: "certificate_of_incorporation", category: "corporate", titleKey: "certificateOfIncorporation", stages: FROM_MVP },
  { key: "cap_table", category: "corporate", titleKey: "capTable", stages: FROM_TRACTION },
  { key: "bylaws", category: "corporate", titleKey: "bylaws", stages: FROM_MVP },
  // Finance
  { key: "historical_financials", category: "finance", titleKey: "historicalFinancials", stages: FROM_TRACTION },
  { key: "forecast", category: "finance", titleKey: "forecast", stages: ALL_STAGES },
  { key: "bank_cash_evidence", category: "finance", titleKey: "bankCashEvidence", stages: FROM_TRACTION },
  // Fundraising
  { key: "pitch_deck", category: "fundraising", titleKey: "pitchDeck", stages: ALL_STAGES },
  { key: "funding_requirement", category: "fundraising", titleKey: "fundingRequirement", stages: ALL_STAGES },
  { key: "previous_investment_docs", category: "fundraising", titleKey: "previousInvestmentDocs", stages: GROWTH_AND_SCALE },
  // Commercial
  { key: "customer_contracts", category: "commercial", titleKey: "customerContracts", stages: FROM_TRACTION },
  { key: "traction_evidence", category: "commercial", titleKey: "tractionEvidence", stages: FROM_MVP },
  // Team
  { key: "founder_info", category: "team", titleKey: "founderInfo", stages: ALL_STAGES },
  { key: "key_employment_info", category: "team", titleKey: "keyEmploymentInfo", stages: FROM_TRACTION },
  // IP
  { key: "ip_ownership_evidence", category: "ip", titleKey: "ipOwnershipEvidence", stages: FROM_MVP },
];

export function requirementsForStage(stage: StartupStage): DocumentRequirement[] {
  return DOCUMENT_REQUIREMENTS.filter((r) => r.stages.includes(stage));
}

export function buildChecklist(startupId: string, stage: StartupStage, documents: DataRoomDocument[]): DataRoomChecklist {
  const requirements = requirementsForStage(stage);
  const items = requirements.map((requirement) => {
    const doc = documents.find((d) => d.requirementKey === requirement.key);
    return {
      requirement,
      status: doc?.status ?? "missing",
      documentId: doc?.id,
    } as const;
  });
  return { startupId, stage, items };
}
