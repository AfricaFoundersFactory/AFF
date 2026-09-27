import type { TextareaHTMLAttributes } from "react";

export function TextAreaField({
  id,
  label,
  ...rest
}: { id: string; label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      {label ? (
        <label htmlFor={id} className="mb-2 block text-[13px] font-semibold text-aff-muted">
          {label}
        </label>
      ) : null}
      <textarea
        id={id}
        className="w-full resize-y rounded-lg border border-aff-line bg-aff-bg2 px-4 py-3.5 text-[15px] text-aff-text placeholder:text-aff-muted focus:border-aff-accent"
        {...rest}
      />
    </div>
  );
}
