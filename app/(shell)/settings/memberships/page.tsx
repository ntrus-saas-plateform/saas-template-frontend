"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/shell/page-header";
import { FillPage, FillSection } from "@/components/shell/fill-page";
import { PermissionGate } from "@/components/shell/permission-gate";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { identityApi, type Membership } from "@/lib/api/identity";
import { formatDateTime } from "@/lib/format/datetime";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { useMemo } from "react";

function MembershipsPanel() {
  const client = useApiClient();
  const { context, organizations } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const api = identityApi(client);

  const query = useQuery({
    queryKey: idk.myMemberships(),
    queryFn: async () => api.users.myMemberships(1, 100),
  });

  const orgName = (id: string) =>
    organizations.find((o) => o.id === id)?.name ?? id;

  const columns = useMemo<DataTableColumn<Membership>[]>(
    () => [
      {
        id: "org",
        header: "Organization",
        cell: (row) => (
          <Link
            href={`/identity/organizations/${row.organizationId}`}
            className="font-medium underline-offset-2 hover:underline"
          >
            {orgName(row.organizationId)}
          </Link>
        ),
      },
      {
        id: "roles",
        header: "Roles",
        cell: (row) =>
          row.roles?.length ? (
            <div className="flex flex-wrap gap-1">
              {row.roles.map((r) => (
                <Badge key={r} tone="info">
                  {r}
                </Badge>
              ))}
            </div>
          ) : (
            "â€”"
          ),
      },
      {
        id: "dept",
        header: "Department",
        cell: (row) => row.department || "â€”",
      },
      {
        id: "position",
        header: "Position",
        cell: (row) => row.position || "â€”",
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => <Badge>{row.status || "ACTIVE"}</Badge>,
      },
      {
        id: "joined",
        header: "Joined",
        cell: (row) => formatDateTime(row.joinedAt || row.createdAt || null),
      },
    ],
    [organizations],
  );

  if (query.isLoading) return <Skeleton className="h-40 w-full" />;
  if (query.isError) {
    return (
      <ErrorState
        title="Couldn't load memberships"
        description={
          query.error instanceof Error ? query.error.message : "Try again."
        }
        onRetry={() => void query.refetch()}
      />
    );
  }

  const rows = query.data?.data ?? [];
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No memberships"
        description="You are not a member of any organization in this tenant."
      />
    );
  }

  return <DataTable columns={columns} rows={rows} />;
}

export default function MyMembershipsPage() {
  return (
    <FillPage>
      <PageHeader
        className="mb-[var(--space-4)]"
        title="My memberships"
        description="Organizations you belong to, with roles and employment context."
      />
      <PermissionGate
        permission="users:read"
        fallback={
          <EmptyState
            title="Access restricted"
            description="You need users:read."
          />
        }
      >
        <FillSection>
          <MembershipsPanel />
        </FillSection>
      </PermissionGate>
    </FillPage>
  );
}
