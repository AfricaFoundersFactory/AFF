export function ReadinessDimensionBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 truncate text-[12.5px] text-aff-muted sm:w-28">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-aff-line/50">
        <div
          className="h-full rounded-full bg-aff-accent"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="w-7 shrink-0 text-right text-[12.5px] font-semibold text-aff-text">
        {value}
      </span>
    </div>
  );
}
