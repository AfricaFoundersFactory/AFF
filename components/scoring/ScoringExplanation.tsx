export function ScoringExplanation({
  children,
  emphasized,
}: {
  children: React.ReactNode;
  emphasized?: boolean;
}) {
  return (
    <p
      className={
        emphasized
          ? "mx-auto mt-8 max-w-[600px] text-center text-sm font-medium text-aff-text sm:mt-11"
          : "mx-auto mt-6 max-w-[600px] text-center text-[13.5px] leading-relaxed text-aff-muted sm:mt-7 sm:text-sm"
      }
    >
      {children}
    </p>
  );
}
