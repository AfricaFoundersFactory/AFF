// Pure, deterministic Progress Timeline builder — no AI, no opaque scoring.
// Takes already-fetched facts from canonical services (readiness history,
// roadmap, tasks, pitch versions/practice, financial periods, Data Room
// documents, expert recommendations, opportunity applications) and turns
// them into a single sorted timeline. Never recomputes a canonical value,
// only reshapes timestamps that already exist on those records.
import type { AnalyticsRange, ProgressTimelineEvent } from "@/types/analytics";

export function filterByRange<T extends { occurredAt: string }>(events: T[], range: AnalyticsRange, nowIso: string): T[] {
  if (range === "ALL") return events;
  const days = range === "30D" ? 30 : 90;
  const cutoff = new Date(nowIso).getTime() - days * 24 * 60 * 60 * 1000;
  return events.filter((e) => new Date(e.occurredAt).getTime() >= cutoff);
}

export function sortTimelineDesc(events: ProgressTimelineEvent[]): ProgressTimelineEvent[] {
  return [...events].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}
