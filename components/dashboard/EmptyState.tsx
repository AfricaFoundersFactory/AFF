export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-aff-line px-6 py-10 text-center">
      <p className="text-[14px] font-semibold text-aff-text">{title}</p>
      {body ? <p className="text-[13px] text-aff-muted">{body}</p> : null}
    </div>
  );
}
