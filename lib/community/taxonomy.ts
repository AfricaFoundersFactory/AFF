// Pure, deterministic Community taxonomy — no AI, no opaque scoring.
// Stable enum-style ids; display strings come from
// dashboard.community.topics.<id> (en/fr) so the ids themselves stay
// locale-neutral. See types/community.ts#CommunityTopicId.
import type { CommunityPostType, CommunityReactionType, CommunityTopicId } from "@/types/community";

export const COMMUNITY_TOPIC_IDS: CommunityTopicId[] = [
  "FUNDRAISING",
  "PITCH",
  "PRODUCT",
  "TECHNOLOGY",
  "AI_DATA",
  "SALES",
  "MARKETING",
  "FINANCE",
  "LEGAL",
  "OPERATIONS",
  "TEAM",
  "IMPACT_ESG",
  "AGRICULTURE",
  "FINTECH",
  "HEALTHTECH",
  "CLIMATE",
  "LOGISTICS",
  "GENERAL",
];

export const COMMUNITY_POST_TYPES: CommunityPostType[] = [
  "QUESTION",
  "DISCUSSION",
  "PROGRESS",
  "RESOURCE_SHARE",
  "OPPORTUNITY_SHARE",
  "PITCH_FEEDBACK_REQUEST",
  "EVENT",
  "GENERAL",
];

export const COMMUNITY_REACTION_TYPES: CommunityReactionType[] = ["HELPFUL", "INSIGHTFUL", "SUPPORT"];

export function isValidTopic(topic: string): topic is CommunityTopicId {
  return (COMMUNITY_TOPIC_IDS as string[]).includes(topic);
}

export function isValidPostType(type: string): type is CommunityPostType {
  return (COMMUNITY_POST_TYPES as string[]).includes(type);
}
