/**
 * Founder Inbox service boundary — the only place a Conversation or
 * Message is created, read or mutated. Same in-memory
 * Map<startupId, ...> pattern as lib/services/support-requests.ts; never
 * lets one startup's conversation/message leak into another's (see
 * messages-isolation.test.ts).
 *
 * A SupportRequest exposes exactly ONE conversation: getOrCreate is
 * idempotent keyed on relatedEntity {type:"SUPPORT_REQUEST", id}, so
 * calling it twice never creates a duplicate thread. The request's own
 * `message` field is preserved as-is and becomes the conversation's first
 * Message (founder-authored) — never duplicated into a second field.
 *
 * Nothing here mutates AFF Readiness, Pitch Readiness, Roadmap Progress,
 * Financial signals or Data Room Completion (see
 * messages-metric-separation.test.ts).
 */
import { randomUUID } from "crypto";
import type { Conversation, ConversationRelatedEntity, Message, MessageSenderRole } from "@/types/messages";
import { getSupportRequest, listSupportRequests } from "@/lib/services/support-requests";
import { listSessions } from "@/lib/services/mentoring";
import { listStartupIds } from "@/lib/services/digital-twin";

const conversationsStore = new Map<string, Conversation[]>();
const messagesStore = new Map<string, Message[]>();

function conversationsFor(startupId: string): Conversation[] {
  return conversationsStore.get(startupId) ?? [];
}
function saveConversations(startupId: string, conversations: Conversation[]) {
  conversationsStore.set(startupId, conversations);
}
function messagesFor(startupId: string): Message[] {
  return messagesStore.get(startupId) ?? [];
}
function saveMessages(startupId: string, messages: Message[]) {
  messagesStore.set(startupId, messages);
}

export function listConversations(startupId: string): Conversation[] {
  return conversationsFor(startupId);
}

export function getConversation(startupId: string, conversationId: string): Conversation | undefined {
  return conversationsFor(startupId).find((c) => c.id === conversationId);
}

export function listMessages(startupId: string, conversationId: string): Message[] {
  return messagesFor(startupId).filter((m) => m.conversationId === conversationId);
}

export function listAllMessages(startupId: string): Message[] {
  return messagesFor(startupId);
}

function findByRelatedEntity(startupId: string, relatedEntity: ConversationRelatedEntity): Conversation | undefined {
  return conversationsFor(startupId).find(
    (c) => c.relatedEntity?.type === relatedEntity.type && c.relatedEntity?.id === relatedEntity.id,
  );
}

/**
 * Exposes (or lazily creates, idempotently) the ONE conversation associated
 * with a SupportRequest. Preserves traceability: Conversation ->
 * SupportRequest -> StartupNeed -> Expert. The request's `message` becomes
 * the conversation's first (founder-authored) message — never duplicated,
 * never destructively migrated.
 */
export function getOrCreateConversationForSupportRequest(startupId: string, supportRequestId: string, nowIso: string): Conversation {
  const relatedEntity: ConversationRelatedEntity = { type: "SUPPORT_REQUEST", id: supportRequestId };
  const existing = findByRelatedEntity(startupId, relatedEntity);
  if (existing) return existing;

  const request = getSupportRequest(startupId, supportRequestId);
  if (!request) throw new Error(`No support request "${supportRequestId}" found for startup "${startupId}"`);

  // Preserve the support request's own timing when available (keeps the
  // conversation's history honest); fall back to the caller's `nowIso` only
  // if the request has no timestamp of its own.
  const originIso = request.createdAt ?? nowIso;
  const conversation: Conversation = {
    id: randomUUID(),
    startupId,
    type: "EXPERT_SUPPORT",
    participantIds: [request.founderId, request.expertId],
    subject: request.topic,
    relatedEntity,
    lastMessageAt: originIso,
    createdAt: originIso,
  };
  saveConversations(startupId, [...conversationsFor(startupId), conversation]);

  const initialMessage: Message = {
    id: randomUUID(),
    conversationId: conversation.id,
    senderId: request.founderId,
    senderRole: "FOUNDER",
    body: request.message,
    createdAt: originIso,
    reference: relatedEntity,
  };
  saveMessages(startupId, [...messagesFor(startupId), initialMessage]);

  return conversation;
}

function requireConversation(startupId: string, conversationId: string): Conversation {
  const conversation = getConversation(startupId, conversationId);
  if (!conversation) throw new Error(`No conversation "${conversationId}" found for startup "${startupId}"`);
  return conversation;
}

export function sendMessage(
  startupId: string,
  conversationId: string,
  input: { senderId: string; senderRole: MessageSenderRole; body: string; reference?: ConversationRelatedEntity; isDemo?: boolean },
  nowIso: string,
): Message {
  requireConversation(startupId, conversationId); // throws if the conversation doesn't exist/isn't this startup's
  const message: Message = {
    id: randomUUID(),
    conversationId,
    senderId: input.senderId,
    senderRole: input.senderRole,
    body: input.body,
    createdAt: nowIso,
    reference: input.reference,
    isDemo: input.isDemo,
  };
  saveMessages(startupId, [...messagesFor(startupId), message]);
  saveConversations(
    startupId,
    conversationsFor(startupId).map((c) => (c.id === conversationId ? { ...c, lastMessageAt: nowIso } : c)),
  );
  return message;
}

/** Marks every unread (non-founder, no readAt) message in a conversation as read. */
export function markConversationRead(startupId: string, conversationId: string, nowIso: string): Message[] {
  requireConversation(startupId, conversationId);
  const updated = messagesFor(startupId).map((m) =>
    m.conversationId === conversationId && m.senderRole !== "FOUNDER" && !m.readAt ? { ...m, readAt: nowIso } : m,
  );
  saveMessages(startupId, updated);
  return updated.filter((m) => m.conversationId === conversationId);
}

/** Test-only reset hook so isolated tests don't leak state across files. */
export function __resetMessagesStoreForTests() {
  conversationsStore.clear();
  messagesStore.clear();
}

// ---------------------------------------------------------------------------
// Seed: expose a conversation for every seeded support request, plus a
// clearly-labeled illustrative/demo expert reply for the one that has a
// completed mentoring session. No real person identities are implied.
// ---------------------------------------------------------------------------

function seedDemoInbox() {
  const seedIso = new Date().toISOString();
  for (const startupId of listStartupIds()) {
    for (const request of listSupportRequests(startupId)) {
      if (request.status === "CANCELLED" || request.status === "DRAFT") continue;
      const conversation = getOrCreateConversationForSupportRequest(startupId, request.id, seedIso);

      const relatedSession = listSessions(startupId).find((s) => s.supportRequestId === request.id && s.status === "COMPLETED");
      if (relatedSession && listMessages(startupId, conversation.id).length === 1) {
        sendMessage(
          startupId,
          conversation.id,
          {
            senderId: relatedSession.expertId,
            senderRole: "EXPERT",
            body:
              relatedSession.expertNotes ??
              "Illustrative/demo reply — thanks for the context, let's set up time to go through this.",
            reference: { type: "MENTORING_SESSION", id: relatedSession.id },
            isDemo: true,
          },
          relatedSession.completedAt ?? seedIso,
        );
      }
    }
  }
}
seedDemoInbox();
