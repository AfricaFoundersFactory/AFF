import type { SelectHTMLAttributes } from "react";

export function SelectField({
  id,
  label,
  children,
  ...rest
}: { id: string; label: string; children: React.ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-semibold text-aff-muted">
        {label}
      </label>
      <select
        id={id}
        className="w-full rounded-lg border border-aff-line bg-aff-bg2 px-4 py-3.5 text-[15px] text-aff-text focus:border-aff-accent"
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}
