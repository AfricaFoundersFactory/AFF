"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useStartup } from "@/components/dashboard/StartupContext";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
import { COMMUNITY_POST_TYPES, COMMUNITY_TOPIC_IDS } from "@/lib/community/taxonomy";
import type { PublicStartupView } from "@/lib/community/visibility";
import {
  addReactionAction,
  removeReactionAction,
  createCommentAction,
  createPostAction,
  joinCircleAction,
  leaveCircleAction,
  registerForEventAction,
  cancelEventRegistrationAction,
} from "@/lib/actions/community";
import type {
  CommunityCircle,
  CommunityComment,
  CommunityEvent,
  CommunityEventRegistration,
  CommunityMembership,
  CommunityPost,
  CommunityPostType,
  CommunityReaction,
  CommunityReactionType,
  CommunityTopicId,
  StartupCommunityVisibility,
} from "@/types/community";

const COMMUNITY_REACTION_TYPES: CommunityReactionType[] = ["HELPFUL", "INSIGHTFUL", "SUPPORT"];

export type CommunityViewData = {
  posts: CommunityPost[];
  commentsByPostId: Record<string, CommunityComment[]>;
  reactionsByTargetId: Record<string, CommunityReaction[]>;
  circles: CommunityCircle[];
  memberships: CommunityMembership[];
  events: CommunityEvent[];
  registrations: CommunityEventRegistration[];
  startupExposure: Record<string, { settings: { showStartupInCommunity: boolean; startupVisibility: StartupCommunityVisibility }; publicView: PublicStartupView }>;
  startupIds: string[];
  profilesByUserId: Record<string, string>;
};

type Tab = "feed" | "circles" | "events";

