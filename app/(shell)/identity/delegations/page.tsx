"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/shell/page-header";
import { FillPage, FillSection } from "@/components/shell/fill-page";
import { PermissionGate } from "@/components/shell/permission-gate";
import { PermissionPicker } from "@/components/identity/permission-picker";
import { SearchableSelect } from "@/components/settings/searchable-select";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { RowActions } from "@/components/data/row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import {
  identityApi,
  type ApplicationUser,
  type Delegation,
} from "@/lib/api/identity";
import { userDisplayName, userEmail } from "@/lib/identity/user-display";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";

function userIdentity(user: ApplicationUser) {
  return user.identityId || user.id;
}

function DelegationsPanel() {
  const client = useApiClient();
  const api = identityApi(client);
  const { context, organizations } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState(
    context?.organizationId ?? "",
  );
  const [granteeIdentityId, setGrantee] = useState("");
  const [permissions, setPermissions] = useState<string[]>([
    "organizations:read",
  ]);
  const [hours, setHours] = useState("24");

  const query = useQuery({
    queryKey: idk.delegations(),
    queryFn: async () => api.delegations.list(1, 50),
  });

  const usersQuery = useQuery({
    queryKey: [...idk.users(), "delegation-grantees"],
    queryFn: async () => api.users.list(1, 100),
    enabled: open,
  });

  const catalogQuery = useQuery({
    queryKey: [...idk.permissions(), "catalog-all", "v2"],
    queryFn: async () => api.permissions.listAll(),
    enabled: open,
  });

  const orgOptions = useMemo(
    () =>
      organizations.map((org) => ({
        value: org.id,
        label: org.name,
      })),
    [organizations],
  );

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

  const orgNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const org of organizations) map.set(org.id, org.name);
    return map;
  }, [organizations]);

  const userNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of usersQuery.data?.data ?? []) {
      const name = userDisplayName(user);
      map.set(userIdentity(user), name);
      map.set(user.id, name);
    }
    return map;
  }, [usersQuery.data?.data]);

  const resetForm = () => {
    setOrganizationId(context?.organizationId ?? "");
    setGrantee("");
    setPermissions(["organizations:read"]);
    setHours("24");
  };

  const grant = useMutation({
    mutationFn: () =>
      api.delegations.grant({
        organizationId,
        granteeIdentityId,
        permissions,
        expiresInHours: Number(hours) || undefined,
      }),
    onSuccess: async () => {
      setOpen(false);
      resetForm();
      await qc.invalidateQueries({ queryKey: idk.delegations() });
    },
  });

  const revoke = useMutation({
    mutationFn: (id: string) => api.delegations.revoke(id),
    onSuccess: async () => {
      setRevokeId(null);
      await qc.invalidateQueries({ queryKey: idk.delegations() });
    },
  });

  const columns = useMemo<DataTableColumn<Delegation>[]>(
    () => [
      {
        id: "code",
        header: "Organisation",
        sortable: true,
        sortValue: (row) =>
          orgNameById.get(row.organizationId) ?? row.organizationId,
        cell: (row) => (
          <span className="font-medium">
            {orgNameById.get(row.organizationId) ??
              ((row.organizationId ?? "").slice(0, 8) || "â€”")}
          </span>
        ),
      },
      {
        id: "label",
        header: "BÃ©nÃ©ficiaire",
        sortable: true,
        sortValue: (row) =>
          userNameById.get(row.granteeIdentityId) ?? row.granteeIdentityId,
        cell: (row) => (
          <span className="font-medium">
            {userNameById.get(row.granteeIdentityId) ?? row.granteeIdentityId}
          </span>
        ),
      },
      {
        id: "description",
        header: "Permissions",
        cell: (row) => (
          <span className="text-[var(--text-secondary)]">
            {(row.permissions ?? []).join(", ") || "â€”"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Statut",
        cell: (row) =>
          row.status ? <Badge>{String(row.status)}</Badge> : "â€”",
      },
      {
        id: "actions",
        header: "Action",
        actions: true,
        cell: (row) => (
          <RowActions
            onDelete={() => setRevokeId(row.id)}
            deleteLabel="RÃ©voquer"
          />
        ),
      },
    ],
    [orgNameById, userNameById],
  );

  if (query.isLoading) return <Skeleton className="min-h-0 w-full flex-1" />;
  if (query.isError) {
    return (
      <ErrorState
        title="Impossible de charger les dÃ©lÃ©gations"
        description={
          query.error instanceof Error
            ? query.error.message
            : "RÃ©essayez."
        }
        onRetry={() => void query.refetch()}
      />
    );
  }

  return (
    <>
      <DataTable
        columns={columns}
        rows={query.data?.data ?? []}
        onRefresh={() => void query.refetch()}
        refreshing={query.isFetching}
        addAction={{
          label: "Ajouter",
          onClick: () => {
            resetForm();
            setOpen(true);
          },
        }}
        empty={
          <EmptyState
            title="Aucune dÃ©lÃ©gation"
            description="Accordez temporairement des permissions Ã  une autre identitÃ©."
            actionLabel="Ajouter"
            onAction={() => {
              resetForm();
              setOpen(true);
            }}
          />
        }
      />
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetForm();
        }}
        title="Accorder une dÃ©lÃ©gation"
        description="Permissions temporaires dans une organisation, choisies dans le catalogue backend."
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={
                !organizationId ||
                !granteeIdentityId ||
                permissions.length === 0 ||
                grant.isPending
              }
              onClick={() => grant.mutate()}
            >
              {grant.isPending ? "Attributionâ€¦" : "Accorder"}
            </Button>
          </>
        }
      >
        <div className="max-h-[70vh] space-y-[var(--space-4)] overflow-auto pr-1">
          <Field label="Organisation" htmlFor="delegation-org" required>
            <SearchableSelect
              id="delegation-org"
              value={organizationId}
              options={orgOptions}
              placeholder="Rechercher une organisationâ€¦"
              onChange={setOrganizationId}
            />
          </Field>
          <Field label="BÃ©nÃ©ficiaire" htmlFor="delegation-grantee" required>
            {usersQuery.isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <SearchableSelect
                id="delegation-grantee"
                value={granteeIdentityId}
                options={userOptions}
                placeholder="Rechercher un utilisateurâ€¦"
                onChange={setGrantee}
              />
            )}
          </Field>
          <Field
            label="Permissions"
            required
            hint="SÃ©lectionnez les permissions du catalogue (resource:action)."
          >
            {catalogQuery.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <PermissionPicker
                permissions={catalogQuery.data?.data ?? []}
                selected={permissions}
                onChange={setPermissions}
              />
            )}
          </Field>
          <Field label="Expire dans (heures)" htmlFor="hours">
            <Input
              id="hours"
              type="number"
              min={1}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </Field>
          {grant.isError ? (
            <p className="type-sm text-[var(--danger)]">
              {grant.error instanceof Error
                ? grant.error.message
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
        title="RÃ©voquer la dÃ©lÃ©gation ?"
        description="Le bÃ©nÃ©ficiaire perd immÃ©diatement les permissions dÃ©lÃ©guÃ©es."
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

export default function DelegationsPage() {
  return (
    <FillPage>
      <PageHeader
        className="mb-[var(--space-4)]"
        title="Délégations"
        description="Accords temporaires de permissions au sein d’une organisation."
      />
      <PermissionGate
        permission="delegation:read"
        fallback={
          <EmptyState
            title="Accès restreint"
            description="Permission delegation:read requise."
          />
        }
      >
        <FillSection>
          <DelegationsPanel />
        </FillSection>
      </PermissionGate>
    </FillPage>
  );
}
