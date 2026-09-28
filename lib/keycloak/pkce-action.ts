/** Browser-side PKCE + Keycloak kc_action helpers (public client platform-web). */

function base64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function createPkcePair(): Promise<{
  verifier: string;
  challenge: string;
}> {
  const random = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64Url(random);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return { verifier, challenge: base64Url(digest) };
}

const PKCE_KEY = "edge.kc_pkce_verifier";

export function storePkceVerifier(verifier: string) {
  sessionStorage.setItem(PKCE_KEY, verifier);
}

export function takePkceVerifier(): string | null {
  const v = sessionStorage.getItem(PKCE_KEY);
  if (v) sessionStorage.removeItem(PKCE_KEY);
  return v;
}

export type KeycloakAction =
  | "CONFIGURE_TOTP"
  | "UPDATE_PASSWORD"
  | "webauthn-register"
  | "webauthn-register-passwordless"
  | "CONFIGURE_RECOVERY_AUTHN_CODES";

export async function buildKeycloakActionUrl(
  action: KeycloakAction,
  redirectUri: string,
): Promise<string> {
  const base = (process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? "").replace(/\/$/, "");
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? "platform";
  const clientId =
    process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? "platform-web";
  if (!base) {
    throw new Error("NEXT_PUBLIC_KEYCLOAK_URL is not configured");
  }
  const { verifier, challenge } = await createPkcePair();
  storePkceVerifier(verifier);
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: "openid",
    redirect_uri: redirectUri,
    code_challenge: challenge,
    code_challenge_method: "S256",
    kc_action: action,
  });
  return `${base}/realms/${realm}/protocol/openid-connect/auth?${params.toString()}`;
}
