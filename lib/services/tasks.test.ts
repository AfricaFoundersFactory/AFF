import { describe, expect, it, vi } from "vitest";
import * as readinessService from "./readiness";
import {
  getTasksForStartup,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  reopenTask,
  startTask,
} from "./tasks";

describe("demo seed", () => {
  it("seeds this-week demo tasks per startup", () => {
    expect(getTasksForStartup("startup-wakama").length).toBeGreaterThan(0);
  });
});

describe("task CRUD", () => {
  it("creates, updates and deletes a founder task", () => {
    const created = createTask("startup-wakama", { title: "New task", createdBy: "FOUNDER" }, "2026-01-01");
    expect(created.status).toBe("todo");
    expect(created.sourceType).toBe("FOUNDER_CREATED");

    const updated = updateTask("startup-wakama", created.id, { title: "Renamed" }, "2026-01-02");
    expect(updated.title).toBe("Renamed");

    deleteTask("startup-wakama", created.id);
    expect(getTasksForStartup("startup-wakama").find((t) => t.id === created.id)).toBeUndefined();
  });
});

describe("status transitions", () => {
  it("allows the standard lifecycle: todo -> in_progress -> done -> reopen", () => {
    const created = createTask("startup-wakama", { title: "Lifecycle task" }, "2026-01-01");
    const started = startTask("startup-wakama", created.id, "2026-01-02");
    expect(started.status).toBe("in_progress");
    expect(started.startedAt).toBe("2026-01-02");

    const completed = completeTask("startup-wakama", created.id, "2026-01-03");
    expect(completed.status).toBe("done");
    expect(completed.completedAt).toBe("2026-01-03");

    const reopened = reopenTask("startup-wakama", created.id, "2026-01-04");
    expect(reopened.status).toBe("todo");
    expect(reopened.completedAt).toBeUndefined();
  });

  it("rejects an invalid transition (done -> in_progress directly, only reopening to todo is allowed)", () => {
    const created = createTask("startup-wakama", { title: "Invalid transition" }, "2026-01-01");
    completeTask("startup-wakama", created.id, "2026-01-02");
    expect(() => updateTask("startup-wakama", created.id, { status: "in_progress" }, "2026-01-03")).toThrow();
  });

  it("allows completing a task directly from todo (starting first is not mandatory)", () => {
    const created = createTask("startup-wakama", { title: "Direct complete" }, "2026-01-01");
    const completed = completeTask("startup-wakama", created.id, "2026-01-02");
    expect(completed.status).toBe("done");
  });
});

describe("startup isolation", () => {
  it("never lets one startup's task mutation affect another's", () => {
    const solariCountBefore = getTasksForStartup("startup-solari").length;
    createTask("startup-wakama", { title: "Wakama-only" }, "2026-01-01");
    expect(getTasksForStartup("startup-solari").length).toBe(solariCountBefore);
  });
});

describe("filters", () => {
  it("filters by status, priority and roadmap-linked vs standalone", () => {
    createTask("startup-wakama", { title: "Roadmap-linked", roadmapItemId: "item-1" }, "2026-01-01");
    const linked = getTasksForStartup("startup-wakama", { roadmapLinked: true });
    expect(linked.every((t) => Boolean(t.roadmapItemId))).toBe(true);
    const standalone = getTasksForStartup("startup-wakama", { roadmapLinked: false });
    expect(standalone.every((t) => !t.roadmapItemId)).toBe(true);
  });
});

describe("no readiness score mutation from task operations", () => {
  it("never calls readiness's score-mutating functions when creating or completing a task", () => {
    const createSpy = vi.spyOn(readinessService, "createAssessment");
    const reassessSpy = vi.spyOn(readinessService, "reassess");
    const saveSpy = vi.spyOn(readinessService, "saveAssessmentAnswers");
    const completeSpy = vi.spyOn(readinessService, "completeAssessment");

    const task = createTask("startup-wakama", { title: "Spy check" }, "2026-01-01");
    completeTask("startup-wakama", task.id, "2026-01-02");

    expect(createSpy).not.toHaveBeenCalled();
    expect(reassessSpy).not.toHaveBeenCalled();
    expect(saveSpy).not.toHaveBeenCalled();
    expect(completeSpy).not.toHaveBeenCalled();

    createSpy.mockRestore();
    reassessSpy.mockRestore();
    saveSpy.mockRestore();
    completeSpy.mockRestore();
  });
});
