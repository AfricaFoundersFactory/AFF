/**
 * Pure, deterministic Founder Inbox engine — no persistence, no
 * randomness, no dates generated internally (every "now" is passed in).
 * lib/services/messages.ts is the only caller that owns state.
 */
import type { Conversation, ConversationFilter, ConversationWithPreview, Message } from "@/types/messages";

export function sortConversationsByRecency(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : a.lastMessageAt > b.lastMessageAt ? -1 : 0));
}

/**
 * A message counts as unread for the founder when it was NOT sent by the
 * founder and has no readAt yet. Founder-authored messages are never
 * "unread" from the founder's own point of view.
 */
export function computeUnreadCount(messages: Message[]): number {
  return messages.filter((m) => m.senderRole !== "FOUNDER" && !m.readAt).length;
}

export function buildConversationPreviews(conversations: Conversation[], messagesByConversationId: Map<string, Message[]>): ConversationWithPreview[] {
  return sortConversationsByRecency(conversations).map((conversation) => {
    const messages = messagesByConversationId.get(conversation.id) ?? [];
    const sorted = [...messages].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    return {
      conversation,
      lastMessage: sorted[sorted.length - 1],
      unreadCount: computeUnreadCount(messages),
    };
  });
}

export function filterConversationPreviews(previews: ConversationWithPreview[], filter: ConversationFilter): ConversationWithPreview[] {
  switch (filter) {
    case "unread":
      return previews.filter((p) => p.unreadCount > 0);
    case "experts":
      return previews.filter((p) => p.conversation.type === "EXPERT_SUPPORT");
    case "all":
    default:
      return previews;
  }
}
