export type AuthUser = {
  id?: string;
  username?: string;
  email?: string;
  name?: string;
  picture?: string;
};

export type AuthSession = {
  /** Ready when Keycloak env is present and init finished */
  status: "loading" | "unconfigured" | "anonymous" | "authenticated";
  user: AuthUser | null;
  getAccessToken: () => Promise<string | undefined>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
};

export type KeycloakPublicConfig = {
  url: string;
  realm: string;
  clientId: string;
};

export function readKeycloakConfig(): KeycloakPublicConfig | null {
  const url = process.env.NEXT_PUBLIC_KEYCLOAK_URL?.trim();
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM?.trim();
  const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID?.trim();
  if (!url || !realm || !clientId) return null;
  return { url, realm, clientId };
}
