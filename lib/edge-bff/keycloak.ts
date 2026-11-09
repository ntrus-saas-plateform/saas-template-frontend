export function edgeKeycloakConfig() {
  const url = (
    process.env.EDGE_KEYCLOAK_URL ||
    process.env.NEXT_PUBLIC_EDGE_KEYCLOAK_URL ||
    ""
  ).replace(/\/$/, "");
  const realm =
    process.env.EDGE_KEYCLOAK_REALM ||
    process.env.NEXT_PUBLIC_EDGE_KEYCLOAK_REALM ||
    "edge-admin";
  const clientId =
    process.env.EDGE_KEYCLOAK_CLIENT_ID ||
    process.env.NEXT_PUBLIC_EDGE_KEYCLOAK_CLIENT_ID ||
    "edge-admin-web";
  const clientSecret = process.env.EDGE_KEYCLOAK_CLIENT_SECRET?.trim();
  if (!url || !realm || !clientId) {
    throw new Error("Edge Keycloak BFF env incomplete");
  }
  return { url, realm, clientId, clientSecret };
}

export function edgeAppOrigin() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3001"
  );
}

export function edgeApiBase() {
  return (
    process.env.API_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function edgeTokenEndpoint() {
  const { url, realm } = edgeKeycloakConfig();
  return `${url}/realms/${realm}/protocol/openid-connect/token`;
}

export function edgeAuthEndpoint() {
  const { url, realm } = edgeKeycloakConfig();
  return `${url}/realms/${realm}/protocol/openid-connect/auth`;
}

export function edgeLogoutEndpoint() {
  const { url, realm } = edgeKeycloakConfig();
  return `${url}/realms/${realm}/protocol/openid-connect/logout`;
}

export function edgeRandomString(bytes = 32) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Buffer.from(arr).toString("base64url");
}

export async function edgePkceChallenge(verifier: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return Buffer.from(digest).toString("base64url");
}

export type EdgeTokenResponse = {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
};

export async function edgeExchangeCode(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<EdgeTokenResponse> {
  const { clientId, clientSecret } = edgeKeycloakConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    code: params.code,
    redirect_uri: params.redirectUri,
    code_verifier: params.codeVerifier,
  });
  if (clientSecret) body.set("client_secret", clientSecret);

  const res = await fetch(edgeTokenEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Edge token exchange failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<EdgeTokenResponse>;
}

export async function edgeRefreshAccessToken(
  refreshToken: string,
): Promise<EdgeTokenResponse> {
  const { clientId, clientSecret } = edgeKeycloakConfig();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refreshToken,
  });
  if (clientSecret) body.set("client_secret", clientSecret);

  const res = await fetch(edgeTokenEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Edge refresh failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<EdgeTokenResponse>;
}

export function parseEdgeIdTokenClaims(idToken?: string) {
  if (!idToken) return {};
  const payload = idToken.split(".")[1];
  if (!payload) return {};
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sub?: string;
      preferred_username?: string;
      email?: string;
      name?: string;
      picture?: string;
    };
  } catch {
    return {};
  }
}

export async function edgePlatformFetch(
  path: string,
  accessToken: string,
  init?: RequestInit & { workspaceSessionToken?: string },
) {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("X-Correlation-Id", crypto.randomUUID());
  const workspaceToken =
    init?.workspaceSessionToken ??
    (headers.get("x-edge-workspace-session") || undefined);
  if (workspaceToken) {
    headers.set("x-edge-workspace-session", workspaceToken);
    // Alias some clients expect; backend reads the session header above.
    headers.set("x-edge-workspace-token", workspaceToken);
  }
  const rest = { ...(init ?? {}) } as RequestInit & {
    workspaceSessionToken?: string;
  };
  delete rest.workspaceSessionToken;
  return fetch(`${edgeApiBase()}${path}`, { ...rest, headers });
}

export function isEdgeBffConfigured(): boolean {
  try {
    edgeKeycloakConfig();
    return Boolean(
      process.env.SESSION_SECRET_EDGE ||
        process.env.SESSION_SECRET ||
        process.env.NODE_ENV !== "production",
    );
  } catch {
    return false;
  }
}
