"use client";

import { useQuery } from "@tanstack/react-query";
import { edgeApi } from "@/lib/api/edge";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

export default function EdgeWorkspaceAdministrationPage() {
  const { activeVerticalId, activeWorkspace, workspaces } = useEdgePlatform();
  const verticalId =
    activeVerticalId ??
    activeWorkspace?.vertical?.id ??
    activeWorkspace?.session?.verticalId ??
    workspaces[0]?.vertical.id;

  const query = useQuery({
    queryKey: ["edge", "workspace", "memberships", verticalId],
    enabled: Boolean(verticalId),
    queryFn: async () => {
      const { data } = await edgeApi.listVerticalMemberships(verticalId!);
      return Array.isArray(data) ? data : [];
    },
  });

  if (!verticalId) {
    return (
      <EdgeEmptyState
        title="Select a workspace"
        description="Switch into a workspace to manage memberships."
      />
    );
  }

  return (
    <div className="space-y-[var(--space-5)]">
      <header className="space-y-[var(--space-1)]">
        <h1 className="type-xl font-semibold text-[var(--text-primary)]">
          Workspace administration
        </h1>
        <p className="type-sm text-[var(--text-secondary)]">
          Memberships and operators for the active vertical.
        </p>
      </header>

      {query.isLoading ? <EdgeLoadingState /> : null}
      {query.isError ? (
        <EdgeErrorState
          description={
            query.error instanceof Error
              ? query.error.message
              : "Failed to load memberships"
          }
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {query.isSuccess && !query.data.length ? (
        <EdgeEmptyState
          title="No memberships"
          description="Invite administrators to this vertical from the Edge API."
        />
      ) : null}
      {query.isSuccess && query.data.length ? (
        <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
          {query.data.map((row, index) => {
            const item = row as Record<string, unknown>;
            const id =
              typeof item.id === "string" ? item.id : `membership-${index}`;
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
