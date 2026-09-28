// AFF Community domain model (AFF-DASH-09 Part A).
//
// Purpose: ask, share, learn, help, discover, connect — community-first,
// no paid features, no vanity metrics. Explicitly NOT a generic social
// network clone.
//
// CommunityProfile is USER-scoped (a founder's community identity), never
// startup-scoped — a founder may carry the same community identity across
// multiple startups. Whether/how a startup is exposed in Community is a
// separate, explicit, per-startup opt-in (see types/settings.ts
// StartupCommunitySettings + lib/community/visibility.ts), never inferred
// from the founder's identity.
//
// Never expose by default via Community: financials, cash, runway, Data
// Room contents, private Digital Twin fields, Readiness evidence, expert
// session notes, or private Messages. See lib/community/visibility.ts and
// community-privacy.test.ts.

export type CommunityProfileVisibility = "PRIVATE" | "COMMUNITY" | "PUBLIC";

// How much of a startup (if any) is exposed alongside a founder's community
// activity. HIDDEN = nothing. NAME_ONLY = startup name only. SUMMARY = name
// + a short, explicitly-safe one-line summary (never financials/Data
// Room/expert notes/messages/readiness evidence).
export type StartupCommunityVisibility = "HIDDEN" | "NAME_ONLY" | "SUMMARY";

export type CommunityProfile = {
  userId: string;
  displayName: string;
  bio?: string;
  profileVisibility: CommunityProfileVisibility;
  allowCommunityDiscovery: boolean;
  allowExpertDiscovery: boolean;
  createdAt: string;
  updatedAt: string;
};

// Controlled taxonomy — stable enum-like keys, never free text. Reuses the
// same sector vocabulary shape as Opportunity.industries where applicable
// (see lib/community/taxonomy.ts). Translated only for display via
// dashboard.community.topics.<id>.
export type CommunityTopicId =
  | "FUNDRAISING"
  | "PITCH"
  | "PRODUCT"
  | "TECHNOLOGY"
  | "AI_DATA"
  | "SALES"
  | "MARKETING"
  | "FINANCE"
  | "LEGAL"
  | "OPERATIONS"
  | "TEAM"
  | "IMPACT_ESG"
  | "AGRICULTURE"
  | "FINTECH"
  | "HEALTHTECH"
  | "CLIMATE"
  | "LOGISTICS"
  | "GENERAL";

export type CommunityPostType =
  | "QUESTION"
  | "DISCUSSION"
  | "PROGRESS"
  | "RESOURCE_SHARE"
  | "OPPORTUNITY_SHARE"
  | "PITCH_FEEDBACK_REQUEST"
  | "EVENT"
  | "GENERAL";

export type CommunityContentStatus = "PUBLISHED" | "DELETED";

export type CommunityPost = {
  id: string;
  authorId: string;
  // Optional: the startup this post is written in the context of. Presence
  // of this field does NOT by itself expose the startup publicly — display
  // is always gated through resolveStartupExposure() using the startup's
  // StartupCommunitySettings (see lib/community/visibility.ts).
  startupId?: string;
  type: CommunityPostType;
  topic: CommunityTopicId;
  title?: string;
  body: string;
  // Set only for RESOURCE_SHARE / OPPORTUNITY_SHARE — references the
  // canonical Resource/Opportunity by id. Community never copies or
  // duplicates that data into its own tables.
  resourceId?: string;
  opportunityId?: string;
  // Set only for EVENT posts that link to a canonical CommunityEvent (or an
  // existing Pitch Live session) rather than duplicating event data.
  eventId?: string;
  circleId?: string;
  status: CommunityContentStatus;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
};

export type CommunityComment = {
  id: string;
  postId: string;
  authorId: string;
  // One reply level max: a comment with parentId set must reply to a
  // top-level comment (parentId === undefined on the parent). Enforced in
  // lib/services/community.ts#createComment.
  parentId?: string;
  body: string;
  status: CommunityContentStatus;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
};

export type CommunityReactionType = "HELPFUL" | "INSIGHTFUL" | "SUPPORT";
export type CommunityReactionTargetType = "POST" | "COMMENT";

export type CommunityReaction = {
  id: string;
  targetType: CommunityReactionTargetType;
  targetId: string;
  userId: string;
  type: CommunityReactionType;
  createdAt: string;
};

export type CommunityCircle = {
  id: string;
  name: string;
  description: string;
  topic?: CommunityTopicId;
  isDemo?: boolean;
};

export type CommunityMembership = {
  circleId: string;
  userId: string;
  joinedAt: string;
};

export type CommunityEventType =
  | "AFF_LIVE"
  | "PITCH_LIVE"
  | "WORKSHOP"
  | "AMA"
  | "NETWORKING"
  | "OFFICE_HOURS"
  | "COMMUNITY_SESSION";

export type CommunityEventFormat = "ONLINE" | "IN_PERSON" | "HYBRID";
export type CommunityEventStatus = "UPCOMING" | "LIVE" | "COMPLETED" | "CANCELLED";

export type CommunityEvent = {
  id: string;
  title: string;
  description: string;
  type: CommunityEventType;
  startsAt: string;
  endsAt?: string;
  format: CommunityEventFormat;
  location?: string;
  externalUrl?: string;
  // If set, this event is a real existing workflow (e.g. Pitch Live) and
  // the UI should link to it rather than duplicating it.
  linkedRoute?: string;
  capacity?: number;
  status: CommunityEventStatus;
  isDemo?: boolean;
};

export type CommunityEventRegistration = {
  id: string;
  eventId: string;
  userId: string;
  // Optional: which startup this registration is made on behalf of, kept
  // for startup-scoped isolation/analytics. Personal (user-only)
  // registrations may leave this unset.
  startupId?: string;
  registeredAt: string;
  cancelledAt?: string;
};

export type CommunityReportReason = "SPAM" | "ABUSE" | "MISLEADING" | "INAPPROPRIATE" | "OTHER";
export type CommunityReportTargetType = "POST" | "COMMENT";

export type CommunityReport = {
  id: string;
  targetType: CommunityReportTargetType;
  targetId: string;
  reporterId: string;
  reason: CommunityReportReason;
  note?: string;
  createdAt: string;
};
