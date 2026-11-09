import { createHash } from "node:crypto";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type EdgeBffSessionData = {
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
  /** Opaque workspace session token — httpOnly only; never expose to JS. */
  workspaceSessionToken?: string;
  activeVerticalId?: string;
};

export const EDGE_SESSION_COOKIE = "okapi_edge_bff_session";

const DEV_EDGE_SESSION_FALLBACK =
  "okapi_edge_dev_only_password_at_least_32_chars_xx";

function resolveEdgeSessionPassword(): string {
  const dedicated = process.env.SESSION_SECRET_EDGE?.trim();
  if (process.env.NODE_ENV === "production") {
    if (!dedicated || dedicated.length < 32) {
      throw new Error(
        "SESSION_SECRET_EDGE must be set to a string of at least 32 characters in production",
      );
    }
    return dedicated;
  }
  if (dedicated && dedicated.length >= 32) return dedicated;

  const erp = process.env.SESSION_SECRET?.trim();
  if (erp && erp.length >= 32) {
    // Derive a distinct secret so Edge cookies cannot be decrypted with SESSION_SECRET.
    return createHash("sha256").update(`okapi-edge:${erp}`).digest("hex");
  }
  return DEV_EDGE_SESSION_FALLBACK;
}

export const edgeSessionOptions: SessionOptions = {
  password: resolveEdgeSessionPassword(),
  cookieName: EDGE_SESSION_COOKIE,
  chunk: true,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
};

export async function getEdgeSession() {
  return getIronSession<EdgeBffSessionData>(
    await cookies(),
    edgeSessionOptions,
  );
}

export function isEdgeSessionAuthenticated(session: EdgeBffSessionData): boolean {
  return Boolean(session.accessToken);
}

export function isEdgeAccessTokenExpired(
  session: EdgeBffSessionData,
  skewMs = 30_000,
) {
  if (!session.expiresAt) return true;
  return Date.now() >= session.expiresAt - skewMs;
}
