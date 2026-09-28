import type { Task } from "@/types/roadmap";

export const demoWeekTasksByStartup: Record<string, Task[]> = {
  "startup-wakama": [
    {
      id: "task-1",
      title: "Complete financial forecast",
      category: "Finance",
      status: "in_progress",
      priority: "high",
      dueDate: "2026-09-28",
      linkedModule: "financials",
    },
    {
      id: "task-2",
      title: "Add traction metrics",
      category: "Traction",
      status: "todo",
      priority: "medium",
      dueDate: "2026-09-30",
      linkedModule: "roadmap",
    },
    {
      id: "task-3",
      title: "Request Pitch Deck review",
      category: "Pitch",
      status: "todo",
      priority: "medium",
      dueDate: "2026-10-02",
      linkedModule: "pitch",
    },
  ],
  "startup-solari": [
    {
      id: "task-1",
      title: "Finalize use-of-funds breakdown",
      category: "Fundraising",
      status: "in_progress",
      priority: "high",
      dueDate: "2026-09-29",
      linkedModule: "pitch",
    },
    {
      id: "task-2",
      title: "Upload latest impact metrics",
      category: "Impact",
      status: "todo",
      priority: "medium",
      dueDate: "2026-10-01",
      linkedModule: "data-room",
    },
  ],
};
