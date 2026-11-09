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

export default function EdgeVerticalsPage() {
  const { permissions } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const allowed =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:verticals:read");

  const query = useQuery({
    queryKey: ["edge", "verticals"],
    enabled: allowed,
    queryFn: async () => {
      const { data } = await edgeApi.listVerticals("page=1&limit=50");
      return data ?? [];
    },
  });

  if (!allowed) {
    return (
      <EdgeForbiddenState description="Requires platform:verticals:read." />
    );
  }

  return (
    <div className="space-y-[var(--space-5)]">
      <header className="space-y-[var(--space-1)]">
        <h1 className="type-xl font-semibold text-[var(--text-primary)]">
          Verticals
        </h1>
        <p className="type-sm text-[var(--text-secondary)]">
          Industry workspaces administered in the Edge control plane.
        </p>
      </header>

      {query.isLoading ? <EdgeLoadingState /> : null}
      {query.isError ? (
        <EdgeErrorState
          description={
            query.error instanceof Error
              ? query.error.message
              : "Failed to load verticals"
          }
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {query.isSuccess && !query.data.length ? (
        <EdgeEmptyState
          title="No verticals"
          description="Create or activate a vertical in the Edge API to see it here."
        />
      ) : null}
      {query.isSuccess && query.data.length ? (
        <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
          {query.data.map((v) => (
            <li key={v.id}>
              <Link
                href={`/edge/verticals/${v.id}`}
                className="flex items-center justify-between gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] hover:bg-[var(--surface-muted)]"
              >
                <span>
                  <span className="block font-medium text-[var(--text-primary)]">
                    {v.name ?? v.code ?? v.id}
                  </span>
                  <span className="type-xs text-[var(--text-muted)]">
                    {[v.code, v.status].filter(Boolean).join(" · ")}
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
