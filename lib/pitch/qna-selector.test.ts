import { describe, expect, it } from "vitest";
import { demoDigitalTwins } from "@/lib/demo/digital-twin";
import { selectContextualQuestions } from "./qna-selector";

const wakamaTwin = demoDigitalTwins["startup-wakama"];

describe("contextual Q&A selection", () => {
  it("is a deterministic pure function — same input, same output", () => {
    const first = selectContextualQuestions(wakamaTwin, "fundraising");
    const second = selectContextualQuestions(wakamaTwin, "fundraising");
    expect(first).toEqual(second);
  });

  it("skips MRR-growth questions and asks a monetization-timing question instead when there's no revenue", () => {
    const preRevenueTwin = {
      ...wakamaTwin,
      financials: { ...wakamaTwin.financials, monthlyRevenue: undefined, annualRevenue: undefined },
      traction: { ...wakamaTwin.traction, metrics: [] },
    };
    const questions = selectContextualQuestions(preRevenueTwin, "general");
    expect(questions.some((q) => q.id === "traction_mrr_growth")).toBe(false);
    expect(questions.some((q) => q.id === "traction_monetization_timing")).toBe(true);
  });

  it("asks MRR-growth (not the monetization-timing fallback) when revenue metrics exist", () => {
    const revenueTwin = {
      ...wakamaTwin,
      traction: {
        ...wakamaTwin.traction,
        metrics: [{ id: "m1", type: "revenue" as const, label: "Monthly revenue", value: 1000, date: "2026-01-01", verified: true }],
      },
    };
    const questions = selectContextualQuestions(revenueTwin, "general");
    expect(questions.some((q) => q.id === "traction_mrr_growth")).toBe(true);
    expect(questions.some((q) => q.id === "traction_monetization_timing")).toBe(false);
  });

  it("only includes fundraising-specific questions when the objective is fundraising", () => {
    const fundraising = selectContextualQuestions(wakamaTwin, "fundraising");
    const general = selectContextualQuestions(wakamaTwin, "general");
    expect(fundraising.some((q) => q.id === "fundraising_use_of_funds")).toBe(true);
    expect(general.some((q) => q.id === "fundraising_use_of_funds")).toBe(false);
  });

  it("includes marketplace supply/demand question only for marketplace business models", () => {
    const marketplaceTwin = { ...wakamaTwin, businessModel: { ...wakamaTwin.businessModel, types: ["marketplace" as const] } };
    const nonMarketplaceTwin = { ...wakamaTwin, businessModel: { ...wakamaTwin.businessModel, types: ["saas" as const] } };
    expect(selectContextualQuestions(marketplaceTwin, "general").some((q) => q.id === "business_model_marketplace_dynamics")).toBe(true);
    expect(selectContextualQuestions(nonMarketplaceTwin, "general").some((q) => q.id === "business_model_marketplace_dynamics")).toBe(false);
  });
});
