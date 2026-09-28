import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetIntroductionRequestsStoreForTests,
  cancelIntroductionRequest,
  createIntroductionDraft,
  createIntroductionRequest,
  listIntroductionRequests,
  transitionStatus,
  updateIntroductionDraft,
} from "./introduction-requests";

const NOW = "2026-01-15T00:00:00.000Z";

beforeEach(() => {
  __resetIntroductionRequestsStoreForTests();
});

describe("introduction-requests service", () => {
  it("creates a request in REQUESTED status — never implies the investor was contacted", () => {
    const request = createIntroductionRequest("startup-a", { investorId: "inv-1", createdBy: "founder-1" }, NOW);
    expect(request.status).toBe("REQUESTED");
    expect(request.history).toEqual([{ status: "REQUESTED", at: NOW }]);
  });

  it("moves through the expected review states", () => {
    const request = createIntroductionRequest("startup-a", { investorId: "inv-1", createdBy: "founder-1" }, NOW);
    const reviewed = transitionStatus("startup-a", request.id, "UNDER_REVIEW", NOW);
    expect(reviewed.status).toBe("UNDER_REVIEW");
    const approved = transitionStatus("startup-a", request.id, "APPROVED", NOW);
    expect(approved.status).toBe("APPROVED");
  });

  it("only reaches INTRODUCED via an explicit transition, and only from APPROVED", () => {
    const request = createIntroductionRequest("startup-a", { investorId: "inv-1", createdBy: "founder-1" }, NOW);
    expect(() => transitionStatus("startup-a", request.id, "INTRODUCED", NOW)).toThrow();
    transitionStatus("startup-a", request.id, "UNDER_REVIEW", NOW);
    transitionStatus("startup-a", request.id, "APPROVED", NOW);
    const introduced = transitionStatus("startup-a", request.id, "INTRODUCED", NOW);
    expect(introduced.status).toBe("INTRODUCED");
  });

  it("rejects invalid transitions", () => {
    const request = createIntroductionRequest("startup-a", { investorId: "inv-1", createdBy: "founder-1" }, NOW);
    expect(() => transitionStatus("startup-a", request.id, "DECLINED", NOW)).toThrow();
  });

  it("allows cancellation from an open state", () => {
    const request = createIntroductionRequest("startup-a", { investorId: "inv-1", createdBy: "founder-1" }, NOW);
    const cancelled = cancelIntroductionRequest("startup-a", request.id, NOW);
    expect(cancelled.status).toBe("CANCELLED");
  });

  it("isolates introduction requests per startup", () => {
    createIntroductionRequest("startup-a", { investorId: "inv-1", createdBy: "founder-1" }, NOW);
    createIntroductionRequest("startup-b", { investorId: "inv-1", createdBy: "founder-2" }, NOW);
    expect(listIntroductionRequests("startup-a")).toHaveLength(1);
    expect(listIntroductionRequests("startup-b")).toHaveLength(1);
  });
});

describe("introduction draft flow (AFF-DASH-10R §5)", () => {
  it("prepares a DRAFT that is not submitted to AFF", () => {
    const draft = createIntroductionDraft("startup-a", { investorId: "inv-1", createdBy: "founder-1", reason: "Aligned thesis" }, NOW);
    expect(draft.status).toBe("DRAFT");
    expect(draft.history).toEqual([{ status: "DRAFT", at: NOW }]);
  });

  it("lets the founder edit reason/context while still DRAFT", () => {
    const draft = createIntroductionDraft("startup-a", { investorId: "inv-1", createdBy: "founder-1" }, NOW);
    const edited = updateIntroductionDraft("startup-a", draft.id, { reason: "Updated reason", context: "More context" }, NOW);
    expect(edited.reason).toBe("Updated reason");
    expect(edited.status).toBe("DRAFT");
  });

  it("only becomes REQUESTED via an explicit submit (transitionStatus), never automatically", () => {
    const draft = createIntroductionDraft("startup-a", { investorId: "inv-1", createdBy: "founder-1" }, NOW);
    expect(listIntroductionRequests("startup-a")[0].status).toBe("DRAFT");
    const submitted = transitionStatus("startup-a", draft.id, "REQUESTED", NOW);
    expect(submitted.status).toBe("REQUESTED");
  });

  it("rejects editing a draft that has already been submitted", () => {
    const draft = createIntroductionDraft("startup-a", { investorId: "inv-1", createdBy: "founder-1" }, NOW);
    transitionStatus("startup-a", draft.id, "REQUESTED", NOW);
    expect(() => updateIntroductionDraft("startup-a", draft.id, { reason: "Too late" }, NOW)).toThrow();
  });

  it("allows discarding a draft via cancellation without ever reaching REQUESTED", () => {
    const draft = createIntroductionDraft("startup-a", { investorId: "inv-1", createdBy: "founder-1" }, NOW);
    const cancelled = cancelIntroductionRequest("startup-a", draft.id, NOW);
    expect(cancelled.status).toBe("CANCELLED");
    expect(cancelled.history.map((h) => h.status)).toEqual(["DRAFT", "CANCELLED"]);
  });
});
