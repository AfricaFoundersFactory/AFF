import { ButtonLink } from "@/components/ui/Button";
import type { OpportunityMatch } from "@/types/opportunity";

/**
 * Command Center preview card — shows the single most relevant opportunity
 * (by MATCH-reason count, never a score/percentage) plus its top
 * human-readable reason. The full reason list lives on
 * /dashboard/opportunities; see components/dashboard/opportunities/OpportunityListCard.tsx.
 */
export function OpportunityCard({
  match,
  reasonLabel,
  deadlineLabel,
  deadlineFormatted,
  ctaLabel,
  ctaHref,
}: {
  match: OpportunityMatch;
  reasonLabel: (key: string, data?: Record<string, string>) => string;
  deadlineLabel: string;
  deadlineFormatted: string | undefined;
  ctaLabel: string;
  ctaHref: string;
}) {
  const { opportunity, reasons } = match;
  const topReason = reasons.find((r) => r.kind === "MATCH");
  const topMismatch = reasons.find((r) => r.kind === "MISMATCH");

  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="font-heading text-[16px] font-semibold text-aff-text">{opportunity.title}</h3>
        <span className="shrink-0 rounded-full bg-aff-accent-soft px-2.5 py-1 text-[11.5px] font-medium text-aff-accent">
          {opportunity.organization}
        </span>
      </div>
      {deadlineFormatted && (
        <div className="mb-1 text-[13px] text-aff-muted">
          {deadlineLabel}: {deadlineFormatted}
        </div>
      )}
      {topReason ? (
        <div className="mb-1 text-[13px] text-aff-text">✓ {reasonLabel(topReason.labelKey, topReason.data)}</div>
      ) : null}
      {topMismatch ? (
        <div className="mb-4 text-[13px] text-amber-400">✗ {reasonLabel(topMismatch.labelKey, topMismatch.data)}</div>
      ) : (
        <div className="mb-4" />
      )}
      <ButtonLink href={ctaHref} variant="secondary" className="px-4 py-2.5 text-[13.5px]">
        {ctaLabel}
      </ButtonLink>
    </div>
  );
}
