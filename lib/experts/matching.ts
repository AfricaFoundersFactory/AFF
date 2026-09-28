/**
 * Expert Matching V1 (AFF-DASH-07) — pure, deterministic, NO AI, NO opaque
 * score, NO percentage. Given a startup's context (needs + stage/industry/
 * languages/markets) and the expert directory, returns relevant experts with
 * human-readable reasons. Same inputs ALWAYS produce the same output: no
 * Date.now(), no randomness, no unstable sort (ties are broken by a stable
 * secondary key — expert.id — never insertion order of a Set/Map).
 *
 * Matching factors (see MATCH FACTORS below): expertise overlap, startup
 * stage, industry, market/geography, language, availability. This function
 * NEVER reads gender/ethnicity/religion/age or any other sensitive
 * attribute — ExpertProfile (types/experts.ts) has no such field to read.
 *
 * This is Expert Matching, wholly separate from AFF Readiness — see
 * lib/services/expert-metric-separation.test.ts. It never computes or
 * returns a score/percentage/"best expert" ranking value, only an ordered
 * list (most reasons first, ties broken by expert.id) plus reasons.
 */
import type { ExpertMatch, ExpertProfile, MatchReason, StartupNeed } from "@/types/experts";
import type { StartupStage } from "@/types/common";
import type { StartupDigitalTwin } from "@/types/digital-twin";
import type { ExpertLanguage } from "./taxonomy";

export type StartupMatchContext = {
  stage: StartupStage;
  industries: string[]; // free-text industry hints (from Digital Twin identity.industry), matched loosely
  languages: ExpertLanguage[]; // founder's preferred language(s)
  markets: string[]; // countries/markets the startup operates in
  needs: StartupNeed[];
};

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Reasons split into two tiers:
 *  - SUBSTANTIVE (expertise/stage/industry/market): what makes an expert
 *    actually relevant to this startup's needs/context.
 *  - SUPPLEMENTARY (language/availability): useful practical information,
 *    but never enough on their own to call an expert "relevant" — an expert
 *    who merely speaks the same language and happens to be available, with
 *    no expertise/stage/industry/market overlap, is not a match.
 * An expert only appears in matchExperts()'s results if at least one
 * substantive reason exists; supplementary reasons are then appended.
 */
function buildReasons(expert: ExpertProfile, ctx: StartupMatchContext): MatchReason[] {
  const substantive: MatchReason[] = [];

  // 1. Expertise overlap with the startup's open needs' categories.
  const neededCategories = new Set(ctx.needs.filter((n) => n.status === "OPEN").map((n) => n.category));
  const matchedCategories = expert.expertise.filter((e) => neededCategories.has(e));
  for (const category of matchedCategories) {
    substantive.push({ key: `expertise:${category}`, labelKey: "dashboard.experts.matching.reasons.expertise", data: { category } });
  }

  // 2. Startup stage.
  if (expert.startupStages.includes(ctx.stage)) {
    substantive.push({ key: "stage", labelKey: "dashboard.experts.matching.reasons.stage", data: { stage: ctx.stage } });
  }

  // 3. Industry (loose, case-insensitive match against expert.industries ids
  // — the caller passes normalized industry tokens derived from taxonomy).
  const industryTokens = new Set(ctx.industries.map(norm));
  const matchedIndustries = expert.industries.filter((i) => industryTokens.has(norm(i)));
  for (const industry of matchedIndustries) {
    substantive.push({ key: `industry:${industry}`, labelKey: "dashboard.experts.matching.reasons.industry", data: { industry } });
  }

  // 4. Market/geography.
  const marketTokens = new Set(ctx.markets.map(norm));
  const matchedMarkets = expert.markets.filter((m) => marketTokens.has(norm(m)));
  for (const market of matchedMarkets) {
    substantive.push({ key: `market:${market}`, labelKey: "dashboard.experts.matching.reasons.market", data: { market } });
  }

  if (substantive.length === 0) return [];

  const supplementary: MatchReason[] = [];

  // 5. Language.
  const matchedLanguages = expert.languages.filter((l) => ctx.languages.includes(l));
  for (const language of matchedLanguages) {
    supplementary.push({ key: `language:${language}`, labelKey: "dashboard.experts.matching.reasons.language", data: { language } });
  }

  // 6. Availability — a single reason, never a score.
  if (expert.availability === "AVAILABLE") {
    supplementary.push({ key: "availability", labelKey: "dashboard.experts.matching.reasons.available" });
  }

  return [...substantive, ...supplementary];
}

/**
 * Returns experts with at least one reason, most-relevant first. "Most
 * relevant" is defined ONLY as "has more reasons" (a count, not a score) —
 * ties broken deterministically by expert.id so repeated calls with the
 * same directory snapshot always return the same order.
 */
export function matchExperts(directory: ExpertProfile[], ctx: StartupMatchContext): ExpertMatch[] {
  const matches = directory
    .filter((e) => e.profileStatus === "ACTIVE")
    .map((expert) => ({ expert, reasons: buildReasons(expert, ctx) }))
    .filter((m) => m.reasons.length > 0);

  return matches.sort((a, b) => {
    if (b.reasons.length !== a.reasons.length) return b.reasons.length - a.reasons.length;
    return a.expert.id < b.expert.id ? -1 : a.expert.id > b.expert.id ? 1 : 0;
  });
}

/**
 * Explains why ONE specific expert may help a startup — used by the Expert
 * Profile page's "How this expert may help your startup" section. Same
 * reason-building logic as matchExperts, just scoped to a single expert and
 * never gated on profileStatus (a founder viewing a profile page should see
 * the real reasons even if, say, the profile is being reviewed).
 */
export function explainExpertMatch(expert: ExpertProfile, ctx: StartupMatchContext): MatchReason[] {
  return buildReasons(expert, ctx);
}

/**
 * Builds a StartupMatchContext from a Digital Twin + a founder's preferred
 * language(s) + already-derived needs. A small, honest read-only mapper —
 * never a second source of truth for stage/industry/market facts.
 */
export function buildStartupMatchContext(
  twin: StartupDigitalTwin,
  needs: StartupNeed[],
  preferredLanguages: ExpertLanguage[] = [],
): StartupMatchContext {
  const industries = [twin.identity.industry, twin.identity.subIndustry].filter((v): v is string => Boolean(v));
  const markets = [twin.identity.country, ...twin.identity.operatingCountries, ...twin.market.geographies].filter(Boolean);
  return {
    stage: twin.identity.stage,
    industries,
    languages: preferredLanguages,
    markets,
    needs,
  };
}

/** Matching for a single manually-picked category (the "Find Help" flow when no need is selected). */
export function matchExpertsForCategory(
  directory: ExpertProfile[],
  category: StartupNeed["category"],
  ctx: Omit<StartupMatchContext, "needs">,
): ExpertMatch[] {
  const syntheticNeed: StartupNeed = {
    id: "synthetic",
    startupId: "synthetic",
    sourceType: "FOUNDER_DECLARED",
    category,
    title: "",
    description: "",
    urgency: "MEDIUM",
    status: "OPEN",
    createdAt: new Date(0).toISOString(),
  };
  return matchExperts(directory, { ...ctx, needs: [syntheticNeed] });
}
