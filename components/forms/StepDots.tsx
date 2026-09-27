export function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="mb-10 flex gap-2 sm:mb-12" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current}>
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div
          key={n}
          className={`h-[3px] flex-1 rounded-sm ${n <= current ? "bg-aff-accent" : "bg-aff-line-strong/60"}`}
        />
      ))}
    </div>
  );
}
