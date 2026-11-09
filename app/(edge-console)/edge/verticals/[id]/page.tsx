"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { edgeApi } from "@/lib/api/edge";
import {
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { BackLink } from "@/components/ui/back-link";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

export default function EdgeVerticalDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { permissions, switchWorkspace } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const allowed =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:verticals:read");

  const query = useQuery({
    queryKey: ["edge", "verticals", id],
    enabled: allowed && Boolean(id),
    queryFn: async () => {
      const { data } = await edgeApi.getVertical(id);
      return data;
    },
  });

  if (!allowed) {
    return (
      <EdgeForbiddenState description="Requires platform:verticals:read." />
    );
  }

  return (
    <div className="space-y-[var(--space-5)]">
      <BackLink href="/edge/verticals" />
      {query.isLoading ? <EdgeLoadingState /> : null}
      {query.isError ? (
        <EdgeErrorState
          description={
            query.error instanceof Error
              ? query.error.message
              : "Failed to load vertical"
          }
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {query.data ? (
        <>
          <header className="space-y-[var(--space-1)]">
            <h1 className="type-xl font-semibold text-[var(--text-primary)]">
              {query.data.name ?? query.data.code ?? query.data.id}
            </h1>
            <p className="type-sm text-[var(--text-secondary)]">
              {[query.data.code, query.data.status].filter(Boolean).join(" · ")}
            </p>
          </header>
          <div className="flex flex-wrap gap-[var(--space-2)]">
            <button
              type="button"
              className="rounded-[var(--radius-sm)] bg-[var(--primary)] px-[var(--space-4)] py-2 type-sm font-semibold text-[var(--on-primary)]"
              onClick={() => void switchWorkspace(query.data.id)}
            >
              Switch to this workspace
            </button>
            <Link
              href="/edge/workspace/configuration"
              className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-[var(--space-4)] py-2 type-sm font-semibold text-[var(--text-primary)]"
            >
              Configuration
            </Link>
            <Link
              href={`/edge/verticals/${query.data.id}/products`}
              className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-[var(--space-4)] py-2 type-sm font-semibold text-[var(--text-primary)]"
            >
              Products
            </Link>
          </div>
          {query.data.description ? (
            <p className="type-sm text-[var(--text-secondary)]">
              {query.data.description}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
