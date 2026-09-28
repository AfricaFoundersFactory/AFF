import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getFounderAnalytics } from "./analytics";
import { getAssessmentHistory } from "./readiness";
import { createPost, registerForEvent, listEvents, __resetCommunityStoreForTests } from "./community";
import { upsertPeriod, setCashPosition } from "./financials";
import { countUnresolvedComments } from "./pitch-review";

const NOW = "2026-06-01T00:00:00.000Z";

describe("Founder Analytics — canonical reuse, determinism, no master score", () => {
  it("readiness analytics matches the real assessment history (never recomputed)", () => {
    const history = getAssessmentHistory("startup-wakama").filter((a) => a.status === "completed");
    const snapshot = getFounderAnalytics("startup-wakama", "ALL", NOW);
    if (history.length > 0) {
      const latest = [...history].sort((a, b) => (a.completedAt ?? a.startedAt).localeCompare(b.completedAt ?? b.startedAt)).at(-1)!;
      expect(snapshot.readiness.available).toBe(true);
      if (snapshot.readiness.available) {
        expect(snapshot.readiness.data.currentScore).toBe(latest.overallScore);
        expect(snapshot.readiness.data.assessmentCount).toBe(history.length);
      }
    }
  });

  it("is deterministic: two calls with the same inputs produce byte-identical output", () => {
    const a = getFounderAnalytics("startup-wakama", "ALL", NOW);
    const b = getFounderAnalytics("startup-wakama", "ALL", NOW);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("handles a startup with no data honestly (no fabricated values)", () => {
    const snapshot = getFounderAnalytics("startup-never-seen", "ALL", NOW);
    expect(snapshot.readiness.available).toBe(false);
    expect(snapshot.pitch.available).toBe(false);
    expect(snapshot.financials.available).toBe(false);
    expect(snapshot.execution.tasksTotal).toBe(0);
    expect(snapshot.dataRoom.completionPct).toBe(0);
    expect(snapshot.timeline).toEqual([]);
  });

  it("date range filtering narrows or preserves the timeline (never fabricates points)", () => {
    const all = getFounderAnalytics("startup-wakama", "ALL", NOW);
    const days30 = getFounderAnalytics("startup-wakama", "30D", NOW);
    expect(days30.timeline.length).toBeLessThanOrEqual(all.timeline.length);
    for (const event of days30.timeline) {
      expect(all.timeline.some((e) => e.id === event.id)).toBe(true);
    }
  });

  it("opportunity counts are labeled as founder-entered only (no field claims a real external status)", () => {
    const snapshot = getFounderAnalytics("startup-wakama", "ALL", NOW);
    expect(typeof snapshot.opportunities.applied).toBe("number");
    expect(Object.keys(snapshot.opportunities).sort()).toEqual(["accepted", "applied", "preparing", "rejected", "saved", "shortlisted"].sort());
  });

  it("startup isolation: community counts for one startup never include another startup's posts/events", () => {
    __resetCommunityStoreForTests();
    createPost({ authorId: "u1", startupId: "startup-a", type: "QUESTION", topic: "GENERAL", body: "q" }, NOW);
    createPost({ authorId: "u1", startupId: "startup-b", type: "QUESTION", topic: "GENERAL", body: "q2" }, NOW);
    const event = listEvents()[0];
    registerForEvent("u1", event.id, NOW, "startup-a");

    const analyticsA = getFounderAnalytics("startup-a", "ALL", NOW);
    const analyticsB = getFounderAnalytics("startup-b", "ALL", NOW);
    expect(analyticsA.community.postsCreated).toBe(1);
    expect(analyticsB.community.postsCreated).toBe(1);
    expect(analyticsA.community.eventsRegistered).toBe(1);
    expect(analyticsB.community.eventsRegistered).toBe(0);
  });

  it("pitch analytics reuses the canonical unresolved-comment count (never a hardcoded 0)", () => {
    const snapshot = getFounderAnalytics("startup-wakama", "ALL", NOW);
    expect(snapshot.pitch.available).toBe(true);
    if (snapshot.pitch.available) {
      expect(snapshot.pitch.data.unresolvedReviewComments).toBe(countUnresolvedComments("startup-wakama"));
      // startup-wakama's demo review seeds an open critical_issue comment — a real,
      // non-zero count, proving this isn't coincidentally still hardcoded to 0.
      expect(snapshot.pitch.data.unresolvedReviewComments).toBeGreaterThan(0);
    }
  });

  it("financial runway analytics distinguishes calculated / sustainable / unavailable (never collapses or fabricates)", () => {
    upsertPeriod(
      "startup-analytics-runway-calc",
      { month: "2026-01", revenue: [{ id: "r1", label: "Sales", amount: { amount: 1000, currency: "XOF" }, recurring: true }], expenses: [{ id: "e1", label: "Ops", amount: { amount: 4000, currency: "XOF" }, category: "other" }] },
      NOW,
    );
    setCashPosition("startup-analytics-runway-calc", { asOfDate: NOW, balance: { amount: 9000, currency: "XOF" } });
    const calc = getFounderAnalytics("startup-analytics-runway-calc", "ALL", NOW);
    expect(calc.financials.available).toBe(true);
    if (calc.financials.available) expect(calc.financials.data.runway).toEqual({ status: "calculated", months: 3 });

    upsertPeriod(
      "startup-analytics-runway-sustainable",
      { month: "2026-01", revenue: [{ id: "r1", label: "Sales", amount: { amount: 5000, currency: "XOF" }, recurring: true }], expenses: [{ id: "e1", label: "Ops", amount: { amount: 2000, currency: "XOF" }, category: "other" }] },
      NOW,
    );
    setCashPosition("startup-analytics-runway-sustainable", { asOfDate: NOW, balance: { amount: 9000, currency: "XOF" } });
    const sustainable = getFounderAnalytics("startup-analytics-runway-sustainable", "ALL", NOW);
    expect(sustainable.financials.available).toBe(true);
    if (sustainable.financials.available) expect(sustainable.financials.data.runway).toEqual({ status: "sustainable" });

    upsertPeriod(
      "startup-analytics-runway-unavailable",
      { month: "2026-01", revenue: [{ id: "r1", label: "Sales", amount: { amount: 1000, currency: "XOF" }, recurring: true }], expenses: [] },
      NOW,
    );
    // Deliberately no cash position set — cashBalance stays null.
    const unavailable = getFounderAnalytics("startup-analytics-runway-unavailable", "ALL", NOW);
    expect(unavailable.financials.available).toBe(true);
    if (unavailable.financials.available) expect(unavailable.financials.data.runway).toEqual({ status: "unavailable" });
  });

  it("static check: no master/global score concept anywhere in the analytics code", () => {
    const forbidden = ["globalScore", "masterScore", "affScore", "overallScore", "compositeScore", "aggregateScore"];
    const filesToCheck = ["lib/services/analytics.ts", "lib/analytics/timeline.ts", "types/analytics.ts", "components/dashboard/analytics/AnalyticsView.tsx"];
    for (const rel of filesToCheck) {
      const source = readFileSync(join(process.cwd(), rel), "utf8");
      for (const term of forbidden) {
        // "overallScore" is a legitimate Readiness field name we READ from
        // (types/readiness-engine.ts) — allow reading it, but never
        // redefining/introducing a NEW combined score field under a
        // different, analytics-owned name.
        if (term === "overallScore") continue;
        expect(source.includes(term), `${rel} must not reference "${term}"`).toBe(false);
      }
    }
  });
});
