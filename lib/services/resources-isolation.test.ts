import { beforeEach, describe, expect, it } from "vitest";
import { __resetResourcesStoreForTests, bookmarkResource, isBookmarked, listBookmarks, listResources } from "./resources";

describe("resource bookmarks are startup-isolated", () => {
  beforeEach(() => __resetResourcesStoreForTests());

  it("does not let startup A's bookmark appear for startup B", () => {
    const resource = listResources()[0];
    bookmarkResource("startup-a", resource.id, "2026-01-01T00:00:00.000Z");
    expect(listBookmarks("startup-b")).toHaveLength(0);
    expect(isBookmarked("startup-b", resource.id)).toBe(false);
  });
});
