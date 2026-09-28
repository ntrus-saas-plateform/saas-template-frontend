"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/shell/page-header";
import { FillPage, FillSection } from "@/components/shell/fill-page";
import { PermissionGate } from "@/components/shell/permission-gate";
import { SearchableSelect } from "@/components/settings/searchable-select";
import { RoleMultiSelect } from "@/components/identity/role-multi-select";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { RowActions } from "@/components/data/row-actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  identityApi,
  type ApplicationUser,
  type Membership,
} from "@/lib/api/identity";
import { userDisplayName, userEmail } from "@/lib/identity/user-display";
import { hasPermission } from "@/lib/access/permissions";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";

function userIdentity(user: ApplicationUser) {
  return user.identityId || user.id;
}

function MembershipsPanel() {
  const client = useApiClient();
  const api = identityApi(client);
  const { context, capabilities, organizations } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const qc = useQueryClient();
  const perms = capabilities?.permissions ?? context?.permissions ?? [];
  const canCreate = hasPermission(perms, "memberships:create");
  const canUpdate = hasPermission(perms, "memberships:update");
  const canRevoke = hasPermission(perms, "memberships:revoke");
  const [open, setOpen] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [organizationId, setOrganizationId] = useState(
    context?.organizationId ?? "",
  );
  const [roles, setRoles] = useState<string[]>(["viewer"]);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    setPage(1);
  }, [organizationId, pageSize]);

  useEffect(() => {
    if (context?.organizationId && !organizationId) {
      setOrganizationId(context.organizationId);
    }
  }, [context?.organizationId, organizationId]);

  const usersQuery = useQuery({
    queryKey: [...idk.users(), "membership-directory"],
    queryFn: async () => api.users.list(1, 100),
  });

  const rolesQuery = useQuery({
    queryKey: idk.roles(),
    queryFn: async () => api.roles.list(1, 100),
    enabled: open,
  });

  const query = useQuery({
    queryKey: [...idk.memberships(organizationId || undefined), page, pageSize],
    queryFn: async () =>
      api.memberships.list(page, pageSize, organizationId || undefined),
  });

  const userNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of usersQuery.data?.data ?? []) {
      const name = userDisplayName(user);
      map.set(user.identityId || user.id, name);
      map.set(user.id, name);
    }
    return map;
  }, [usersQuery.data?.data]);

  const orgNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const org of organizations) map.set(org.id, org.name);
    return map;
  }, [organizations]);

  const userOptions = useMemo(
    () =>
      (usersQuery.data?.data ?? []).map((user) => {
        const email = userEmail(user);
        const label = userDisplayName(user);
        return {
          value: userIdentity(user),
          label: email ? `${label} Â· ${email}` : label,
        };
      }),
    [usersQuery.data?.data],
  );

  const orgOptions = useMemo(
    () =>
      organizations.map((org) => ({
        value: org.id,
        label: org.name,
      })),
    [organizations],
  );

  const roleCatalog = rolesQuery.data?.data ?? [];

  const resetGrantForm = () => {
    setUserId("");
    setOrganizationId(context?.organizationId ?? "");
    setRoles(["viewer"]);
  };

  const create = useMutation({
    mutationFn: () =>
      api.memberships.create({
        userId,
        organizationId,
        roles,
      }),
    onSuccess: async () => {
      setOpen(false);
      resetGrantForm();
      await qc.invalidateQueries({ queryKey: ["identity", "memberships"] });
    },
  });

  const revoke = useMutation({
    mutationFn: (id: string) => api.memberships.revoke(id),
    onSuccess: async () => {
      setRevokeId(null);
      await qc.invalidateQueries({ queryKey: ["identity", "memberships"] });
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async (row: Membership) => {
      const next = row.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      return api.memberships.patch(row.id, { status: next });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["identity", "memberships"] });
    },
  });

  const filtered = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    const rows = query.data?.data ?? [];
    if (!q) return rows;
    return rows.filter((row) => {
      const hay = [
        userNameById.get(row.userId),
        row.userId,
        orgNameById.get(row.organizationId),
        row.organizationId,
        ...(row.roles ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query.data?.data, searchInput, userNameById, orgNameById]);

  const columns = useMemo<DataTableColumn<Membership>[]>(
    () => [
      {
        id: "code",
        header: "Code",
        sortable: true,
        sortValue: (row) => orgNameById.get(row.organizationId) ?? "",
        cell: (row) => orgNameById.get(row.organizationId) ?? "â€”",
      },
      {
        id: "label",
        header: "LibellÃ©",
        sortable: true,
        sortValue: (row) => userNameById.get(row.userId) ?? row.userId,
        cell: (row) => (
          <span className="font-medium">
            {userNameById.get(row.userId) ?? row.userId}
          </span>
        ),
      },
      {
        id: "description",
        header: "Description",
        cell: (row) => (
          <span className="text-[var(--text-secondary)]">
            {(row.roles ?? []).join(", ") || "â€”"}
            {row.position ? ` Â· ${row.position}` : ""}
          </span>
        ),
      },
      {
        id: "status",
        header: "Statut",
        align: "center",
        cell: (row) => (
          <div className="flex justify-center">
            <Switch
              checked={row.status === "ACTIVE"}
              disabled={!canUpdate || toggleStatus.isPending}
              aria-label={`Statut de ${userNameById.get(row.userId) ?? row.userId}`}
              onCheckedChange={() => toggleStatus.mutate(row)}
            />
          </div>
        ),
      },
      {
        id: "actions",
        header: "Action",
        actions: true,
        cell: (row) =>
          canRevoke ? (
            <RowActions
              onDelete={() => setRevokeId(row.id)}
              deleteLabel="RÃ©voquer"
            />
          ) : null,
      },
    ],
    [canRevoke, canUpdate, orgNameById, toggleStatus.isPending, userNameById],
  );

  if (query.isLoading) return <Skeleton className="min-h-0 w-full flex-1" />;
  if (query.isError) {
    return (
      <ErrorState
        title="Couldn't load memberships"
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
        columns={columns}
        rows={filtered}
        search={{
          value: searchInput,
          onChange: setSearchInput,
          placeholder: "Rechercher des membresâ€¦",
        }}
        onRefresh={() => void query.refetch()}
        refreshing={query.isFetching}
        addAction={
          canCreate
            ? {
                label: "Ajouter",
                onClick: () => {
                  resetGrantForm();
                  setOpen(true);
                },
              }
            : undefined
        }
        pagination={{
          page,
          pageSize,
          total: query.data?.pagination?.total,
          hasMore: query.data?.pagination?.hasNext,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
        empty={
          <EmptyState
            title="No memberships"
            description="Grant a user access to an organization."
            actionLabel={canCreate ? "Ajouter" : undefined}
            onAction={
              canCreate
                ? () => {
                    resetGrantForm();
                    setOpen(true);
                  }
                : undefined
            }
          />
        }
      />
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetGrantForm();
        }}
        title="Accorder un accÃ¨s"
        description="Ajoutez un utilisateur existant Ã  une organisation avec les rÃ´les adaptÃ©s."
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                resetGrantForm();
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={
                !userId ||
                !organizationId ||
                roles.length === 0 ||
                create.isPending
              }
              onClick={() => create.mutate()}
            >
              {create.isPending ? "Attributionâ€¦" : "Accorder"}
            </Button>
          </>
        }
      >
        <div className="space-y-[var(--space-4)]">
          <Field label="Utilisateur" htmlFor="grant-user" required>
            <SearchableSelect
              id="grant-user"
              value={userId}
              options={userOptions}
              placeholder="Rechercher un utilisateurâ€¦"
              emptyLabel="Aucun utilisateur"
              onChange={setUserId}
            />
          </Field>
          <Field label="Organisation" htmlFor="grant-org" required>
            <SearchableSelect
              id="grant-org"
              value={organizationId}
              options={orgOptions}
              placeholder="Rechercher une organisationâ€¦"
              emptyLabel="Aucune organisation"
              onChange={setOrganizationId}
            />
          </Field>
          <Field
            label="RÃ´les"
            htmlFor="grant-roles"
            required
            hint="RÃ´les organisation / tenant disponibles."
          >
            {rolesQuery.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <RoleMultiSelect
                roles={roleCatalog}
                selected={roles}
                onChange={setRoles}
              />
            )}
          </Field>
          {create.isError ? (
            <p className="type-sm text-[var(--danger)]">
              {create.error instanceof Error
                ? create.error.message
                : "Attribution impossible."}
            </p>
          ) : null}
        </div>
      </Dialog>
      <ConfirmDialog
        open={Boolean(revokeId)}
        onOpenChange={(o) => {
          if (!o) setRevokeId(null);
        }}
        title="RÃ©voquer lâ€™accÃ¨s ?"
        description="La protection du dernier administrateur peut bloquer cette action."
        confirmLabel="RÃ©voquer"
        tone="danger"
        loading={revoke.isPending}
        onConfirm={() => {
          if (revokeId) revoke.mutate(revokeId);
        }}
      />
    </>
  );
}

export default function MembershipsPage() {
  return (
    <FillPage>
      <PageHeader
        className="mb-[var(--space-4)]"
        title="Memberships"
        description="Organization membership grants and revocations."
      />
      <PermissionGate
        permission="memberships:read"
        fallback={
          <EmptyState
            title="Access restricted"
            description="You need memberships:read."
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
