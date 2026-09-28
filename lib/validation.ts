/**
 * Lightweight, dependency-free validation helpers.
 *
 * No validation library exists in this project yet (see package.json) and
 * Digital Twin forms don't need one — these small typed predicates are used
 * both client-side (to enable/disable submit) and inside Server Actions (the
 * actual trust boundary), matching the pattern already established by
 * lib/actions/contact.ts.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidUrl(value: string): boolean {
  if (!value.trim()) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isValidPercentage(value: unknown): value is number {
  return isValidNumber(value) && value >= 0 && value <= 100;
}

export function isValidDate(value: string): boolean {
  if (!value.trim()) return false;
  const time = Date.parse(value);
  return Number.isFinite(time);
}

export function isValidCurrencyAmount(value: unknown): value is number {
  return isValidNumber(value) && value >= 0;
}

export function isNonEmpty(value: string | undefined | null): boolean {
  return Boolean(value && value.trim().length > 0);
}

export function toStringList(raw: string): string[] {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
