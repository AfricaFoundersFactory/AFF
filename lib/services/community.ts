/**
 * AFF Community service boundary — the only place a CommunityProfile,
 * CommunityPost, CommunityComment, CommunityReaction, CommunityCircle
 * membership, CommunityEvent registration or CommunityReport is created,
 * read or mutated. Same Map-based in-memory pattern as
 * lib/services/messages.ts / lib/services/opportunities.ts.
 *
 * Scoping: CommunityProfile is USER-scoped (see types/settings.ts for why).
 * Posts/comments/reactions/circles/events are a shared community-wide
 * catalog (like Opportunities), not startup-scoped — but event
 * registrations and post->startup references ARE isolable per startup, and
 * community-analytics.test.ts / community-isolation.test.ts assert that.
 *
 * Startup exposure is NEVER decided here directly from a post's
 * `startupId` — always through lib/community/visibility.ts, fed by
 * lib/services/settings.ts's StartupCommunitySettings. This file never
 * reads Financials/Data Room/Expert notes/Messages/Readiness evidence.
 *
 * All seeded content is clearly fictional/illustrative (isDemo: true).
 */
import { randomUUID } from "crypto";
import type {
  CommunityCircle,
  CommunityComment,
  CommunityContentStatus,
  CommunityEvent,
  CommunityEventRegistration,
  CommunityMembership,
  CommunityPost,
  CommunityPostType,
  CommunityProfile,
  CommunityReaction,
  CommunityReactionTargetType,
  CommunityReactionType,
  CommunityReport,
  CommunityReportReason,
  CommunityReportTargetType,
  CommunityTopicId,
} from "@/types/community";
import { isValidPostType, isValidTopic } from "@/lib/community/taxonomy";

const profilesStore = new Map<string, CommunityProfile>();
const postsStore = new Map<string, CommunityPost>();
const commentsStore = new Map<string, CommunityComment[]>(); // keyed by postId
const reactionsStore = new Map<string, CommunityReaction[]>(); // keyed by `${targetType}:${targetId}`
const circlesStore = new Map<string, CommunityCircle>();
const membershipsStore = new Map<string, CommunityMembership[]>(); // keyed by userId
const eventsStore = new Map<string, CommunityEvent>();
const registrationsStore = new Map<string, CommunityEventRegistration[]>(); // keyed by eventId
const reportsStore: CommunityReport[] = [];

// ---------------------------------------------------------------------------
// Profiles (user-scoped identity)
// ---------------------------------------------------------------------------

export function getProfile(userId: string): CommunityProfile | undefined {
  return profilesStore.get(userId);
}

