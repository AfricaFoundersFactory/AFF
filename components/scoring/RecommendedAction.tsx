export function RecommendedAction({
  label,
  action,
  resource,
}: {
  label: string;
  action: string;
  resource: string;
}) {
  return (
    <div>
      <div className="mb-2 text-[11.5px] font-semibold tracking-[0.1em] text-aff-muted">
        {label}
      </div>
      <p className="mb-5 text-[15px] leading-relaxed text-aff-text sm:text-[15.5px]">{action}</p>
      <div className="text-[13px] font-semibold text-aff-accent">→ {resource}</div>
    </div>
  );
}
