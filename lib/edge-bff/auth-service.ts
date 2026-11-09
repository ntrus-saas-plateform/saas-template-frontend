import {
  edgeExchangeCode,
  edgeRefreshAccessToken,
  parseEdgeIdTokenClaims,
  type EdgeTokenResponse,
} from "@/lib/edge-bff/keycloak";
import {
  getEdgeSession,
  isEdgeAccessTokenExpired,
  type EdgeBffSessionData,
} from "@/lib/edge-bff/session";

export async function applyEdgeTokenResponse(
  session: Awaited<ReturnType<typeof getEdgeSession>>,
  tokens: EdgeTokenResponse,
) {
  const claims = parseEdgeIdTokenClaims(tokens.id_token);
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

export async function ensureFreshEdgeAccessToken(): Promise<string | null> {
  const session = await getEdgeSession();
  if (!session.accessToken) return null;

  if (!isEdgeAccessTokenExpired(session)) {
    return session.accessToken;
  }

  if (!session.refreshToken) {
    session.destroy();
    return null;
  }

  try {
    const tokens = await edgeRefreshAccessToken(session.refreshToken);
    await applyEdgeTokenResponse(session, tokens);
    return session.accessToken ?? null;
  } catch {
    session.destroy();
    return null;
  }
}

export async function completeEdgeLogin(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}) {
  const session = await getEdgeSession();
  const tokens = await edgeExchangeCode(params);
  await applyEdgeTokenResponse(session, tokens);
}

export function publicEdgeSessionView(session: EdgeBffSessionData) {
  return {
    authenticated: Boolean(session.accessToken),
    user: session.user ?? null,
    hasWorkspaceSession: Boolean(session.workspaceSessionToken),
    activeVerticalId: session.activeVerticalId ?? null,
  };
}
