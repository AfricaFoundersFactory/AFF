import { StatusBadge } from "./StatusBadge";
import type { Task } from "@/types/roadmap";

export function TaskCard({
  task,
  dueLabel,
  statusLabel,
}: {
  task: Task;
  dueLabel: string;
  statusLabel: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-aff-line py-3.5 last:border-0 last:pb-0">
      <div>
        <div className="text-[14px] font-semibold text-aff-text">{task.title}</div>
        <div className="mt-0.5 text-[12.5px] text-aff-muted">
          {dueLabel} · {task.category}
        </div>
      </div>
      <StatusBadge status={task.status} label={statusLabel} className="shrink-0" />
    </div>
  );
}
