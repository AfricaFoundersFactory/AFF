"use server";

/**
 * Server Action boundary for the Investor Data Room — the only way client
 * components create/mutate a document's metadata. Delegates to
 * lib/services/data-room.ts. There is no upload endpoint here on purpose —
 * this batch is metadata-only (no real file storage exists yet).
 */
import { revalidatePath } from "next/cache";
import * as dataRoomService from "@/lib/services/data-room";
import { isNonEmpty } from "@/lib/validation";
import type { DataRoom, DataRoomDocument, DataRoomCategory, DocumentStatus, DocumentVisibility } from "@/types/data-room";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function nowIso(): string {
  return new Date().toISOString();
}

function revalidateDashboard() {
  revalidatePath("/[locale]/dashboard", "layout");
}

function guard<T>(fn: () => T): Result<T> {
  try {
    const data = fn();
    revalidateDashboard();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function createDocumentAction(
  startupId: string,
  input: {
    category: DataRoomCategory;
    title: string;
    description?: string;
    visibility: DocumentVisibility;
    documentType?: string;
    requirementKey?: string;
  },
): Promise<Result<DataRoomDocument>> {
  if (!isNonEmpty(input.title)) return { ok: false, error: "validation" };
  return guard(() => dataRoomService.createDocument(startupId, input, nowIso()));
}

export async function updateDocumentStatusAction(
  startupId: string,
  documentId: string,
  status: Exclude<DocumentStatus, "verified">,
): Promise<Result<DataRoomDocument>> {
  if (!isNonEmpty(documentId)) return { ok: false, error: "validation" };
  return guard(() => dataRoomService.updateDocumentStatus(startupId, documentId, status, nowIso()));
}

export async function verifyDocumentAction(startupId: string, documentId: string): Promise<Result<DataRoomDocument>> {
  if (!isNonEmpty(documentId)) return { ok: false, error: "validation" };
  return guard(() => dataRoomService.verifyDocument(startupId, documentId, nowIso()));
}

export async function addDocumentVersionAction(
  startupId: string,
  documentId: string,
  input: { fileName: string; mimeType: string; size: number },
): Promise<Result<DataRoomDocument>> {
  if (!isNonEmpty(documentId) || !isNonEmpty(input.fileName)) return { ok: false, error: "validation" };
  return guard(() => dataRoomService.addDocumentVersion(startupId, documentId, input, nowIso()));
}

export async function removeDocumentAction(startupId: string, documentId: string): Promise<Result<DataRoom>> {
  if (!isNonEmpty(documentId)) return { ok: false, error: "validation" };
  return guard(() => dataRoomService.removeDocument(startupId, documentId));
}
