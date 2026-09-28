import type { InputHTMLAttributes } from "react";

export function CheckboxField({
  id,
  label,
  ...rest
}: { id: string; label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 text-[14px] text-aff-text">
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 flex-shrink-0 rounded border-aff-line bg-aff-bg accent-aff-cta-bg"
        {...rest}
      />
      {label}
    </label>
  );
}
