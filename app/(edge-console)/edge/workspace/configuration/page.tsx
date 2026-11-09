"use client";

import { useQuery } from "@tanstack/react-query";
import { edgeApi } from "@/lib/api/edge";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

export default function EdgeWorkspaceConfigurationPage() {
  const { activeVerticalId, activeWorkspace, workspaces } = useEdgePlatform();
  const verticalId =
    activeVerticalId ??
    activeWorkspace?.vertical?.id ??
    activeWorkspace?.session?.verticalId ??
    workspaces[0]?.vertical.id;

  const query = useQuery({
    queryKey: ["edge", "workspace", "configuration", verticalId],
    enabled: Boolean(verticalId),
    queryFn: async () => {
      const { data } = await edgeApi.getWorkspaceConfiguration(verticalId!);
      return data;
    },
  });

  if (!verticalId) {
    return (
      <EdgeEmptyState
        title="Select a workspace"
        description="Switch into a workspace before editing configuration."
      />
    );
  }

  return (
    <div className="space-y-[var(--space-5)]">
      <header className="space-y-[var(--space-1)]">
        <h1 className="type-xl font-semibold text-[var(--text-primary)]">
          Workspace configuration
        </h1>
        <p className="type-sm text-[var(--text-secondary)]">
          Draft and activated configuration for the active vertical.
        </p>
      </header>

      {query.isLoading ? <EdgeLoadingState /> : null}
      {query.isError ? (
        <EdgeErrorState
          description={
            query.error instanceof Error
              ? query.error.message
              : "Failed to load configuration"
          }
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {query.isSuccess ? (
        <pre className="overflow-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] p-[var(--space-4)] type-xs text-[var(--text-secondary)]">
          {JSON.stringify(query.data, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
