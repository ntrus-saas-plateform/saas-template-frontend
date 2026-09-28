import {
  exchangeCode,
  parseIdTokenClaims,
  refreshAccessToken,
  type TokenResponse,
} from "@/lib/bff/keycloak";
import {
  getSession,
  isAccessTokenExpired,
  type BffSessionData,
} from "@/lib/bff/session";

export async function applyTokenResponse(
  session: Awaited<ReturnType<typeof getSession>>,
  tokens: TokenResponse,
) {
  const claims = parseIdTokenClaims(tokens.id_token);
  session.accessToken = tokens.access_token;
  session.refreshToken = tokens.refresh_token ?? session.refreshToken;
  session.idToken = tokens.id_token ?? session.idToken;
  session.expiresAt = Date.now() + tokens.expires_in * 1000;
  session.user = {
    id: claims.sub,
    username: claims.preferred_username,
    email: claims.email,
    name: claims.name ?? claims.preferred_username,
    picture: claims.picture,
  };
  session.pkceVerifier = undefined;
  session.oauthState = undefined;
  await session.save();
}

export async function ensureFreshAccessToken(): Promise<string | null> {
  const session = await getSession();
  if (!session.accessToken) return null;

  if (!isAccessTokenExpired(session)) {
    return session.accessToken;
  }

  if (!session.refreshToken) {
    session.destroy();
    return null;
  }

  try {
    const tokens = await refreshAccessToken(session.refreshToken);
    await applyTokenResponse(session, tokens);
    return session.accessToken ?? null;
  } catch {
    session.destroy();
    return null;
  }
}

export async function completeLogin(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}) {
  const session = await getSession();
  const tokens = await exchangeCode(params);
  await applyTokenResponse(session, tokens);
}

export function publicSessionView(session: BffSessionData) {
  return {
    authenticated: Boolean(session.accessToken),
    user: session.user ?? null,
  };
}
