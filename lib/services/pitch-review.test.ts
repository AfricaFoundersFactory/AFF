import { describe, expect, it } from "vitest";
import { listReviews, resolveComment, dismissComment, createTaskFromComment, createPitchImprovementTask } from "./pitch-review";
import { getActiveVersion, getPitchReadiness } from "./pitch";
import { getTasksForStartup, completeTask } from "./tasks";
import { getLatestAssessment } from "./readiness";

describe("demo seed", () => {
  it("seeds startup-wakama with one clearly-labeled demo review and startup-solari with none", () => {
    const wakamaReviews = listReviews("startup-wakama");
    expect(wakamaReviews).toHaveLength(1);
    expect(wakamaReviews[0].isDemo).toBe(true);
    expect(listReviews("startup-solari")).toHaveLength(0);
  });
});

describe("review comment lifecycle", () => {
  it("resolves and dismisses comments, updating status and resolvedAt", () => {
    const review = listReviews("startup-wakama")[0];
    const openComment = review.comments.find((c) => c.status === "open")!;

    const resolved = resolveComment("startup-wakama", review.id, openComment.id, "2026-03-05T00:00:00.000Z");
    expect(resolved.comments.find((c) => c.id === openComment.id)!.status).toBe("resolved");
    expect(resolved.comments.find((c) => c.id === openComment.id)!.resolvedAt).toBe("2026-03-05T00:00:00.000Z");

    const secondOpen = resolved.comments.find((c) => c.status === "open");
    if (secondOpen) {
      const dismissed = dismissComment("startup-wakama", review.id, secondOpen.id, "2026-03-05T00:00:01.000Z");
      expect(dismissed.comments.find((c) => c.id === secondOpen.id)!.status).toBe("dismissed");
    }
  });
});

describe("feedback -> task", () => {
  it("creates a Task with sourceType EXPERT_RECOMMENDATION linked back to the comment", () => {
    const review = listReviews("startup-wakama")[0];
    const target = review.comments.find((c) => !c.taskId)!;
    const before = getTasksForStartup("startup-wakama").length;

    const { task } = createTaskFromComment("startup-wakama", review.id, target.id, "2026-03-06T00:00:00.000Z");
    expect(task.sourceType).toBe("EXPERT_RECOMMENDATION");
    expect(task.sourceReference).toBe(target.id);
    expect(getTasksForStartup("startup-wakama").length).toBe(before + 1);
  });

  it("prevents duplicate task creation from the same unresolved comment", () => {
    const review = listReviews("startup-wakama")[0];
    const alreadyLinked = review.comments.find((c) => c.taskId)!;
    expect(() => createTaskFromComment("startup-wakama", review.id, alreadyLinked.id, "2026-03-06T00:00:01.000Z")).toThrow();
  });
});

describe("pitch improvement -> task", () => {
  it("creates a PITCH_IMPROVEMENT task for a gap, and returns the same task on a second call for the same gap (no duplicate)", () => {
    const version = getActiveVersion("startup-solari")!;
    const before = getTasksForStartup("startup-solari").length;

    const first = createPitchImprovementTask(
      "startup-solari",
      { gapKey: "pitch-gap-market-section", title: "Flesh out the market section", pitchVersionId: version.id },
      "2026-03-07T00:00:00.000Z",
    );
    expect(first.sourceType).toBe("PITCH_IMPROVEMENT");
    expect(getTasksForStartup("startup-solari").length).toBe(before + 1);

    const second = createPitchImprovementTask(
      "startup-solari",
      { gapKey: "pitch-gap-market-section", title: "Flesh out the market section", pitchVersionId: version.id },
      "2026-03-07T00:00:01.000Z",
    );
    expect(second.id).toBe(first.id);
    expect(getTasksForStartup("startup-solari").length).toBe(before + 1);
  });
});

describe("task completion does not modify AFF Readiness or Pitch Readiness", () => {
  it("leaves both scores untouched after completing a pitch-originated task", () => {
    const version = getActiveVersion("startup-wakama")!;
    const affBefore = getLatestAssessment("startup-wakama")?.overallScore;
    const pitchBefore = getPitchReadiness("startup-wakama", version.id, "2026-03-08T00:00:00.000Z")!;

    const [task] = getTasksForStartup("startup-wakama").filter((t) => t.sourceType === "EXPERT_RECOMMENDATION");
    completeTask("startup-wakama", task.id, "2026-03-08T00:00:00.000Z");

    const affAfter = getLatestAssessment("startup-wakama")?.overallScore;
    const pitchAfter = getPitchReadiness("startup-wakama", version.id, "2026-03-08T00:00:00.000Z")!;

    expect(affAfter).toBe(affBefore);
    expect(pitchAfter.score).toBe(pitchBefore.score);
  });
});
