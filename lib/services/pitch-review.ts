/**
 * Expert Review foundation service boundary (Part 19-22). Same
 * Map<startupId, ...> pattern as the other pitch services.
 *
 * No real expert authentication/workflow exists yet — every PitchReview
 * seeded below (bottom of this file, same self-seeding convention as
 * lib/services/roadmap.ts) has isDemo=true and a reviewerName that is
 * always rendered next to an "illustrative/demo" label in the UI (never
 * presented as if a real AFF expert reviewed the pitch).
 *
 * Feedback -> Task integration reuses lib/services/tasks.ts directly (no
 * parallel task system): a created task's `sourceReference` is set to the
 * originating comment id (or gap key), which is how duplicate-creation is
 * prevented. Nothing here ever calls a Readiness-score-mutating function —
 * completing/creating a task from feedback never changes AFF Readiness or
 * Pitch Readiness.
 */
import { randomUUID } from "crypto";
import type { PitchReview, ReviewComment, ReviewCommentType } from "@/types/pitch";
import type { Task } from "@/types/roadmap";
import * as taskService from "@/lib/services/tasks";
import { getActiveVersion } from "@/lib/services/pitch";

const store = new Map<string, PitchReview[]>();

function reviewsFor(startupId: string): PitchReview[] {
  return store.get(startupId) ?? [];
}

function save(startupId: string, reviews: PitchReview[]) {
  store.set(startupId, reviews);
}

export function listReviews(startupId: string, pitchVersionId?: string): PitchReview[] {
  const reviews = reviewsFor(startupId);
  return pitchVersionId ? reviews.filter((r) => r.pitchVersionId === pitchVersionId) : reviews;
}

function requireReview(startupId: string, reviewId: string): PitchReview {
  const review = reviewsFor(startupId).find((r) => r.id === reviewId);
  if (!review) throw new Error(`No pitch review "${reviewId}" found for startup "${startupId}"`);
  return review;
}

function requireComment(review: PitchReview, commentId: string): ReviewComment {
  const comment = review.comments.find((c) => c.id === commentId);
  if (!comment) throw new Error(`No review comment "${commentId}" found in review "${review.id}"`);
  return comment;
}

function saveReview(startupId: string, review: PitchReview) {
  const reviews = reviewsFor(startupId);
  const exists = reviews.some((r) => r.id === review.id);
  save(startupId, exists ? reviews.map((r) => (r.id === review.id ? review : r)) : [...reviews, review]);
}

export function resolveComment(startupId: string, reviewId: string, commentId: string, nowIso: string): PitchReview {
  const review = requireReview(startupId, reviewId);
  requireComment(review, commentId);
  const comments = review.comments.map((c) => (c.id === commentId ? { ...c, status: "resolved" as const, resolvedAt: nowIso } : c));
  const updated = { ...review, comments };
  saveReview(startupId, updated);
  return updated;
}

export function dismissComment(startupId: string, reviewId: string, commentId: string, nowIso: string): PitchReview {
  const review = requireReview(startupId, reviewId);
  requireComment(review, commentId);
  const comments = review.comments.map((c) => (c.id === commentId ? { ...c, status: "dismissed" as const, resolvedAt: nowIso } : c));
  const updated = { ...review, comments };
  saveReview(startupId, updated);
  return updated;
}

export function countUnresolvedComments(startupId: string, pitchVersionId?: string): number {
  return listReviews(startupId, pitchVersionId)
    .flatMap((r) => r.comments)
    .filter((c) => c.status === "open").length;
}

/**
 * Creates a Task from a review comment (Part 21). sourceType is always
 * EXPERT_RECOMMENDATION. Prevents duplicate task creation from the same
 * comment: if the comment already has a `taskId`, throws rather than
 * silently creating a second task.
 */
export function createTaskFromComment(
  startupId: string,
  reviewId: string,
  commentId: string,
  nowIso: string,
): { review: PitchReview; task: Task } {
  const review = requireReview(startupId, reviewId);
  const comment = requireComment(review, commentId);
  if (comment.taskId) {
    throw new Error(`A task already exists for review comment "${commentId}".`);
  }

  const task = taskService.createTask(
    startupId,
    {
      title: comment.message.slice(0, 120),
      description: comment.message,
      category: "pitch",
      sourceType: "EXPERT_RECOMMENDATION",
      createdBy: "AFF",
      linkedModule: "pitch",
    },
    nowIso,
  );
  const taskWithLinks = taskService.updateTask(
    startupId,
    task.id,
    { sourceReference: commentId, pitchVersionId: review.pitchVersionId, pitchSectionId: comment.sectionId },
    nowIso,
  );

  const comments = review.comments.map((c) => (c.id === commentId ? { ...c, taskId: task.id } : c));
  const updatedReview = { ...review, comments };
  saveReview(startupId, updatedReview);
  return { review: updatedReview, task: taskWithLinks };
}

