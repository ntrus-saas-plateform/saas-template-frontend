"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/shell/page-header";
import { FillPage, FillSection } from "@/components/shell/fill-page";
import { PermissionGate } from "@/components/shell/permission-gate";
import { InviteUserDialog } from "@/components/identity/invite-user-dialog";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { RowActions } from "@/components/data/row-actions";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { identityApi, type ApplicationUser } from "@/lib/api/identity";
import {
  userDisplayName,
  userEmail,
  userJobTitle,
} from "@/lib/identity/user-display";
import { hasPermission } from "@/lib/access/permissions";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";

function userCode(user: ApplicationUser): string {
  const n = user.profile?.employeeNumber;
  return typeof n === "string" && n.trim() ? n.trim() : "—";
}

function userDescription(user: ApplicationUser): string {
  const parts = [
    userEmail(user),
    userJobTitle(user),
    (user.organizations ?? [])
      .map((o) => o.organizationName)
      .filter(Boolean)
      .slice(0, 2)
      .join(", "),
  ].filter(Boolean);
  return parts.join(" · ") || "—";
}

function UsersDirectory() {
  const router = useRouter();
  const client = useApiClient();
  const { context, capabilities } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const api = identityApi(client);
  const qc = useQueryClient();
  const perms = capabilities?.permissions ?? context?.permissions ?? [];
  const canInvite = hasPermission(perms, "users:invite");
  const canSuspend = hasPermission(perms, "users:suspend");
  const canUpdate = hasPermission(perms, "users:update");

  const meQuery = useQuery({
    queryKey: [...idk.users(), "me"],
    queryFn: async () => api.users.me(),
  });
  const me = meQuery.data?.data;

  const isCurrentUser = (row: ApplicationUser) => {
    if (!me) return false;
    return (
      row.id === me.id ||
      Boolean(row.identityId && me.identityId && row.identityId === me.identityId)
    );
  };

  const [inviteOpen, setInviteOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [pending, setPending] = useState<{
    action: "disable" | "suspend" | "reactivate";
    user: ApplicationUser;
  } | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const query = useQuery({
    queryKey: [...idk.users(), page, pageSize, search],
    queryFn: async () =>
      api.users.list(page, pageSize, undefined, search || undefined),
  });

  const lifecycle = useMutation({
    mutationFn: async (input: {
      action: "disable" | "suspend" | "reactivate";
      identityId: string;
    }) => {
      if (input.action === "suspend") return api.users.suspend(input.identityId);
      if (input.action === "disable") return api.users.disable(input.identityId);
      return api.users.reactivate(input.identityId);
    },
    onSuccess: async () => {
      setPending(null);
      await qc.invalidateQueries({ queryKey: idk.users() });
    },
  });

  const rows = query.data?.data ?? [];
  const total = query.data?.pagination?.total ?? rows.length;

  const columns = useMemo<DataTableColumn<ApplicationUser>[]>(
    () => [
      {
        id: "code",
        header: "Code",
        sortable: true,
        sortValue: (row) => userCode(row),
        cell: (row) => (
          <span className="font-medium uppercase tracking-wide">
            {userCode(row)}
          </span>
        ),
      },
      {
        id: "label",
        header: "Libellé",
        sortable: true,
        sortValue: (row) => userDisplayName(row),
        cell: (row) => (
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium">{userDisplayName(row)}</span>
            {isCurrentUser(row) ? <Badge tone="info">Vous</Badge> : null}
          </div>
        ),
      },
      {
        id: "description",
        header: "Description",
        sortable: true,
        sortValue: (row) => userEmail(row) ?? "",
        cell: (row) => (
          <span className="text-[var(--text-secondary)]">
            {userDescription(row)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Statut",
        align: "center",
        sortable: true,
        sortValue: (row) => row.status,
        cell: (row) => {
          const isSelf = isCurrentUser(row);
          const active = row.status === "ACTIVE";
          const togglable =
            !isSelf &&
            (active
              ? canSuspend
              : canUpdate &&
                (row.status === "SUSPENDED" ||
                  row.status === "DISABLED" ||
                  row.status === "LOCKED"));
          return (
            <div className="flex items-center justify-center">
              <Switch
                checked={active}
                disabled={!togglable || lifecycle.isPending}
                aria-label={
                  active
                    ? `Désactiver ${userDisplayName(row)}`
                    : `Activer ${userDisplayName(row)}`
                }
                onCheckedChange={(next) => {
                  const identityId = row.identityId || row.id;
                  if (next) {
                    void lifecycle.mutateAsync({
                      action: "reactivate",
                      identityId,
                    });
                  } else {
                    setPending({ action: "suspend", user: row });
                  }
                }}
              />
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Action",
        actions: true,
        hideable: false,
        cell: (row) => {
          const isSelf = isCurrentUser(row);
          return (
            <RowActions
              onEdit={() =>
                router.push(
                  `/identity/users/${encodeURIComponent(row.identityId || row.id)}`,
                )
              }
              onDelete={
                !isSelf && canSuspend
                  ? () => setPending({ action: "disable", user: row })
                  : undefined
              }
              deleteDisabled={isSelf || row.status === "DISABLED"}
              deleteLabel="Désactiver"
            />
          );
        },
      },
    ],
    [canSuspend, canUpdate, isCurrentUser, lifecycle, router],
  );

  if (query.isLoading) {
    return <Skeleton className="min-h-0 w-full flex-1" />;
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Couldn't load users"
        description={
          query.error instanceof Error
            ? query.error.message
            : "Try again shortly."
        }
        onRetry={() => void query.refetch()}
      />
    );
  }

  return (
    <>
      <DataTable
        fill
        columns={columns}
        rows={rows}
        search={{
          value: searchInput,
          onChange: setSearchInput,
          placeholder: "Rechercher des utilisateurs…",
        }}
        onRefresh={() => void query.refetch()}
        refreshing={query.isFetching}
        onRowClick={(row) => {
          router.push(
            `/identity/users/${encodeURIComponent(row.identityId || row.id)}`,
          );
        }}
        bulkActions={
          canSuspend
            ? [
                {
                  id: "suspend",
                  label: "Suspendre",
                  tone: "danger",
                  onClick: (ids) => {
                    const first = rows.find(
                      (r) => r.id === ids[0] && !isCurrentUser(r),
                    );
                    if (first) setPending({ action: "suspend", user: first });
                  },
                },
              ]
            : undefined
        }
        addAction={
          canInvite
            ? { label: "Ajouter", onClick: () => setInviteOpen(true) }
            : undefined
        }
        pagination={{
          page,
          pageSize,
          total,
          hasMore: query.data?.pagination?.hasNext,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
        empty={
          <EmptyState
            title={search ? "Aucun utilisateur" : "No users yet"}
            description={
              search
                ? "Essayez une autre recherche."
                : "Invite someone to join an organization in this tenant."
            }
            actionLabel={canInvite && !search ? "Ajouter" : undefined}
            onAction={
              canInvite && !search ? () => setInviteOpen(true) : undefined
            }
          />
        }
      />

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title={
          pending?.action === "disable"
            ? `Désactiver ${pending ? userDisplayName(pending.user) : "l’utilisateur"} ?`
            : `Suspendre ${pending ? userDisplayName(pending.user) : "l’utilisateur"} ?`
        }
        description={
          pending?.action === "disable"
            ? "Le compte perdra l’accès jusqu’à réactivation."
            : "La personne ne pourra plus se connecter tant que le compte n’est pas réactivé."
        }
        confirmLabel={pending?.action === "disable" ? "Désactiver" : "Suspendre"}
        tone="danger"
        loading={lifecycle.isPending}
        onConfirm={() => {
          if (!pending) return;
          lifecycle.mutate({
            action: pending.action,
            identityId: pending.user.identityId || pending.user.id,
          });
        }}
      />
    </>
  );
}

export default function UsersPage() {
  return (
    <FillPage>
      <PageHeader
        className="mb-[var(--space-4)]"
        title="Users"
        description="People with access to this tenant."
      />
      <PermissionGate
        permission="users:read"
        fallback={
          <EmptyState
            title="Access restricted"
            description="You need users:read to view the directory."
          />
        }
      >
        <FillSection>
          <UsersDirectory />
        </FillSection>
      </PermissionGate>
    </FillPage>
  );
}
