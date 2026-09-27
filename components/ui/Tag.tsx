import { cn } from "@/lib/utils";

export function Tag({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-aff-accent/40 px-3.5 py-1.5 text-[11.5px] font-semibold tracking-[0.06em] text-aff-accent",
        className,
      )}
    >
      {children}
    </span>
  );
}
