"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { edgeApi } from "@/lib/api/edge";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

export default function EdgeAdministratorsPage() {
  const { permissions } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const allowed =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:administrators:read");

  const query = useQuery({
    queryKey: ["edge", "administrators"],
    enabled: allowed,
    queryFn: async () => {
      const { data } = await edgeApi.listAdministrators();
      return data ?? [];
    },
  });

  if (!allowed) {
    return (
      <EdgeForbiddenState description="Requires platform:administrators:read." />
    );
  }

  return (
    <div className="space-y-[var(--space-5)]">
      <header className="space-y-[var(--space-1)]">
        <h1 className="type-xl font-semibold text-[var(--text-primary)]">
          Administrators
        </h1>
        <p className="type-sm text-[var(--text-secondary)]">
          Edge platform administrators in the edge-admin realm.
        </p>
      </header>

      {query.isLoading ? <EdgeLoadingState /> : null}
      {query.isError ? (
        <EdgeErrorState
          description={
            query.error instanceof Error
              ? query.error.message
              : "Failed to load administrators"
          }
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {query.isSuccess && !query.data.length ? (
        <EdgeEmptyState
          title="No administrators"
          description="Invite an administrator via the Edge API."
        />
      ) : null}
      {query.isSuccess && query.data.length ? (
        <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
          {query.data.map((admin) => (
            <li key={admin.id}>
              <Link
                href={`/edge/administrators/${admin.id}`}
                className="flex items-center justify-between gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] hover:bg-[var(--surface-muted)]"
              >
                <span>
                  <span className="block font-medium text-[var(--text-primary)]">
                    {admin.displayName ?? admin.email ?? admin.id}
                  </span>
                  <span className="type-xs text-[var(--text-muted)]">
                    {[admin.email, admin.status].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="type-xs text-[var(--primary)]">Open</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
