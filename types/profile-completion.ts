import type { DigitalTwinSectionKey } from "./digital-twin";

// Profile completion measures whether required/relevant Digital Twin
// information EXISTS. It is deliberately distinct from the AFF Readiness
// Score (types/readiness.ts), which will later judge the QUALITY and
// maturity of that information. Never derive one from the other.

export type MissingItem = {
  section: DigitalTwinSectionKey;
  // Stable id translated via dashboard.digitalTwin.fields.<fieldKey> — never
  // a literal label, so missing-item copy stays bilingual.
  fieldKey: string;
};

export type SectionCompletion = {
  section: DigitalTwinSectionKey;
  pct: number;
};

export type ProfileCompletion = {
  overallPct: number;
  bySection: SectionCompletion[];
  missingItems: MissingItem[];
};
