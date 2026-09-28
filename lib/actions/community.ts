"use server";

/**
 * Server Action boundary for AFF Community — the only way client
 * components create/edit/delete posts & comments, react, join/leave
 * circles, register for events, or file a report. Delegates entirely to
 * lib/services/community.ts and revalidates the dashboard routes on
 * success, exactly like lib/actions/messages.ts.
 */
import { revalidatePath } from "next/cache";
import * as communityService from "@/lib/services/community";
import { isNonEmpty } from "@/lib/validation";
import type {
  CommunityComment,
  CommunityEventRegistration,
  CommunityMembership,
  CommunityPost,
  CommunityPostType,
  CommunityReactionTargetType,
  CommunityReactionType,
  CommunityReport,
  CommunityReportReason,
  CommunityTopicId,
} from "@/types/community";

function nowIso(): string {
  return new Date().toISOString();
}

function revalidateDashboard() {
  revalidatePath("/[locale]/dashboard", "layout");
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function guard<T>(fn: () => T): Result<T> {
  try {
    const data = fn();
    revalidateDashboard();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function createPostAction(input: {
  authorId: string;
  startupId?: string;
  type: CommunityPostType;
  topic: CommunityTopicId;
  title?: string;
  body: string;
  resourceId?: string;
  opportunityId?: string;
}): Promise<Result<CommunityPost>> {
  if (!isNonEmpty(input.body)) return { ok: false, error: "validation" };
  return guard(() => communityService.createPost(input, nowIso()));
}

export async function editPostAction(postId: string, authorId: string, patch: { title?: string; body?: string }): Promise<Result<CommunityPost>> {
  return guard(() => communityService.editPost(postId, authorId, patch, nowIso()));
}

export async function deletePostAction(postId: string, authorId: string): Promise<Result<CommunityPost>> {
  return guard(() => communityService.softDeletePost(postId, authorId, nowIso()));
}

export async function createCommentAction(postId: string, authorId: string, body: string, parentId?: string): Promise<Result<CommunityComment>> {
  if (!isNonEmpty(body)) return { ok: false, error: "validation" };
  return guard(() => communityService.createComment(postId, { authorId, body, parentId }, nowIso()));
}

export async function editCommentAction(postId: string, commentId: string, authorId: string, body: string): Promise<Result<CommunityComment>> {
  if (!isNonEmpty(body)) return { ok: false, error: "validation" };
  return guard(() => communityService.editComment(postId, commentId, authorId, body, nowIso()));
}

export async function deleteCommentAction(postId: string, commentId: string, authorId: string): Promise<Result<CommunityComment>> {
  return guard(() => communityService.softDeleteComment(postId, commentId, authorId, nowIso()));
}

export async function addReactionAction(
  targetType: CommunityReactionTargetType,
  targetId: string,
  userId: string,
  type: CommunityReactionType,
) {
  return guard(() => communityService.addReaction(targetType, targetId, userId, type, nowIso()));
}

export async function removeReactionAction(
  targetType: CommunityReactionTargetType,
  targetId: string,
  userId: string,
  type: CommunityReactionType,
): Promise<Result<null>> {
  return guard(() => {
    communityService.removeReaction(targetType, targetId, userId, type);
    return null;
  });
}

export async function joinCircleAction(userId: string, circleId: string): Promise<Result<CommunityMembership>> {
  return guard(() => communityService.joinCircle(userId, circleId, nowIso()));
}

export async function leaveCircleAction(userId: string, circleId: string): Promise<Result<null>> {
  return guard(() => {
    communityService.leaveCircle(userId, circleId);
    return null;
  });
}

export async function registerForEventAction(userId: string, eventId: string, startupId?: string): Promise<Result<CommunityEventRegistration>> {
  return guard(() => communityService.registerForEvent(userId, eventId, nowIso(), startupId));
}

export async function cancelEventRegistrationAction(userId: string, eventId: string): Promise<Result<null>> {
  return guard(() => {
    communityService.cancelEventRegistration(userId, eventId, nowIso());
    return null;
  });
}

export async function reportContentAction(
  targetType: "POST" | "COMMENT",
  targetId: string,
  reporterId: string,
  reason: CommunityReportReason,
  note?: string,
): Promise<Result<CommunityReport>> {
  return guard(() => communityService.createReport({ targetType, targetId, reporterId, reason, note }, nowIso()));
}
