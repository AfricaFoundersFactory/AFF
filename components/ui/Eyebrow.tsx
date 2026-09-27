import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 text-[11.5px] font-semibold tracking-[0.14em] text-aff-accent sm:mb-5 sm:text-[13px]",
        className,
      )}
    >
      {children}
    </div>
  );
}
