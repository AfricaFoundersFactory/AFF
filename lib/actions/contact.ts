"use server";

/**
 * Server-side boundary for the About page contact form.
 *
 * No email provider is wired up yet. This action validates the payload,
 * then checks whether delivery is actually configured via environment
 * variables (see .env.example). If it isn't, it returns an honest
 * "not_configured" result rather than pretending the message was sent.
 *
 * To connect a real mailbox in Phase 2: implement the `send` branch below
 * using whichever provider CONTACT_EMAIL_PROVIDER names (e.g. Resend,
 * Postmark, SMTP via nodemailer) and the provider's own credentials.
 * Nothing above this file needs to change — the form and its validation
 * are already wired to this single function.
 */

export type ContactFormPayload = {
  name: string;
  email: string;
  organization: string;
  subject: string;
  message: string;
  consent: boolean;
};

export type ContactResult =
  | { ok: true }
  | { ok: false; error: "validation" | "not_configured" | "send_failed" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(payload: ContactFormPayload): boolean {
  return Boolean(
    payload.name.trim() &&
      payload.email.trim() &&
      EMAIL_RE.test(payload.email.trim()) &&
      payload.subject.trim() &&
      payload.message.trim() &&
      payload.consent,
  );
}

function isDeliveryConfigured(): boolean {
  return Boolean(process.env.CONTACT_EMAIL_PROVIDER && process.env.CONTACT_TO_EMAIL);
}

export async function submitContactForm(
  payload: ContactFormPayload,
): Promise<ContactResult> {
  if (!validate(payload)) {
    return { ok: false, error: "validation" };
  }

  if (!isDeliveryConfigured()) {
    return { ok: false, error: "not_configured" };
  }

  // Phase 2: dispatch through the configured provider here using
  // process.env.CONTACT_EMAIL_PROVIDER / CONTACT_TO_EMAIL and that
  // provider's own credentials (never read secrets in client code).
  // No provider is implemented yet, so this path is unreachable until
  // real credentials are set.
  return { ok: false, error: "send_failed" };
}
