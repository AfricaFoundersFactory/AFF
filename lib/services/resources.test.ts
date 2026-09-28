import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetResourcesStoreForTests,
  bookmarkResource,
  createTaskFromResource,
  isBookmarked,
  listBookmarks,
  listResources,
  unbookmarkResource,
} from "./resources";

describe("Resources: catalog seeding", () => {
  it("seeds 15-25 demo resources spanning categories/formats, with origin always explicit", () => {
    const resources = listResources();
    expect(resources.length).toBeGreaterThanOrEqual(15);
    expect(resources.length).toBeLessThanOrEqual(25);
    for (const r of resources) {
      expect(["AFF_RESOURCE", "EXTERNAL_RESOURCE"]).toContain(r.origin);
      expect(r.title.en).toBeTruthy();
      expect(r.title.fr).toBeTruthy();
    }
  });
});

describe("Resources: bookmarking", () => {
  beforeEach(() => __resetResourcesStoreForTests());

  it("bookmarks and unbookmarks without duplicates", () => {
    const resource = listResources()[0];
    bookmarkResource("startup-a", resource.id, "2026-01-01T00:00:00.000Z");
    bookmarkResource("startup-a", resource.id, "2026-01-02T00:00:00.000Z");
    expect(listBookmarks("startup-a")).toHaveLength(1);
    expect(isBookmarked("startup-a", resource.id)).toBe(true);

    unbookmarkResource("startup-a", resource.id);
    expect(listBookmarks("startup-a")).toHaveLength(0);
  });
});

describe("Resources: task conversion", () => {
  beforeEach(() => __resetResourcesStoreForTests());

  it("creates a task and prevents duplicate task creation for the same resource+startup", () => {
    const resource = listResources()[0];
    const { task } = createTaskFromResource("startup-a", resource.id, "2026-01-01T00:00:00.000Z");
    expect(task.sourceType).toBe("RESOURCE_ACTION");
    expect(() => createTaskFromResource("startup-a", resource.id, "2026-01-02T00:00:00.000Z")).toThrow();
  });

  it("allows the same resource to become a task independently for a different startup", () => {
    const resource = listResources()[0];
    createTaskFromResource("startup-a", resource.id, "2026-01-01T00:00:00.000Z");
    expect(() => createTaskFromResource("startup-b", resource.id, "2026-01-01T00:00:00.000Z")).not.toThrow();
  });
});
