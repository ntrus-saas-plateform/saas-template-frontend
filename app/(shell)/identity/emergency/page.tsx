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
import { SearchableSelect } from "@/components/settings/searchable-select";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { RowActions } from "@/components/data/row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import {
  identityApi,
  type ApplicationUser,
  type EmergencyAccessGrant,
} from "@/lib/api/identity";
import { userDisplayName, userEmail } from "@/lib/identity/user-display";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";

function userIdentity(user: ApplicationUser) {
  return user.identityId || user.id;
}

function EmergencyPanel() {
  const client = useApiClient();
  const api = identityApi(client);
  const { context, organizations } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [operatorIdentityId, setOperator] = useState("");
  const [reason, setReason] = useState("");
  const [organizationId, setOrganizationId] = useState(
    context?.organizationId ?? "",
  );
  const [hours, setHours] = useState("4");

  const query = useQuery({
    queryKey: idk.emergency(),
    queryFn: async () => api.emergencyAccess.list(1, 50),
  });

  const usersQuery = useQuery({
    queryKey: [...idk.users(), "emergency-operators"],
    queryFn: async () => api.users.list(1, 100),
    enabled: open,
  });

  const orgOptions = useMemo(
    () => [
      { value: "", label: "Tout le tenant" },
      ...organizations.map((org) => ({
        value: org.id,
        label: org.name,
      })),
    ],
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
    setOperator("");
    setReason("");
    setOrganizationId(context?.organizationId ?? "");
    setHours("4");
  };

  const grant = useMutation({
    mutationFn: () =>
      api.emergencyAccess.grant({
        operatorIdentityId,
        reason,
        organizationId: organizationId || undefined,
        expiresInHours: Number(hours) || undefined,
      }),
    onSuccess: async () => {
      setOpen(false);
      resetForm();
      await qc.invalidateQueries({ queryKey: idk.emergency() });
    },
  });

  const revoke = useMutation({
    mutationFn: (id: string) => api.emergencyAccess.revoke(id),
    onSuccess: async () => {
      setRevokeId(null);
      await qc.invalidateQueries({ queryKey: idk.emergency() });
    },
  });

  const columns = useMemo<DataTableColumn<EmergencyAccessGrant>[]>(
    () => [
      {
        id: "code",
        header: "Organisation",
        sortable: true,
        sortValue: (row) =>
          orgNameById.get(row.organizationId ?? "") ?? row.organizationId ?? "",
        cell: (row) => (
          <span className="font-medium">
            {row.organizationId
              ? orgNameById.get(row.organizationId) ??
                row.organizationId.slice(0, 8)
              : "Tenant"}
          </span>
        ),
      },
      {
        id: "label",
        header: "OpÃ©rateur",
        sortable: true,
        sortValue: (row) =>
          userNameById.get(row.operatorIdentityId) ?? row.operatorIdentityId,
        cell: (row) => (
          <span className="font-medium">
            {userNameById.get(row.operatorIdentityId) ??
              row.operatorIdentityId}
          </span>
        ),
      },
      {
        id: "description",
        header: "Motif",
        cell: (row) => (
          <span className="text-[var(--text-secondary)]">{row.reason}</span>
        ),
      },
      {
        id: "status",
        header: "Statut",
        cell: (row) =>
          row.status ? <Badge tone="warning">{String(row.status)}</Badge> : "â€”",
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
        title="Impossible de charger lâ€™accÃ¨s dâ€™urgence"
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
            title="Aucun accÃ¨s dâ€™urgence"
            description="Les accÃ¨s break-glass sont auditÃ©s et limitÃ©s dans le temps (max 24 h)."
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
        title="Accorder un accÃ¨s dâ€™urgence"
        description="Authentification step-up requise lorsque lâ€™API lâ€™impose."
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
                !operatorIdentityId ||
                reason.trim().length < 10 ||
                grant.isPending
              }
              onClick={() => grant.mutate()}
            >
              {grant.isPending ? "Attributionâ€¦" : "Accorder"}
            </Button>
          </>
        }
      >
        <div className="space-y-[var(--space-4)]">
          <Field label="OpÃ©rateur" htmlFor="emergency-op" required>
            {usersQuery.isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <SearchableSelect
                id="emergency-op"
                value={operatorIdentityId}
                options={userOptions}
                placeholder="Rechercher un utilisateurâ€¦"
                onChange={setOperator}
              />
            )}
          </Field>
          <Field label="Motif (min. 10 caractÃ¨res)" htmlFor="reason" required>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contexte de lâ€™incidentâ€¦"
            />
          </Field>
          <Field label="Organisation (optionnel)" htmlFor="emergency-org">
            <SearchableSelect
              id="emergency-org"
              value={organizationId}
              options={orgOptions}
              placeholder="Organisationâ€¦"
              onChange={setOrganizationId}
            />
          </Field>
          <Field label="Expire dans (heures, max 24)" htmlFor="hours">
            <Input
              id="hours"
              type="number"
              min={1}
              max={24}
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
        title="RÃ©voquer lâ€™accÃ¨s dâ€™urgence ?"
        description="Lâ€™opÃ©rateur perd immÃ©diatement les privilÃ¨ges break-glass."
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

export default function EmergencyPage() {
  return (
    <FillPage>
      <PageHeader
        className="mb-[var(--space-4)]"
        title="Accès d’urgence"
        description="Accords break-glass audités pour la réponse aux incidents."
      />
      <PermissionGate
        permission="emergency_access:read"
        fallback={
          <EmptyState
            title="Accès restreint"
            description="Permission emergency_access:read requise."
          />
        }
      >
        <FillSection>
          <EmergencyPanel />
        </FillSection>
      </PermissionGate>
    </FillPage>
  );
}
