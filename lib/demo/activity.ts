import type { Activity, UpcomingEvent } from "@/types/activity";

export const demoRecentActivityByStartup: Record<string, Activity[]> = {
  "startup-wakama": [
    {
      id: "act-1",
      delta: 8,
      dimension: "Traction",
      description: "Customer evidence added",
      occurredAt: "2026-09-25",
    },
    {
      id: "act-2",
      delta: 5,
      dimension: "Product",
      description: "MVP milestone validated",
      occurredAt: "2026-09-22",
    },
    {
      id: "act-3",
      delta: 3,
      dimension: "Team",
      description: "CTO profile completed",
      occurredAt: "2026-09-19",
    },
  ],
  "startup-solari": [
    {
      id: "act-1",
      delta: 6,
      dimension: "Impact",
      description: "Impact report draft uploaded",
      occurredAt: "2026-09-24",
    },
    {
      id: "act-2",
      delta: 4,
      dimension: "Fundraising",
      description: "Data room shared with 2 investors",
      occurredAt: "2026-09-21",
    },
  ],
};

export const demoUpcomingEventsByStartup: Record<string, UpcomingEvent[]> = {
  "startup-wakama": [
    { id: "up-1", kind: "task", title: "Financial forecast deadline", date: "2026-09-28" },
    { id: "up-2", kind: "expert_session", title: "Session with Growth Expert", date: "2026-10-03" },
    { id: "up-3", kind: "pitch_live", title: "AFF Pitch Live", date: "2026-10-08" },
  ],
  "startup-solari": [
    { id: "up-1", kind: "investor_meeting", title: "Bridge round follow-up call", date: "2026-09-30" },
    { id: "up-2", kind: "application_deadline", title: "Clean Energy Catalyst Fund closes", date: "2026-11-05" },
  ],
};
