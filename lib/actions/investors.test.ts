import { beforeEach, describe, expect, it, vi } from "vitest";

// next/cache's revalidatePath throws "static generation store missing"
// when called outside a real Next.js request — mock it so guard()'s
// success/failure path reflects only this module's own business logic,
// not an artifact of the test harness. Every other investor service module
// underneath is exercised for real (no mocking of business logic).
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

import {
  addToShortlistAction,
  createIntroductionDraftAction,
  createPipelineEntryAction,
  createRoundAction,
  moveStageAction,
  submitIntroductionRequestAction,
  updatePipelineEntryAction,
  updateRoundStatusAction,
} from "./investors";
import { __resetFundraisingPipelineStoreForTests, createPipelineEntry, createRound } from "@/lib/services/fundraising-pipeline";
import { __resetIntroductionRequestsStoreForTests, createIntroductionRequest } from "@/lib/services/introduction-requests";
import { __resetShortlistStoreForTests } from "@/lib/services/investor-shortlist";
import { __resetDataRoomSharesStoreForTests, listShares } from "@/lib/services/data-room-shares";

const NOW = "2026-01-15T00:00:00.000Z";

beforeEach(() => {
  __resetFundraisingPipelineStoreForTests();
  __resetIntroductionRequestsStoreForTests();
  __resetShortlistStoreForTests();
  __resetDataRoomSharesStoreForTests();
});

describe("Server Action boundary — cross-startup mutation rejection (AFF-DASH-10R §7)", () => {
  it("rejects moveStageAction when the caller's startup context does not own the pipeline entry id", async () => {
    // Startup B creates a pipeline entry for itself.
    const entryB = createPipelineEntry("startup-b", { investorId: "demo-inv-baobab-ventures", ownerFounderId: "founder-b" }, NOW);

    // A caller resolved to startup A's session tries to move startup B's entry.
    const result = await moveStageAction("startup-a", entryB.id, "CONTACTED");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/No pipeline entry/);
    }
  });

  it("rejects updatePipelineEntryAction across startups the same way", async () => {
    const entryB = createPipelineEntry("startup-b", { investorId: "demo-inv-baobab-ventures", ownerFounderId: "founder-b" }, NOW);
    const result = await updatePipelineEntryAction("startup-a", entryB.id, { note: "attempted cross-startup edit" });
    expect(result.ok).toBe(false);
  });

  it("rejects submitIntroductionRequestAction when the introduction request id belongs to another startup", async () => {
    const draftB = createIntroductionRequest("startup-b", { investorId: "demo-inv-baobab-ventures", createdBy: "founder-b" }, NOW);
    const result = await submitIntroductionRequestAction("startup-a", draftB.id);
    expect(result.ok).toBe(false);
  });

  it("confirms the legitimate owner can still mutate their own entry (the boundary rejects by ownership, not universally)", async () => {
    const entryA = createPipelineEntry("startup-a", { investorId: "demo-inv-baobab-ventures", ownerFounderId: "founder-a" }, NOW);
    const result = await moveStageAction("startup-a", entryA.id, "CONTACTED");
    expect(result.ok).toBe(true);
  });
});

describe("Privacy gate — Data Room share is never implicit (AFF-DASH-10R §8)", () => {
  it("NO_IMPLICIT_SHARE_FROM_SHORTLIST — shortlisting an investor creates no Data Room share", async () => {
    await addToShortlistAction("startup-privacy-a", "demo-inv-baobab-ventures");
    expect(listShares("startup-privacy-a")).toEqual([]);
  });

  it("NO_IMPLICIT_SHARE_FROM_PIPELINE — adding an investor to the pipeline creates no Data Room share", async () => {
    await createPipelineEntryAction("startup-privacy-b", { investorId: "demo-inv-baobab-ventures", ownerFounderId: "founder-b" });
    expect(listShares("startup-privacy-b")).toEqual([]);
  });

  it("NO_IMPLICIT_SHARE_FROM_INTRODUCTION — drafting and submitting an introduction request creates no Data Room share", async () => {
    const draft = await createIntroductionDraftAction("startup-privacy-c", { investorId: "demo-inv-baobab-ventures", createdBy: "founder-c" });
    expect(draft.ok).toBe(true);
    if (draft.ok) {
      await submitIntroductionRequestAction("startup-privacy-c", draft.data.id);
    }
    expect(listShares("startup-privacy-c")).toEqual([]);
  });
});

describe("Fundraising round action-layer validation (AFF-DASH-10R §3)", () => {
  it("rejects createRoundAction with a blank name", async () => {
    const result = await createRoundAction("startup-a", { name: "  ", targetAmount: { amount: 100_000, currency: "USD" } });
    expect(result.ok).toBe(false);
  });

  it("rejects createRoundAction with a negative target amount", async () => {
    const result = await createRoundAction("startup-a", { name: "Seed", targetAmount: { amount: -1, currency: "USD" } });
    expect(result.ok).toBe(false);
  });

  it("accepts a valid round and rejects a second ACTIVE round for the same startup at the action layer", async () => {
    const first = await createRoundAction("startup-a", { name: "Seed", targetAmount: { amount: 300_000, currency: "USD" } });
    expect(first.ok).toBe(true);
    const second = createRound("startup-a", { name: "Bridge", targetAmount: { amount: 100_000, currency: "USD" } }, NOW);
    if (!first.ok) return;
    const activateFirst = await updateRoundStatusAction("startup-a", first.data.id, "ACTIVE");
    expect(activateFirst.ok).toBe(true);
    const activateSecond = await updateRoundStatusAction("startup-a", second.id, "ACTIVE");
    expect(activateSecond.ok).toBe(false);
  });
});

describe("Introduction draft UX — explicit two-step submission (AFF-DASH-10R §5)", () => {
  it("a draft never appears as REQUESTED until explicitly submitted", async () => {
    const draft = await createIntroductionDraftAction("startup-a", { investorId: "demo-inv-baobab-ventures", createdBy: "founder-a" });
    expect(draft.ok).toBe(true);
    if (!draft.ok) return;
    expect(draft.data.status).toBe("DRAFT");

    const submitted = await submitIntroductionRequestAction("startup-a", draft.data.id);
    expect(submitted.ok).toBe(true);
    if (submitted.ok) expect(submitted.data.status).toBe("REQUESTED");
  });
});
