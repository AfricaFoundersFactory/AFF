type FormatStat = { value: string; label: string };

export function PitchFormatStats({ format }: { format: FormatStat[] }) {
  return (
    <div className="flex flex-wrap gap-6 sm:flex-nowrap">
      {format.map((f, i) => (
        <div
          key={f.label}
          className={
            i < format.length - 1
              ? "flex-1 border-r border-aff-line pr-4 sm:pr-[18px]"
              : "flex-1"
          }
        >
          <div className="mb-1.5 font-heading text-lg font-bold text-aff-text sm:text-xl">
            {f.value}
          </div>
          <div className="text-[11px] font-semibold tracking-[0.06em] text-aff-muted sm:text-[11.5px]">
            {f.label}
          </div>
        </div>
      ))}
    </div>
  );
}
