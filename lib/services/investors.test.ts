import { describe, expect, it } from "vitest";
import { getInvestor, listInvestors, searchInvestors } from "./investors";

describe("investors service", () => {
  it("lists seeded demo investors, all clearly marked as demo", () => {
    const all = listInvestors();
    expect(all.length).toBeGreaterThan(0);
    for (const r of all) {
      expect(r.organization.isDemo).toBe(true);
      expect(r.organization.name).toMatch(/\(Demo\)/);
    }
  });

  it("retrieves a single investor profile by id", () => {
    const all = listInvestors();
    const found = getInvestor(all[0].organization.id);
    expect(found?.organization.id).toBe(all[0].organization.id);
    expect(found?.profile.thesis).toBeDefined();
  });

  it("returns undefined for an unknown investor id", () => {
    expect(getInvestor("does-not-exist")).toBeUndefined();
  });

  it("filters by investor type", () => {
    const vcs = searchInvestors({ type: "VC" });
    expect(vcs.length).toBeGreaterThan(0);
    for (const r of vcs) expect(r.organization.type).toBe("VC");
  });

  it("filters by stage", () => {
    const results = searchInvestors({ stage: "idea" });
    for (const r of results) expect(r.profile.thesis.stages).toContain("idea");
  });

  it("filters by industry (case-insensitive)", () => {
    const results = searchInvestors({ industry: "fintech" });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) expect(r.profile.thesis.industries.map((i) => i.toLowerCase())).toContain("fintech");
  });

  it("filters by free-text query across name/description", () => {
    const results = searchInvestors({ query: "Baobab" });
    expect(results.some((r) => r.organization.name.includes("Baobab"))).toBe(true);
  });

  it("filters by instrument", () => {
    const results = searchInvestors({ instrument: "safe" });
    for (const r of results) expect(r.profile.thesis.instruments).toContain("safe");
  });

  it("combines multiple filters", () => {
    const results = searchInvestors({ type: "VC", stage: "growth" });
    for (const r of results) {
      expect(r.organization.type).toBe("VC");
      expect(r.profile.thesis.stages).toContain("growth");
    }
  });

  it("returns no results for an impossible filter combination without throwing", () => {
    expect(() => searchInvestors({ country: "Nowhereland" })).not.toThrow();
    expect(searchInvestors({ country: "Nowhereland" })).toEqual([]);
  });

  it("filters by geography", () => {
    const results = searchInvestors({ geography: "West Africa" });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) expect(r.profile.thesis.geographies).toContain("West Africa");
  });

  it("filters by country (case-insensitive)", () => {
    const results = searchInvestors({ country: "kenya" });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) expect(r.profile.thesis.countries.map((c) => c.toLowerCase())).toContain("kenya");
  });

  it("filters by impact theme", () => {
    const results = searchInvestors({ impactTheme: "Financial Inclusion" });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) expect(r.profile.thesis.impactThemes).toContain("Financial Inclusion");
  });

  it("filters by ticket amount that falls inside an investor's same-currency range", () => {
    const results = searchInvestors({ ticketAmount: { amount: 50_000, currency: "USD" } });
    expect(results.some((r) => r.organization.id === "demo-inv-savanna-angels")).toBe(true);
  });

  it("excludes investors whose same-currency ticket range does not cover the amount", () => {
    const results = searchInvestors({ ticketAmount: { amount: 50_000, currency: "USD" } });
    // Baobab's USD range is 250k-2M — 50k should not qualify.
    expect(results.some((r) => r.organization.id === "demo-inv-baobab-ventures")).toBe(false);
  });

  it("never excludes an investor on ticket amount when currencies differ (comparison unavailable, not a mismatch)", () => {
    // Atlas Family Office's ticket range is EUR-denominated only.
    const results = searchInvestors({ ticketAmount: { amount: 50_000, currency: "USD" } });
    expect(results.some((r) => r.organization.id === "demo-inv-atlas-family-office")).toBe(true);
  });

  it("combines ticket amount with another filter", () => {
    const results = searchInvestors({ stage: "growth", ticketAmount: { amount: 1_000_000, currency: "USD" } });
    for (const r of results) {
      expect(r.profile.thesis.stages).toContain("growth");
    }
    expect(results.some((r) => r.organization.id === "demo-inv-baobab-ventures")).toBe(true);
  });
});
