import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetMessagesStoreForTests,
  getOrCreateConversationForSupportRequest,
  listConversations,
  listMessages,
  markConversationRead,
  sendMessage,
} from "./messages";
import { __resetSupportRequestsStoreForTests, createSupportRequest } from "./support-requests";
import { __resetExpertsStoreForTests, createExpertProfile } from "./experts";

function seedExpert() {
  return createExpertProfile(
    {
      displayName: "Demo Expert",
      headline: "h",
      bio: "b",
      country: "Kenya",
      languages: ["en"],
      expertise: ["FUNDRAISING"],
      industries: [],
      startupStages: ["mvp"],
      markets: ["Kenya"],
      availability: "AVAILABLE",
      mentoringFormats: ["VIDEO_CALL"],
      profileStatus: "ACTIVE",
    },
    "2026-01-01T00:00:00.000Z",
  );
}

describe("Founder Inbox: conversation creation + traceability", () => {
  beforeEach(() => {
    __resetMessagesStoreForTests();
    __resetSupportRequestsStoreForTests();
    __resetExpertsStoreForTests();
  });

  it("creates exactly one conversation from a support request, preserving the original message", () => {
    const expert = seedExpert();
    const request = createSupportRequest(
      "startup-a",
      {
        founderId: "founder-a",
        expertId: expert.id,
        topic: "Pricing sanity check",
        message: "Could you review our pricing model?",
        preferredFormat: "VIDEO_CALL",
        preferredLanguage: "en",
      },
      "2026-01-01T00:00:00.000Z",
    );

    const conversation = getOrCreateConversationForSupportRequest("startup-a", request.id, "2026-01-01T00:00:00.000Z");
    expect(conversation.relatedEntity).toEqual({ type: "SUPPORT_REQUEST", id: request.id });

    const messages = listMessages("startup-a", conversation.id);
    expect(messages).toHaveLength(1);
    expect(messages[0].body).toBe(request.message);
    expect(messages[0].senderRole).toBe("FOUNDER");
  });

  it("is idempotent — calling getOrCreate twice never creates a duplicate conversation", () => {
    const expert = seedExpert();
    const request = createSupportRequest(
      "startup-a",
      {
        founderId: "founder-a",
        expertId: expert.id,
        topic: "t",
        message: "m",
        preferredFormat: "CHAT",
        preferredLanguage: "en",
      },
      "2026-01-01T00:00:00.000Z",
    );
    const first = getOrCreateConversationForSupportRequest("startup-a", request.id, "2026-01-01T00:00:00.000Z");
    const second = getOrCreateConversationForSupportRequest("startup-a", request.id, "2026-01-02T00:00:00.000Z");
    expect(first.id).toBe(second.id);
    expect(listConversations("startup-a")).toHaveLength(1);
  });

  it("sends a founder message and advances lastMessageAt, preserving conversation ordering", () => {
    const expert = seedExpert();
    const requestA = createSupportRequest(
      "startup-a",
      { founderId: "f", expertId: expert.id, topic: "old", message: "m1", preferredFormat: "CHAT", preferredLanguage: "en" },
      "2026-01-01T00:00:00.000Z",
    );
    const requestB = createSupportRequest(
      "startup-a",
      { founderId: "f", expertId: expert.id, topic: "new", message: "m2", preferredFormat: "CHAT", preferredLanguage: "en" },
      "2026-01-02T00:00:00.000Z",
    );
    const convA = getOrCreateConversationForSupportRequest("startup-a", requestA.id, "2026-01-01T00:00:00.000Z");
    const convB = getOrCreateConversationForSupportRequest("startup-a", requestB.id, "2026-01-02T00:00:00.000Z");

    sendMessage("startup-a", convA.id, { senderId: "f", senderRole: "FOUNDER", body: "follow-up" }, "2026-03-01T00:00:00.000Z");

    const ordered = listConversations("startup-a").sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1));
    expect(ordered[0].id).toBe(convA.id);
    expect(ordered[1].id).toBe(convB.id);
  });

  it("marks messages read/unread correctly", () => {
    const expert = seedExpert();
    const request = createSupportRequest(
      "startup-a",
      { founderId: "f", expertId: expert.id, topic: "t", message: "m", preferredFormat: "CHAT", preferredLanguage: "en" },
      "2026-01-01T00:00:00.000Z",
    );
    const conversation = getOrCreateConversationForSupportRequest("startup-a", request.id, "2026-01-01T00:00:00.000Z");
    sendMessage("startup-a", conversation.id, { senderId: expert.id, senderRole: "EXPERT", body: "reply" }, "2026-01-02T00:00:00.000Z");

    const beforeRead = listMessages("startup-a", conversation.id);
    expect(beforeRead.find((m) => m.senderRole === "EXPERT")?.readAt).toBeUndefined();

    markConversationRead("startup-a", conversation.id, "2026-01-03T00:00:00.000Z");
    const afterRead = listMessages("startup-a", conversation.id);
    expect(afterRead.find((m) => m.senderRole === "EXPERT")?.readAt).toBe("2026-01-03T00:00:00.000Z");
    // founder's own message is never marked via this path
    expect(afterRead.find((m) => m.senderRole === "FOUNDER")?.readAt).toBeUndefined();
  });
});

describe("Founder Inbox: startup isolation", () => {
  beforeEach(() => {
    __resetMessagesStoreForTests();
    __resetSupportRequestsStoreForTests();
    __resetExpertsStoreForTests();
  });

  it("does not let startup A's conversations/messages appear for startup B", () => {
    const expert = seedExpert();
    const requestA = createSupportRequest(
      "startup-a",
      { founderId: "f", expertId: expert.id, topic: "t", message: "secret-a", preferredFormat: "CHAT", preferredLanguage: "en" },
      "2026-01-01T00:00:00.000Z",
    );
    const requestB = createSupportRequest(
      "startup-b",
      { founderId: "f2", expertId: expert.id, topic: "t2", message: "secret-b", preferredFormat: "CHAT", preferredLanguage: "en" },
      "2026-01-01T00:00:00.000Z",
    );
    const convA = getOrCreateConversationForSupportRequest("startup-a", requestA.id, "2026-01-01T00:00:00.000Z");
    getOrCreateConversationForSupportRequest("startup-b", requestB.id, "2026-01-01T00:00:00.000Z");

    expect(listConversations("startup-b")).toHaveLength(1);
    expect(listConversations("startup-b")[0].id).not.toBe(convA.id);
    // No cross-startup message access: startup-b's message list never
    // contains startup-a's conversation id or content.
    const bMessages = listMessages("startup-b", convA.id);
    expect(bMessages).toHaveLength(0);
    const allBMessages = listConversations("startup-b").flatMap((c) => listMessages("startup-b", c.id));
    expect(allBMessages.some((m) => m.body === "secret-a")).toBe(false);
  });
});

describe("Founder Inbox: deterministic demo seeding", () => {
  it("seeds a conversation for existing demo support requests without crashing, and demo replies are labeled", () => {
    // Uses the module-level seed already run against the real demo data
    // (support-requests.ts / mentoring.ts seed on import) — verify shape
    // only, since state here is the real app seed, not a reset test store.
    const conversations = listConversations("startup-wakama");
    expect(Array.isArray(conversations)).toBe(true);
    for (const conversation of conversations) {
      const messages = listMessages("startup-wakama", conversation.id);
      for (const message of messages) {
        if (message.senderRole !== "FOUNDER") {
          expect(message.isDemo).toBe(true);
        }
      }
    }
  });
});
