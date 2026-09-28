"use client";

import { useQuery } from "@tanstack/react-query";
import { ErrorState, PageHeader } from "@/components/shell/page-header";
import { FillPage, FillSection } from "@/components/shell/fill-page";
import { PermissionGate } from "@/components/shell/permission-gate";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { identityApi } from "@/lib/api/identity";
import { formatDateTime } from "@/lib/format/datetime";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";

type AuditRow = Record<string, unknown> & { id: string };

export default function AuditSettingsPage() {
  const client = useApiClient();
  const api = identityApi(client);
  const { context } = usePlatform();
  const idk = qk.identity(context?.organizationId);

  const query = useQuery({
    queryKey: idk.auditLogs(),
    queryFn: async () => api.auditLogs.list({ page: 1, limit: 50 }),
  });

  const rows: AuditRow[] = (query.data?.data ?? []).map((r) => ({
    ...r,
    id: String(r.id),
  }));

  const columns: DataTableColumn<AuditRow>[] = [
    {
      id: "timestamp",
      header: "When",
      cell: (r) => formatDateTime(r.timestamp ?? r.createdAt ?? r.occurredAt),
    },
    {
      id: "action",
      header: "Action",
      cell: (r) => String(r.action ?? "-"),
    },
    {
      id: "resource",
      header: "Resource",
      cell: (r) =>
        `${String(r.resource ?? "")}${r.resourceId ? `:${String(r.resourceId)}` : ""}`,
    },
    {
      id: "actor",
      header: "Actor",
      cell: (r) => String(r.actorId ?? "-"),
    },
    {
      id: "status",
      header: "Status",
      cell: (r) => <Badge>{String(r.status ?? "-")}</Badge>,
    },
    {
      id: "ip",
      header: "IP",
      cell: (r) => String(r.ip ?? "-"),
    },
  ];

  return (
    <FillPage>
      <PageHeader
        className="mb-[var(--space-4)]"
        title="Audit"
        description="Security, configuration and administrative actions for this tenant."
      />
      <PermissionGate permission="audit:read">
        <FillSection>
          {query.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : query.isError ? (
            <ErrorState
              title="Failed to load audit logs"
              description="Retry or check your permissions."
              onRetry={() => void query.refetch()}
            />
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              onRefresh={() => void query.refetch()}
              refreshing={query.isFetching}
              empty={<p>No audit events yet.</p>}
            />
          )}
        </FillSection>
      </PermissionGate>
    </FillPage>
  );
}