export function CommunityView({ founderId, data }: { founderId: string; data: CommunityViewData }) {
  const t = useTranslations("dashboard.community");
  const { activeStartup } = useStartup();
  const [tab, setTab] = useState<Tab>("feed");
  const [pending, startTransition] = useTransition();

  const [postType, setPostType] = useState<CommunityPostType>("QUESTION");
  const [postTopic, setPostTopic] = useState<CommunityTopicId>("GENERAL");
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [attachStartup, setAttachStartup] = useState(false);

  const exposure = data.startupExposure[activeStartup.id];

  function submitPost() {
    if (!postBody.trim()) return;
    startTransition(async () => {
      await createPostAction({
        authorId: founderId,
        startupId: attachStartup ? activeStartup.id : undefined,
        type: postType,
        topic: postTopic,
        title: postTitle.trim() || undefined,
        body: postBody,
      });
      setPostTitle("");
      setPostBody("");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-dashed border-aff-line bg-aff-bg2 px-4 py-2.5 text-[12.5px] text-aff-muted">
        {t("demoNotice")}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["feed", "circles", "events"] as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={
              "rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors " +
              (tab === key ? "border-aff-accent text-aff-accent" : "border-aff-line text-aff-muted hover:text-aff-text")
            }
          >
            {t(`tabs.${key}`)}
          </button>
        ))}
      </div>

      {tab === "feed" ? (
        <>
          <DashboardSection title={t("composer.title")}>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value as CommunityPostType)}
                  className="rounded-lg border border-aff-line bg-aff-bg px-3 py-2 text-[13px] text-aff-text"
                >
                  {COMMUNITY_POST_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {t(`postTypes.${type}`)}
                    </option>
                  ))}
                </select>
                <select
                  value={postTopic}
                  onChange={(e) => setPostTopic(e.target.value as CommunityTopicId)}
                  className="rounded-lg border border-aff-line bg-aff-bg px-3 py-2 text-[13px] text-aff-text"
                >
                  {COMMUNITY_TOPIC_IDS.map((topic) => (
                    <option key={topic} value={topic}>
                      {t(`topics.${topic}`)}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-[13px] text-aff-muted">
                  <input type="checkbox" checked={attachStartup} onChange={(e) => setAttachStartup(e.target.checked)} />
                  {t("composer.attachStartup")}
                </label>
              </div>
              {attachStartup ? (
                <p className="text-[11.5px] text-aff-muted">
                  {exposure?.publicView.visible ? t("composer.startupWillShow") : t("composer.startupHiddenNotice")}
                </p>
              ) : null}
              <input
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder={t("composer.titlePlaceholder")}
                className="rounded-lg border border-aff-line bg-aff-bg px-3 py-2 text-[13.5px] text-aff-text"
              />
              <textarea
                value={postBody}
                onChange={(e) => setPostBody(e.target.value)}
                placeholder={t("composer.bodyPlaceholder")}
                rows={3}
                className="rounded-lg border border-aff-line bg-aff-bg px-3 py-2 text-[13.5px] text-aff-text"
              />
              <div>
                <Button onClick={submitPost} disabled={pending || !postBody.trim()}>
                  {t("composer.submit")}
                </Button>
              </div>
            </div>
          </DashboardSection>

          <DashboardSection title={t("feed.title")}>
            {data.posts.length === 0 ? (
              <EmptyState title={t("feed.emptyTitle")} body={t("feed.emptyBody")} />
            ) : (
              <div className="flex flex-col gap-4">
                {data.posts.map((post) => (
                  <PostCard key={post.id} post={post} founderId={founderId} data={data} t={t} startTransition={startTransition} pending={pending} />
                ))}
              </div>
            )}
          </DashboardSection>
        </>
      ) : null}

      {tab === "circles" ? (
        <DashboardSection title={t("circles.title")}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.circles.map((circle) => {
              const joined = data.memberships.some((m) => m.circleId === circle.id);
              return (
                <div key={circle.id} className="rounded-xl border border-aff-line bg-aff-bg p-4">
                  <p className="text-[14px] font-semibold text-aff-text">{circle.name}</p>
                  <p className="mt-1 text-[12.5px] text-aff-muted">{circle.description}</p>
                  <div className="mt-3">
                    <Button
                      variant={joined ? "secondary" : "primary"}
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          if (joined) await leaveCircleAction(founderId, circle.id);
                          else await joinCircleAction(founderId, circle.id);
                        })
                      }
                    >
                      {joined ? t("circles.leave") : t("circles.join")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </DashboardSection>
      ) : null}

      {tab === "events" ? (
        <DashboardSection title={t("events.title")}>
          {data.events.length === 0 ? (
            <EmptyState title={t("events.emptyTitle")} />
          ) : (
            <div className="flex flex-col gap-3">
              {data.events.map((event) => {
                const registered = data.registrations.some((r) => r.eventId === event.id);
                return (
                  <div key={event.id} className="rounded-xl border border-aff-line bg-aff-bg p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[14px] font-semibold text-aff-text">{event.title}</p>
                        <p className="mt-1 text-[12.5px] text-aff-muted">{event.description}</p>
                        <p className="mt-1 text-[11.5px] text-aff-muted">{new Date(event.startsAt).toLocaleString()}</p>
                        {event.linkedRoute ? (
                          <p className="mt-1 text-[11.5px] text-aff-accent">{t("events.seeModule")}</p>
                        ) : null}
                      </div>
                      {event.status === "UPCOMING" ? (
                        <Button
                          variant={registered ? "secondary" : "primary"}
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              if (registered) await cancelEventRegistrationAction(founderId, event.id);
                              else await registerForEventAction(founderId, event.id, activeStartup.id);
                            })
                          }
                        >
                          {registered ? t("events.cancel") : t("events.register")}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DashboardSection>
      ) : null}
    </div>
  );
}

function PostCard({
  post,
  founderId,
  data,
  t,
  startTransition,
  pending,
}: {
  post: CommunityPost;
  founderId: string;
  data: CommunityViewData;
  t: ReturnType<typeof useTranslations>;
  startTransition: (fn: () => void | Promise<void>) => void;
  pending: boolean;
}) {
  const [commentDraft, setCommentDraft] = useState("");
  const comments = (data.commentsByPostId[post.id] ?? []).filter((c) => c.status === "PUBLISHED");
  const reactions = data.reactionsByTargetId[`POST:${post.id}`] ?? [];

  return (
    <div className="rounded-xl border border-aff-line bg-aff-bg p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-aff-text">{data.profilesByUserId[post.authorId] ?? "Community member"}</p>
        <span className="rounded-full border border-aff-line px-2 py-0.5 text-[11px] text-aff-muted">{t(`postTypes.${post.type}`)}</span>
      </div>
      {post.title ? <p className="mt-1.5 text-[14.5px] font-semibold text-aff-text">{post.title}</p> : null}
      <p className="mt-1 text-[13.5px] text-aff-text">{post.body}</p>
      <p className="mt-2 text-[11px] text-aff-muted">{t(`topics.${post.topic}`)}</p>

      <div className="mt-3 flex items-center gap-3">
        {COMMUNITY_REACTION_TYPES.map((reactionType) => {
          const count = reactions.filter((r) => r.type === reactionType).length;
          const active = reactions.some((r) => r.type === reactionType && r.userId === founderId);
          return (
            <button
              key={reactionType}
              type="button"
              disabled={pending}
              aria-pressed={active}
              onClick={() =>
                startTransition(async () => {
                  if (active) {
                    await removeReactionAction("POST", post.id, founderId, reactionType);
                  } else {
                    await addReactionAction("POST", post.id, founderId, reactionType);
                  }
                })
              }
              className={
                "text-[12px] font-semibold transition-colors " +
                (active ? "text-aff-accent" : "text-aff-muted hover:text-aff-accent")
              }
            >
              {t(`reactions.${reactionType}`)} ({count})
            </button>
          );
        })}
      </div>

      {comments.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2 border-t border-aff-line pt-3">
          {comments.map((comment) => (
            <div key={comment.id} className={comment.parentId ? "ml-4 text-[12.5px]" : "text-[12.5px]"}>
              <span className="font-semibold text-aff-text">{data.profilesByUserId[comment.authorId] ?? "Community member"}: </span>
              <span className="text-aff-muted">{comment.status === "DELETED" ? t("comments.deleted") : comment.body}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex gap-2">
        <input
          value={commentDraft}
          onChange={(e) => setCommentDraft(e.target.value)}
          placeholder={t("comments.placeholder")}
          className="flex-1 rounded-lg border border-aff-line bg-aff-bg2 px-3 py-1.5 text-[12.5px] text-aff-text"
        />
        <Button
          variant="secondary"
          disabled={pending || !commentDraft.trim()}
          onClick={() =>
            startTransition(async () => {
              await createCommentAction(post.id, founderId, commentDraft);
              setCommentDraft("");
            })
          }
        >
          {t("comments.submit")}
        </Button>
      </div>
    </div>
  );
}
