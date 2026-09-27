export function ScoreOverview({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const pct = Math.max(0, Math.min(1, value / max));
  const degrees = Math.round(pct * 360);

  return (
    <div className="flex flex-shrink-0 flex-col items-center gap-4">
      <div
        role="img"
        aria-label={`${label}: ${value}/${max}`}
        className="flex h-[150px] w-[150px] items-center justify-center rounded-full sm:h-[190px] sm:w-[190px]"
        style={{
          background: `conic-gradient(var(--aff-accent) 0deg ${degrees}deg, rgba(143,167,179,0.16) ${degrees}deg 360deg)`,
        }}
      >
        <div className="flex h-[122px] w-[122px] flex-col items-center justify-center rounded-full bg-aff-bg2 sm:h-[158px] sm:w-[158px]">
          <div className="font-heading text-[36px] font-bold leading-none text-aff-text sm:text-[46px]">
            {value}
            <span className="text-base font-medium text-aff-muted sm:text-xl">/{max}</span>
          </div>
        </div>
      </div>
      <div className="text-[11.5px] font-semibold tracking-[0.14em] text-aff-accent">
        {label}
      </div>
    </div>
  );
}
