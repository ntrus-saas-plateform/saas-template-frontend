"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/shell/page-header";
import { FillPage, FillSection } from "@/components/shell/fill-page";
import { AdminGate } from "@/components/shell/admin-gate";
import { PermissionGate } from "@/components/shell/permission-gate";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adminApi,
  type ReconciliationReportRecord,
} from "@/lib/api/admin";
import { formatDateTime } from "@/lib/format/datetime";
import { qk } from "@/lib/query/keys";
import { useApiClient } from "@/providers/platform-provider";

function ReconciliationPanel() {
  const client = useApiClient();
  const api = adminApi(client);
  const qc = useQueryClient();
  const [repair, setRepair] = useState(false);
  const [lastRun, setLastRun] = useState<Record<string, unknown> | null>(null);

  const lastQuery = useQuery({
    queryKey: [...qk.admin.reconciliation(), "last"],
    queryFn: async () => api.reconciliation.report(),
  });

  const historyQuery = useQuery({
    queryKey: [...qk.admin.reconciliation(), "history"],
    queryFn: async () => api.reconciliation.reports(1, 20),
  });

  const run = useMutation({
    mutationFn: () => api.reconciliation.run(repair),
    onSuccess: async (res) => {
      setLastRun(res.data as Record<string, unknown>);
      await qc.invalidateQueries({ queryKey: qk.admin.reconciliation() });
    },
  });

  const columns = useMemo<DataTableColumn<ReconciliationReportRecord>[]>(
    () => [
      {
        id: "id",
        header: "Report",
        cell: (row) => (
          <span className="font-mono text-xs">{row.id}</span>
        ),
      },
      {
        id: "when",
        header: "Created",
        cell: (row) => formatDateTime(row.createdAt),
      },
      {
        id: "drifts",
        header: "Drifts",
        numeric: true,
        cell: (row) => row.driftCount ?? "—",
      },
      {
        id: "repaired",
        header: "Repaired",
        cell: (row) => (
          <Badge tone={row.repaired ? "success" : "default"}>
            {String(Boolean(row.repaired))}
          </Badge>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <section className="flex shrink-0 flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="atlas-checkbox"
            checked={repair}
            onChange={(e) => setRepair(e.target.checked)}
          />
          Apply safe repairs
        </label>
        <PermissionGate permission="tenant:update">
          <Button
            type="button"
            disabled={run.isPending}
            onClick={() => run.mutate()}
          >
            {run.isPending ? "Running…" : "Run reconciliation"}
          </Button>
        </PermissionGate>
        {run.isError ? (
          <p className="text-sm text-[var(--danger)]">
            {run.error instanceof Error ? run.error.message : "Run failed"}
          </p>
        ) : null}
      </section>

      {(lastRun || lastQuery.data?.data) && (
        <section className="shrink-0 space-y-2">
          <h2 className="text-sm font-semibold">Latest report</h2>
          {lastQuery.isLoading && !lastRun ? (
            <Skeleton className="h-32 w-full" />
          ) : lastQuery.isError && !lastRun ? (
            <ErrorState
              title="Couldn't load last report"
              description={
                lastQuery.error instanceof Error
                  ? lastQuery.error.message
                  : "Try again."
              }
              onRetry={() => void lastQuery.refetch()}
            />
          ) : (
            <pre className="max-h-64 overflow-auto rounded-md bg-[var(--secondary)] p-3 text-xs">
              {JSON.stringify(lastRun ?? lastQuery.data?.data, null, 2)}
            </pre>
          )}
        </section>
      )}

      <section className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
        <h2 className="shrink-0 text-sm font-semibold">History</h2>
        {historyQuery.isLoading ? (
          <Skeleton className="min-h-0 w-full flex-1" />
        ) : historyQuery.isError ? (
          <ErrorState
            title="Couldn't load report history"
            description={
              historyQuery.error instanceof Error
                ? historyQuery.error.message
                : "Try again."
            }
            onRetry={() => void historyQuery.refetch()}
          />
        ) : (
          <DataTable
            columns={columns}
            rows={historyQuery.data?.data ?? []}
            empty={
              <EmptyState
                title="No reconciliation reports"
                description="Run reconciliation to generate the first report."
              />
            }
          />
        )}
      </section>
    </>
  );
}

export default function AdminReconciliationPage() {
  return (
    <AdminGate
      fallback={
        <EmptyState
          title="Access restricted"
          description="Platform admin access is required for reconciliation."
        />
      }
    >
      <FillPage>
        <PageHeader
          className="mb-[var(--space-4)]"
          title="Reconciliation"
          description="Detect and optionally repair Keycloak ↔ application drift for the current tenant."
        />
        <PermissionGate
          permission="tenant:read"
          fallback={
            <EmptyState
              title="Access restricted"
              description="You need tenant:read to view reconciliation reports."
            />
          }
        >
          <FillSection>
            <ReconciliationPanel />
          </FillSection>
        </PermissionGate>
      </FillPage>
    </AdminGate>
  );
}
