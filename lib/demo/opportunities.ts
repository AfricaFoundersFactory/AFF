import type { Opportunity } from "@/types/opportunity";

export const demoOpportunityByStartup: Record<string, Opportunity> = {
  "startup-wakama": {
    id: "opp-1",
    title: "Africa Startup Challenge",
    matchPct: 89,
    deadline: "2026-10-18",
    missingRequirement: "Impact metrics",
  },
  "startup-solari": {
    id: "opp-2",
    title: "Clean Energy Catalyst Fund",
    matchPct: 92,
    deadline: "2026-11-05",
  },
};
