"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import { edgeApi } from "@/lib/api/edge";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { fieldControlClass } from "@/components/ui/field-control";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type { EdgeProductLifecycleStatus } from "@/types/edge";

const STATUS_OPTIONS: Array<EdgeProductLifecycleStatus | ""> = [
  "",
  "DRAFT",
  "CONFIGURING",
  "TECHNICAL_VALIDATION",
  "READY_FOR_PUBLICATION",
  "PUBLISHED",
  "DEPRECATED",
  "RETIRED",
  "ARCHIVED",
];

function statusTone(
  status?: string,
): "default" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "PUBLISHED":
      return "success";
    case "READY_FOR_PUBLICATION":
    case "TECHNICAL_VALIDATION":
      return "info";
    case "DEPRECATED":
    case "RETIRED":
      return "warning";
    case "ARCHIVED":
      return "danger";
    default:
      return "default";
  }
}

export default function EdgeCatalogPage() {
  const router = useRouter();
  const { permissions } = useEdgePlatform();
  const permissionKnown = permissions.length > 0;
  const allowed =
    !permissionKnown ||
    hasEdgePermission(permissions, "platform:products:read");
  const canCreate = hasEdgePermission(permissions, "platform:products:create");
  const [status, setStatus] = useState<EdgeProductLifecycleStatus | "">("");

  const query = useQuery({
    queryKey: ["edge", "products", status || "all"],
    enabled: allowed,
    queryFn: async () => {
      const { data } = await edgeApi.listProducts({
        status: status || undefined,
        limit: 100,
      });
      return data ?? [];
    },
  });

  const rows = useMemo(() => query.data ?? [], [query.data]);

  if (!allowed) {
    return (
      <EdgeForbiddenState description="Requires platform:products:read." />
    );
  }

  return (
    <div className="space-y-[var(--space-5)]">
      <header className="flex flex-wrap items-end justify-between gap-[var(--space-3)]">
        <div className="space-y-[var(--space-1)]">
          <h1 className="type-xl font-semibold text-[var(--text-primary)]">
            Product catalog
          </h1>
          <p className="type-sm text-[var(--text-secondary)]">
            Edge products across verticals and lifecycle stages.
          </p>
        </div>
        <EdgePermissionGate permission="platform:products:create">
          <Button asChild>
            <Link href="/edge/catalog/new">New product</Link>
          </Button>
        </EdgePermissionGate>
      </header>

      <div className="flex flex-wrap items-center gap-[var(--space-3)]">
        <label className="space-y-1 type-sm text-[var(--text-secondary)]">
          <span className="block type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Status
          </span>
          <select
            className={`${fieldControlClass} min-w-[14rem]`}
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as EdgeProductLifecycleStatus | "")
            }
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      {query.isLoading ? <EdgeLoadingState /> : null}
      {query.isError ? (
        <EdgeErrorState
          description={
            query.error instanceof Error
              ? query.error.message
              : "Failed to load products"
          }
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {query.isSuccess && !rows.length ? (
        <EdgeEmptyState
          title="No products"
          description="Create a product or adjust the status filter."
          actionLabel={canCreate ? "New product" : undefined}
          onAction={
            canCreate ? () => router.push("/edge/catalog/new") : undefined
          }
        />
      ) : null}
      {query.isSuccess && rows.length ? (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)]">
          <table className="w-full min-w-[40rem] text-left type-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--surface-muted)] type-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              <tr>
                <th className="px-[var(--space-4)] py-[var(--space-3)] font-medium">
                  Name
                </th>
                <th className="px-[var(--space-4)] py-[var(--space-3)] font-medium">
                  Code
                </th>
                <th className="px-[var(--space-4)] py-[var(--space-3)] font-medium">
                  Status
                </th>
                <th className="px-[var(--space-4)] py-[var(--space-3)] font-medium">
                  Vertical
                </th>
                <th className="px-[var(--space-4)] py-[var(--space-3)] font-medium">
                  {" "}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {rows.map((product) => (
                <tr key={product.id} className="hover:bg-[var(--surface-muted)]">
                  <td className="px-[var(--space-4)] py-[var(--space-3)] font-medium text-[var(--text-primary)]">
                    {product.name}
                  </td>
                  <td className="px-[var(--space-4)] py-[var(--space-3)] text-[var(--text-secondary)]">
                    {product.code}
                  </td>
                  <td className="px-[var(--space-4)] py-[var(--space-3)]">
                    <Badge tone={statusTone(product.lifecycleStatus)}>
                      {product.lifecycleStatus}
                    </Badge>
                  </td>
                  <td className="px-[var(--space-4)] py-[var(--space-3)] type-xs text-[var(--text-muted)]">
                    {product.verticalId}
                  </td>
                  <td className="px-[var(--space-4)] py-[var(--space-3)] text-right">
                    <Link
                      href={`/edge/catalog/${product.id}`}
                      className="type-xs font-semibold text-[var(--primary)]"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
