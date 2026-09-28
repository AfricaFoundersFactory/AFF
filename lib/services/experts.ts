/**
 * Expert directory + Startup Need service boundary — the only place an
 * ExpertProfile is created/read/verified, and the only place a
 * FOUNDER_DECLARED StartupNeed is persisted. Same in-memory Map pattern as
 * lib/services/roadmap.ts / lib/services/pitch.ts.
 *
 * Verification is EXPLICIT ONLY (verifyExpert / markProfileReviewed) — no
 * function here ever defaults an expert to a verified state, and seeding
 * below deliberately gives most demo experts UNVERIFIED status.
 *
 * listStartupNeeds() merges LIVE derived needs (lib/experts/needs.ts —
 * recomputed fresh every call, never cached/stale) with persisted
 * FOUNDER_DECLARED needs. Nothing here mutates readiness/financials/pitch/
 * data-room/roadmap — see lib/services/expert-metric-separation.test.ts.
 *
 * Expert-facing / admin-facing future boundary: listExperts/getExpert/
 * verifyExpert/updateExpertProfile are written so an expert-facing profile
 * editor or an admin verification console could call these SAME functions
 * later with a different caller identity — no separate expert/admin service
 * needs to be built for that; only new UI would be added.
 */
import { randomUUID } from "crypto";
import type {
  ExpertAvailability,
  ExpertProfile,
  ExpertVerificationStatus,
  StartupNeed,
} from "@/types/experts";
import { deriveAllNeeds, buildFounderDeclaredNeed } from "@/lib/experts/needs";
import type { ExpertiseCategoryId } from "@/lib/experts/taxonomy";
import { listStartupIds } from "@/lib/services/digital-twin";

const directory = new Map<string, ExpertProfile>();
const founderNeeds = new Map<string, StartupNeed[]>();

// ---------------------------------------------------------------------------
// Directory
// ---------------------------------------------------------------------------

export type ExpertFilters = {
  expertise?: ExpertiseCategoryId;
  industry?: ExpertiseCategoryId;
  stage?: ExpertProfile["startupStages"][number];
  language?: ExpertProfile["languages"][number];
  country?: string;
  availability?: ExpertAvailability;
};

export function listExperts(filters?: ExpertFilters): ExpertProfile[] {
  let experts = Array.from(directory.values()).filter((e) => e.profileStatus === "ACTIVE");
  if (!filters) return experts;
  if (filters.expertise) experts = experts.filter((e) => e.expertise.includes(filters.expertise!));
  if (filters.industry) experts = experts.filter((e) => e.industries.includes(filters.industry!));
  if (filters.stage) experts = experts.filter((e) => e.startupStages.includes(filters.stage!));
  if (filters.language) experts = experts.filter((e) => e.languages.includes(filters.language!));
  if (filters.country) experts = experts.filter((e) => e.country === filters.country);
  if (filters.availability) experts = experts.filter((e) => e.availability === filters.availability);
  return experts;
}

export function getExpert(expertId: string): ExpertProfile | undefined {
  return directory.get(expertId);
}

function requireExpert(expertId: string): ExpertProfile {
  const expert = directory.get(expertId);
  if (!expert) throw new Error(`No expert profile "${expertId}" found`);
  return expert;
}

