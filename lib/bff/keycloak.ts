function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export function keycloakConfig() {
  const url = (
    process.env.KEYCLOAK_URL ||
    process.env.NEXT_PUBLIC_KEYCLOAK_URL ||
    ""
  ).replace(/\/$/, "");
  const realm =
    process.env.KEYCLOAK_REALM || process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "";
  const clientId =
    process.env.KEYCLOAK_CLIENT_ID ||
    process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ||
    "";
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET?.trim();
  if (!url || !realm || !clientId) {
    throw new Error("Keycloak BFF env incomplete");
  }
  return { url, realm, clientId, clientSecret };
}

export function appOrigin() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3001"
  );
}

export function apiBase() {
  return (
    process.env.API_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function tokenEndpoint() {
  const { url, realm } = keycloakConfig();
  return `${url}/realms/${realm}/protocol/openid-connect/token`;
}

export function authEndpoint() {
  const { url, realm } = keycloakConfig();
  return `${url}/realms/${realm}/protocol/openid-connect/auth`;
}

export function logoutEndpoint() {
  const { url, realm } = keycloakConfig();
  return `${url}/realms/${realm}/protocol/openid-connect/logout`;
}

export function randomString(bytes = 32) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Buffer.from(arr).toString("base64url");
}

export async function pkceChallenge(verifier: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return Buffer.from(digest).toString("base64url");
}

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
};

export async function exchangeCode(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<TokenResponse> {
  const { clientId, clientSecret } = keycloakConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    code: params.code,
    redirect_uri: params.redirectUri,
    code_verifier: params.codeVerifier,
  });
  if (clientSecret) body.set("client_secret", clientSecret);

  const res = await fetch(tokenEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<TokenResponse>;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenResponse> {
  const { clientId, clientSecret } = keycloakConfig();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refreshToken,
  });
  if (clientSecret) body.set("client_secret", clientSecret);

  const res = await fetch(tokenEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Refresh failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<TokenResponse>;
}

export function parseIdTokenClaims(idToken?: string) {
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

export async function platformFetch(
  path: string,
  accessToken: string,
  init?: RequestInit,
) {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("X-Correlation-Id", crypto.randomUUID());
  return fetch(`${apiBase()}${path}`, { ...init, headers });
}

export function isBffConfigured(): boolean {
  try {
    keycloakConfig();
    return Boolean(process.env.SESSION_SECRET || process.env.NODE_ENV !== "production");
  } catch {
    return false;
  }
}

export function requireEnvPublic(name: string) {
  return requireEnv(name);
}
