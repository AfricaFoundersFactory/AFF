/**
 * Investor directory service — the only place an InvestorOrganization or
 * InvestorProfile is created or read. Same Map-based in-memory pattern as
 * lib/services/community.ts / lib/services/experts.ts.
 *
 * All seeded investors are CLEARLY FICTIONAL demo organizations
 * (isDemo: true) with plausible-but-invented theses. They never imply real
 * investor interest, commitment, partnership with AFF, or likelihood of
 * investment — see AFF-DASH-10 §7. This file never reads Financials/Data
 * Room/private messages/expert notes; matching consumes only the narrow
 * StartupMatchFacts shape built by the investors Server Action layer.
 */
import { randomUUID } from "crypto";
import type { InvestorFilters, InvestorOrganization, InvestorProfile, InvestorRecord } from "@/types/investors";

const organizations = new Map<string, InvestorOrganization>();
const profiles = new Map<string, InvestorProfile>(); // keyed by organizationId

function record(id: string): InvestorRecord | undefined {
  const organization = organizations.get(id);
  const profile = profiles.get(id);
  if (!organization || !profile) return undefined;
  return { organization, profile };
}

export function listInvestors(): InvestorRecord[] {
  return Array.from(organizations.keys())
    .map((id) => record(id))
    .filter((r): r is InvestorRecord => r !== undefined)
    .sort((a, b) => a.organization.name.localeCompare(b.organization.name));
}

export function getInvestor(id: string): InvestorRecord | undefined {
  return record(id);
}

function matchesFilters(r: InvestorRecord, filters?: InvestorFilters): boolean {
  if (!filters) return true;
  const { thesis } = r.profile;
  if (filters.query) {
    const q = filters.query.trim().toLowerCase();
    if (q && !r.organization.name.toLowerCase().includes(q) && !(r.organization.description ?? "").toLowerCase().includes(q)) return false;
  }
  if (filters.type && r.organization.type !== filters.type) return false;
  if (filters.stage && !thesis.stages.includes(filters.stage)) return false;
  if (filters.industry && !thesis.industries.some((i) => i.toLowerCase() === filters.industry!.toLowerCase())) return false;
  if (filters.geography && !thesis.geographies.some((g) => g.toLowerCase() === filters.geography!.toLowerCase())) return false;
  if (filters.country && !thesis.countries.some((c) => c.toLowerCase() === filters.country!.toLowerCase())) return false;
  if (filters.instrument && !thesis.instruments.includes(filters.instrument)) return false;
  if (filters.impactTheme && !thesis.impactThemes.some((t) => t.toLowerCase() === filters.impactTheme!.toLowerCase())) return false;
  if (filters.ticketAmount) {
    const { amount, currency } = filters.ticketAmount;
    const { ticketMin, ticketMax } = thesis;
    const thesisCurrency = ticketMin?.currency ?? ticketMax?.currency;
    // Only a same-currency, explicit min/max on both sides can exclude an
    // investor — no live FX conversion exists, and unknown/incomparable
    // data must never be treated as a mismatch (mirrors ticketOutcome() in
    // lib/investors/matching.ts).
    if ((ticketMin || ticketMax) && thesisCurrency === currency) {
      const lowerOk = ticketMin === undefined || amount >= ticketMin.amount;
      const upperOk = ticketMax === undefined || amount <= ticketMax.amount;
      if (!(lowerOk && upperOk)) return false;
    }
  }
  return true;
}

export function searchInvestors(filters?: InvestorFilters): InvestorRecord[] {
  return listInvestors().filter((r) => matchesFilters(r, filters));
}

/** Test-only reset hook so tests don't leak state across files. */
export function __resetInvestorsStoreForTests() {
  organizations.clear();
  profiles.clear();
  seed();
}

function addInvestor(organization: Omit<InvestorOrganization, "isDemo" | "createdAt" | "updatedAt">, profile: Omit<InvestorProfile, "id">, nowIso: string) {
  organizations.set(organization.id, { ...organization, isDemo: true, createdAt: nowIso, updatedAt: nowIso });
  profiles.set(organization.id, { id: organization.id, ...profile });
}

