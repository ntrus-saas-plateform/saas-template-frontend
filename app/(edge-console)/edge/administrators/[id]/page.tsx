"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { edgeApi } from "@/lib/api/edge";
import {
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { BackLink } from "@/components/ui/back-link";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

export default function EdgeAdministratorDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { permissions } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const allowed =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:administrators:read");

  const query = useQuery({
    queryKey: ["edge", "administrators", id],
    enabled: allowed && Boolean(id),
    queryFn: async () => {
      const { data } = await edgeApi.getAdministrator(id);
      return data;
    },
  });

  if (!allowed) {
    return (
      <EdgeForbiddenState description="Requires platform:administrators:read." />
    );
  }

  return (
    <div className="space-y-[var(--space-5)]">
      <BackLink href="/edge/administrators" />
      {query.isLoading ? <EdgeLoadingState /> : null}
      {query.isError ? (
        <EdgeErrorState
          description={
            query.error instanceof Error
              ? query.error.message
              : "Failed to load administrator"
          }
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {query.data ? (
        <header className="space-y-[var(--space-1)]">
          <h1 className="type-xl font-semibold text-[var(--text-primary)]">
            {query.data.displayName ?? query.data.email ?? query.data.id}
          </h1>
          <p className="type-sm text-[var(--text-secondary)]">
            {[query.data.email, query.data.status].filter(Boolean).join(" · ")}
          </p>
          <dl className="mt-[var(--space-4)] grid gap-[var(--space-3)] sm:grid-cols-2">
            <div>
              <dt className="type-xs text-[var(--text-muted)]">ID</dt>
              <dd className="type-sm font-mono text-[var(--text-primary)]">
                {query.data.id}
              </dd>
            </div>
            {query.data.externalIdentityId ? (
              <div>
                <dt className="type-xs text-[var(--text-muted)]">
                  External identity
                </dt>
                <dd className="type-sm font-mono text-[var(--text-primary)]">
                  {query.data.externalIdentityId}
                </dd>
              </div>
            ) : null}
          </dl>
        </header>
      ) : null}
    </div>
  );
}
