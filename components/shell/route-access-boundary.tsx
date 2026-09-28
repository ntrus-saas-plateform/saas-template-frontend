"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AdminGate } from "@/components/shell/admin-gate";
import { ProtectedRoute } from "@/components/shell/protected-route";
import { Skeleton } from "@/components/ui/skeleton";
import { matchRouteAccess } from "@/lib/access/route-access";
import { usePlatform } from "@/providers/platform-provider";

/**
 * Enforces UI route permissions for deep links after AuthGate.
 * Backend PermissionGuard remains the security boundary.
 */
export function RouteAccessBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const { isLoading } = usePlatform();
  const rule = matchRouteAccess(pathname);

  if (!rule) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="space-y-3 p-6" aria-busy="true" aria-label="Loading">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (rule.platformAdmin) {
    return <AdminGate>{children}</AdminGate>;
  }

  if (rule.permission) {
    return (
      <ProtectedRoute permission={rule.permission}>{children}</ProtectedRoute>
    );
  }

  return <>{children}</>;
}
