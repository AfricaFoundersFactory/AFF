/**
 * Investor Data Room service boundary — the only place a DataRoom /
 * DataRoomDocument is created, read or mutated. Same in-memory
 * Map<startupId, ...> pattern as lib/services/financials.ts.
 *
 * Metadata/service foundation ONLY — there is no real file storage. No
 * function here ever sets status "verified" implicitly; a caller must pass
 * it explicitly via verifyDocument(). Nothing here touches AFF Readiness or
 * Pitch Readiness — see lib/services/financial-metric-separation.test.ts.
 */
import { randomUUID } from "crypto";
import type { DataRoom, DataRoomDocument, DocumentStatus, DocumentVersion, DocumentVisibility } from "@/types/data-room";
import { getDigitalTwin, listStartupIds } from "@/lib/services/digital-twin";
import { buildChecklist } from "@/lib/data-room/checklist";
import { computeDataRoomCompletion } from "@/lib/data-room/completion";

const store = new Map<string, DataRoom>();

function blankRoom(startupId: string, nowIso: string): DataRoom {
  return { id: randomUUID(), startupId, documents: [], createdAt: nowIso, updatedAt: nowIso };
}

function save(startupId: string, room: DataRoom): DataRoom {
  store.set(startupId, room);
  return room;
}

export function getDataRoom(startupId: string): DataRoom {
  const existing = store.get(startupId);
  if (existing) return existing;
  const nowIso = new Date().toISOString();
  return save(startupId, blankRoom(startupId, nowIso));
}

export function createDocument(
  startupId: string,
  input: Pick<DataRoomDocument, "category" | "title" | "description" | "visibility" | "documentType" | "requirementKey">,
  nowIso: string,
): DataRoomDocument {
  const room = getDataRoom(startupId);
  const document: DataRoomDocument = {
    id: randomUUID(),
    startupId,
    category: input.category,
    title: input.title,
    description: input.description,
    status: "draft",
    visibility: input.visibility,
    documentType: input.documentType,
    requirementKey: input.requirementKey,
    createdAt: nowIso,
    updatedAt: nowIso,
    versions: [],
    source: "founder_upload",
  };
  save(startupId, { ...room, documents: [...room.documents, document], updatedAt: nowIso });
  return document;
}

function requireDocument(startupId: string, documentId: string): { room: DataRoom; document: DataRoomDocument } {
  const room = getDataRoom(startupId);
  const document = room.documents.find((d) => d.id === documentId);
  if (!document) throw new Error(`No document "${documentId}" found for startup "${startupId}"`);
  return { room, document };
}

export function updateDocumentStatus(
  startupId: string,
  documentId: string,
  status: Exclude<DocumentStatus, "verified">, // verification is a distinct, explicit action — see verifyDocument
  nowIso: string,
): DataRoomDocument {
  const { room, document } = requireDocument(startupId, documentId);
  const updated = { ...document, status, updatedAt: nowIso };
  save(startupId, { ...room, documents: room.documents.map((d) => (d.id === documentId ? updated : d)), updatedAt: nowIso });
  return updated;
}

/**
 * The ONLY path by which a document can become "verified". Never a
 * default, never implied by any other mutation — see spec part K.
 */
export function verifyDocument(startupId: string, documentId: string, nowIso: string): DataRoomDocument {
  const { room, document } = requireDocument(startupId, documentId);
  const updated: DataRoomDocument = { ...document, status: "verified", updatedAt: nowIso };
  save(startupId, { ...room, documents: room.documents.map((d) => (d.id === documentId ? updated : d)), updatedAt: nowIso });
  return updated;
}

export function updateDocumentVisibility(startupId: string, documentId: string, visibility: DocumentVisibility, nowIso: string): DataRoomDocument {
  const { room, document } = requireDocument(startupId, documentId);
  const updated = { ...document, visibility, updatedAt: nowIso };
  save(startupId, { ...room, documents: room.documents.map((d) => (d.id === documentId ? updated : d)), updatedAt: nowIso });
  return updated;
}

export function removeDocument(startupId: string, documentId: string): DataRoom {
  const room = getDataRoom(startupId);
  return save(startupId, { ...room, documents: room.documents.filter((d) => d.id !== documentId), updatedAt: new Date().toISOString() });
}

/**
 * Records a new metadata-only version for a document — no real file bytes
 * are stored (`storageReference` stays undefined). Adding a version also
 * moves a document from "missing"/"draft" toward "available" so its
 * checklist status reflects that something was recorded, but never
 * auto-promotes to "verified".
 */
export function addDocumentVersion(
  startupId: string,
  documentId: string,
  input: Pick<DocumentVersion, "fileName" | "mimeType" | "size">,
  nowIso: string,
): DataRoomDocument {
  const { room, document } = requireDocument(startupId, documentId);
  const version: DocumentVersion = {
    id: randomUUID(),
    version: document.versions.length + 1,
    fileName: input.fileName,
    mimeType: input.mimeType,
    size: input.size,
    uploadedAt: nowIso,
  };
  const nextStatus: DocumentStatus = document.status === "verified" ? "outdated" : "available";
  const updated: DataRoomDocument = { ...document, versions: [...document.versions, version], status: nextStatus, updatedAt: nowIso };
  save(startupId, { ...room, documents: room.documents.map((d) => (d.id === documentId ? updated : d)), updatedAt: nowIso });
  return updated;
}

