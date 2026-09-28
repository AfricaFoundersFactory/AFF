/**
 * Session boundary — TODO(AFF-AUTH): integrate a real auth provider.
 *
 * No production authentication exists yet. This module deliberately does
 * NOT invent an insecure login mechanism (no fake JWTs, no client-trusted
 * cookies). Instead it exposes the interface the rest of the app is written
 * against, backed by a hardcoded demo session so the protected dashboard
 * layout has something real to check.
 *
 * When an auth provider is selected (NextAuth, Clerk, custom), replace only
 * the body of getSession() with a real lookup (cookie/JWT/provider SDK) that
 * resolves to `null` when there is no valid session — every caller already
 * treats `null` as "redirect to sign-in", so no other file needs to change.
 */
import type { PlatformRole } from "@/types/domain";
import { demoUser } from "@/lib/demo";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  roles: PlatformRole[];
};

export type Session = { user: SessionUser } | null;

export async function getSession(): Promise<Session> {
  return { user: demoUser };
}