export function getOrCreateProfile(userId: string, displayName: string, nowIso: string): CommunityProfile {
  const existing = profilesStore.get(userId);
  if (existing) return existing;
  const profile: CommunityProfile = {
    userId,
    displayName,
    profileVisibility: "COMMUNITY",
    allowCommunityDiscovery: true,
    allowExpertDiscovery: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  profilesStore.set(userId, profile);
  return profile;
}

export function updateProfile(userId: string, patch: Partial<CommunityProfile>, nowIso: string): CommunityProfile {
  const existing = profilesStore.get(userId);
  if (!existing) throw new Error(`No community profile for user "${userId}"`);
  const updated: CommunityProfile = { ...existing, ...patch, userId, updatedAt: nowIso };
  profilesStore.set(userId, updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export type CreatePostInput = {
  authorId: string;
  startupId?: string;
  type: CommunityPostType;
  topic: CommunityTopicId;
  title?: string;
  body: string;
  resourceId?: string;
  opportunityId?: string;
  eventId?: string;
  circleId?: string;
  isDemo?: boolean;
};

export function listPosts(filters?: { topic?: CommunityTopicId; type?: CommunityPostType; circleId?: string }): CommunityPost[] {
  let posts = Array.from(postsStore.values()).filter((p) => p.status === "PUBLISHED");
  if (filters?.topic) posts = posts.filter((p) => p.topic === filters.topic);
  if (filters?.type) posts = posts.filter((p) => p.type === filters.type);
  if (filters?.circleId) posts = posts.filter((p) => p.circleId === filters.circleId);
  return posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getPost(postId: string): CommunityPost | undefined {
  return postsStore.get(postId);
}

export function listPostsByStartup(startupId: string): CommunityPost[] {
  return Array.from(postsStore.values()).filter((p) => p.startupId === startupId);
}

export function listPostsByAuthor(authorId: string): CommunityPost[] {
  return Array.from(postsStore.values()).filter((p) => p.authorId === authorId);
}

export function createPost(input: CreatePostInput, nowIso: string): CommunityPost {
  if (!isValidTopic(input.topic)) throw new Error(`Unknown community topic "${input.topic}"`);
  if (!isValidPostType(input.type)) throw new Error(`Unknown community post type "${input.type}"`);
  if (!input.body.trim()) throw new Error("Post body is required");
  const post: CommunityPost = {
    id: randomUUID(),
    authorId: input.authorId,
    startupId: input.startupId,
    type: input.type,
    topic: input.topic,
    title: input.title,
    body: input.body,
    resourceId: input.resourceId,
    opportunityId: input.opportunityId,
    eventId: input.eventId,
    circleId: input.circleId,
    status: "PUBLISHED",
    createdAt: nowIso,
    updatedAt: nowIso,
    isDemo: input.isDemo,
  };
  postsStore.set(post.id, post);
  return post;
}

function requirePost(postId: string): CommunityPost {
  const post = postsStore.get(postId);
  if (!post) throw new Error(`No community post "${postId}"`);
  return post;
}

export function editPost(postId: string, authorId: string, patch: { title?: string; body?: string }, nowIso: string): CommunityPost {
  const post = requirePost(postId);
  if (post.authorId !== authorId) throw new Error("Only the author can edit this post");
  const updated: CommunityPost = { ...post, ...patch, updatedAt: nowIso };
  postsStore.set(postId, updated);
  return updated;
}

export function softDeletePost(postId: string, authorId: string, nowIso: string): CommunityPost {
  const post = requirePost(postId);
  if (post.authorId !== authorId) throw new Error("Only the author can delete this post");
  const updated: CommunityPost = { ...post, status: "DELETED" as CommunityContentStatus, updatedAt: nowIso };
  postsStore.set(postId, updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Comments — one reply level max.
// ---------------------------------------------------------------------------

function commentsFor(postId: string): CommunityComment[] {
  return commentsStore.get(postId) ?? [];
}

export function listComments(postId: string): CommunityComment[] {
  return commentsFor(postId).filter((c) => c.status === "PUBLISHED" || c.status === "DELETED");
}

export function createComment(
  postId: string,
  input: { authorId: string; body: string; parentId?: string; isDemo?: boolean },
  nowIso: string,
): CommunityComment {
  requirePost(postId);
  if (!input.body.trim()) throw new Error("Comment body is required");
  if (input.parentId) {
    const parent = commentsFor(postId).find((c) => c.id === input.parentId);
    if (!parent) throw new Error(`No parent comment "${input.parentId}" on post "${postId}"`);
    if (parent.parentId) throw new Error("Comments support only one reply level");
  }
  const comment: CommunityComment = {
    id: randomUUID(),
    postId,
    authorId: input.authorId,
    parentId: input.parentId,
    body: input.body,
    status: "PUBLISHED",
    createdAt: nowIso,
    updatedAt: nowIso,
    isDemo: input.isDemo,
  };
  commentsStore.set(postId, [...commentsFor(postId), comment]);
  return comment;
}

function requireComment(postId: string, commentId: string): CommunityComment {
  const comment = commentsFor(postId).find((c) => c.id === commentId);
  if (!comment) throw new Error(`No comment "${commentId}" on post "${postId}"`);
  return comment;
}

export function editComment(postId: string, commentId: string, authorId: string, body: string, nowIso: string): CommunityComment {
  const comment = requireComment(postId, commentId);
  if (comment.authorId !== authorId) throw new Error("Only the author can edit this comment");
  const updated: CommunityComment = { ...comment, body, updatedAt: nowIso };
  commentsStore.set(postId, commentsFor(postId).map((c) => (c.id === commentId ? updated : c)));
  return updated;
}

export function softDeleteComment(postId: string, commentId: string, authorId: string, nowIso: string): CommunityComment {
  const comment = requireComment(postId, commentId);
  if (comment.authorId !== authorId) throw new Error("Only the author can delete this comment");
  const updated: CommunityComment = { ...comment, status: "DELETED", updatedAt: nowIso };
  commentsStore.set(postId, commentsFor(postId).map((c) => (c.id === commentId ? updated : c)));
  return updated;
}

// ---------------------------------------------------------------------------
// Reactions — HELPFUL / INSIGHTFUL / SUPPORT only, one per (user, target,
// type). No follower/vanity mechanics.
// ---------------------------------------------------------------------------

function reactionKey(targetType: CommunityReactionTargetType, targetId: string): string {
  return `${targetType}:${targetId}`;
}

export function listReactions(targetType: CommunityReactionTargetType, targetId: string): CommunityReaction[] {
  return reactionsStore.get(reactionKey(targetType, targetId)) ?? [];
}

export function addReaction(
  targetType: CommunityReactionTargetType,
  targetId: string,
  userId: string,
  type: CommunityReactionType,
  nowIso: string,
): CommunityReaction {
  const key = reactionKey(targetType, targetId);
  const existing = reactionsStore.get(key) ?? [];
  const already = existing.find((r) => r.userId === userId && r.type === type);
  if (already) return already;
  const reaction: CommunityReaction = { id: randomUUID(), targetType, targetId, userId, type, createdAt: nowIso };
  reactionsStore.set(key, [...existing, reaction]);
  return reaction;
}

export function removeReaction(targetType: CommunityReactionTargetType, targetId: string, userId: string, type: CommunityReactionType): void {
  const key = reactionKey(targetType, targetId);
  const existing = reactionsStore.get(key) ?? [];
  reactionsStore.set(
    key,
    existing.filter((r) => !(r.userId === userId && r.type === type)),
  );
}

// ---------------------------------------------------------------------------
// Circles — lightweight, demo structures. Membership is always explicit.
// ---------------------------------------------------------------------------

export function listCircles(): CommunityCircle[] {
  return Array.from(circlesStore.values());
}

export function getCircle(circleId: string): CommunityCircle | undefined {
  return circlesStore.get(circleId);
}

export function listMemberships(userId: string): CommunityMembership[] {
  return membershipsStore.get(userId) ?? [];
}

export function isMember(userId: string, circleId: string): boolean {
  return listMemberships(userId).some((m) => m.circleId === circleId);
}

export function joinCircle(userId: string, circleId: string, nowIso: string): CommunityMembership {
  if (!circlesStore.has(circleId)) throw new Error(`No circle "${circleId}"`);
  const existing = listMemberships(userId).find((m) => m.circleId === circleId);
  if (existing) return existing;
  const membership: CommunityMembership = { circleId, userId, joinedAt: nowIso };
  membershipsStore.set(userId, [...listMemberships(userId), membership]);
  return membership;
}

export function leaveCircle(userId: string, circleId: string): void {
  membershipsStore.set(
    userId,
    listMemberships(userId).filter((m) => m.circleId !== circleId),
  );
}

// ---------------------------------------------------------------------------
// Events — link to existing workflows (e.g. Pitch Live) via linkedRoute
// rather than duplicating them.
// ---------------------------------------------------------------------------

export function listEvents(): CommunityEvent[] {
  return Array.from(eventsStore.values()).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function getEvent(eventId: string): CommunityEvent | undefined {
  return eventsStore.get(eventId);
}

function registrationsForEvent(eventId: string): CommunityEventRegistration[] {
  return registrationsStore.get(eventId) ?? [];
}

export function listRegistrationsForUser(userId: string): CommunityEventRegistration[] {
  return Array.from(registrationsStore.values())
    .flat()
    .filter((r) => r.userId === userId && !r.cancelledAt);
}

/** Startup-scoped view — never exposes another startup's registrations. */
export function listRegistrationsForStartup(startupId: string): CommunityEventRegistration[] {
  return Array.from(registrationsStore.values())
    .flat()
    .filter((r) => r.startupId === startupId && !r.cancelledAt);
}

export function isRegistered(userId: string, eventId: string): boolean {
  return registrationsForEvent(eventId).some((r) => r.userId === userId && !r.cancelledAt);
}

export function registerForEvent(userId: string, eventId: string, nowIso: string, startupId?: string): CommunityEventRegistration {
  const event = eventsStore.get(eventId);
  if (!event) throw new Error(`No community event "${eventId}"`);
  const existing = registrationsForEvent(eventId).find((r) => r.userId === userId && !r.cancelledAt);
  if (existing) return existing;
  if (event.capacity !== undefined) {
    const activeCount = registrationsForEvent(eventId).filter((r) => !r.cancelledAt).length;
    if (activeCount >= event.capacity) throw new Error("Event is at capacity");
  }
  const registration: CommunityEventRegistration = { id: randomUUID(), eventId, userId, startupId, registeredAt: nowIso };
  registrationsStore.set(eventId, [...registrationsForEvent(eventId), registration]);
  return registration;
}

export function cancelEventRegistration(userId: string, eventId: string, nowIso: string): void {
  registrationsStore.set(
    eventId,
    registrationsForEvent(eventId).map((r) => (r.userId === userId && !r.cancelledAt ? { ...r, cancelledAt: nowIso } : r)),
  );
}

// ---------------------------------------------------------------------------
// Reports — service-layer record only, no Admin UI in this batch.
// ---------------------------------------------------------------------------

export function createReport(
  input: { targetType: CommunityReportTargetType; targetId: string; reporterId: string; reason: CommunityReportReason; note?: string },
  nowIso: string,
): CommunityReport {
  const report: CommunityReport = { id: randomUUID(), createdAt: nowIso, ...input };
  reportsStore.push(report);
  return report;
}

export function listReports(): CommunityReport[] {
  return reportsStore;
}

/** Test-only reset hook so isolated tests don't leak state across files. */
export function __resetCommunityStoreForTests() {
  profilesStore.clear();
  postsStore.clear();
  commentsStore.clear();
  reactionsStore.clear();
  membershipsStore.clear();
  registrationsStore.clear();
  reportsStore.length = 0;
  // Circles and events are a stable shared catalog — reseed rather than
  // wipe so `circlesStore`/`eventsStore` keep pre-existing ids stable.
}

// ---------------------------------------------------------------------------
// Seed: fictional demo circles, events, and a handful of illustrative
// posts/comments — clearly demo, never presented as real member activity.
// ---------------------------------------------------------------------------

function seedCircles() {
  if (circlesStore.size > 0) return;
  const demo: Array<Omit<CommunityCircle, "isDemo">> = [
    { id: "agritech-founders", name: "AgriTech Founders", description: "For founders building in agriculture and agri-value chains.", topic: "AGRICULTURE" },
    { id: "fintech-founders", name: "FinTech Founders", description: "Payments, lending, and financial infrastructure builders.", topic: "FINTECH" },
    { id: "women-founders", name: "Women Founders", description: "A circle for women founders across the AFF network." },
    { id: "francophone-africa", name: "Francophone Africa", description: "Founders building across Francophone Africa." },
    { id: "west-africa", name: "West Africa", description: "Founders building across West Africa." },
    { id: "saas-b2b", name: "SaaS / B2B", description: "B2B software founders comparing notes on GTM and product.", topic: "PRODUCT" },
    { id: "fundraising-circle", name: "Fundraising", description: "Founders actively fundraising, sharing process and prep.", topic: "FUNDRAISING" },
    { id: "first-time-founders", name: "First-time Founders", description: "A space for founders building their first company." },
  ];
  for (const c of demo) circlesStore.set(c.id, { ...c, isDemo: true });
}

function seedEvents() {
  if (eventsStore.size > 0) return;
  const base = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const demo: CommunityEvent[] = [
    {
      id: "event-aff-live-1",
      title: "AFF Live: Founder Office Hours (Demo)",
      description: "Illustrative/demo AFF Live session — open Q&A with the AFF team.",
      type: "AFF_LIVE",
      startsAt: new Date(base + 5 * day).toISOString(),
      format: "ONLINE",
      status: "UPCOMING",
      capacity: 100,
      isDemo: true,
    },
    {
      id: "event-pitch-live-1",
      title: "Pitch Live: Upcoming Session (Demo)",
      description: "See the Pitch Live module for the real preparation workflow.",
      type: "PITCH_LIVE",
      startsAt: new Date(base + 10 * day).toISOString(),
      format: "HYBRID",
      status: "UPCOMING",
      linkedRoute: "/dashboard/pitch-live",
      isDemo: true,
    },
    {
      id: "event-workshop-1",
      title: "Workshop: Building an Investor Data Room (Demo)",
      description: "Illustrative/demo workshop on structuring a Data Room.",
      type: "WORKSHOP",
      startsAt: new Date(base + 14 * day).toISOString(),
      format: "ONLINE",
      status: "UPCOMING",
      capacity: 60,
      isDemo: true,
    },
    {
      id: "event-ama-1",
      title: "AMA with an AFF Expert (Demo)",
      description: "Illustrative/demo AMA — ask-me-anything format.",
      type: "AMA",
      startsAt: new Date(base - 3 * day).toISOString(),
      format: "ONLINE",
      status: "COMPLETED",
      isDemo: true,
    },
  ];
  for (const e of demo) eventsStore.set(e.id, e);
}

function seedIllustrativePosts() {
  if (postsStore.size > 0) return;
  const seedIso = new Date().toISOString();
  const demoAuthorA = "demo-founder-amara";
  const demoAuthorB = "demo-founder-kwame";
  getOrCreateProfile(demoAuthorA, "Amara (Demo Founder)", seedIso);
  getOrCreateProfile(demoAuthorB, "Kwame (Demo Founder)", seedIso);

  const p1 = createPost(
    {
      authorId: demoAuthorA,
      type: "QUESTION",
      topic: "FUNDRAISING",
      title: "How are you structuring your seed round timeline? (Demo)",
      body: "Illustrative/demo post — curious how other founders are sequencing investor conversations alongside AFF Readiness work.",
      isDemo: true,
    },
    seedIso,
  );
  createComment(p1.id, { authorId: demoAuthorB, body: "Demo reply — we ran ours in parallel with our Roadmap milestones.", isDemo: true }, seedIso);
  addReaction("POST", p1.id, demoAuthorB, "HELPFUL", seedIso);

  createPost(
    {
      authorId: demoAuthorB,
      type: "PROGRESS",
      topic: "PRODUCT",
      title: "Shipped our v2 onboarding flow (Demo)",
      body: "Illustrative/demo progress update — sharing for visibility, not a real product announcement.",
      isDemo: true,
    },
    seedIso,
  );

  createPost(
    {
      authorId: demoAuthorA,
      type: "PITCH_FEEDBACK_REQUEST",
      topic: "PITCH",
      title: "Looking for informal feedback on my opening (Demo)",
      body: "Illustrative/demo request for community/peer feedback — separate from the formal Pitch Lab review pipeline.",
      isDemo: true,
    },
    seedIso,
  );
}

seedCircles();
seedEvents();
seedIllustrativePosts();
