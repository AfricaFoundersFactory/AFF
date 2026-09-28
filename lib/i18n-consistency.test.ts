import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function flattenKeys(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [prefix];
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    keys.push(...flattenKeys(value, prefix ? `${prefix}.${key}` : key));
  }
  return keys;
}

describe("messages/en.json and messages/fr.json stay in lockstep", () => {
  it("every key in en.json exists in fr.json and vice versa", () => {
    const en = JSON.parse(readFileSync(join(process.cwd(), "messages/en.json"), "utf8"));
    const fr = JSON.parse(readFileSync(join(process.cwd(), "messages/fr.json"), "utf8"));

    const enKeys = new Set(flattenKeys(en));
    const frKeys = new Set(flattenKeys(fr));

    const missingInFr = [...enKeys].filter((k) => !frKeys.has(k));
    const missingInEn = [...frKeys].filter((k) => !enKeys.has(k));

    expect(missingInFr, `keys present in en.json but missing in fr.json: ${missingInFr.join(", ")}`).toEqual([]);
    expect(missingInEn, `keys present in fr.json but missing in en.json: ${missingInEn.join(", ")}`).toEqual([]);
  });
});
