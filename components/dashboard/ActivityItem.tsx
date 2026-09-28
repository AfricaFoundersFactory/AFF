import type { Activity } from "@/types/activity";

export function ActivityItem({ activity }: { activity: Activity }) {
  return (
    <div className="flex items-start gap-3 border-b border-aff-line py-3.5 last:border-0 last:pb-0">
      <span className="mt-0.5 shrink-0 rounded-full bg-aff-accent-soft px-2 py-0.5 text-[12px] font-semibold text-aff-accent">
        +{activity.delta}
      </span>
      <div>
        <div className="text-[13.5px] font-semibold text-aff-text">{activity.dimension}</div>
        <div className="text-[12.5px] text-aff-muted">{activity.description}</div>
      </div>
    </div>
  );
}
