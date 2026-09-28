import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { getSession } from "@/lib/auth/session";
import {
  listPosts,
  listComments,
  listReactions,
  listCircles,
  listMemberships,
  listEvents,
  listRegistrationsForUser,
  getOrCreateProfile,
  getProfile,
} from "@/lib/services/community";
import { getOrCreateStartupCommunitySettings } from "@/lib/services/settings";
import { resolveStartupExposure } from "@/lib/community/visibility";
import { CommunityView, type CommunityViewData } from "@/components/dashboard/community/CommunityView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.module" });
  return { title: t("community.title") };
}

export default async function DashboardCommunityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { startups } = await getWorkspaceContext();
  const session = await getSession();
  const founderId = session?.user.id ?? "unknown-founder";
  const nowIso = new Date().toISOString();

  getOrCreateProfile(founderId, session?.user.name ?? "Founder", nowIso);

  const posts = listPosts();
  const commentsByPostId: CommunityViewData["commentsByPostId"] = {};
  const reactionsByTargetId: CommunityViewData["reactionsByTargetId"] = {};
  for (const post of posts) {
    commentsByPostId[post.id] = listComments(post.id);
    reactionsByTargetId[`POST:${post.id}`] = listReactions("POST", post.id);
    for (const comment of commentsByPostId[post.id]) {
      reactionsByTargetId[`COMMENT:${comment.id}`] = listReactions("COMMENT", comment.id);
    }
  }

  const circles = listCircles();
  const memberships = listMemberships(founderId);
  const events = listEvents();
  const registrations = listRegistrationsForUser(founderId);

  // Startup exposure — resolved server-side, per startup, via the ONLY
  // allowed privacy resolver. Never expose more than settings allow.
  const startupExposure: CommunityViewData["startupExposure"] = {};
  for (const startup of startups) {
    const settings = getOrCreateStartupCommunitySettings(startup.id, nowIso);
    startupExposure[startup.id] = {
      settings: { showStartupInCommunity: settings.showStartupInCommunity, startupVisibility: settings.startupVisibility },
      publicView: resolveStartupExposure(settings, {
        name: startup.twin.identity.name,
        tagline: startup.twin.identity.tagline,
        industry: startup.twin.identity.industry,
        stage: startup.twin.identity.stage,
      }),
    };
  }

  const profilesByUserId: CommunityViewData["profilesByUserId"] = {};
  const authorIds = new Set<string>([founderId]);
  for (const post of posts) {
    authorIds.add(post.authorId);
    for (const comment of commentsByPostId[post.id]) authorIds.add(comment.authorId);
  }
  for (const id of authorIds) {
    const profile = getProfile(id);
    profilesByUserId[id] = profile?.displayName ?? (id === founderId ? session?.user.name ?? "You" : "AFF community member (demo)");
  }

  const data: CommunityViewData = {
    posts,
    commentsByPostId,
    reactionsByTargetId,
    circles,
    memberships,
    events,
    registrations,
    startupExposure,
    startupIds: startups.map((s) => s.id),
    profilesByUserId,
  };

  return <CommunityView founderId={founderId} data={data} />;
}
