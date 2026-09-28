"use client";

import { useMemo, useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useStartup } from "@/components/dashboard/StartupContext";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
import { filterConversationPreviews } from "@/lib/messages/inbox";
import { markConversationReadAction, sendFounderMessageAction } from "@/lib/actions/messages";
import type { ConversationFilter, ConversationWithPreview, Message } from "@/types/messages";

export type FounderInboxEntry = {
  previews: ConversationWithPreview[];
  messagesByConversationId: Record<string, Message[]>;
};

const FILTERS: ConversationFilter[] = ["all", "unread", "experts"];

export function FounderInboxView({
  dataByStartupId,
  founderId,
}: {
  dataByStartupId: Record<string, FounderInboxEntry>;
  founderId: string;
}) {
  const { activeStartup } = useStartup();
  const entry = dataByStartupId[activeStartup.id];
  const t = useTranslations("dashboard.messages");
  const format = useFormatter();
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const [selectedId, setSelectedId] = useState<string | undefined>(entry?.previews[0]?.conversation.id);
  const [readOverrides, setReadOverrides] = useState<Record<string, boolean>>({});
  const [localMessages, setLocalMessages] = useState<Record<string, Message[]>>({});
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  const previews = useMemo(() => entry?.previews ?? [], [entry]);
  const filtered = useMemo(() => filterConversationPreviews(previews, filter), [previews, filter]);
  const selected = previews.find((p) => p.conversation.id === selectedId) ?? filtered[0];
  const messages = selected
    ? localMessages[selected.conversation.id] ?? entry?.messagesByConversationId[selected.conversation.id] ?? []
    : [];
  const sortedMessages = [...messages].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

  function selectConversation(id: string) {
    setSelectedId(id);
    if (!readOverrides[id]) {
      setReadOverrides((prev) => ({ ...prev, [id]: true }));
      startTransition(async () => {
        await markConversationReadAction(activeStartup.id, id);
      });
    }
  }

  function handleSend() {
    if (!selected || !draft.trim()) return;
    const conversationId = selected.conversation.id;
    const body = draft.trim();
    setDraft("");
    startTransition(async () => {
      const result = await sendFounderMessageAction(activeStartup.id, conversationId, founderId, body);
      if (result.ok) {
        setLocalMessages((prev) => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] ?? entry?.messagesByConversationId[conversationId] ?? []), result.data],
        }));
      }
    });
  }

  const formatTime = (iso: string) => format.dateTime(new Date(iso), { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{t("pageTitle")}</h1>
        <p className="mt-1.5 text-[14.5px] text-aff-muted">{t("pageSubtitle")}</p>
      </div>

      <DashboardSection title={t("inboxTitle")}>
        {previews.length === 0 ? (
          <EmptyState title={t("emptyTitle")} body={t("emptyBody")} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
            {/* Conversation list — hidden on mobile once a conversation is selected */}
            <div className={selected ? "hidden md:block" : "block"}>
              <div className="mb-3 flex gap-2">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                      filter === f ? "border-aff-accent text-aff-accent" : "border-aff-line text-aff-muted hover:text-aff-text"
                    }`}
                  >
                    {t(`filters.${f}`)}
                  </button>
                ))}
              </div>
              <ul className="flex max-h-[560px] flex-col gap-1.5 overflow-y-auto">
                {filtered.map((preview) => {
                  const isReadOverride = readOverrides[preview.conversation.id];
                  const unread = isReadOverride ? 0 : preview.unreadCount;
                  return (
                    <li key={preview.conversation.id}>
                      <button
                        onClick={() => selectConversation(preview.conversation.id)}
                        className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                          selected?.conversation.id === preview.conversation.id
                            ? "border-aff-accent bg-aff-accent-soft"
                            : "border-aff-line hover:border-aff-line-strong"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13.5px] font-semibold text-aff-text">
                            {preview.conversation.subject ?? t("noSubject")}
                          </span>
                          {unread > 0 && (
                            <span className="shrink-0 rounded-full bg-aff-accent px-2 py-0.5 text-[10.5px] font-bold text-white">{unread}</span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[12px] text-aff-muted">{preview.lastMessage?.body ?? ""}</p>
                        <p className="mt-0.5 text-[11px] text-aff-muted">{formatTime(preview.conversation.lastMessageAt)}</p>
                      </button>
                    </li>
                  );
                })}
                {filtered.length === 0 && <EmptyState title={t("noMatchingConversations")} />}
              </ul>
            </div>

            {/* Thread detail */}
            <div className={selected ? "block" : "hidden md:block"}>
              {selected ? (
                <div className="flex h-full flex-col rounded-xl border border-aff-line p-4">
                  <div className="mb-3 flex items-center justify-between gap-2 border-b border-aff-line pb-3">
                    <button onClick={() => setSelectedId(undefined)} className="text-[12.5px] font-semibold text-aff-muted hover:text-aff-text md:hidden">
                      ← {t("backToInbox")}
                    </button>
                    <h3 className="font-heading text-[15px] font-semibold text-aff-text">{selected.conversation.subject ?? t("noSubject")}</h3>
                    <span className="text-[11px] text-aff-muted">
                      {selected.conversation.type === "EXPERT_SUPPORT" ? t("threadType.expert") : t("threadType.system")}
                    </span>
                  </div>
                  <div className="flex max-h-[420px] flex-1 flex-col gap-3 overflow-y-auto pr-1">
                    {sortedMessages.map((message) => (
                      <div key={message.id} className={`max-w-[85%] rounded-xl px-3 py-2 text-[13.5px] ${
                        message.senderRole === "FOUNDER" ? "self-end bg-aff-accent-soft text-aff-text" : "self-start border border-aff-line text-aff-text"
                      }`}>
                        {message.isDemo && (
                          <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-amber-500">{t("demoLabel")}</p>
                        )}
                        <p>{message.body}</p>
                        <p className="mt-1 text-[10.5px] text-aff-muted">{formatTime(message.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2 border-t border-aff-line pt-3">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={t("composerPlaceholder")}
                      className="w-full rounded-lg border border-aff-line bg-aff-bg2 px-3 py-2.5 text-[13.5px] text-aff-text focus:border-aff-accent"
                    />
                    <Button className="px-4 py-2.5 text-[13px]" disabled={pending || !draft.trim()} onClick={handleSend}>
                      {t("send")}
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState title={t("selectConversation")} />
              )}
            </div>
          </div>
        )}
        <p className="mt-4 text-[11.5px] text-aff-muted">{t("demoDisclaimer")}</p>
      </DashboardSection>
    </div>
  );
}
