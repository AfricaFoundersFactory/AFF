export function ResourceCategoryList({ categories }: { categories: string[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {categories.map((cat) => (
        <div
          key={cat}
          className="rounded-lg border border-aff-line px-4 py-2.5 text-[12.5px] font-semibold tracking-[0.04em] text-aff-text"
        >
          {cat}
        </div>
      ))}
    </div>
  );
}

export function ResourceTypeList({ types }: { types: string[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      {types.map((t) => (
        <div key={t} className="px-1 py-1.5 text-xs text-aff-muted">
          {t}
        </div>
      ))}
    </div>
  );
}
