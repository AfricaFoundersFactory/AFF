import { describe, expect, it } from "vitest";
import { resolveStartupExposure } from "./visibility";

const identity = {
  name: "Fictional Startup Inc.",
  tagline: "We do fictional things (demo)",
  industry: "AgriTech",
  stage: "growth",
};

describe("Community startup exposure resolver", () => {
  it("HIDDEN (or opted-out) exposes nothing at all", () => {
    expect(resolveStartupExposure({ showStartupInCommunity: false, startupVisibility: "SUMMARY" }, identity)).toEqual({ visible: false });
    expect(resolveStartupExposure({ showStartupInCommunity: true, startupVisibility: "HIDDEN" }, identity)).toEqual({ visible: false });
    expect(resolveStartupExposure(undefined, identity)).toEqual({ visible: false });
  });

  it("NAME_ONLY exposes only the startup name", () => {
    const view = resolveStartupExposure({ showStartupInCommunity: true, startupVisibility: "NAME_ONLY" }, identity);
    expect(view).toEqual({ visible: true, visibility: "NAME_ONLY", name: identity.name });
  });

  it("SUMMARY exposes only the explicitly allow-listed summary fields", () => {
    const view = resolveStartupExposure({ showStartupInCommunity: true, startupVisibility: "SUMMARY" }, identity);
    expect(view).toEqual({
      visible: true,
      visibility: "SUMMARY",
      name: identity.name,
      tagline: identity.tagline,
      industry: identity.industry,
      stage: identity.stage,
    });
  });

  it("never exposes fields outside the allow-list even if the source object carries more", () => {
    const richerIdentity = {
      ...identity,
      // Simulates a caller accidentally passing a richer object — the
      // resolver's return type is a strict allow-list, so nothing beyond
      // name/tagline/industry/stage can ever appear on the result even if
      // present on the input.
      cashBalance: 999999,
      runway: 3,
    } as typeof identity & { cashBalance: number; runway: number };
    const view = resolveStartupExposure({ showStartupInCommunity: true, startupVisibility: "SUMMARY" }, richerIdentity);
    expect(Object.keys(view).sort()).toEqual(["industry", "name", "stage", "tagline", "visibility", "visible"].sort());
  });
});
