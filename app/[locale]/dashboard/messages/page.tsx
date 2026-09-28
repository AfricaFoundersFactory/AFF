import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { listConversations, listAllMessages } from "@/lib/services/messages";
import { buildConversationPreviews } from "@/lib/messages/inbox";
import { FounderInboxView, type FounderInboxEntry } from "@/components/dashboard/messages/FounderInboxView";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.messages" });
  return { title: t("pageTitle") };
}

export default async function DashboardMessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { startups } = await getWorkspaceContext();
  const session = await getSession();

  const dataByStartupId: Record<string, FounderInboxEntry> = Object.fromEntries(
    startups.map((startup) => {
      const conversations = listConversations(startup.id);
      const allMessages = listAllMessages(startup.id);
      const byConversationId = new Map<string, typeof allMessages>();
      for (const message of allMessages) {
        byConversationId.set(message.conversationId, [...(byConversationId.get(message.conversationId) ?? []), message]);
      }
      const previews = buildConversationPreviews(conversations, byConversationId);
      const messagesByConversationId: Record<string, typeof allMessages> = {};
      for (const [id, msgs] of byConversationId) messagesByConversationId[id] = msgs;

      return [startup.id, { previews, messagesByConversationId }];
    }),
  );

  return <FounderInboxView dataByStartupId={dataByStartupId} founderId={session?.user.id ?? "unknown-founder"} />;
}
