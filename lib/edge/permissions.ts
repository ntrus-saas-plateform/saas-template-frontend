function matchesPermission(granted: string, required: string): boolean {
  if (granted === "*" || granted === required) return true;
  if (granted.endsWith(":*")) {
    const prefix = granted.slice(0, -1);
    return required.startsWith(prefix);
  }
  return false;
}

/** UI-only Edge permission check — backend remains source of truth. */
export function hasEdgePermission(
  permissions: string[] | undefined,
  required: string | string[],
): boolean {
  if (!permissions?.length) return false;
  const needed = Array.isArray(required) ? required : [required];
  return needed.every((req) =>
    permissions.some((g) => matchesPermission(g, req)),
  );
}

export function hasAnyEdgePermission(
  permissions: string[] | undefined,
  required: string[],
): boolean {
  if (!permissions?.length) return false;
  return required.some((req) =>
    permissions.some((g) => matchesPermission(g, req)),
  );
}
