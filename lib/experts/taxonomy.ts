/**
 * Controlled Expertise Taxonomy (AFF-DASH-07). Stable IDs only — every place
 * in the codebase that needs an expertise category MUST reference one of
 * these IDs (never an ad hoc string). Localized labels live under the i18n
 * key `dashboard.experts.expertise.<id>` in messages/{en,fr}.json — this file
 * intentionally holds no translated strings.
 *
 * A subset of these IDs (see INDUSTRY_EXPERTISE_IDS) doubles as an
 * "industry" tag on ExpertProfile.industries — rather than inventing a
 * second, competing industry taxonomy, industry-shaped expertise areas
 * (AgriTech, FinTech, HealthTech, Climate, Logistics, Marketplace, SaaS,
 * B2B, B2C) are simply the same controlled IDs used in a different field.
 */

export type ExpertiseCategoryId =
  | "STRATEGY"
  | "PROBLEM_MARKET_VALIDATION"
  | "PRODUCT"
  | "TECHNOLOGY"
  | "AI_DATA"
  | "UX_DESIGN"
  | "BUSINESS_MODEL"
  | "GO_TO_MARKET"
  | "SALES"
  | "MARKETING"
  | "GROWTH"
  | "OPERATIONS"
  | "FINANCE"
  | "FINANCIAL_MODELING"
  | "FUNDRAISING"
  | "INVESTOR_RELATIONS"
  | "PITCHING"
  | "LEGAL"
  | "GOVERNANCE"
  | "COMPLIANCE"
  | "IP"
  | "HR_TALENT"
  | "LEADERSHIP"
  | "IMPACT_ESG"
  | "AGRITECH"
  | "FINTECH"
  | "HEALTHTECH"
  | "CLIMATE"
  | "LOGISTICS"
  | "MARKETPLACE"
  | "SAAS"
  | "B2B"
  | "B2C";

export const EXPERTISE_CATEGORY_IDS: ExpertiseCategoryId[] = [
  "STRATEGY",
  "PROBLEM_MARKET_VALIDATION",
  "PRODUCT",
  "TECHNOLOGY",
  "AI_DATA",
  "UX_DESIGN",
  "BUSINESS_MODEL",
  "GO_TO_MARKET",
  "SALES",
  "MARKETING",
  "GROWTH",
  "OPERATIONS",
  "FINANCE",
  "FINANCIAL_MODELING",
  "FUNDRAISING",
  "INVESTOR_RELATIONS",
  "PITCHING",
  "LEGAL",
  "GOVERNANCE",
  "COMPLIANCE",
  "IP",
  "HR_TALENT",
  "LEADERSHIP",
  "IMPACT_ESG",
  "AGRITECH",
  "FINTECH",
  "HEALTHTECH",
  "CLIMATE",
  "LOGISTICS",
  "MARKETPLACE",
  "SAAS",
  "B2B",
  "B2C",
];

// The industry-shaped subset of the taxonomy — used to populate
// ExpertProfile.industries and the directory's "industry" filter, so
// industries are never a second uncontrolled string list.
export const INDUSTRY_EXPERTISE_IDS: ExpertiseCategoryId[] = [
  "AGRITECH",
  "FINTECH",
  "HEALTHTECH",
  "CLIMATE",
  "LOGISTICS",
  "MARKETPLACE",
  "SAAS",
  "B2B",
  "B2C",
];

export function isValidExpertiseCategory(id: string): id is ExpertiseCategoryId {
  return (EXPERTISE_CATEGORY_IDS as string[]).includes(id);
}

export function labelKeyForExpertise(id: ExpertiseCategoryId): string {
  return `dashboard.experts.expertise.${id}`;
}

// ---------------------------------------------------------------------------
// AFF Readiness dimension -> expertise category mapping. Locale-neutral,
// read by lib/experts/needs.ts only (never by the Readiness engine itself —
// this mapping does not and must not feed back into a Readiness score).
// ---------------------------------------------------------------------------
import type { DimensionKey } from "@/types/readiness-engine";

export const READINESS_DIMENSION_TO_EXPERTISE: Record<DimensionKey, ExpertiseCategoryId[]> = {
  problem_market: ["PROBLEM_MARKET_VALIDATION", "STRATEGY"],
  product: ["PRODUCT", "TECHNOLOGY"],
  business_model: ["BUSINESS_MODEL"],
  traction: ["GROWTH", "GO_TO_MARKET"],
  team: ["HR_TALENT", "LEADERSHIP"],
  finance: ["FINANCE", "FINANCIAL_MODELING"],
  fundraising: ["FUNDRAISING", "INVESTOR_RELATIONS", "PITCHING"],
  operations: ["OPERATIONS"],
  legal_governance: ["LEGAL", "GOVERNANCE", "COMPLIANCE"],
  impact_esg: ["IMPACT_ESG"],
};

// ---------------------------------------------------------------------------
// Controlled languages — Africa/diaspora context, at minimum
// French/English/Arabic/Portuguese. Extend, never freeform.
// ---------------------------------------------------------------------------
export type ExpertLanguage = "fr" | "en" | "ar" | "pt";
export const EXPERT_LANGUAGES: ExpertLanguage[] = ["fr", "en", "ar", "pt"];

// ---------------------------------------------------------------------------
// Founder "I need help with..." categories for the Find Help entry point.
// These map 1:1 onto expertise categories used as the primary lens for a
// manually-declared need (a founder picking "Fundraising" declares a need in
// category FUNDRAISING, etc.) — kept as a curated subset (not all 32 IDs are
// sensible top-level founder-facing choices).
// ---------------------------------------------------------------------------
export const FOUNDER_HELP_CATEGORIES: ExpertiseCategoryId[] = [
  "FUNDRAISING",
  "FINANCE",
  "PITCHING",
  "PRODUCT",
  "SALES",
  "MARKETING",
  "TECHNOLOGY",
  "LEGAL",
  "HR_TALENT",
  "OPERATIONS",
  "STRATEGY",
];
