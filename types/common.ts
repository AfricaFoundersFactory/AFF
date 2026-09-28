// Small shared primitives with no dependencies on other type modules —
// exists to avoid circular imports between types/domain.ts and
// types/digital-twin.ts, which both need these.

export type StartupStage = "idea" | "mvp" | "early_traction" | "growth" | "scale";

// AFF is Africa-first but globally usable: never assume USD/USA. Amounts are
// always paired with an explicit ISO 4217 currency code, never formatted
// strings like "$10M".
export type MonetaryAmount = {
  amount: number;
  currency: string;
};

// Documents the future access-control boundary for Digital Twin data (see
// types/digital-twin.ts). Not enforced by any permissions engine yet — this
// only ensures the domain model never assumes every field is public.
export type VisibilityLevel = "private" | "aff_team" | "experts" | "investors" | "public";
