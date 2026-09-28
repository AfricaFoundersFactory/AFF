/**
 * Canonical Pitch Section catalog (AFF-DASH-05 Part 4) — static
 * configuration, not logic. Mirrors the spirit of
 * lib/readiness/framework.ts and lib/roadmap/action-catalog.ts: data lives
 * here, pure functions that consume it live elsewhere.
 *
 * Section identifiers (PitchSectionType) are stable and locale-neutral.
 * Founder-facing labels/guidance are translation keys only, under
 * messages/{en,fr}.json → dashboard.pitch.sections.<type>.*.
 */
import type { PitchObjective, PitchSectionType, PitchType } from "@/types/pitch";

export type SectionDefinition = {
  type: PitchSectionType;
  order: number;
  titleKey: string;
  guidanceKey: string;
  // Sections a founder cannot remove — always shown even if not
  // "applicable" for a given pitch type, but greyed as optional in that case.
  alwaysRequired: boolean;
};

const NS = "dashboard.pitch.sections";

export const SECTION_DEFINITIONS: SectionDefinition[] = [
  { type: "hook", order: 1, titleKey: `${NS}.hook.title`, guidanceKey: `${NS}.hook.guidance`, alwaysRequired: true },
  { type: "problem", order: 2, titleKey: `${NS}.problem.title`, guidanceKey: `${NS}.problem.guidance`, alwaysRequired: true },
  { type: "solution", order: 3, titleKey: `${NS}.solution.title`, guidanceKey: `${NS}.solution.guidance`, alwaysRequired: true },
  { type: "product", order: 4, titleKey: `${NS}.product.title`, guidanceKey: `${NS}.product.guidance`, alwaysRequired: false },
  { type: "market", order: 5, titleKey: `${NS}.market.title`, guidanceKey: `${NS}.market.guidance`, alwaysRequired: false },
  {
    type: "business_model",
    order: 6,
    titleKey: `${NS}.business_model.title`,
    guidanceKey: `${NS}.business_model.guidance`,
    alwaysRequired: false,
  },
  { type: "traction", order: 7, titleKey: `${NS}.traction.title`, guidanceKey: `${NS}.traction.guidance`, alwaysRequired: true },
  {
    type: "competition",
    order: 8,
    titleKey: `${NS}.competition.title`,
    guidanceKey: `${NS}.competition.guidance`,
    alwaysRequired: false,
  },
  {
    type: "go_to_market",
    order: 9,
    titleKey: `${NS}.go_to_market.title`,
    guidanceKey: `${NS}.go_to_market.guidance`,
    alwaysRequired: false,
  },
  { type: "team", order: 10, titleKey: `${NS}.team.title`, guidanceKey: `${NS}.team.guidance`, alwaysRequired: false },
  {
    type: "financials",
    order: 11,
    titleKey: `${NS}.financials.title`,
    guidanceKey: `${NS}.financials.guidance`,
    alwaysRequired: false,
  },
  {
    type: "fundraising_ask",
    order: 12,
    titleKey: `${NS}.fundraising_ask.title`,
    guidanceKey: `${NS}.fundraising_ask.guidance`,
    alwaysRequired: true,
  },
  {
    type: "vision_impact",
    order: 13,
    titleKey: `${NS}.vision_impact.title`,
    guidanceKey: `${NS}.vision_impact.guidance`,
    alwaysRequired: false,
  },
  { type: "closing", order: 14, titleKey: `${NS}.closing.title`, guidanceKey: `${NS}.closing.guidance`, alwaysRequired: false },
];

export const ALL_SECTION_TYPES: PitchSectionType[] = SECTION_DEFINITIONS.map((s) => s.type);

// ---------------------------------------------------------------------------
// Applicability — deterministic, pitch-type/objective-aware (Part 4). Never
// force all 14 sections on a 1-minute pitch; never omit sections that don't
// fit the available time from an investor deck.
// ---------------------------------------------------------------------------

const SHORT_FORMAT_SECTIONS: PitchSectionType[] = ["hook", "problem", "solution", "traction", "fundraising_ask"];

const THREE_MINUTE_SECTIONS: PitchSectionType[] = [
  "hook",
  "problem",
  "solution",
  "market",
  "traction",
  "business_model",
  "fundraising_ask",
];

const FIVE_MINUTE_SECTIONS: PitchSectionType[] = [
  "hook",
  "problem",
  "solution",
  "product",
  "market",
  "business_model",
  "traction",
  "competition",
  "team",
  "fundraising_ask",
];

export function applicableSectionTypes(pitchType: PitchType, objective: PitchObjective): PitchSectionType[] {
  let base: PitchSectionType[];
  switch (pitchType) {
    case "elevator":
    case "one_minute":
      base = SHORT_FORMAT_SECTIONS;
      break;
    case "three_minute":
      base = THREE_MINUTE_SECTIONS;
      break;
    case "five_minute":
      base = FIVE_MINUTE_SECTIONS;
      break;
    case "investor_deck":
    case "custom":
    default:
      base = ALL_SECTION_TYPES;
      break;
  }

  const set = new Set(base);
  // Fundraising objective always needs a clear ask, regardless of format.
  if (objective === "fundraising") set.add("fundraising_ask");
  // Non-fundraising short pitches don't need to force an "ask" section —
  // but we keep it as a soft/optional closing-style ask rather than remove
  // it entirely, since every pitch benefits from a clear next step.
  return ALL_SECTION_TYPES.filter((t) => set.has(t));
}

export function isSectionRequired(type: PitchSectionType, pitchType: PitchType, objective: PitchObjective): boolean {
  const def = SECTION_DEFINITIONS.find((s) => s.type === type);
  if (!def) return false;
  if (def.alwaysRequired) return true;
  return applicableSectionTypes(pitchType, objective).includes(type);
}

export function sectionDefinition(type: PitchSectionType): SectionDefinition {
  const def = SECTION_DEFINITIONS.find((s) => s.type === type);
  if (!def) throw new Error(`Unknown pitch section type "${type}"`);
  return def;
}
