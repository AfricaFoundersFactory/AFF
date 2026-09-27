import type { CategoryEvolution } from "@/types/scoring";

export function AssessmentHistory({ categories }: { categories: CategoryEvolution[] }) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      {categories.map((cat) => (
        <div
          key={cat.label}
          className="flex items-center justify-between border-b border-aff-line py-4"
        >
          <div className="text-[15px] font-semibold text-aff-text sm:text-[15.5px]">
            {cat.label}
          </div>
          <div className="font-heading text-sm text-aff-muted">
            {cat.from} <span className="text-aff-accent">→ {cat.to}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
