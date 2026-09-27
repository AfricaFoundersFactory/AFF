export function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-aff-line px-5 py-4 last:border-b-0 sm:flex-row sm:gap-0 sm:py-4">
      <div className="w-full flex-shrink-0 text-[13px] font-semibold text-aff-muted sm:w-[180px]">
        {label}
      </div>
      <div className="text-[14.5px] text-aff-text">{value}</div>
    </div>
  );
}
