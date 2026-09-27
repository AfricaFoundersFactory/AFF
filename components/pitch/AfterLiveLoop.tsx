export function AfterLiveLoop({ steps }: { steps: string[] }) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-y-2.5 sm:mt-8">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className="rounded-full border border-aff-line px-3.5 py-2 font-heading text-[11.5px] font-semibold tracking-[0.04em] text-aff-text sm:px-4 sm:text-[12.5px]">
            {step}
          </div>
          {i < steps.length - 1 ? (
            <div className="mx-1.5 h-px w-5 bg-aff-accent opacity-50 sm:w-6" />
          ) : null}
        </div>
      ))}
    </div>
  );
}
