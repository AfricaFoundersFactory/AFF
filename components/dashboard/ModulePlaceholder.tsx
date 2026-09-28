/**
 * Shared "module foundation" screen for every dashboard route that only
 * exists for navigation/routing validation in this batch. It never claims
 * to be finished functionality.
 */
export function ModulePlaceholder({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-dashed border-aff-line-strong px-6 py-16 text-center">
      <h1 className="mb-3 font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">
        {title}
      </h1>
      <p className="mb-5 max-w-md text-[14.5px] leading-relaxed text-aff-muted">
        {description}
      </p>
      <span className="rounded-full border border-dashed border-aff-line-strong px-4 py-2 text-[12px] font-semibold tracking-[0.06em] text-aff-muted">
        {badge}
      </span>
    </div>
  );
}
