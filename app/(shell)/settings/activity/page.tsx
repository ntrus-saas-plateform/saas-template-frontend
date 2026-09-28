"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/shell/page-header";
import { FillPage, FillSection } from "@/components/shell/fill-page";
import { PermissionGate } from "@/components/shell/permission-gate";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { identityApi, type UserActivityEvent } from "@/lib/api/identity";
import { formatDateTime } from "@/lib/format/datetime";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { useToast } from "@/components/feedback/toast";
import { useMemo } from "react";
import Link from "next/link";

function ActivityPanel() {
  const client = useApiClient();
  const { context } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const api = identityApi(client);
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({
    queryKey: idk.activity(),
    queryFn: async () => api.users.activity.list(1, 50),
  });

  const rows = query.data?.data ?? [];

  const clear = useMutation({
    mutationFn: () => api.users.activity.clear(),
    onSuccess: async () => {
      toast.push({ title: "Activity cleared", tone: "success" });
      await qc.invalidateQueries({ queryKey: idk.activity() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const columns = useMemo<DataTableColumn<UserActivityEvent>[]>(
    () => [
      {
        id: "title",
        header: "Event",
        cell: (row) => (
          <div>
            <p className="font-medium">{row.title}</p>
            <p className="text-[11px] text-[var(--text-muted)]">
              {row.detail || row.category}
            </p>
          </div>
        ),
      },
      {
        id: "when",
        header: "When",
        cell: (row) => formatDateTime(row.createdAt),
      },
      {
        id: "link",
        header: "",
        cell: (row) =>
          row.href ? (
            <Link className="text-sm underline" href={row.href}>
              Open
            </Link>
          ) : null,
      },
    ],
    [],
  );

  return (
    <FillPage>
      <PageHeader
        className="mb-[var(--space-4)]"
        title="My activity"
        description="Recent actions synced from the shell activity feed."
      />
      <FillSection>
        <div className="flex shrink-0 justify-end">
          <Button
            variant="outline"
            disabled={clear.isPending || rows.length === 0}
            onClick={() => clear.mutate()}
          >
            Clear activity
          </Button>
        </div>
        {query.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : query.isError ? (
          <ErrorState
            title="Couldn't load activity"
            description={
              query.error instanceof Error ? query.error.message : "Try again."
            }
            onRetry={() => void query.refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No activity yet"
            description="Navigation and shell actions will appear here."
          />
        ) : (
          <DataTable columns={columns} rows={rows} />
        )}
      </FillSection>
    </FillPage>
  );
}

export default function ActivitySettingsPage() {
  return (
    <PermissionGate permission="users:read">
      <ActivityPanel />
    </PermissionGate>
  );
}