// ---------------------------------------------------------------------------
// Derived read model
// ---------------------------------------------------------------------------

export function getChecklist(startupId: string) {
  const twin = getDigitalTwin(startupId);
  const stage = twin?.identity.stage ?? "idea";
  const room = getDataRoom(startupId);
  return buildChecklist(startupId, stage, room.documents);
}

export function getCompletion(startupId: string) {
  return computeDataRoomCompletion(getChecklist(startupId));
}

/** Test-only reset hook so isolated tests don't leak state across files. */
export function __resetDataRoomStoreForTests() {
  store.clear();
}

// ---------------------------------------------------------------------------
// Seed: materially different data-room completeness for the two demo
// startups, consistent with lib/services/financials.ts (Wakama = mature,
// Solari = early stage, more missing documents).
// ---------------------------------------------------------------------------
function seedDemoDataRoom() {
  const seedIso = new Date().toISOString();

  if (listStartupIds().includes("startup-wakama") && !store.has("startup-wakama")) {
    const docs: Array<[Parameters<typeof createDocument>[1], Exclude<DocumentStatus, "verified">]> = [
      [{ category: "corporate", title: "Certificate of Incorporation", visibility: "aff_team", requirementKey: "certificate_of_incorporation" }, "available"],
      [{ category: "corporate", title: "Cap Table", visibility: "aff_team", requirementKey: "cap_table" }, "available"],
      [{ category: "corporate", title: "Bylaws", visibility: "aff_team", requirementKey: "bylaws" }, "outdated"],
      [{ category: "finance", title: "Historical Financials (FY25-26)", visibility: "investors", requirementKey: "historical_financials" }, "available"],
      [{ category: "finance", title: "12-Month Forecast", visibility: "investors", requirementKey: "forecast" }, "available"],
      [{ category: "finance", title: "Bank Statements", visibility: "aff_team", requirementKey: "bank_cash_evidence" }, "needs_review"],
      [{ category: "fundraising", title: "Investor Deck", visibility: "investors", requirementKey: "pitch_deck" }, "available"],
      [{ category: "fundraising", title: "Funding Requirement Summary", visibility: "investors", requirementKey: "funding_requirement" }, "available"],
      [{ category: "fundraising", title: "Previous SAFE Agreement", visibility: "aff_team", requirementKey: "previous_investment_docs" }, "available"],
      [{ category: "commercial", title: "Key Distributor Contracts", visibility: "aff_team", requirementKey: "customer_contracts" }, "available"],
      [{ category: "commercial", title: "Traction Evidence Pack", visibility: "investors", requirementKey: "traction_evidence" }, "available"],
      [{ category: "team", title: "Founder Bios & CVs", visibility: "investors", requirementKey: "founder_info" }, "available"],
      [{ category: "team", title: "Key Employment Contracts", visibility: "aff_team", requirementKey: "key_employment_info" }, "missing"],
      [{ category: "ip", title: "IP Assignment Agreements", visibility: "aff_team", requirementKey: "ip_ownership_evidence" }, "missing"],
    ];
    for (const [input, status] of docs) {
      const doc = createDocument("startup-wakama", input, seedIso);
      if (status !== "missing" && status !== "draft") {
        addDocumentVersion("startup-wakama", doc.id, { fileName: `${input.title.toLowerCase().replace(/\s+/g, "-")}.pdf`, mimeType: "application/pdf", size: 245_000 }, seedIso);
        if (status !== "available") updateDocumentStatus("startup-wakama", doc.id, status, seedIso);
      }
    }
  }

  if (listStartupIds().includes("startup-solari") && !store.has("startup-solari")) {
    // Early stage: only the universally-applicable items exist, and most
    // are still missing or draft — an honest reflection of an idea-stage
    // data room, never penalized for lacking growth-stage documents (the
    // checklist itself won't even ask for them — see stage-aware filtering).
    const founderInfo = createDocument("startup-solari", { category: "team", title: "Founder Bios", visibility: "aff_team", requirementKey: "founder_info" }, seedIso);
    addDocumentVersion("startup-solari", founderInfo.id, { fileName: "founder-bios.pdf", mimeType: "application/pdf", size: 82_000 }, seedIso);

    createDocument("startup-solari", { category: "fundraising", title: "Funding Requirement Summary", visibility: "aff_team", requirementKey: "funding_requirement" }, seedIso);
    createDocument("startup-solari", { category: "fundraising", title: "Pitch Deck", visibility: "aff_team", requirementKey: "pitch_deck" }, seedIso);
    createDocument("startup-solari", { category: "finance", title: "Cost Forecast", visibility: "aff_team", requirementKey: "forecast" }, seedIso);
  }
}
seedDemoDataRoom();
