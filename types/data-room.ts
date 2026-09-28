// Investor Data Room domain model (AFF-DASH-06). Metadata/service foundation
// only — there is NO real file storage backing this yet (see
// DocumentVersion.storageReference below), and the UI must always say so
// rather than fake a successful upload.
import type { StartupStage, VisibilityLevel } from "./common";

export type DataRoomCategory =
  | "corporate"
  | "legal"
  | "finance"
  | "fundraising"
  | "product"
  | "commercial"
  | "team"
  | "ip"
  | "compliance"
  | "impact_esg"
  | "other";

// "verified" must never be a default — it only appears once an explicit
// verification action has been recorded against a document (there is no
// such action wired up in this batch, so no seed document starts verified).
export type DocumentStatus = "missing" | "draft" | "available" | "outdated" | "needs_review" | "verified";

export type DocumentVisibility = VisibilityLevel;

export type DocumentSource = "founder_upload" | "generated" | "template";

export type DocumentVersion = {
  id: string;
  version: number;
  fileName: string;
  mimeType: string;
  size: number; // bytes
  // Deliberately unused/optional — no real object storage exists yet. When a
  // real upload pipeline lands, this becomes the pointer into it; until
  // then it stays undefined and the UI never implies a file is retrievable.
  storageReference?: string;
  uploadedAt: string;
};

export type DataRoomDocument = {
  id: string;
  startupId: string;
  category: DataRoomCategory;
  title: string;
  description?: string;
  status: DocumentStatus;
  visibility: DocumentVisibility;
  documentType?: string;
  requirementKey?: string; // links back to a DocumentRequirement.key, when applicable
  createdAt: string;
  updatedAt: string;
  versions: DocumentVersion[];
  source: DocumentSource;
};

// A checklist entry definition — stage-aware, so an idea-stage startup is
// never penalized for lacking a Series-A-only document.
export type DocumentRequirement = {
  key: string;
  category: DataRoomCategory;
  titleKey: string; // i18n key under dashboard.dataRoom.requirements.*
  stages: StartupStage[]; // stages at which this requirement applies
};

export type DataRoomChecklistItem = {
  requirement: DocumentRequirement;
  status: DocumentStatus;
  documentId?: string;
};

export type DataRoomChecklist = {
  startupId: string;
  stage: StartupStage;
  items: DataRoomChecklistItem[];
};

export type DataRoom = {
  id: string;
  startupId: string;
  documents: DataRoomDocument[];
  createdAt: string;
  updatedAt: string;
};

// Deterministic "Data Room Completion" — a document-readiness percentage
// that is STRUCTURALLY SEPARATE from AFF Readiness and must never be merged
// into or reported as it. See lib/data-room/completion.ts.
export type DataRoomCompletion = {
  requiredTotal: number;
  availableCount: number; // status === "available" || "verified"
  outdatedCount: number;
  needsReviewCount: number;
  missingCount: number;
  completionPct: number; // availableCount / requiredTotal, 0 when requiredTotal is 0
};
