"use client";

import type { ReactNode } from "react";
import { EmptyState } from "@/components/shell/page-header";
import { hasPlatformAdminAccess } from "@/lib/access/permissions";
import { usePlatform } from "@/providers/platform-provider";

export function AdminGate({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { capabilities, context } = usePlatform();
  if (!hasPlatformAdminAccess(capabilities, context)) {
    return (
      <>
        {fallback ?? (
          <EmptyState
            title="Access restricted"
            description="Platform admin role or admin permissions are required."
          />
        )}
      </>
    );
  }
  return <>{children}</>;
}
