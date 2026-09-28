"use client";

import type { ReactNode } from "react";
import { hasPermission } from "@/lib/access/permissions";
import { NoAccessPage } from "@/components/shell/no-access";
import { usePlatform } from "@/providers/platform-provider";

/** Redirect-style gate: shows NoAccess with capability reason when permission missing. */
export function ProtectedRoute({
  permission,
  children,
  reason,
}: {
  permission: string | string[];
  children: ReactNode;
  reason?: string;
}) {
  const { capabilities, context, isLoading } = usePlatform();
  if (isLoading) return null;

  const perms = capabilities?.permissions ?? context?.permissions ?? [];
  if (!hasPermission(perms, permission)) {
    const needed = Array.isArray(permission) ? permission.join(" or ") : permission;
    return (
      <NoAccessPage
        title="Access restricted"
        description={
          reason ??
          `This screen requires ${needed}. Ask an administrator to grant the capability for your current organization.`
        }
      />
    );
  }

  return <>{children}</>;
}

export function RequirePermission({
  permission,
  children,
  fallback,
}: {
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { capabilities, context } = usePlatform();
  const perms = capabilities?.permissions ?? context?.permissions ?? [];
  if (!hasPermission(perms, permission)) {
    return <>{fallback ?? null}</>;
  }
  return <>{children}</>;
}
