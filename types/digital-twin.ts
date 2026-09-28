// AFF Startup Digital Twin — the structured source of truth for a startup,
// intended to eventually power Readiness scoring, Roadmap, Pitch Lab,
// financial analysis, expert/investor/opportunity matching and AFF
// Operations. This is a domain model, not a presentation form: each section
// is independently typed so it can be read, validated and completed on its
// own.
//
// See lib/services/digital-twin.ts for the (demo-backed) service boundary
// and lib/services/profile-completion.ts for how "percent complete" is
// derived from this data. Profile completion is NEVER the same thing as the
// (unrelated) AFF Readiness Score in types/readiness.ts — one measures
// whether information exists, the other will eventually judge its quality.

import type { MonetaryAmount, StartupStage, VisibilityLevel } from "./common";

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export type CompanyRegistrationStatus = "not_registered" | "in_progress" | "registered";

export type CompanyRegistration = {
  status: CompanyRegistrationStatus;
  country?: string;
  number?: string;
};

export type StartupIdentity = {
  name: string;
  logoUrl?: string;
  tagline?: string;
  shortDescription?: string;
  longDescription?: string;
  website?: string;
  foundedYear?: number;
  country: string;
  city?: string;
  operatingCountries: string[];
  industry?: string;
  subIndustry?: string;
  stage: StartupStage;
  legalStatus?: string;
  registration?: CompanyRegistration;
  preferredCurrency: string;
};

// ---------------------------------------------------------------------------
// Founders & team
// ---------------------------------------------------------------------------

export type FounderStatus = "active" | "advisor" | "departed";
export type EngagementType = "full_time" | "part_time";

export type Founder = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  country?: string;
  bio?: string;
  status: FounderStatus;
  engagement: EngagementType;
  ownershipPct?: number;
  isPrimaryContact: boolean;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  department?: string;
  engagement: EngagementType;
  startDate?: string;
  bio?: string;
  linkedin?: string;
  expertise: string[];
  // Deliberately NOT merged into User/StartupMembership yet — team members
  // are company facts first; linking to a real platform account is a later
  // batch's concern.
  linkedUserId?: string;
};

// ---------------------------------------------------------------------------
// Problem
// ---------------------------------------------------------------------------

export type PainSeverity = "low" | "medium" | "high" | "critical";

export type StartupProblem = {
  statement?: string;
  targetCustomer?: string;
  currentAlternatives?: string;
  painSeverity?: PainSeverity;
  evidence?: string;
  whyNow?: string;
};

// ---------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------

export type ProductType = "software" | "hardware" | "marketplace" | "service" | "hybrid" | "other";
export type DevelopmentStage = "concept" | "prototype" | "mvp" | "live" | "scaling";
export type IpStatus = "none" | "pending" | "filed" | "granted" | "not_applicable";

export type StartupProduct = {
  name?: string;
  type?: ProductType;
  description?: string;
  developmentStage?: DevelopmentStage;
  valueProposition?: string;
  coreFeatures: string[];
  technology?: string;
  ipStatus?: IpStatus;
  launched: boolean;
  launchDate?: string;
  demoUrl?: string;
};

// ---------------------------------------------------------------------------
// Market
// ---------------------------------------------------------------------------

export type MarketSizeEstimate = {
  amount: MonetaryAmount;
  methodology?: string;
};

export type Competitor = {
  id: string;
  name: string;
  notes?: string;
};

export type StartupMarket = {
  primaryMarket?: string;
  customerSegments: string[];
  geographies: string[];
  tam?: MarketSizeEstimate;
  sam?: MarketSizeEstimate;
  som?: MarketSizeEstimate;
  trends?: string;
  competitors: Competitor[];
  competitiveAdvantage?: string;
};

// ---------------------------------------------------------------------------
// Business model
// ---------------------------------------------------------------------------

export type BusinessModelType =
  | "b2b"
  | "b2c"
  | "b2b2c"
  | "marketplace"
  | "saas"
  | "subscription"
  | "transactional"
  | "licensing"
  | "other";

export type RevenueStream = {
  id: string;
  label: string;
};

export type StartupBusinessModel = {
  types: BusinessModelType[];
  revenueStreams: RevenueStream[];
  pricingModel?: string;
  averageRevenuePerCustomer?: MonetaryAmount;
  salesChannels: string[];
  salesCycle?: string;
  distributionModel?: string;
  keyPartnerships: string[];
};

// ---------------------------------------------------------------------------
// Traction — deliberately flexible: not every startup uses every metric.
// ---------------------------------------------------------------------------

export type TractionMetricType =
  | "customers"
  | "active_customers"
  | "users"
  | "active_users"
  | "mrr"
  | "arr"
  | "revenue"
  | "revenue_growth"
  | "gmv"
  | "contracts"
  | "pilots"
  | "partnerships"
  | "retention"
  | "churn"
  | "cac"
  | "ltv"
  | "custom";

