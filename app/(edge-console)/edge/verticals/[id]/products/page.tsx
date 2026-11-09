"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { edgeApi } from "@/lib/api/edge";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

export default function EdgeVerticalProductsPage() {
  const params = useParams<{ id: string }>();
  const verticalId = params.id;
  const { permissions } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const allowed =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:products:read");

  const verticalQuery = useQuery({
    queryKey: ["edge", "verticals", verticalId],
    enabled: Boolean(verticalId),
    queryFn: async () => {
      const { data } = await edgeApi.getVertical(verticalId);
      return data;
    },
  });

  const productsQuery = useQuery({
    queryKey: ["edge", "products", "vertical", verticalId],
    enabled: allowed && Boolean(verticalId),
    queryFn: async () => {
      const { data } = await edgeApi.listProducts({
        verticalId,
        limit: 100,
      });
      return data ?? [];
    },
  });

  if (!allowed) {
    return (
      <EdgeForbiddenState description="Requires platform:products:read." />
    );
  }

  const title =
    verticalQuery.data?.name ??
    verticalQuery.data?.code ??
    "Vertical products";

  return (
    <div className="space-y-[var(--space-5)]">
      <BackLink href={`/edge/verticals/${verticalId}`} />
      <header className="flex flex-wrap items-end justify-between gap-[var(--space-3)]">
        <div className="space-y-[var(--space-1)]">
          <h1 className="type-xl font-semibold text-[var(--text-primary)]">
            {title}
          </h1>
          <p className="type-sm text-[var(--text-secondary)]">
            Products filtered to this vertical.
          </p>
        </div>
        <EdgePermissionGate permission="platform:products:create">
          <Button asChild>
            <Link href="/edge/catalog/new">New product</Link>
          </Button>
        </EdgePermissionGate>
      </header>

      {productsQuery.isLoading ? <EdgeLoadingState /> : null}
      {productsQuery.isError ? (
        <EdgeErrorState
          description={
            productsQuery.error instanceof Error
              ? productsQuery.error.message
              : "Failed to load products"
          }
          onRetry={() => void productsQuery.refetch()}
        />
      ) : null}
      {productsQuery.isSuccess && !productsQuery.data.length ? (
        <EdgeEmptyState
          title="No products in this vertical"
          description="Create a product and assign it to this vertical."
        />
      ) : null}
      {productsQuery.isSuccess && productsQuery.data.length ? (
        <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
          {productsQuery.data.map((product) => (
            <li key={product.id}>
              <Link
                href={`/edge/catalog/${product.id}`}
                className="flex items-center justify-between gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] hover:bg-[var(--surface-muted)]"
              >
                <span>
                  <span className="block font-medium text-[var(--text-primary)]">
                    {product.name}
                  </span>
                  <span className="type-xs text-[var(--text-muted)]">
                    {product.code}
                  </span>
                </span>
                <Badge>{product.lifecycleStatus}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
