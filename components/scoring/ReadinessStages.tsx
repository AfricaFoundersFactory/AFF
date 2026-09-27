type Stage = { label: string; items: string[] };

export function ReadinessStages({ stages }: { stages: Stage[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:flex sm:gap-0">
      {stages.map((stage, i) => (
        <div
          key={stage.label}
          className={
            i === 0
              ? "sm:flex-1 sm:px-3.5"
              : "border-l border-aff-line sm:flex-1 sm:px-3.5"
          }
        >
          <div className="mb-3.5 font-heading text-[13px] font-semibold tracking-[0.04em] text-aff-accent sm:mb-4">
            {stage.label}
          </div>
          <div className="flex flex-col gap-1.5">
            {stage.items.map((item) => (
              <div key={item} className="text-[12.5px] leading-relaxed text-aff-muted sm:text-[13px]">
                {item}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
