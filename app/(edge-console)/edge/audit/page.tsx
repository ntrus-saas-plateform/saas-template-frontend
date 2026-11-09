"use client";

import { useQuery } from "@tanstack/react-query";
import { edgeApi } from "@/lib/api/edge";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

export default function EdgeAuditPage() {
  const { permissions } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const allowed =
    !permissionKnown || hasEdgePermission(permissions, "audit:read");

  const query = useQuery({
    queryKey: ["edge", "audit", "events"],
    enabled: allowed,
    queryFn: async () => {
      const { data } = await edgeApi.listAuditEvents();
      return Array.isArray(data) ? data : [];
    },
  });

  if (!allowed) {
    return <EdgeForbiddenState description="Requires audit:read." />;
  }

  return (
    <div className="space-y-[var(--space-5)]">
      <header className="space-y-[var(--space-1)]">
        <h1 className="type-xl font-semibold text-[var(--text-primary)]">
          Audit
        </h1>
        <p className="type-sm text-[var(--text-secondary)]">
          Security and administration events from the Edge control plane.
        </p>
      </header>

      {query.isLoading ? <EdgeLoadingState /> : null}
      {query.isError ? (
        <EdgeErrorState
          description={
            query.error instanceof Error
              ? query.error.message
              : "Failed to load audit events"
          }
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {query.isSuccess && !query.data.length ? (
        <EdgeEmptyState
          title="No audit events"
          description="Edge audit events will show up as administrators take actions."
        />
      ) : null}
      {query.isSuccess && query.data.length ? (
        <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
          {query.data.map((row, index) => {
            const item = row as Record<string, unknown>;
            const id =
              typeof item.id === "string" ? item.id : `event-${index}`;
            const type =
              typeof item.eventType === "string"
                ? item.eventType
                : typeof item.type === "string"
                  ? item.type
                  : "event";
            return (
              <li
                key={id}
                className="px-[var(--space-4)] py-[var(--space-3)] type-sm"
              >
                <span className="font-medium text-[var(--text-primary)]">
                  {type}
                </span>
                <span className="ml-2 type-xs text-[var(--text-muted)]">
                  {id}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
