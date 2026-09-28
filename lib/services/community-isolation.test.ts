import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetCommunityStoreForTests,
  createPost,
  listEvents,
  listPostsByStartup,
  listRegistrationsForStartup,
  registerForEvent,
} from "./community";

// Community posts/circles/events are a shared catalog, but event
// registrations and post->startup references must never leak from one
// startup to another.
describe("community data is startup-isolated", () => {
  beforeEach(() => {
    __resetCommunityStoreForTests();
  });

  it("a post attached to startup A never appears in startup B's post list", () => {
    createPost({ authorId: "u1", startupId: "startup-a", type: "PROGRESS", topic: "GENERAL", body: "progress on A" }, "2026-01-01T00:00:00.000Z");
    expect(listPostsByStartup("startup-a")).toHaveLength(1);
    expect(listPostsByStartup("startup-b")).toHaveLength(0);
  });

  it("event registrations made on behalf of startup A never appear for startup B", () => {
    const event = listEvents()[0];
    registerForEvent("u1", event.id, "2026-01-01T00:00:00.000Z", "startup-a");
    expect(listRegistrationsForStartup("startup-a")).toHaveLength(1);
    expect(listRegistrationsForStartup("startup-b")).toHaveLength(0);
  });
});
