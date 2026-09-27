import { cn } from "@/lib/utils";

export function Chip({
  label,
  future,
  className,
}: {
  label: string;
  future?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-4 py-2.5 text-[13px] font-semibold tracking-[0.04em]",
        future
          ? "border-dashed border-aff-line-strong text-aff-muted"
          : "border-aff-line text-aff-text",
        className,
      )}
    >
      {label}
    </span>
  );
}
