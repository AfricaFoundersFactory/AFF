"use server";

/**
 * Server Action boundary for the Founder Inbox — the only way client
 * components send a message or mark a conversation read. Delegates to
 * lib/services/messages.ts and revalidates the dashboard routes on
 * success, exactly like lib/actions/experts.ts.
 */
import { revalidatePath } from "next/cache";
import * as messagesService from "@/lib/services/messages";
import { isNonEmpty } from "@/lib/validation";
import type { Conversation, Message } from "@/types/messages";

function nowIso(): string {
  return new Date().toISOString();
}

function revalidateDashboard() {
  revalidatePath("/[locale]/dashboard", "layout");
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function guard<T>(fn: () => T): Result<T> {
  try {
    const data = fn();
    revalidateDashboard();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function sendFounderMessageAction(
  startupId: string,
  conversationId: string,
  founderId: string,
  body: string,
): Promise<Result<Message>> {
  if (!isNonEmpty(body)) return { ok: false, error: "validation" };
  return guard(() =>
    messagesService.sendMessage(startupId, conversationId, { senderId: founderId, senderRole: "FOUNDER", body }, nowIso()),
  );
}

export async function markConversationReadAction(startupId: string, conversationId: string): Promise<Result<Message[]>> {
  if (!isNonEmpty(conversationId)) return { ok: false, error: "validation" };
  return guard(() => messagesService.markConversationRead(startupId, conversationId, nowIso()));
}

export async function openConversationForSupportRequestAction(
  startupId: string,
  supportRequestId: string,
): Promise<Result<Conversation>> {
  if (!isNonEmpty(supportRequestId)) return { ok: false, error: "validation" };
  return guard(() => messagesService.getOrCreateConversationForSupportRequest(startupId, supportRequestId, nowIso()));
}
