export function ErrorState({ title, body }: { title: string; body?: string }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-red-400/30 bg-red-400/5 px-6 py-10 text-center"
    >
      <p className="text-[14px] font-semibold text-aff-text">{title}</p>
      {body ? <p className="text-[13px] text-aff-muted">{body}</p> : null}
    </div>
  );
}
