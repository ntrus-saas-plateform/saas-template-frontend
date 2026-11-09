"use client";

import { useQuery } from "@tanstack/react-query";
import { edgeApi } from "@/lib/api/edge";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { hasAnyEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

export default function EdgeSecurityPage() {
  const { permissions } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const allowed =
    !permissionKnown ||
    hasAnyEdgePermission(permissions, [
      "security:sessions:read",
      "audit:read",
    ]);

  const query = useQuery({
    queryKey: ["edge", "security", "sessions"],
    enabled: allowed,
    queryFn: async () => {
      const { data } = await edgeApi.listSecuritySessions();
      return Array.isArray(data) ? data : [];
    },
  });

  if (!allowed) {
    return (
      <EdgeForbiddenState description="Requires security:sessions:read." />
    );
  }

  return (
    <div className="space-y-[var(--space-5)]">
      <header className="space-y-[var(--space-1)]">
        <h1 className="type-xl font-semibold text-[var(--text-primary)]">
          Security
        </h1>
        <p className="type-sm text-[var(--text-secondary)]">
          Sessions, MFA posture, and break-glass controls for Edge administrators.
        </p>
      </header>

      {query.isLoading ? <EdgeLoadingState /> : null}
      {query.isError ? (
        <EdgeErrorState
          description={
            query.error instanceof Error
              ? query.error.message
              : "Failed to load security sessions"
          }
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {query.isSuccess && !query.data.length ? (
        <EdgeEmptyState
          title="No sessions listed"
          description="Active Edge security sessions will appear here when available."
        />
      ) : null}
      {query.isSuccess && query.data.length ? (
        <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
          {query.data.map((row, index) => {
            const item = row as Record<string, unknown>;
            const id =
              typeof item.id === "string" ? item.id : `session-${index}`;
            return (
              <li
                key={id}
                className="px-[var(--space-4)] py-[var(--space-3)] type-sm text-[var(--text-secondary)]"
              >
                <span className="font-mono text-[var(--text-primary)]">
                  {id}
                </span>
                {typeof item.status === "string" ? ` · ${item.status}` : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
