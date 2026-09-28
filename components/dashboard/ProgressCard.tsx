export function ProgressCard({
  pct,
  completedLabel,
  inProgressLabel,
  remainingLabel,
}: {
  pct: number;
  completedLabel: string;
  inProgressLabel: string;
  remainingLabel: string;
}) {
  return (
    <div>
      <div className="mb-3 font-heading text-[34px] font-semibold text-aff-text">{pct}%</div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-aff-line/50">
        <div
          className="h-full rounded-full bg-aff-accent transition-[width]"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-aff-muted">
        <span>{completedLabel}</span>
        <span>{inProgressLabel}</span>
        <span>{remainingLabel}</span>
      </div>
    </div>
  );
}
