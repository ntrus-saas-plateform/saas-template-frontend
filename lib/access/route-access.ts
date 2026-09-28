/** Path → required permission for shell deep-links (UI gate; backend remains SoT). */

export type RouteAccessRule = {
  /** Path prefix match (startsWith) */
  prefix: string;
  permission?: string | string[];
  /** When true, requires platform-admin / admin* access */
  platformAdmin?: boolean;
};

export const ROUTE_ACCESS_RULES: RouteAccessRule[] = [
  { prefix: "/identity/organizations", permission: "organizations:read" },
  { prefix: "/identity/users", permission: "users:read" },
  { prefix: "/identity/memberships", permission: "memberships:read" },
  { prefix: "/identity/invitations", permission: "users:invite" },
  { prefix: "/identity/roles", permission: "roles:read" },
  { prefix: "/identity/delegations", permission: "delegation:read" },
  { prefix: "/identity/emergency", permission: "emergency_access:read" },
  { prefix: "/settings/general", permission: "tenant:read" },
  { prefix: "/settings/company", permission: "tenant:read" },
  { prefix: "/settings/tenant", permission: "tenant:read" },
  { prefix: "/settings/security", permission: "users:read" },
  { prefix: "/settings/activity", permission: "users:read" },
  { prefix: "/settings/preferences", permission: "users:read" },
  { prefix: "/settings/personalization", permission: "users:read" },
  { prefix: "/settings/memberships", permission: "users:read" },
  { prefix: "/settings/appearance", permission: "users:read" },
  { prefix: "/settings/language", permission: "users:read" },
  { prefix: "/settings/organization", permission: "organizations:read" },
  { prefix: "/settings/authentication", permission: "security:read" },
  { prefix: "/settings/mfa", permission: "security:read" },
  { prefix: "/settings/sso", permission: "security:read" },
  { prefix: "/settings/identity-providers", permission: "security:read" },
  { prefix: "/settings/audit", permission: "audit:read" },
  { prefix: "/settings/", permission: "settings:read" },
  { prefix: "/admin", platformAdmin: true },
  { prefix: "/users/", permission: "users:read" },
];

export function matchRouteAccess(pathname: string): RouteAccessRule | null {
  const path = pathname.split("?")[0] ?? pathname;
  let best: RouteAccessRule | null = null;
  for (const rule of ROUTE_ACCESS_RULES) {
    if (path === rule.prefix || path.startsWith(rule.prefix + "/") || path.startsWith(rule.prefix)) {
      if (!best || rule.prefix.length > best.prefix.length) best = rule;
    }
  }
  if (path === "/settings" || path === "/settings/profile") return null;
  if (path === "/" || path.startsWith("/apps/")) return null;
  return best;
}