function seed() {
  if (organizations.size > 0) return;
  const now = new Date().toISOString();

  addInvestor(
    { id: "demo-inv-savanna-angels", name: "Savanna Angels Network (Demo)", type: "ANGEL_NETWORK", description: "Illustrative demo investor — early-stage angel network.", headquartersCountry: "Kenya" },
    {
      organizationId: "demo-inv-savanna-angels",
      thesis: {
        stages: ["idea", "mvp"],
        industries: ["AgriTech", "FinTech", "HealthTech"],
        geographies: ["East Africa"],
        countries: ["Kenya", "Uganda", "Tanzania"],
        businessModels: ["b2c", "marketplace"],
        ticketMin: { amount: 10_000, currency: "USD" },
        ticketMax: { amount: 100_000, currency: "USD" },
        instruments: ["safe", "convertible_note"],
        impactThemes: ["Financial Inclusion"],
        leadPreference: "either",
        followOn: false,
        description: "Illustrative/demo thesis — early check-writers backing first-time East African founders.",
      },
      contacts: [{ id: randomUUID(), name: "Demo Contact — Membership Lead", role: "Membership Lead", isPrimary: true }],
    },
    now,
  );

  addInvestor(
    { id: "demo-inv-baobab-ventures", name: "Baobab Ventures (Demo)", type: "VC", description: "Illustrative demo investor — seed and Series A venture fund.", headquartersCountry: "Senegal" },
    {
      organizationId: "demo-inv-baobab-ventures",
      thesis: {
        stages: ["early_traction", "growth"],
        industries: ["FinTech", "Logistics", "SaaS"],
        geographies: ["West Africa"],
        countries: ["Senegal", "Côte d'Ivoire", "Nigeria", "Ghana"],
        businessModels: ["b2b", "saas"],
        ticketMin: { amount: 250_000, currency: "USD" },
        ticketMax: { amount: 2_000_000, currency: "USD" },
        instruments: ["equity", "convertible_note"],
        impactThemes: [],
        leadPreference: "leads",
        followOn: true,
        description: "Illustrative/demo thesis — leads seed/Series A rounds for B2B software across Francophone and Anglophone West Africa.",
      },
      contacts: [{ id: randomUUID(), name: "Demo Contact — Investment Director", role: "Investment Director", isPrimary: true }],
    },
    now,
  );

  addInvestor(
    { id: "demo-inv-continental-impact-fund", name: "Continental Impact Fund (Demo)", type: "IMPACT_FUND", description: "Illustrative demo investor — impact-first fund.", headquartersCountry: "South Africa" },
    {
      organizationId: "demo-inv-continental-impact-fund",
      thesis: {
        stages: ["early_traction", "growth", "scale"],
        industries: ["AgriTech", "CleanTech", "EdTech", "HealthTech"],
        geographies: ["Sub-Saharan Africa"],
        countries: [],
        businessModels: ["b2b", "b2c", "b2b2c"],
        ticketMin: { amount: 500_000, currency: "USD" },
        ticketMax: { amount: 5_000_000, currency: "USD" },
        instruments: ["equity", "revenue_based_financing", "grant"],
        impactThemes: ["Climate Resilience", "Financial Inclusion", "Gender Equity"],
        leadPreference: "either",
        followOn: true,
        description: "Illustrative/demo thesis — impact-linked capital for ventures with a clearly articulated impact thesis.",
      },
      contacts: [{ id: randomUUID(), name: "Demo Contact — Portfolio Associate", role: "Portfolio Associate", isPrimary: true }],
    },
    now,
  );

  addInvestor(
    { id: "demo-inv-atlas-family-office", name: "Atlas Family Office (Demo)", type: "FAMILY_OFFICE", description: "Illustrative demo investor — patient, flexible capital.", headquartersCountry: "Morocco" },
    {
      organizationId: "demo-inv-atlas-family-office",
      thesis: {
        stages: ["growth", "scale"],
        industries: ["Real Estate", "FinTech", "Consumer"],
        geographies: ["North Africa"],
        countries: ["Morocco", "Tunisia", "Egypt"],
        businessModels: ["b2c", "b2b2c"],
        ticketMin: { amount: 1_000_000, currency: "EUR" },
        instruments: ["equity", "debt"],
        impactThemes: [],
        leadPreference: "follows",
        followOn: true,
        description: "Illustrative/demo thesis — flexible follow-on capital once commercial traction is established.",
      },
      contacts: [{ id: randomUUID(), name: "Demo Contact — Family Office Principal", role: "Principal", isPrimary: true }],
    },
    now,
  );

  addInvestor(
    { id: "demo-inv-delta-dfi", name: "Delta Development Finance (Demo)", type: "DEVELOPMENT_FINANCE", description: "Illustrative demo investor — development finance institution.", headquartersCountry: "France" },
    {
      organizationId: "demo-inv-delta-dfi",
      thesis: {
        stages: ["growth", "scale"],
        industries: ["Infrastructure", "AgriTech", "Energy"],
        geographies: ["West Africa", "Central Africa"],
        countries: ["Côte d'Ivoire", "Cameroon", "Senegal"],
        businessModels: ["b2b"],
        ticketMin: { amount: 2_000_000, currency: "EUR" },
        ticketMax: { amount: 20_000_000, currency: "EUR" },
        instruments: ["debt", "equity"],
        impactThemes: ["Climate Resilience", "Job Creation"],
        leadPreference: "either",
        followOn: true,
        description: "Illustrative/demo thesis — larger-ticket blended finance for infrastructure-adjacent ventures.",
      },
      contacts: [{ id: randomUUID(), name: "Demo Contact — Investment Officer", role: "Investment Officer", isPrimary: true }],
    },
    now,
  );

  addInvestor(
    { id: "demo-inv-nomad-studio", name: "Nomad Venture Studio (Demo)", type: "VENTURE_STUDIO", description: "Illustrative demo investor — venture studio / accelerator fund.", headquartersCountry: "Rwanda" },
    {
      organizationId: "demo-inv-nomad-studio",
      thesis: {
        stages: ["idea", "mvp"],
        industries: ["SaaS", "Mobility", "EdTech"],
        geographies: ["East Africa"],
        countries: ["Rwanda", "Kenya"],
        businessModels: ["saas", "subscription"],
        ticketMin: { amount: 25_000, currency: "USD" },
        ticketMax: { amount: 150_000, currency: "USD" },
        instruments: ["safe"],
        impactThemes: [],
        leadPreference: "leads",
        followOn: false,
        description: "Illustrative/demo thesis — pre-seed studio capital paired with hands-on build support.",
      },
      contacts: [{ id: randomUUID(), name: "Demo Contact — Studio Partner", role: "Studio Partner", isPrimary: true }],
    },
    now,
  );
}

seed();
