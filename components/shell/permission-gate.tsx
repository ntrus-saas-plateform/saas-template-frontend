"use client";

import type { ReactNode } from "react";
import { hasPermission } from "@/lib/access/permissions";
import { usePlatform } from "@/providers/platform-provider";

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { capabilities, context } = usePlatform();
  const perms = capabilities?.permissions ?? context?.permissions ?? [];
  if (!hasPermission(perms, permission)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
