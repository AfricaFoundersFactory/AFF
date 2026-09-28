import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetMentoringStoreForTests,
  addRecommendationToRoadmap,
  completeSession,
  createSession,
  createTaskFromRecommendation,
  getFollowUp,
  listRecommendations,
  listSessions,
  updateRecommendationStatus,
} from "./mentoring";
import { __resetExpertsStoreForTests, createExpertProfile } from "./experts";
import { __resetSupportRequestsStoreForTests, createSupportRequest } from "./support-requests";
import { __resetTaskStoreForTests, getTasksForStartup } from "./tasks";
import { getCurrentRoadmap } from "./roadmap";

function seedExpert() {
  return createExpertProfile(
    {
      displayName: "Mentor",
      headline: "h",
      bio: "b",
      country: "Nigeria",
      languages: ["en"],
      expertise: ["FUNDRAISING", "GROWTH"],
      industries: [],
      startupStages: ["mvp"],
      markets: [],
      availability: "AVAILABLE",
      mentoringFormats: ["VIDEO_CALL"],
    },
    "2026-01-01T00:00:00.000Z",
  );
}

function seedRequest(startupId: string, expertId: string) {
  return createSupportRequest(
    startupId,
    { founderId: "founder-1", expertId, topic: "Topic", message: "Msg", preferredFormat: "VIDEO_CALL", preferredLanguage: "en" },
    "2026-01-01T00:00:00.000Z",
  );
}

