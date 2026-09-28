import type { CapabilitiesSnapshot, PlatformContext } from "@/types/platform";

function matchesPermission(granted: string, required: string): boolean {
  if (granted === "*" || granted === required) return true;
  if (granted.endsWith(":*")) {
    const prefix = granted.slice(0, -1); // keep trailing ":"
    return required.startsWith(prefix);
  }
  return false;
}

export function hasPermission(
  permissions: string[] | undefined,
  required: string | string[],
): boolean {
  if (!permissions?.length) return false;
  const needed = Array.isArray(required) ? required : [required];
  return needed.every((req) =>
    permissions.some((g) => matchesPermission(g, req)),
  );
}

export function hasAnyPermission(
  permissions: string[] | undefined,
  required: string[],
): boolean {
  if (!permissions?.length) return false;
  return required.some((req) =>
    permissions.some((g) => matchesPermission(g, req)),
  );
}

export function isModuleEnabled(
  modules: Record<string, boolean> | undefined,
  moduleKey: string,
): boolean {
  return Boolean(modules?.[moduleKey]);
}

/** Platform admin app gate: role contains platform-admin OR any admin* permission. */
export function hasPlatformAdminAccess(
  capabilities: CapabilitiesSnapshot | null | undefined,
  context?: PlatformContext | null,
): boolean {
  const roles = [
    ...(capabilities?.roles ?? []),
    ...(context?.roles ?? []),
  ];
  if (roles.some((r) => r.includes("platform-admin"))) return true;
  const perms = [
    ...(capabilities?.permissions ?? []),
    ...(context?.permissions ?? []),
  ];
  return perms.some((p) => p === "admin" || p.startsWith("admin:") || p.startsWith("admin."));
}
