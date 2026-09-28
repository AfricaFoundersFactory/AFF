/**
 * Investor Q&A catalog (Part 17) — static, hand-authored question bank.
 * Same "template ID + translation key" convention as
 * lib/roadmap/action-catalog.ts: no AI generation anywhere in this file or
 * lib/pitch/qna-selector.ts, which only filters/substitutes among these
 * fixed ids deterministically based on Digital Twin facts.
 */
import type { QnaQuestionTemplate } from "@/types/pitch";

const NS = "dashboard.pitch.qna.catalog";

export const QNA_CATALOG: QnaQuestionTemplate[] = [
  // Problem
  { id: "problem_why_matters", category: "problem", questionKey: `${NS}.problem_why_matters` },
  { id: "problem_evidence", category: "problem", questionKey: `${NS}.problem_evidence` },

  // Market
  { id: "market_size", category: "market", questionKey: `${NS}.market_size` },
  { id: "market_why_now", category: "market", questionKey: `${NS}.market_why_now` },

  // Product
  { id: "product_defensibility", category: "product", questionKey: `${NS}.product_defensibility` },
  { id: "product_roadmap", category: "product", questionKey: `${NS}.product_roadmap` },

  // Competition
  { id: "competition_who_else", category: "competition", questionKey: `${NS}.competition_who_else` },
  { id: "competition_moat", category: "competition", questionKey: `${NS}.competition_moat` },

  // Business model
  { id: "business_model_pricing", category: "business_model", questionKey: `${NS}.business_model_pricing` },
  {
    id: "business_model_marketplace_dynamics",
    category: "business_model",
    questionKey: `${NS}.business_model_marketplace_dynamics`,
    requiresBusinessModel: ["marketplace"],
  },

  // Traction — revenue-dependent pair (fallback rule, Part 18 example)
  {
    id: "traction_mrr_growth",
    category: "traction",
    questionKey: `${NS}.traction_mrr_growth`,
    requiresRevenue: true,
  },
  {
    id: "traction_monetization_timing",
    category: "traction",
    questionKey: `${NS}.traction_monetization_timing`,
    fallbackForId: "traction_mrr_growth",
  },
  { id: "traction_retention", category: "traction", questionKey: `${NS}.traction_retention` },

  // Team
  { id: "team_gaps", category: "team", questionKey: `${NS}.team_gaps` },
  { id: "team_why_you", category: "team", questionKey: `${NS}.team_why_you` },

  // Financials
  { id: "financials_burn_runway", category: "financials", questionKey: `${NS}.financials_burn_runway` },
  { id: "financials_path_to_profitability", category: "financials", questionKey: `${NS}.financials_path_to_profitability` },

  // Fundraising — only relevant when raising
  {
    id: "fundraising_use_of_funds",
    category: "fundraising",
    questionKey: `${NS}.fundraising_use_of_funds`,
    requiresFundraising: true,
  },
  {
    id: "fundraising_valuation",
    category: "fundraising",
    questionKey: `${NS}.fundraising_valuation`,
    requiresFundraising: true,
  },

  // Risks
  { id: "risks_biggest", category: "risks", questionKey: `${NS}.risks_biggest` },
  { id: "risks_regulatory", category: "risks", questionKey: `${NS}.risks_regulatory` },

  // Vision
  { id: "vision_five_years", category: "vision", questionKey: `${NS}.vision_five_years` },
  { id: "vision_exit", category: "vision", questionKey: `${NS}.vision_exit` },
];
