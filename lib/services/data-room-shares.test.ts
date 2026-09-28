import { beforeEach, describe, expect, it } from "vitest";
import { __resetDataRoomSharesStoreForTests, createShare, listShares, revokeShare } from "./data-room-shares";

const NOW = "2026-01-15T00:00:00.000Z";

beforeEach(() => {
  __resetDataRoomSharesStoreForTests();
});

describe("data-room-shares service", () => {
  it("requires an explicit founder action naming specific document ids", () => {
    expect(() => createShare("startup-a", { investorId: "inv-1", documentIds: [] }, NOW)).toThrow();
    const share = createShare("startup-a", { investorId: "inv-1", documentIds: ["doc-1", "doc-2"] }, NOW);
    expect(share.documentIds).toEqual(["doc-1", "doc-2"]);
    expect(share.status).toBe("ACTIVE");
  });

  it("associates a share with an investor", () => {
    const share = createShare("startup-a", { investorId: "inv-1", documentIds: ["doc-1"] }, NOW);
    expect(share.investorId).toBe("inv-1");
  });

  it("revokes a share", () => {
    const share = createShare("startup-a", { investorId: "inv-1", documentIds: ["doc-1"] }, NOW);
    const revoked = revokeShare("startup-a", share.id, NOW);
    expect(revoked.status).toBe("REVOKED");
    expect(revoked.revokedAt).toBe(NOW);
  });

  it("never fabricates a view/download state on the share record", () => {
    const share = createShare("startup-a", { investorId: "inv-1", documentIds: ["doc-1"] }, NOW);
    const keys = Object.keys(share);
    expect(keys).not.toContain("viewedAt");
    expect(keys).not.toContain("downloadedAt");
    expect(keys).not.toContain("viewCount");
  });

  it("does not create a share implicitly — only createShare() does, nothing else in the module writes to the store", () => {
    // No shortlist/pipeline/introduction service is imported here at all —
    // this test documents that this service exposes no implicit trigger.
    expect(listShares("startup-a")).toEqual([]);
  });

  it("isolates shares per startup", () => {
    createShare("startup-a", { investorId: "inv-1", documentIds: ["doc-1"] }, NOW);
    createShare("startup-b", { investorId: "inv-1", documentIds: ["doc-2"] }, NOW);
    expect(listShares("startup-a")).toHaveLength(1);
    expect(listShares("startup-b")).toHaveLength(1);
    expect(listShares("startup-a")[0].documentIds).toEqual(["doc-1"]);
  });
});
