import type { InputHTMLAttributes } from "react";

export function TextField({
  id,
  label,
  ...rest
}: { id: string; label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-semibold text-aff-muted">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-lg border border-aff-line bg-aff-bg2 px-4 py-3.5 text-[15px] text-aff-text placeholder:text-aff-muted focus:border-aff-accent"
        {...rest}
      />
    </div>
  );
}
