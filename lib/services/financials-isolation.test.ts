import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetFinancialsStoreForTests,
  getFinancialProfile,
  setCashPosition,
  upsertPeriod,
} from "./financials";
import { __resetDataRoomStoreForTests, createDocument, getDataRoom } from "./data-room";

describe("financial data is startup-isolated", () => {
  beforeEach(() => {
    __resetFinancialsStoreForTests();
  });

  it("does not let startup A's period mutation leak into startup B's profile", () => {
    upsertPeriod(
      "startup-a",
      {
        month: "2026-01",
        revenue: [{ id: "r1", label: "Sales", amount: { amount: 1000, currency: "XOF" }, recurring: true }],
        expenses: [],
      },
      "2026-01-01T00:00:00.000Z",
    );

    const profileA = getFinancialProfile("startup-a");
    const profileB = getFinancialProfile("startup-b");

    expect(profileA.periods).toHaveLength(1);
    expect(profileB.periods).toHaveLength(0);
  });

  it("does not let startup A's cash position leak into startup B", () => {
    setCashPosition("startup-a", { asOfDate: "2026-01-01T00:00:00.000Z", balance: { amount: 50000, currency: "XOF" } });
    const profileB = getFinancialProfile("startup-b");
    expect(profileB.cashPosition).toBeUndefined();
  });
});

describe("data room documents are startup-isolated", () => {
  beforeEach(() => {
    __resetDataRoomStoreForTests();
  });

  it("does not let startup A's document appear in startup B's data room", () => {
    createDocument("startup-a", { category: "finance", title: "A's forecast", visibility: "private" }, "2026-01-01T00:00:00.000Z");
    const roomA = getDataRoom("startup-a");
    const roomB = getDataRoom("startup-b");

    expect(roomA.documents).toHaveLength(1);
    expect(roomB.documents).toHaveLength(0);
    expect(roomB.documents.find((d) => d.title === "A's forecast")).toBeUndefined();
  });
});
