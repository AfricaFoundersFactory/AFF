import { DiagnosticGap } from "./DiagnosticGap";
import { RecommendedAction } from "./RecommendedAction";
import type { ActionCard } from "@/types/scoring";

export function ActionPlan({
  card,
  gapLabel,
  actionLabel,
}: {
  card: ActionCard;
  gapLabel: string;
  actionLabel: string;
}) {
  return (
    <div className="flex-1 rounded-2xl border border-aff-line bg-aff-bg2 p-8 sm:p-10">
      <div className="mb-5 flex items-baseline justify-between">
        <div className="font-heading text-[14px] font-semibold tracking-[0.06em] text-aff-text sm:text-[15px]">
          {card.title}
        </div>
        <div className="font-heading text-xl font-bold text-aff-text sm:text-[26px]">
          {card.score}
          <span className="text-sm font-medium text-aff-muted">/100</span>
        </div>
      </div>
      <span className="mb-5 inline-block rounded-full border border-aff-accent/40 px-3 py-1.5 text-[11.5px] font-semibold tracking-[0.06em] text-aff-accent">
        {card.status}
      </span>
      <DiagnosticGap label={gapLabel}>{card.gap}</DiagnosticGap>
      <RecommendedAction label={actionLabel} action={card.action} resource={card.resource} />
    </div>
  );
}
