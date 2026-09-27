export function DiagnosticGap({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="mb-2 text-[11.5px] font-semibold tracking-[0.1em] text-aff-muted">
        {label}
      </div>
      <p className="text-[15px] leading-relaxed text-aff-text sm:text-[15.5px]">{children}</p>
    </div>
  );
}
