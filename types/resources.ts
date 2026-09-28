// AFF Founder Knowledge Hub domain model (AFF-DASH-08 Part C).
//
// A structured library, not a CMS/blog — content is seeded in
// lib/services/resources.ts as short original AFF demo content or
// structured templates. No copyrighted external articles, no scraped
// content, no fabricated partnerships. AFF_RESOURCE vs EXTERNAL_RESOURCE is
// always explicit so the UI can label the source honestly.
//
// Recommendations are deterministic (lib/resources/recommendation.ts),
// derived from readiness gaps / pitch gaps / financial signals / stage —
// NEVER an AI suggestion, never a score. No fabricated "N founders viewed
// this" style counters.

import type { LocalizedText } from "./opportunity";
import type { StartupStage } from "./common";

export type { LocalizedText };

export type ResourceCategory =
  | "STARTUP_BASICS"
  | "PROBLEM_VALIDATION"
  | "PRODUCT"
  | "MARKET"
  | "BUSINESS_MODEL"
  | "SALES"
  | "MARKETING"
  | "FINANCE"
  | "FUNDRAISING"
  | "PITCH"
  | "LEGAL"
  | "OPERATIONS"
  | "TEAM"
  | "IMPACT_ESG";

export type ResourceFormat = "GUIDE" | "CHECKLIST" | "TEMPLATE" | "VIDEO" | "ARTICLE" | "TOOL" | "FRAMEWORK";

// "ANY" = relevant regardless of stage.
export type ResourceStage = StartupStage | "ANY";

export type ResourceOrigin = "AFF_RESOURCE" | "EXTERNAL_RESOURCE";

export type Resource = {
  id: string; // stable, locale-neutral (e.g. "res-fundraising-checklist")
  title: LocalizedText;
  description: LocalizedText;
  category: ResourceCategory;
  format: ResourceFormat;
  stages: ResourceStage[];
  estimatedMinutes?: number;
  origin: ResourceOrigin;
  // Only ever a known-safe generic/example URL, and only for
  // EXTERNAL_RESOURCE entries — never a fabricated partner link.
  externalUrl?: string;
  languages: string[]; // "en" | "fr"
  createdAt: string;
};

export type ResourceRecommendationReasonKind =
  | "READINESS_GAP"
  | "PITCH_GAP"
  | "FINANCIAL_SIGNAL"
  | "ROADMAP_NEED"
  | "STAGE";

export type ResourceRecommendationReason = {
  kind: ResourceRecommendationReasonKind;
  labelKey: string;
  data?: Record<string, string>;
};

export type ResourceRecommendation = {
  resource: Resource;
  reasons: ResourceRecommendationReason[];
};

export type ResourceBookmark = {
  startupId: string;
  resourceId: string;
  savedAt: string;
};
