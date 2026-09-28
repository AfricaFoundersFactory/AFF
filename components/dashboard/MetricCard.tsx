export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-aff-line bg-aff-bg p-4">
      <div className="text-[11.5px] font-semibold tracking-[0.06em] text-aff-muted">
        {label.toUpperCase()}
      </div>
      <div className="mt-1 font-heading text-2xl font-semibold text-aff-text">{value}</div>
      {hint ? <div className="mt-1 text-[12px] text-aff-muted">{hint}</div> : null}
    </div>
  );
}
