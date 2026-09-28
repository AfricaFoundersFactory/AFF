import type { Roadmap } from "@/types/roadmap";

export const demoRoadmapByStartup: Record<string, Roadmap> = {
  "startup-wakama": {
    id: "roadmap-wakama-1",
    startupId: "startup-wakama",
    progressPct: 68,
    completedCount: 12,
    inProgressCount: 4,
    remainingCount: 6,
    items: [
      { id: "item-1", title: "Validate problem-solution fit", status: "done" },
      { id: "item-2", title: "Ship MVP", status: "done" },
      { id: "item-3", title: "Complete financial forecast", status: "in_progress" },
      { id: "item-4", title: "Add traction metrics", status: "in_progress" },
      { id: "item-5", title: "Prepare investor data room", status: "todo" },
    ],
    milestones: [
      { id: "ms-1", title: "First 100 farmers onboarded", completed: true },
      { id: "ms-2", title: "Break-even unit economics", completed: false, dueDate: "2026-12-01" },
    ],
  },
  "startup-solari": {
    id: "roadmap-solari-1",
    startupId: "startup-solari",
    progressPct: 74,
    completedCount: 17,
    inProgressCount: 3,
    remainingCount: 5,
    items: [
      { id: "item-1", title: "Reach 1,000 active households", status: "done" },
      { id: "item-2", title: "Close bridge round", status: "in_progress" },
      { id: "item-3", title: "Publish impact report", status: "todo" },
    ],
    milestones: [
      { id: "ms-1", title: "Series A readiness review", completed: false, dueDate: "2026-11-15" },
    ],
  },
};
