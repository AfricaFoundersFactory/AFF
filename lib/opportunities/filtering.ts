import type { Opportunity, OpportunityType } from "@/types/opportunity";
import type { StartupStage } from "@/types/common";

export type OpportunityFilters = {
  type?: OpportunityType;
  country?: string;
  industry?: string;
  stage?: StartupStage;
  language?: string;
  remoteOnly?: boolean;
  search?: string;
};

export function filterOpportunities(opportunities: Opportunity[], filters: OpportunityFilters): Opportunity[] {
  return opportunities.filter((o) => {
    if (filters.type && o.type !== filters.type) return false;
    if (filters.country && o.countries.length > 0 && !o.countries.some((c) => c.toLowerCase() === filters.country?.toLowerCase())) {
      return false;
    }
    if (filters.industry && o.industries.length > 0 && !o.industries.some((i) => i.toLowerCase() === filters.industry?.toLowerCase())) {
      return false;
    }
    if (filters.stage && o.startupStages.length > 0 && !o.startupStages.includes(filters.stage)) return false;
    if (filters.language && !o.languages.includes(filters.language)) return false;
    if (filters.remoteOnly && !o.remoteAllowed) return false;
    if (filters.search) {
      const needle = filters.search.toLowerCase();
      const haystack = `${o.title} ${o.organization} ${o.description.en} ${o.description.fr}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}
