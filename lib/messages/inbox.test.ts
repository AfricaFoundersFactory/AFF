import { describe, expect, it } from "vitest";
import { buildConversationPreviews, computeUnreadCount, filterConversationPreviews, sortConversationsByRecency } from "./inbox";
import type { Conversation, Message } from "@/types/messages";

function conv(id: string, lastMessageAt: string, type: Conversation["type"] = "EXPERT_SUPPORT"): Conversation {
  return { id, startupId: "s1", type, participantIds: ["founder", "expert"], lastMessageAt, createdAt: lastMessageAt };
}

function msg(id: string, conversationId: string, senderRole: Message["senderRole"], createdAt: string, readAt?: string): Message {
  return { id, conversationId, senderId: "x", senderRole, body: "hi", createdAt, readAt };
}

describe("sortConversationsByRecency", () => {
  it("orders newest lastMessageAt first", () => {
    const result = sortConversationsByRecency([conv("a", "2026-01-01"), conv("b", "2026-02-01")]);
    expect(result.map((c) => c.id)).toEqual(["b", "a"]);
  });
});

describe("computeUnreadCount", () => {
  it("counts only non-founder messages without readAt", () => {
    const messages = [
      msg("1", "c1", "EXPERT", "2026-01-01"),
      msg("2", "c1", "FOUNDER", "2026-01-02"),
      msg("3", "c1", "EXPERT", "2026-01-03", "2026-01-04"),
    ];
    expect(computeUnreadCount(messages)).toBe(1);
  });
});

describe("buildConversationPreviews + filterConversationPreviews", () => {
  it("computes last message and unread count per conversation, and filters", () => {
    const conversations = [conv("a", "2026-01-01"), conv("b", "2026-02-01", "SYSTEM")];
    const byConv = new Map<string, Message[]>([
      ["a", [msg("1", "a", "EXPERT", "2026-01-01")]],
      ["b", [msg("2", "b", "SYSTEM", "2026-02-01", "2026-02-02")]],
    ]);
    const previews = buildConversationPreviews(conversations, byConv);
    expect(previews[0].conversation.id).toBe("b");
    expect(previews[0].unreadCount).toBe(0);
    expect(previews[1].unreadCount).toBe(1);

    expect(filterConversationPreviews(previews, "unread").map((p) => p.conversation.id)).toEqual(["a"]);
    expect(filterConversationPreviews(previews, "experts").map((p) => p.conversation.id)).toEqual(["a"]);
    expect(filterConversationPreviews(previews, "all")).toHaveLength(2);
  });
});