describe("mentoring sessions", () => {
  beforeEach(() => {
    __resetExpertsStoreForTests();
    __resetSupportRequestsStoreForTests();
    __resetMentoringStoreForTests();
    __resetTaskStoreForTests();
  });

  it("creates a session in PLANNED status", () => {
    const expert = seedExpert();
    const request = seedRequest("startup-a", expert.id);
    const session = createSession(
      "startup-a",
      { supportRequestId: request.id, expertId: expert.id, founderId: "founder-1", topic: "Topic", format: "VIDEO_CALL" },
      "2026-01-01T00:00:00.000Z",
    );
    expect(session.status).toBe("PLANNED");
    expect(listSessions("startup-a")).toHaveLength(1);
  });

  it("completes a session, creates recommendations, and cannot be completed twice", () => {
    const expert = seedExpert();
    const request = seedRequest("startup-a", expert.id);
    const session = createSession(
      "startup-a",
      { supportRequestId: request.id, expertId: expert.id, founderId: "founder-1", topic: "Topic", format: "VIDEO_CALL" },
      "2026-01-01T00:00:00.000Z",
    );
    const { session: completed, recommendations } = completeSession(
      "startup-a",
      session.id,
      { recommendations: [{ category: "FUNDRAISING", title: "Do X", description: "desc", priority: "high" }] },
      "2026-01-02T00:00:00.000Z",
    );
    expect(completed.status).toBe("COMPLETED");
    expect(recommendations).toHaveLength(1);
    expect(completed.recommendationIds).toEqual([recommendations[0].id]);
    expect(() =>
      completeSession("startup-a", session.id, {}, "2026-01-03T00:00:00.000Z"),
    ).toThrow();
  });

  it("recommendation status transitions", () => {
    const expert = seedExpert();
    const request = seedRequest("startup-a", expert.id);
    const session = createSession(
      "startup-a",
      { supportRequestId: request.id, expertId: expert.id, founderId: "founder-1", topic: "Topic", format: "VIDEO_CALL" },
      "2026-01-01T00:00:00.000Z",
    );
    const { recommendations } = completeSession(
      "startup-a",
      session.id,
      { recommendations: [{ category: "FUNDRAISING", title: "Do X", description: "desc", priority: "high" }] },
      "2026-01-02T00:00:00.000Z",
    );
    const accepted = updateRecommendationStatus("startup-a", recommendations[0].id, "ACCEPTED", "2026-01-03T00:00:00.000Z");
    expect(accepted.status).toBe("ACCEPTED");
  });

  it("createTaskFromRecommendation creates a Task with sourceType EXPERT_RECOMMENDATION and prevents duplicates", () => {
    const expert = seedExpert();
    const request = seedRequest("startup-a", expert.id);
    const session = createSession(
      "startup-a",
      { supportRequestId: request.id, expertId: expert.id, founderId: "founder-1", topic: "Topic", format: "VIDEO_CALL" },
      "2026-01-01T00:00:00.000Z",
    );
    const { recommendations } = completeSession(
      "startup-a",
      session.id,
      { recommendations: [{ category: "FUNDRAISING", title: "Do X", description: "desc", priority: "high" }] },
      "2026-01-02T00:00:00.000Z",
    );
    const { task, recommendation } = createTaskFromRecommendation("startup-a", recommendations[0].id, "2026-01-03T00:00:00.000Z");
    expect(task.sourceType).toBe("EXPERT_RECOMMENDATION");
    expect(task.sourceReference).toBe(recommendations[0].id);
    expect(recommendation.taskId).toBe(task.id);
    expect(getTasksForStartup("startup-a")).toHaveLength(1);

    expect(() => createTaskFromRecommendation("startup-a", recommendations[0].id, "2026-01-04T00:00:00.000Z")).toThrow();
    // Still exactly one task — the duplicate attempt never created a second one.
    expect(getTasksForStartup("startup-a")).toHaveLength(1);
  });

  it("addRecommendationToRoadmap is founder-triggered, adds one item, and prevents duplicates", () => {
    const expert = seedExpert();
    // startup-wakama already has a seeded roadmap from lib/services/roadmap.ts.
    const request = seedRequest("startup-wakama", expert.id);
    const session = createSession(
      "startup-wakama",
      { supportRequestId: request.id, expertId: expert.id, founderId: "founder-1", topic: "Topic", format: "VIDEO_CALL" },
      "2026-01-01T00:00:00.000Z",
    );
    const { recommendations } = completeSession(
      "startup-wakama",
      session.id,
      { recommendations: [{ category: "GROWTH", title: "Fix traction story", description: "desc", priority: "medium" }] },
      "2026-01-02T00:00:00.000Z",
    );
    const before = getCurrentRoadmap("startup-wakama");
    const beforeCount = before?.items.length ?? 0;

    const updated = addRecommendationToRoadmap("startup-wakama", recommendations[0].id, "2026-01-03T00:00:00.000Z");
    expect(updated.roadmapItemId).toBeDefined();
    const after = getCurrentRoadmap("startup-wakama");
    expect(after?.items.length).toBe(beforeCount + 1);

    expect(() => addRecommendationToRoadmap("startup-wakama", recommendations[0].id, "2026-01-04T00:00:00.000Z")).toThrow();
    const afterSecondAttempt = getCurrentRoadmap("startup-wakama");
    expect(afterSecondAttempt?.items.length).toBe(beforeCount + 1);
  });

  it("getFollowUp aggregates recommendation execution, never an expert rating", () => {
    const expert = seedExpert();
    const request = seedRequest("startup-a", expert.id);
    const session = createSession(
      "startup-a",
      { supportRequestId: request.id, expertId: expert.id, founderId: "founder-1", topic: "Topic", format: "VIDEO_CALL" },
      "2026-01-01T00:00:00.000Z",
    );
    const { recommendations } = completeSession(
      "startup-a",
      session.id,
      {
        recommendations: [
          { category: "FUNDRAISING", title: "A", description: "d", priority: "high" },
          { category: "GROWTH", title: "B", description: "d", priority: "medium" },
          { category: "PRODUCT", title: "C", description: "d", priority: "low" },
        ],
      },
      "2026-01-02T00:00:00.000Z",
    );
    updateRecommendationStatus("startup-a", recommendations[0].id, "ACCEPTED", "2026-01-03T00:00:00.000Z");
    createTaskFromRecommendation("startup-a", recommendations[1].id, "2026-01-03T00:00:00.000Z");
    updateRecommendationStatus("startup-a", recommendations[2].id, "COMPLETED", "2026-01-03T00:00:00.000Z");

    const followUp = getFollowUp("startup-a", session.id);
    expect(followUp).toEqual({ sessionId: session.id, total: 3, accepted: 1, convertedToTask: 1, completed: 1, dismissed: 0 });
    expect(followUp).not.toHaveProperty("rating");
    expect(followUp).not.toHaveProperty("stars");
  });

  it("startup isolation: startup A's sessions/recommendations never appear for startup B", () => {
    const expert = seedExpert();
    const requestA = seedRequest("startup-a", expert.id);
    const sessionA = createSession(
      "startup-a",
      { supportRequestId: requestA.id, expertId: expert.id, founderId: "founder-1", topic: "Topic", format: "VIDEO_CALL" },
      "2026-01-01T00:00:00.000Z",
    );
    completeSession(
      "startup-a",
      sessionA.id,
      { recommendations: [{ category: "FUNDRAISING", title: "A", description: "d", priority: "high" }] },
      "2026-01-02T00:00:00.000Z",
    );

    expect(listSessions("startup-b")).toHaveLength(0);
    expect(listRecommendations("startup-b")).toHaveLength(0);
  });
});
