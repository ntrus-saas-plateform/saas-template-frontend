/**
 * Auth mode:
 * - `bff`  → HttpOnly iron-session + /api/auth/* + /api/bootstrap + /api/backend/*
 * - `spa`  → Wave 0 keycloak-js PKCE (access token in memory)
 * Default: bff when SESSION_SECRET is conceptually expected; client uses NEXT_PUBLIC_AUTH_MODE.
 */
export function authMode(): "bff" | "spa" {
  const mode = process.env.NEXT_PUBLIC_AUTH_MODE?.trim().toLowerCase();
  if (mode === "spa") return "spa";
  if (mode === "bff") return "bff";
  // Prefer BFF when public flag unset but SPA Keycloak may still work
  return "bff";
}

export function isBffAuthMode() {
  return authMode() === "bff";
}
