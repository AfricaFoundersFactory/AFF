import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetSupportRequestsStoreForTests,
  createSupportRequest,
  getSupportRequest,
  listSupportRequests,
  updateSupportRequestStatus,
} from "./support-requests";
import { __resetExpertsStoreForTests, createExpertProfile } from "./experts";

function seedExpert() {
  return createExpertProfile(
    {
      displayName: "Test Expert",
      headline: "h",
      bio: "b",
      country: "Kenya",
      languages: ["en"],
      expertise: ["FUNDRAISING"],
      industries: [],
      startupStages: ["mvp"],
      markets: [],
      availability: "AVAILABLE",
      mentoringFormats: ["VIDEO_CALL"],
    },
    "2026-01-01T00:00:00.000Z",
  );
}

describe("support requests", () => {
  beforeEach(() => {
    __resetExpertsStoreForTests();
    __resetSupportRequestsStoreForTests();
  });

  it("creates a request that defaults to SENT — submitted inside AFF only", () => {
    const expert = seedExpert();
    const request = createSupportRequest(
      "startup-a",
      {
        founderId: "founder-1",
        expertId: expert.id,
        topic: "Fundraising narrative",
        message: "Could you review our ask?",
        preferredFormat: "VIDEO_CALL",
        preferredLanguage: "en",
      },
      "2026-01-01T00:00:00.000Z",
    );
    expect(request.status).toBe("SENT");
    expect(getSupportRequest("startup-a", request.id)).toEqual(request);
  });

  it("rejects a request for an expert that doesn't exist", () => {
    expect(() =>
      createSupportRequest(
        "startup-a",
        { founderId: "f1", expertId: "no-such-expert", topic: "t", message: "m", preferredFormat: "CHAT", preferredLanguage: "en" },
        "2026-01-01T00:00:00.000Z",
      ),
    ).toThrow();
  });

  it("valid status transition: SENT -> ACCEPTED -> COMPLETED", () => {
    const expert = seedExpert();
    const request = createSupportRequest(
      "startup-a",
      { founderId: "f1", expertId: expert.id, topic: "t", message: "m", preferredFormat: "CHAT", preferredLanguage: "en" },
      "2026-01-01T00:00:00.000Z",
    );
    const accepted = updateSupportRequestStatus("startup-a", request.id, "ACCEPTED", "2026-01-02T00:00:00.000Z");
    expect(accepted.status).toBe("ACCEPTED");
    const completed = updateSupportRequestStatus("startup-a", request.id, "COMPLETED", "2026-01-03T00:00:00.000Z");
    expect(completed.status).toBe("COMPLETED");
  });

  it("rejects an invalid status transition (DECLINED is terminal)", () => {
    const expert = seedExpert();
    const request = createSupportRequest(
      "startup-a",
      { founderId: "f1", expertId: expert.id, topic: "t", message: "m", preferredFormat: "CHAT", preferredLanguage: "en" },
      "2026-01-01T00:00:00.000Z",
    );
    updateSupportRequestStatus("startup-a", request.id, "DECLINED", "2026-01-02T00:00:00.000Z");
    expect(() => updateSupportRequestStatus("startup-a", request.id, "ACCEPTED", "2026-01-03T00:00:00.000Z")).toThrow();
  });

  it("does not let startup A's support request leak into startup B's list", () => {
    const expert = seedExpert();
    createSupportRequest(
      "startup-a",
      { founderId: "f1", expertId: expert.id, topic: "t", message: "m", preferredFormat: "CHAT", preferredLanguage: "en" },
      "2026-01-01T00:00:00.000Z",
    );
    expect(listSupportRequests("startup-a")).toHaveLength(1);
    expect(listSupportRequests("startup-b")).toHaveLength(0);
  });
});
