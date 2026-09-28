import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type BffSessionData = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  idToken?: string;
  user?: {
    id?: string;
    username?: string;
    email?: string;
    name?: string;
    picture?: string;
  };
  pkceVerifier?: string;
  oauthState?: string;
};

const DEV_SESSION_FALLBACK =
  "complex_password_at_least_32_characters_long_dev_only";

function resolveSessionPassword(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (process.env.NODE_ENV === "production") {
    if (!secret || secret.length < 32) {
      throw new Error(
        "SESSION_SECRET must be set to a string of at least 32 characters in production",
      );
    }
    return secret;
  }
  if (secret && secret.length >= 32) return secret;
  return DEV_SESSION_FALLBACK;
}

export const sessionOptions: SessionOptions = {
  password: resolveSessionPassword(),
  cookieName: "edge_bff_session",
  // Access + refresh + id tokens exceed ~4KB; split across cookies.
  chunk: true,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
};

export async function getSession() {
  return getIronSession<BffSessionData>(await cookies(), sessionOptions);
}

export function isSessionAuthenticated(session: BffSessionData): boolean {
  return Boolean(session.accessToken);
}

export function isAccessTokenExpired(session: BffSessionData, skewMs = 30_000) {
  if (!session.expiresAt) return true;
  return Date.now() >= session.expiresAt - skewMs;
}
