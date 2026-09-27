"use client";

export function ResourceSearchInput({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex w-full justify-center">
      <label htmlFor="resource-search" className="sr-only">
        {placeholder}
      </label>
      <input
        id="resource-search"
        type="search"
        placeholder={placeholder}
        className="w-full max-w-[480px] rounded-lg border border-aff-line bg-aff-bg2 px-4 py-3 text-[14.5px] text-aff-text placeholder:text-aff-muted focus:border-aff-accent"
      />
    </div>
  );
}
