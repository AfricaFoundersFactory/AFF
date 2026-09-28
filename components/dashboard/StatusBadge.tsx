import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types/roadmap";

const statusClasses: Record<TaskStatus, string> = {
  todo: "border-aff-line text-aff-muted",
  in_progress: "border-aff-cyan/40 text-aff-cyan",
  done: "border-aff-accent/40 text-aff-accent",
  blocked: "border-red-400/40 text-red-400",
  cancelled: "border-aff-line text-aff-muted line-through",
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: TaskStatus;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11.5px] font-semibold tracking-[0.02em]",
        statusClasses[status],
        className,
      )}
    >
      {label}
    </span>
  );
}
