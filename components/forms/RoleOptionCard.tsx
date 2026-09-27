import { cn } from "@/lib/utils";

export function RoleOptionCard({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "rounded-[10px] border px-5 py-4 text-left text-[15.5px] font-semibold transition-colors",
        selected
          ? "border-aff-accent bg-aff-accent/10 text-aff-text"
          : "border-aff-line bg-aff-bg2 text-aff-text hover:border-aff-line-strong",
      )}
    >
      {label}
    </button>
  );
}