export type TractionMetric = {
  id: string;
  type: TractionMetricType;
  label: string;
  value: number;
  unit?: string;
  currency?: string;
  period?: string;
  date: string;
  source?: string;
  verified: boolean;
};

export type StartupTraction = {
  metrics: TractionMetric[];
  narrative?: string;
  majorCustomers: string[];
  commercialEvidence?: string;
};

// ---------------------------------------------------------------------------
// Financials — structured summary only, not the full forecasting engine.
// ---------------------------------------------------------------------------

export type StartupFinancials = {
  currency: string;
  annualRevenue?: number;
  monthlyRevenue?: number;
  monthlyExpenses?: number;
  monthlyBurn?: number;
  cashBalance?: number;
  runwayMonths?: number;
  profitable?: boolean;
  financialYear?: number;
  notes?: string;
};

// ---------------------------------------------------------------------------
// Funding — instrument-agnostic (not VC equity only).
// ---------------------------------------------------------------------------

export type FundingInstrument =
  | "equity"
  | "safe"
  | "convertible_note"
  | "debt"
  | "grant"
  | "revenue_based_financing"
  | "other";

export type FundingStatus = "not_raising" | "raising" | "closed";

export type PreviousRound = {
  id: string;
  date: string;
  roundType: string;
  amount: MonetaryAmount;
  investorNames: string[];
  notes?: string;
};

export type StartupFunding = {
  status: FundingStatus;
  totalRaised?: MonetaryAmount;
  currentRound?: string;
  targetRaise?: MonetaryAmount;
  minimumTicket?: MonetaryAmount;
  maximumTicket?: MonetaryAmount;
  valuation?: MonetaryAmount;
  instrument?: FundingInstrument;
  previousRounds: PreviousRound[];
  useOfFunds?: string;
};

// ---------------------------------------------------------------------------
// Impact — never forced when a startup doesn't track it.
// ---------------------------------------------------------------------------

export type StartupImpact = {
  enabled: boolean;
  thesis?: string;
  sdgs: string[];
  beneficiaries?: number;
  jobsCreated?: number;
  womenBeneficiariesPct?: number;
  youthBeneficiariesPct?: number;
  environmentalImpact?: string;
  socialImpact?: string;
  metrics: TractionMetric[];
};

// ---------------------------------------------------------------------------
// Goals, risks, milestones
// ---------------------------------------------------------------------------

export type GoalCategory = "growth" | "product" | "fundraising" | "market" | "team" | "other";
export type GoalStatus = "not_started" | "in_progress" | "achieved" | "missed";

export type StartupGoal = {
  id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  targetDate?: string;
  status: GoalStatus;
  progressPct: number;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
};

export type RiskCategory =
  | "market"
  | "product"
  | "technology"
  | "financial"
  | "legal"
  | "team"
  | "operations"
  | "fundraising"
  | "regulatory"
  | "other";

export type RiskLevel = "low" | "medium" | "high";
export type RiskStatus = "open" | "mitigated" | "accepted" | "closed";

export type StartupRisk = {
  id: string;
  title: string;
  description?: string;
  category: RiskCategory;
  probability: RiskLevel;
  impact: RiskLevel;
  mitigation?: string;
  status: RiskStatus;
};

export type MilestoneCategory = "company" | "product" | "traction" | "funding" | "team" | "legal" | "other";
export type StartupMilestoneStatus = "planned" | "achieved";

export type StartupMilestone = {
  id: string;
  title: string;
  description?: string;
  date: string;
  category: MilestoneCategory;
  status: StartupMilestoneStatus;
  evidenceUrl?: string;
};

// ---------------------------------------------------------------------------
// Section visibility (future access-control boundary, not enforced yet)
// ---------------------------------------------------------------------------

export type DigitalTwinSectionKey =
  | "identity"
  | "founders"
  | "team"
  | "problem"
  | "product"
  | "market"
  | "businessModel"
  | "traction"
  | "financials"
  | "funding"
  | "impact"
  | "goals"
  | "risks"
  | "milestones";

export type SectionVisibility = Record<DigitalTwinSectionKey, VisibilityLevel>;

// ---------------------------------------------------------------------------
// Root aggregate
// ---------------------------------------------------------------------------

export type StartupDigitalTwin = {
  identity: StartupIdentity;
  founders: Founder[];
  team: TeamMember[];
  problem: StartupProblem;
  product: StartupProduct;
  market: StartupMarket;
  businessModel: StartupBusinessModel;
  traction: StartupTraction;
  financials: StartupFinancials;
  funding: StartupFunding;
  impact: StartupImpact;
  goals: StartupGoal[];
  risks: StartupRisk[];
  milestones: StartupMilestone[];
  visibility: SectionVisibility;
  onboarding: {
    completed: boolean;
    currentStep: number;
  };
};
