"use client";

import type { ReactNode } from "react";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

/** UI-only hide — backend remains source of truth. */
export function EdgePermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { permissions } = useEdgePlatform();
  if (!hasEdgePermission(permissions, permission)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
