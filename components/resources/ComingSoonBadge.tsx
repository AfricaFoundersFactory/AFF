export function ComingSoonBadge({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-full border border-aff-accent/40 px-4 py-2 text-xs font-semibold tracking-[0.1em] text-aff-accent">
      {label}
    </span>
  );
}
