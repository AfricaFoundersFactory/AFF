export function ScoreProgress({
  label,
  from,
  to,
  max = 100,
}: {
  label: string;
  from: number;
  to: number;
  max?: number;
}) {
  const delta = to - from;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-[13px] font-semibold text-aff-text">
        <span>{label}</span>
        <span className="text-aff-accent">
          {delta >= 0 ? "+" : ""}
          {delta}
        </span>
      </div>
      <div className="relative h-1 overflow-hidden rounded-full bg-aff-line-strong/40">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-aff-muted/50"
          style={{ width: `${(from / max) * 100}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-aff-accent"
          style={{ width: `${(to / max) * 100}%` }}
        />
      </div>
    </div>
  );
}
