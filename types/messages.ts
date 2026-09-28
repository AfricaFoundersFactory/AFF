// Founder Inbox domain model (AFF-DASH-08 Part A).
//
// Reuses existing Expert Network domain concepts instead of duplicating
// them: SupportRequest.message (types/experts.ts) is the origin/context of
// a conversation, never copied — a Conversation traces back to it via
// `relatedEntity`. MentoringSession / ExpertRecommendation identities are
// reused as-is; no second "expert" record is introduced here.
//
// Conversation.type reserves room for future workflows (INVESTOR,
// COMMUNITY, PROGRAM, AFF_SUPPORT) that are explicitly OUT OF SCOPE this
// batch — only EXPERT_SUPPORT and SYSTEM are ever created by the services
// in lib/services/messages.ts. This is a type-level reservation only, not a
// promise of behavior.
//
// NO realtime, NO read receipts between real users, NO attachments, NO
// email/push delivery — this is a structured inbox foundation. Seeded
// expert replies are always isDemo:true and must be rendered as
// illustrative/demo content, never as a real person having contacted the
// founder (see lib/services/messages.ts's seed function).

export type ConversationType =
  | "EXPERT_SUPPORT"
  | "SYSTEM"
  // --- reserved, NOT implemented this batch ---
  | "INVESTOR"
  | "COMMUNITY"
  | "PROGRAM"
  | "AFF_SUPPORT";

export type ConversationRelatedEntityType = "SUPPORT_REQUEST" | "MENTORING_SESSION" | "EXPERT_RECOMMENDATION";

export type ConversationRelatedEntity = {
  type: ConversationRelatedEntityType;
  id: string;
};

export type Conversation = {
  id: string;
  startupId: string;
  type: ConversationType;
  // Participant identities are opaque strings (founderId / expertId /
  // "system") — no separate user directory is introduced.
  participantIds: string[];
  subject?: string;
  relatedEntity?: ConversationRelatedEntity;
  lastMessageAt: string;
  createdAt: string;
};

export type MessageSenderRole = "FOUNDER" | "EXPERT" | "SYSTEM";

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: MessageSenderRole;
  body: string;
  createdAt: string;
  readAt?: string;
  reference?: ConversationRelatedEntity;
  // Every seeded expert/system reply is isDemo:true — the UI must render an
  // explicit "illustrative demo" label and never imply a real person sent
  // it. Founder-authored messages are always isDemo:false/undefined.
  isDemo?: boolean;
};

export type ConversationFilter = "all" | "unread" | "experts";

export type ConversationWithPreview = {
  conversation: Conversation;
  lastMessage?: Message;
  unreadCount: number;
};
