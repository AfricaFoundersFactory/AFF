"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useStartup } from "@/components/dashboard/StartupContext";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
import { resolveReviewCommentAction, dismissReviewCommentAction, createTaskFromCommentAction } from "@/lib/actions/pitch";
import type { PitchReview, PitchSection, ReviewComment } from "@/types/pitch";
import { cn } from "@/lib/utils";

export type PitchReviewEntry = {
  reviews: PitchReview[];
  sections: PitchSection[];
};

const TYPE_TONE: Record<ReviewComment["type"], string> = {
  comment: "border-aff-line text-aff-muted",
  question: "border-aff-cyan/40 text-aff-cyan",
  suggestion: "border-aff-accent/40 text-aff-accent",
  critical_issue: "border-red-400/40 text-red-400",
};

function CommentRow({
  startupId,
  review,
  comment,
  sectionTitle,
}: {
  startupId: string;
  review: PitchReview;
  comment: ReviewComment;
  sectionTitle?: string;
}) {
  const t = useTranslations("dashboard.pitch.review");
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleResolve = () => {
    startTransition(async () => {
      await resolveReviewCommentAction(startupId, review.id, comment.id);
      router.refresh();
    });
  };
  const handleDismiss = () => {
    startTransition(async () => {
      await dismissReviewCommentAction(startupId, review.id, comment.id);
      router.refresh();
    });
  };
  const handleCreateTask = () => {
    startTransition(async () => {
      await createTaskFromCommentAction(startupId, review.id, comment.id);
      router.refresh();
    });
  };

  return (
    <div className={cn("rounded-lg border p-3", TYPE_TONE[comment.type])}>
      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.04em]">
        <span>{t(`types.${comment.type}`)}</span>
        <span>{t(`statusLabels.${comment.status}`)}</span>
      </div>
      {sectionTitle ? <p className="mt-1 text-[11px] text-aff-muted">{sectionTitle}</p> : null}
      <p className="mt-1.5 text-[13px] text-aff-text">{comment.message}</p>
      {comment.status === "open" ? (
        <div className="mt-2.5 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleResolve} className="px-3 py-1.5 text-[11.5px]">
            {t("resolve")}
          </Button>
          <Button variant="secondary" onClick={handleDismiss} className="px-3 py-1.5 text-[11.5px]">
            {t("dismiss")}
          </Button>
          {comment.taskId ? (
            <span className="px-3 py-1.5 text-[11.5px] text-aff-accent">{t("taskCreated")}</span>
          ) : (
            <Button variant="secondary" onClick={handleCreateTask} className="px-3 py-1.5 text-[11.5px]">
              {t("createTask")}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function PitchReviewView({ dataByStartupId }: { dataByStartupId: Record<string, PitchReviewEntry> }) {
  const { activeStartup } = useStartup();
  const entry = dataByStartupId[activeStartup.id];
  const t = useTranslations("dashboard.pitch.review");
  const tSections = useTranslations("dashboard.pitch.sections");

  if (!entry) return null;

  const unresolved = entry.reviews.flatMap((r) => r.comments).filter((c) => c.status === "open").length;
  const sectionTitleFor = (sectionId?: string) => {
    const section = entry.sections.find((s) => s.id === sectionId);
    return section ? tSections(`${section.type}.title`) : undefined;
  };

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{t("pageTitle")}</h1>
        <p className="mt-1.5 text-[13.5px] text-aff-muted">{t("pageSubtitle")}</p>
      </div>

      {entry.reviews.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        entry.reviews.map((review) => (
          <DashboardSection key={review.id} title={t("unresolvedCount", { count: unresolved })}>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-[12.5px] font-semibold text-aff-text">{review.reviewerName}</span>
              {review.isDemo ? (
                <span className="rounded-full bg-aff-bg px-2 py-0.5 text-[10.5px] font-semibold text-aff-muted">{t("demoLabel")}</span>
              ) : null}
            </div>
            {review.overallComment ? <p className="mb-3 text-[13px] text-aff-muted">{review.overallComment}</p> : null}
            <div className="flex flex-col gap-3">
              {review.comments.map((comment) => (
                <CommentRow
                  key={comment.id}
                  startupId={activeStartup.id}
                  review={review}
                  comment={comment}
                  sectionTitle={sectionTitleFor(comment.sectionId)}
                />
              ))}
            </div>
          </DashboardSection>
        ))
      )}
    </div>
  );
}
