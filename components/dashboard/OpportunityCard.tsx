import { ButtonLink } from "@/components/ui/Button";
import type { Opportunity } from "@/types/opportunity";

export function OpportunityCard({
  opportunity,
  matchLabel,
  deadlineLabel,
  deadlineFormatted,
  missingLabel,
  ctaLabel,
  ctaHref,
}: {
  opportunity: Opportunity;
  matchLabel: string;
  deadlineLabel: string;
  deadlineFormatted: string;
  missingLabel: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="font-heading text-[16px] font-semibold text-aff-text">
          {opportunity.title}
        </h3>
        <span className="shrink-0 rounded-full bg-aff-accent-soft px-2.5 py-1 text-[12px] font-semibold text-aff-accent">
          {opportunity.matchPct}% {matchLabel}
        </span>
      </div>
      <div className="mb-1 text-[13px] text-aff-muted">
        {deadlineLabel}: {deadlineFormatted}
      </div>
      {opportunity.missingRequirement ? (
        <div className="mb-4 text-[13px] text-amber-400">
          {missingLabel}: {opportunity.missingRequirement}
        </div>
      ) : (
        <div className="mb-4" />
      )}
      <ButtonLink href={ctaHref} variant="secondary" className="px-4 py-2.5 text-[13.5px]">
        {ctaLabel}
      </ButtonLink>
    </div>
  );
}
