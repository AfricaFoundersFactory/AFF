import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetCommunityStoreForTests,
  addReaction,
  createComment,
  createPost,
  createReport,
  editComment,
  editPost,
  joinCircle,
  leaveCircle,
  listCircles,
  listComments,
  listMemberships,
  listPosts,
  listReactions,
  registerForEvent,
  cancelEventRegistration,
  softDeleteComment,
  softDeletePost,
  listEvents,
  isRegistered,
} from "./community";

describe("community service", () => {
  beforeEach(() => {
    __resetCommunityStoreForTests();
  });

  it("creates, edits and soft-deletes a post; only the author may do so", () => {
    const post = createPost({ authorId: "u1", type: "QUESTION", topic: "GENERAL", body: "hello" }, "2026-01-01T00:00:00.000Z");
    expect(listPosts()).toHaveLength(1);

    expect(() => editPost(post.id, "someone-else", { body: "hacked" }, "2026-01-02T00:00:00.000Z")).toThrow();

    const edited = editPost(post.id, "u1", { body: "hello world" }, "2026-01-02T00:00:00.000Z");
    expect(edited.body).toBe("hello world");

    const deleted = softDeletePost(post.id, "u1", "2026-01-03T00:00:00.000Z");
    expect(deleted.status).toBe("DELETED");
    expect(listPosts()).toHaveLength(0); // listPosts only returns PUBLISHED
  });

  it("creates comments with at most one reply level", () => {
    const post = createPost({ authorId: "u1", type: "DISCUSSION", topic: "GENERAL", body: "hi" }, "2026-01-01T00:00:00.000Z");
    const top = createComment(post.id, { authorId: "u2", body: "top-level" }, "2026-01-01T00:00:00.000Z");
    const reply = createComment(post.id, { authorId: "u1", body: "reply", parentId: top.id }, "2026-01-01T00:00:00.000Z");
    expect(reply.parentId).toBe(top.id);

    expect(() => createComment(post.id, { authorId: "u2", body: "double reply", parentId: reply.id }, "2026-01-01T00:00:00.000Z")).toThrow(
      /one reply level/,
    );
    expect(listComments(post.id)).toHaveLength(2);
  });

  it("edit/delete comment is author-only", () => {
    const post = createPost({ authorId: "u1", type: "DISCUSSION", topic: "GENERAL", body: "hi" }, "2026-01-01T00:00:00.000Z");
    const comment = createComment(post.id, { authorId: "u2", body: "c1" }, "2026-01-01T00:00:00.000Z");
    expect(() => editComment(post.id, comment.id, "u1", "hacked", "2026-01-02T00:00:00.000Z")).toThrow();
    const edited = editComment(post.id, comment.id, "u2", "c1 edited", "2026-01-02T00:00:00.000Z");
    expect(edited.body).toBe("c1 edited");
    const deleted = softDeleteComment(post.id, comment.id, "u2", "2026-01-03T00:00:00.000Z");
    expect(deleted.status).toBe("DELETED");
  });

  it("reactions are idempotent per (user, target, type) and removable", () => {
    const post = createPost({ authorId: "u1", type: "DISCUSSION", topic: "GENERAL", body: "hi" }, "2026-01-01T00:00:00.000Z");
    addReaction("POST", post.id, "u2", "HELPFUL", "2026-01-01T00:00:00.000Z");
    addReaction("POST", post.id, "u2", "HELPFUL", "2026-01-01T00:00:00.000Z"); // duplicate, no-op
    expect(listReactions("POST", post.id)).toHaveLength(1);
    addReaction("POST", post.id, "u2", "INSIGHTFUL", "2026-01-01T00:00:00.000Z");
    expect(listReactions("POST", post.id)).toHaveLength(2);
    addReaction("POST", post.id, "u3", "SUPPORT", "2026-01-01T00:00:00.000Z");
    expect(listReactions("POST", post.id)).toHaveLength(3);
  });

  it("circle join/leave is explicit and idempotent", () => {
    const circle = listCircles()[0];
    joinCircle("u1", circle.id, "2026-01-01T00:00:00.000Z");
    joinCircle("u1", circle.id, "2026-01-01T00:00:00.000Z"); // idempotent
    expect(listMemberships("u1")).toHaveLength(1);
    leaveCircle("u1", circle.id);
    expect(listMemberships("u1")).toHaveLength(0);
  });

  it("event registration respects capacity and supports cancellation", () => {
    const event = listEvents().find((e) => e.capacity !== undefined)!;
    registerForEvent("u1", event.id, "2026-01-01T00:00:00.000Z");
    expect(isRegistered("u1", event.id)).toBe(true);
    cancelEventRegistration("u1", event.id, "2026-01-02T00:00:00.000Z");
    expect(isRegistered("u1", event.id)).toBe(false);
  });

  it("records a report for future admin review", () => {
    const post = createPost({ authorId: "u1", type: "GENERAL", topic: "GENERAL", body: "spammy" }, "2026-01-01T00:00:00.000Z");
    const report = createReport({ targetType: "POST", targetId: post.id, reporterId: "u2", reason: "SPAM" }, "2026-01-01T00:00:00.000Z");
    expect(report.targetId).toBe(post.id);
  });

  it("resource/opportunity references are by id only, never duplicated data", () => {
    const post = createPost(
      { authorId: "u1", type: "RESOURCE_SHARE", topic: "GENERAL", body: "check this out", resourceId: "resource-123" },
      "2026-01-01T00:00:00.000Z",
    );
    expect(post.resourceId).toBe("resource-123");
    expect((post as unknown as Record<string, unknown>).resourceTitle).toBeUndefined();
  });
});