export function createExpertProfile(
  input: Omit<ExpertProfile, "id" | "createdAt" | "updatedAt" | "verificationStatus" | "profileStatus"> & {
    profileStatus?: ExpertProfile["profileStatus"];
  },
  nowIso: string,
): ExpertProfile {
  const profile: ExpertProfile = {
    ...input,
    id: randomUUID(),
    profileStatus: input.profileStatus ?? "ACTIVE",
    verificationStatus: "UNVERIFIED",
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  directory.set(profile.id, profile);
  return profile;
}

export function updateExpertProfile(expertId: string, patch: Partial<ExpertProfile>, nowIso: string): ExpertProfile {
  const existing = requireExpert(expertId);
  const updated: ExpertProfile = { ...existing, ...patch, id: existing.id, updatedAt: nowIso };
  directory.set(expertId, updated);
  return updated;
}

/**
 * The ONLY path by which an expert becomes PROFILE_REVIEWED — an explicit
 * AFF-team action, never a default.
 */
export function markProfileReviewed(expertId: string, nowIso: string): ExpertProfile {
  return updateExpertProfile(expertId, { verificationStatus: "PROFILE_REVIEWED" }, nowIso);
}

/**
 * The ONLY path by which an expert becomes AFF_VERIFIED — an explicit
 * "admin action" (spec part: Expert Verification Foundation). Never called
 * as a default/side effect of anything else. This is a verification of
 * IDENTITY/PROFILE ACCURACY, not an expertise-quality score — see
 * lib/services/expert-metric-separation.test.ts.
 */
export function verifyExpert(expertId: string, nowIso: string): ExpertProfile {
  return updateExpertProfile(expertId, { verificationStatus: "AFF_VERIFIED" as ExpertVerificationStatus }, nowIso);
}

/** Test-only reset hook so isolated tests don't leak state across files. */
export function __resetExpertsStoreForTests() {
  directory.clear();
  founderNeeds.clear();
}

// ---------------------------------------------------------------------------
// Startup needs
// ---------------------------------------------------------------------------

function founderNeedsFor(startupId: string): StartupNeed[] {
  return founderNeeds.get(startupId) ?? [];
}

/** Founder-declared need — "I need help with X" — always a valid path even with incomplete startup data. */
export function declareFounderNeed(
  startupId: string,
  input: { category: ExpertiseCategoryId; title: string; description?: string },
  nowIso: string,
): StartupNeed {
  const need = buildFounderDeclaredNeed(startupId, input, nowIso);
  founderNeeds.set(startupId, [...founderNeedsFor(startupId), need]);
  return need;
}

export function updateNeedStatus(startupId: string, needId: string, status: StartupNeed["status"], nowIso: string): StartupNeed {
  const list = founderNeedsFor(startupId);
  const existing = list.find((n) => n.id === needId);
  if (!existing) {
    throw new Error(`No founder-declared need "${needId}" found for startup "${startupId}" (derived needs cannot have their status changed directly).`);
  }
  const updated: StartupNeed = { ...existing, status, resolvedAt: status === "RESOLVED" || status === "DISMISSED" ? nowIso : existing.resolvedAt };
  founderNeeds.set(startupId, list.map((n) => (n.id === needId ? updated : n)));
  return updated;
}

/**
 * Read accessor combining LIVE derived needs (never cached) with persisted
 * founder-declared needs for this startup. Never returns another startup's
 * needs — see lib/services/support-requests.test.ts / mentoring isolation
 * tests for the cross-startup assertion.
 */
export function listStartupNeeds(startupId: string, nowIso: string): StartupNeed[] {
  const derived = deriveAllNeeds(startupId, nowIso);
  const declared = founderNeedsFor(startupId);
  return [...derived, ...declared];
}

export function getNeed(startupId: string, needId: string, nowIso: string): StartupNeed | undefined {
  return listStartupNeeds(startupId, nowIso).find((n) => n.id === needId);
}

// ---------------------------------------------------------------------------
// Seed: 10 fictional demo experts across the AFF footprint + diaspora.
// verificationStatus is deliberately mixed — most UNVERIFIED, a couple
// PROFILE_REVIEWED, exactly one explicitly AFF_VERIFIED via verifyExpert()
// (never a default). None of these are real people.
// ---------------------------------------------------------------------------
function seedDemoExperts() {
  if (directory.size > 0) return;
  const seedIso = new Date().toISOString();

  const seed = (input: Omit<ExpertProfile, "id" | "createdAt" | "updatedAt" | "verificationStatus" | "profileStatus">) =>
    createExpertProfile(input, seedIso);

  const e1 = seed({
    displayName: "Aïcha Koné",
    headline: "Fundraising & investor relations advisor for early-traction African startups",
    bio: "15 years advising founders across West Africa on seed and Series A raises, cap table structuring and investor narratives.",
    country: "Côte d'Ivoire",
    city: "Abidjan",
    languages: ["fr", "en"],
    expertise: ["FUNDRAISING", "INVESTOR_RELATIONS", "PITCHING", "FINANCIAL_MODELING"],
    industries: ["AGRITECH", "FINTECH"],
    startupStages: ["early_traction", "growth"],
    markets: ["Côte d'Ivoire", "Senegal", "Mali"],
    yearsExperience: 15,
    availability: "AVAILABLE",
    hoursPerMonth: 6,
    mentoringFormats: ["VIDEO_CALL", "DOCUMENT_REVIEW", "PITCH_REVIEW"],
    currentRole: "Independent Advisor",
  });

  const e2 = seed({
    displayName: "Moussa Diagne",
    headline: "Go-to-market & sales operator, agri and logistics marketplaces",
    bio: "Built and scaled B2B sales teams for two agri-marketplace startups in Senegal before becoming a full-time mentor.",
    country: "Senegal",
    city: "Dakar",
    languages: ["fr"],
    expertise: ["GO_TO_MARKET", "SALES", "MARKETPLACE", "AGRITECH"],
    industries: ["AGRITECH", "MARKETPLACE"],
    startupStages: ["mvp", "early_traction"],
    markets: ["Senegal", "Mali", "Côte d'Ivoire"],
    yearsExperience: 9,
    availability: "LIMITED",
    hoursPerMonth: 2,
    mentoringFormats: ["VIDEO_CALL", "CHAT"],
    currentRole: "Head of Sales",
    organization: "Teranga Fresh",
  });

  const e3 = seed({
    displayName: "Chidinma Okafor",
    headline: "Product & technology lead, fintech and consumer apps",
    bio: "Ex-CTO of two Lagos fintech startups; now advises early founders on product strategy and technical hiring.",
    country: "Nigeria",
    city: "Lagos",
    languages: ["en"],
    expertise: ["PRODUCT", "TECHNOLOGY", "AI_DATA", "FINTECH"],
    industries: ["FINTECH", "SAAS"],
    startupStages: ["idea", "mvp", "early_traction"],
    markets: ["Nigeria", "Ghana"],
    yearsExperience: 11,
    availability: "AVAILABLE",
    hoursPerMonth: 8,
    mentoringFormats: ["VIDEO_CALL", "DOCUMENT_REVIEW"],
    currentRole: "Independent CTO Advisor",
  });

  const e4 = seed({
    displayName: "Kwame Asante",
    headline: "Legal & governance counsel for growth-stage startups",
    bio: "Corporate lawyer specializing in company registration, cap tables and cross-border fundraising instruments in West Africa.",
    country: "Ghana",
    city: "Accra",
    languages: ["en"],
    expertise: ["LEGAL", "GOVERNANCE", "COMPLIANCE", "IP"],
    industries: ["FINTECH", "HEALTHTECH"],
    startupStages: ["mvp", "early_traction", "growth", "scale"],
    markets: ["Ghana", "Nigeria"],
    yearsExperience: 13,
    availability: "AVAILABLE",
    hoursPerMonth: 4,
    mentoringFormats: ["VIDEO_CALL", "DOCUMENT_REVIEW"],
    currentRole: "Partner",
    organization: "Asante & Co.",
  });

  const e5 = seed({
    displayName: "Salma El Fassi",
    headline: "Business model & pricing strategy for SaaS and marketplaces",
    bio: "Strategy consultant turned startup mentor, focused on unit economics and business model design for North African tech companies.",
    country: "Morocco",
    city: "Casablanca",
    languages: ["fr", "ar"],
    expertise: ["BUSINESS_MODEL", "STRATEGY", "SAAS", "B2B"],
    industries: ["SAAS", "B2B"],
    startupStages: ["idea", "mvp"],
    markets: ["Morocco", "Tunisia"],
    yearsExperience: 8,
    availability: "AVAILABLE",
    hoursPerMonth: 5,
    mentoringFormats: ["VIDEO_CALL", "CHAT"],
    currentRole: "Strategy Consultant",
  });

  const e6 = seed({
    displayName: "Wanjiru Mwangi",
    headline: "Operations & climate-tech scaling advisor",
    bio: "Former operations director at a Kenyan climate-tech scale-up; advises on process design and operational efficiency.",
    country: "Kenya",
    city: "Nairobi",
    languages: ["en"],
    expertise: ["OPERATIONS", "CLIMATE", "LOGISTICS"],
    industries: ["CLIMATE", "LOGISTICS"],
    startupStages: ["growth", "scale"],
    markets: ["Kenya", "Uganda", "Tanzania"],
    yearsExperience: 10,
    availability: "UNAVAILABLE",
    mentoringFormats: ["DOCUMENT_REVIEW"],
    currentRole: "VP Operations",
    organization: "Jua Climate",
  });

  const e7 = seed({
    displayName: "Jean-Baptiste Kouassi",
    headline: "Diaspora fintech and financial modeling mentor (Paris-based)",
    bio: "Ivorian-French finance professional supporting West African fintech founders remotely with financial modeling and fundraising prep.",
    country: "France",
    city: "Paris",
    languages: ["fr", "en"],
    expertise: ["FINANCE", "FINANCIAL_MODELING", "FUNDRAISING", "FINTECH"],
    industries: ["FINTECH"],
    startupStages: ["mvp", "early_traction", "growth"],
    markets: ["Côte d'Ivoire", "Senegal", "France"],
    yearsExperience: 12,
    availability: "AVAILABLE",
    hoursPerMonth: 4,
    mentoringFormats: ["VIDEO_CALL", "PHONE_CALL"],
    currentRole: "Finance Director",
    organization: "Diaspora Ventures Network",
  });

  const e8 = seed({
    displayName: "Amara Nwosu",
    headline: "UX/design mentor for consumer and health apps (London-based diaspora)",
    bio: "Nigerian-British product designer helping early founders turn rough ideas into testable prototypes.",
    country: "United Kingdom",
    city: "London",
    languages: ["en"],
    expertise: ["UX_DESIGN", "PRODUCT", "HEALTHTECH"],
    industries: ["HEALTHTECH"],
    startupStages: ["idea", "mvp"],
    markets: ["Nigeria", "United Kingdom"],
    yearsExperience: 7,
    availability: "LIMITED",
    hoursPerMonth: 3,
    mentoringFormats: ["VIDEO_CALL", "CHAT"],
    currentRole: "Senior Product Designer",
  });

  const e9 = seed({
    displayName: "Fatou Ndiaye",
    headline: "HR, talent & leadership coach for founding teams",
    bio: "Organizational psychologist coaching founding teams on hiring, culture and leadership as they scale past their first hires.",
    country: "Senegal",
    city: "Dakar",
    languages: ["fr", "en"],
    expertise: ["HR_TALENT", "LEADERSHIP"],
    industries: [],
    startupStages: ["early_traction", "growth"],
    markets: ["Senegal", "Côte d'Ivoire", "Ghana"],
    yearsExperience: 14,
    availability: "AVAILABLE",
    hoursPerMonth: 6,
    mentoringFormats: ["VIDEO_CALL", "IN_PERSON"],
    currentRole: "Executive Coach",
  });

  const e10 = seed({
    displayName: "Ibrahim Traoré",
    headline: "Impact & ESG advisor for agriculture and social enterprises",
    bio: "Impact measurement specialist supporting agri and social-impact founders with donor-facing metrics and ESG frameworks.",
    country: "Côte d'Ivoire",
    city: "Bouaké",
    languages: ["fr"],
    expertise: ["IMPACT_ESG", "AGRITECH"],
    industries: ["AGRITECH"],
    startupStages: ["idea", "mvp", "early_traction"],
    markets: ["Côte d'Ivoire"],
    yearsExperience: 6,
    availability: "AVAILABLE",
    hoursPerMonth: 4,
    mentoringFormats: ["VIDEO_CALL", "DOCUMENT_REVIEW"],
    currentRole: "Impact Consultant",
  });

  // Verification mix — explicit actions only, never a default.
  verifyExpert(e1.id, seedIso); // exactly one AFF_VERIFIED
  markProfileReviewed(e3.id, seedIso);
  markProfileReviewed(e4.id, seedIso);
  // e2, e5, e6, e7, e8, e9, e10 stay UNVERIFIED (the default), on purpose.
  void e2;
  void e5;
  void e6;
  void e7;
  void e8;
  void e9;
  void e10;
}
seedDemoExperts();

// ---------------------------------------------------------------------------
// Seed a founder-declared need for each demo startup that has a Digital
// Twin, so the "Find Help" flow has at least one manually-declared need to
// show even before any live derivation runs. Kept intentionally small (one
// per startup) — this is not a substitute for live derivation.
// ---------------------------------------------------------------------------
function seedDemoFounderNeeds() {
  const seedIso = new Date().toISOString();
  if (listStartupIds().includes("startup-wakama") && founderNeedsFor("startup-wakama").length === 0) {
    declareFounderNeed(
      "startup-wakama",
      { category: "FUNDRAISING", title: "Prepare for our Seed round conversations", description: "We want a sanity check on our ask and use-of-funds narrative before approaching investors." },
      seedIso,
    );
  }
  if (listStartupIds().includes("startup-solari") && founderNeedsFor("startup-solari").length === 0) {
    declareFounderNeed(
      "startup-solari",
      { category: "PRODUCT", title: "Help shaping our MVP scope", description: "We're not sure which features to cut for our first pilot." },
      seedIso,
    );
  }
}
seedDemoFounderNeeds();
