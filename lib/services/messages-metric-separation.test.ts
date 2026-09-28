import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getLatestAssessment } from "./readiness";
import { getCurrentRoadmap } from "./roadmap";
import { getPitchReadiness, getActiveVersion } from "./pitch";
import { getFinancialProfile } from "./financials";
import { getDataRoom } from "./data-room";
import {
  __resetMessagesStoreForTests,
  getOrCreateConversationForSupportRequest,
  sendMessage,
  markConversationRead,
} from "./messages";
import { __resetSupportRequestsStoreForTests, createSupportRequest } from "./support-requests";
import { __resetExpertsStoreForTests, createExpertProfile } from "./experts";

// AFF-DASH-08 Part A: the Founder Inbox is a structured message log only.
// It must never mutate AFF Readiness, Pitch Readiness, Roadmap Progress,
// Financial signals, or Data Room Completion — mirroring
// lib/services/expert-metric-separation.test.ts's pattern exactly.
describe("Founder Inbox never mutates other metric modules", () => {
  it("static check: no messages source file imports a readiness/pitch/roadmap-mutating function", () => {
    const mutatingFns = [
      "createAssessment",
      "reassess",
      "saveAssessmentAnswers",
      "completeAssessment",
      "updateSection",
      "finalizeVersion",
      "upsertPeriod",
      "setCashPosition",
      "createDocument",
    ];
    const filesToCheck = ["lib/services/messages.ts", "lib/messages/inbox.ts", "lib/actions/messages.ts"];
    for (const relPath of filesToCheck) {
      const source = readFileSync(join(process.cwd(), relPath), "utf8");
      for (const fnName of mutatingFns) {
        expect(source.includes(fnName), `${relPath} must not reference mutating function ${fnName}`).toBe(false);
      }
    }
  });

  it("behavioral: sending/reading messages leaves readiness, pitch, roadmap, financials and data room byte-identical", () => {
    __resetMessagesStoreForTests();
    __resetSupportRequestsStoreForTests();
    __resetExpertsStoreForTests();

    const expert = createExpertProfile(
      {
        displayName: "Demo Expert",
        headline: "h",
        bio: "b",
        country: "Kenya",
        languages: ["en"],
        expertise: ["FUNDRAISING"],
        industries: [],
        startupStages: ["mvp"],
        markets: ["Kenya"],
        availability: "AVAILABLE",
        mentoringFormats: ["VIDEO_CALL"],
        profileStatus: "ACTIVE",
      },
      "2026-01-01T00:00:00.000Z",
    );
    const request = createSupportRequest(
      "startup-wakama",
      { founderId: "f", expertId: expert.id, topic: "t", message: "m", preferredFormat: "CHAT", preferredLanguage: "en" },
      "2026-01-01T00:00:00.000Z",
    );

    const before = {
      readiness: JSON.stringify(getLatestAssessment("startup-wakama")),
      roadmap: JSON.stringify(getCurrentRoadmap("startup-wakama")),
      pitch: JSON.stringify(getActiveVersion("startup-wakama")),
      financials: JSON.stringify(getFinancialProfile("startup-wakama")),
      dataRoom: JSON.stringify(getDataRoom("startup-wakama")),
    };

    const conversation = getOrCreateConversationForSupportRequest("startup-wakama", request.id, "2026-01-01T00:00:00.000Z");
    sendMessage("startup-wakama", conversation.id, { senderId: "f", senderRole: "FOUNDER", body: "hello" }, "2026-01-02T00:00:00.000Z");
    markConversationRead("startup-wakama", conversation.id, "2026-01-03T00:00:00.000Z");

    const activeVersion = getActiveVersion("startup-wakama");
    const after = {
      readiness: JSON.stringify(getLatestAssessment("startup-wakama")),
      roadmap: JSON.stringify(getCurrentRoadmap("startup-wakama")),
      pitch: JSON.stringify(activeVersion),
      financials: JSON.stringify(getFinancialProfile("startup-wakama")),
      dataRoom: JSON.stringify(getDataRoom("startup-wakama")),
    };

    expect(after).toEqual(before);
    if (activeVersion) {
      expect(getPitchReadiness("startup-wakama", activeVersion.id, "2026-01-03T00:00:00.000Z")).toBeDefined();
    }
  });
});
