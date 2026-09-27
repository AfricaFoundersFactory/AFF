export function VideoPlaceholder({ label }: { label?: string }) {
  return (
    <div
      className="flex aspect-video w-full items-center justify-center rounded-2xl border border-aff-line bg-aff-bg2"
      role="img"
      aria-label={label ?? "Video placeholder"}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-aff-accent sm:h-16 sm:w-16">
        <div
          aria-hidden="true"
          className="ml-1 h-0 w-0 border-y-[9px] border-l-[14px] border-y-transparent border-l-aff-accent"
        />
      </div>
    </div>
  );
}