/**
 * Pitch Readiness gap -> Roadmap/Task (Part 22). Founder-triggered per gap
 * (never automatic/bulk). sourceType PITCH_IMPROVEMENT, deduplicated by
 * `sourceReference` (the gap's stable key, e.g. a Pitch Readiness dimension
 * key) so clicking the CTA twice for the same gap never creates two tasks.
 */
export function createPitchImprovementTask(
  startupId: string,
  input: { gapKey: string; title: string; description?: string; pitchVersionId: string; pitchSectionId?: string },
  nowIso: string,
): Task {
  const existing = taskService
    .getTasksForStartup(startupId)
    .find((t) => t.sourceType === "PITCH_IMPROVEMENT" && t.sourceReference === input.gapKey);
  if (existing) return existing;

  const task = taskService.createTask(
    startupId,
    {
      title: input.title,
      description: input.description,
      category: "pitch",
      sourceType: "PITCH_IMPROVEMENT",
      createdBy: "FOUNDER",
      linkedModule: "pitch",
    },
    nowIso,
  );
  return taskService.updateTask(
    startupId,
    task.id,
    { sourceReference: input.gapKey, pitchVersionId: input.pitchVersionId, pitchSectionId: input.pitchSectionId },
    nowIso,
  );
}

/** Test-only reset hook so isolated tests don't leak state across files. */
export function __resetPitchReviewStoreForTests() {
  store.clear();
}

/** Internal seeding hook used by seedDemoReviewData() (bottom of this file) only. */
export function __seedReviewsForDemo(startupId: string, reviews: PitchReview[]) {
  store.set(startupId, reviews);
}

export function __buildDemoComment(input: {
  reviewId: string;
  sectionId?: string;
  authorId: string;
  type: ReviewCommentType;
  message: string;
  createdAt: string;
}): ReviewComment {
  return {
    id: randomUUID(),
    reviewId: input.reviewId,
    sectionId: input.sectionId,
    authorId: input.authorId,
    type: input.type,
    message: input.message,
    status: "open",
    createdAt: input.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Seed: startup-wakama gets one completed, clearly-labeled DEMO review with
// a critical issue, a suggestion and an already-resolved comment (Part 30 —
// startup-solari intentionally gets none, since it has "no review" yet).
// isDemo=true throughout — never presented as if a real AFF expert reviewed
// this pitch (Part 20).
// ---------------------------------------------------------------------------
function seedDemoReviewData() {
  if (store.has("startup-wakama")) return;
  const version = getActiveVersion("startup-wakama");
  if (!version) return;

  const seedIso = new Date().toISOString();
  const reviewId = randomUUID();
  const askSectionId = version.sections.find((s) => s.type === "fundraising_ask")?.id;
  const tractionSectionId = version.sections.find((s) => s.type === "traction")?.id;
  const teamSectionId = version.sections.find((s) => s.type === "team")?.id;

  const comments: ReviewComment[] = [
    __buildDemoComment({
      reviewId,
      sectionId: askSectionId,
      authorId: "demo-reviewer-1",
      type: "critical_issue",
      message: "The ask doesn't state an amount or instrument — investors will ask about this immediately.",
      createdAt: seedIso,
    }),
    __buildDemoComment({
      reviewId,
      sectionId: tractionSectionId,
      authorId: "demo-reviewer-1",
      type: "suggestion",
      message: "Add a specific growth metric (e.g. month-over-month GMV) instead of a general claim.",
      createdAt: seedIso,
    }),
    { ...__buildDemoComment({
        reviewId,
        sectionId: teamSectionId,
        authorId: "demo-reviewer-1",
        type: "comment",
        message: "Team section reads well — clear complementary roles.",
        createdAt: seedIso,
      }), status: "resolved", resolvedAt: seedIso },
  ];

  const review: PitchReview = {
    id: reviewId,
    startupId: "startup-wakama",
    pitchVersionId: version.id,
    reviewerId: "demo-reviewer-1",
    reviewerName: "Amina K. (illustrative AFF Venture Partner — demo data)",
    isDemo: true,
    status: "completed",
    createdAt: seedIso,
    completedAt: seedIso,
    overallComment: "Strong narrative; sharpen the ask and traction evidence before Pitch Live.",
    comments,
  };
  __seedReviewsForDemo("startup-wakama", [review]);
}
seedDemoReviewData();
