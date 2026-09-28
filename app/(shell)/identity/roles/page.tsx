"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Trash2 } from "lucide-react";
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/shell/page-header";
import { FillPage, FillSection } from "@/components/shell/fill-page";
import { PermissionGate } from "@/components/shell/permission-gate";
import { PermissionPicker } from "@/components/identity/permission-picker";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { RowActions } from "@/components/data/row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import {
  formatPermissionKey,
  identityApi,
  isSystemRole,
  type Permission,
  type Role,
} from "@/lib/api/identity";
import { qk } from "@/lib/query/keys";
import { hasPermission } from "@/lib/access/permissions";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { useToast } from "@/components/feedback/toast";
import { cn } from "@/lib/utils";

const SCOPE_OPTIONS = [
  {
    id: "organization" as const,
    label: "Organisation",
    hint: "Rôle lié à un site (ex. PHARMACIST, INVENTORY_MANAGER).",
  },
  {
    id: "tenant" as const,
    label: "Tenant",
    hint: "Rôle transversal au tenant (ex. TENANT_USER).",
  },
] as const;

function emptyCreateForm() {
  return {
    name: "",
    scope: "organization" as "tenant" | "organization",
    description: "",
    permissions: [] as string[],
  };
}

function RolesPanel() {
  const client = useApiClient();
  const { context, capabilities } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const api = identityApi(client);
  const qc = useQueryClient();
  const perms = capabilities?.permissions ?? context?.permissions ?? [];
  const canCreate = hasPermission(perms, "roles:create");
  const canUpdate = hasPermission(perms, "roles:update");
  const canDelete = hasPermission(perms, "roles:delete");
  const [tab, setTab] = useState("roles");
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"ALL" | "tenant" | "organization">(
    "ALL",
  );
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [editMode, setEditMode] = useState<"view" | "edit">("view");
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editDescription, setEditDescription] = useState("");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const { push: pushToast } = useToast();

  const openRole = (row: Role, mode: "view" | "edit") => {
    setEditRole(row);
    setEditMode(mode);
    setEditDescription((row.description as string) || "");
    setEditPermissions([...(row.permissions ?? [])]);
  };

  const closeRoleDialog = () => {
    setEditRole(null);
    setEditMode("view");
  };

  const editReadOnly =
    editMode === "view" || (editRole ? isSystemRole(editRole) : false);

  const rolesQuery = useQuery({
    queryKey: idk.roles(),
    queryFn: async () => api.roles.list(1, 100),
  });

  const catalogQuery = useQuery({
    queryKey: [...idk.permissions(), "catalog-all", "v2"],
    queryFn: async () => api.permissions.listAll(),
    enabled: tab === "permissions" || open || Boolean(editRole),
  });

  const catalog = catalogQuery.data?.data ?? [];

  const create = useMutation({
    mutationFn: () =>
      api.roles.create({
        name: createForm.name.trim(),
        scope: createForm.scope,
        description: createForm.description.trim() || undefined,
        permissions: createForm.permissions,
      }),
    onSuccess: async () => {
      setOpen(false);
      setCreateForm(emptyCreateForm());
      await qc.invalidateQueries({ queryKey: idk.roles() });
    },
  });

  const update = useMutation({
    mutationFn: () =>
      api.roles.patch(editRole!.id, {
        description: editDescription.trim() || undefined,
        permissions: editPermissions,
      }),
    onSuccess: async () => {
      closeRoleDialog();
      await qc.invalidateQueries({ queryKey: idk.roles() });
    },
  });

  const remove = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await api.roles.delete(id);
      }
    },
    onSuccess: async (_data, ids) => {
      setDeleteIds([]);
      pushToast({
        title:
          ids.length > 1
            ? `${ids.length} rôles supprimés`
            : "Rôle supprimé",
        tone: "success",
      });
      await qc.invalidateQueries({ queryKey: idk.roles() });
    },
    onError: (error) => {
      pushToast({
        title: "Suppression impossible",
        description:
          error instanceof Error ? error.message : "Réessayez.",
        tone: "danger",
      });
    },
  });

  const requestDeleteRoles = (ids: string[]) => {
    const byId = new Map((rolesQuery.data?.data ?? []).map((r) => [r.id, r]));
    const deletable = ids.filter((id) => {
      const role = byId.get(id);
      return role && !isSystemRole(role);
    });
    const skipped = ids.length - deletable.length;
    if (skipped > 0) {
      pushToast({
        title:
          deletable.length === 0
            ? "Aucun rôle personnalisé sélectionné"
            : `${skipped} rôle(s) système ignoré(s)`,
        description:
          deletable.length === 0
            ? "Les rôles système ne peuvent pas être supprimés."
            : "Seuls les rôles personnalisés seront proposés à la suppression.",
        tone: deletable.length === 0 ? "warning" : "info",
      });
    }
    if (deletable.length > 0) setDeleteIds(deletable);
  };

  const roleColumns = useMemo<DataTableColumn<Role>[]>(
    () => [
      {
        id: "code",
        header: "Portée",
        sortable: true,
        sortValue: (row) => row.scope,
        cell: (row) => (
          <Badge tone={row.scope === "tenant" ? "info" : "default"}>
            {row.scope === "tenant"
              ? "Tenant"
              : row.scope === "organization"
                ? "Organisation"
                : row.scope}
          </Badge>
        ),
      },
      {
        id: "label",
        header: "Rôle",
        sortable: true,
        sortValue: (row) => row.name,
        cell: (row) => (
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.name}</span>
            {isSystemRole(row) ? <Badge tone="info">Système</Badge> : null}
          </div>
        ),
      },
      {
        id: "description",
        header: "Description",
        cell: (row) => (
          <span className="text-[var(--text-secondary)]">
            {row.description ||
              `${(row.permissions ?? []).length} permission(s)`}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Action",
        actions: true,
        cell: (row) => {
          const system = isSystemRole(row);
          const canEditRow = canUpdate && !system;
          const canDeleteRow = canDelete && !system;
          return (
            <RowActions
              items={[
                {
                  id: "view",
                  label: "Voir",
                  icon: <Eye className="size-[var(--icon-sm)]" aria-hidden />,
                  onClick: () => openRole(row, "view"),
                },
                {
                  id: "edit",
                  label: "Modifier",
                  icon: (
                    <Pencil className="size-[var(--icon-sm)]" aria-hidden />
                  ),
                  disabled: !canEditRow,
                  onClick: () => openRole(row, "edit"),
                },
                {
                  id: "delete",
                  label: system
                    ? "Supprimer (rôle système)"
                    : !canDelete
                      ? "Supprimer (permission requise)"
                      : "Supprimer",
                  icon: (
                    <Trash2 className="size-[var(--icon-sm)]" aria-hidden />
                  ),
                  tone: "danger",
                  separatorBefore: true,
                  disabled: !canDeleteRow,
                  onClick: () => setDeleteIds([row.id]),
                },
              ]}
            />
          );
        },
      },
    ],
    [canDelete, canUpdate],
  );

  const permRows = useMemo(() => {
    return catalog.map((p: Permission) => ({
      id: p.id || formatPermissionKey(p),
      code: formatPermissionKey(p),
      resource: p.resource,
      action: p.action,
      description: p.description || "",
    }));
  }, [catalog]);

  const permColumns = useMemo<
    DataTableColumn<{
      id: string;
      code: string;
      resource: string;
      action: string;
      description: string;
    }>[]
  >(
    () => [
      {
        id: "code",
        header: "Permission",
        sortable: true,
        sortValue: (row) => row.code,
        cell: (row) => (
          <span className="font-mono type-xs">{row.code}</span>
        ),
      },
      {
        id: "resource",
        header: "Ressource",
        sortable: true,
        sortValue: (row) => row.resource,
        cell: (row) => row.resource,
      },
      {
        id: "action",
        header: "Action",
        sortable: true,
        sortValue: (row) => row.action,
        cell: (row) => row.action,
      },
      {
        id: "desc",
        header: "Description",
        cell: (row) => (
          <span className="text-[var(--text-secondary)]">
            {row.description || "—"}
          </span>
        ),
      },
    ],
    [],
  );

  const filteredRoles = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    return (rolesQuery.data?.data ?? []).filter((row) => {
      if (scopeFilter !== "ALL" && row.scope !== scopeFilter) return false;
      if (!q) return true;
      return [row.name, row.scope, row.description, ...(row.permissions ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rolesQuery.data?.data, searchInput, scopeFilter]);

  return (
    <FillSection>
      <div className="shrink-0">
        <Tabs
          tabs={[
            { id: "roles", label: "Rôles" },
            { id: "permissions", label: "Catalogue permissions" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      {tab === "roles" ? (
        rolesQuery.isLoading ? (
          <Skeleton className="min-h-0 w-full flex-1" />
        ) : rolesQuery.isError ? (
          <ErrorState
            title="Impossible de charger les rôles"
            description={
              rolesQuery.error instanceof Error
                ? rolesQuery.error.message
                : "Réessayez."
            }
            onRetry={() => void rolesQuery.refetch()}
          />
        ) : (
          <DataTable
            fill
            columns={roleColumns}
            rows={filteredRoles}
            search={{
              value: searchInput,
              onChange: setSearchInput,
              placeholder: "Rechercher un rôle…",
            }}
            onRowClick={(row) => openRole(row, "view")}
            bulkActions={
              canDelete
                ? [
                    {
                      id: "delete",
                      label: "Supprimer",
                      tone: "danger",
                      onClick: (ids) => requestDeleteRoles(ids),
                    },
                  ]
                : undefined
            }
            toolbar={
              <Select
                aria-label="Filtrer par portée"
                className="max-w-[12rem]"
                value={scopeFilter}
                onChange={(e) =>
                  setScopeFilter(
                    e.target.value as "ALL" | "tenant" | "organization",
                  )
                }
              >
                <option value="ALL">Toutes les portées</option>
                <option value="tenant">Tenant</option>
                <option value="organization">Organisation</option>
              </Select>
            }
            onRefresh={() => void rolesQuery.refetch()}
            refreshing={rolesQuery.isFetching}
            addAction={
              canCreate
                ? {
                    label: "Ajouter",
                    onClick: () => {
                      setCreateForm(emptyCreateForm());
                      setOpen(true);
                    },
                  }
                : undefined
            }
            empty={
              <EmptyState
                title="Aucun rôle"
                description="Créez un rôle tenant ou organisation à partir du catalogue de permissions."
                actionLabel={canCreate ? "Ajouter" : undefined}
                onAction={
                  canCreate
                    ? () => {
                        setCreateForm(emptyCreateForm());
                        setOpen(true);
                      }
                    : undefined
                }
              />
            }
          />
        )
      ) : catalogQuery.isLoading ? (
        <Skeleton className="min-h-0 w-full flex-1" />
      ) : catalogQuery.isError ? (
        <ErrorState
          title="Impossible de charger le catalogue"
          description={
            catalogQuery.error instanceof Error
              ? catalogQuery.error.message
              : "Réessayez."
          }
          onRetry={() => void catalogQuery.refetch()}
        />
      ) : (
        <DataTable
          fill
          columns={permColumns}
          rows={permRows.filter((row) => {
            const q = searchInput.trim().toLowerCase();
            if (!q) return true;
            return `${row.code} ${row.description} ${row.resource} ${row.action}`
              .toLowerCase()
              .includes(q);
          })}
          search={{
            value: searchInput,
            onChange: setSearchInput,
            placeholder: "Rechercher une permission…",
          }}
          onRefresh={() => void catalogQuery.refetch()}
          refreshing={catalogQuery.isFetching}
          empty={
            <EmptyState
              title="Catalogue vide"
              description="Aucune permission n’est enregistrée côté backend."
            />
          }
        />
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setCreateForm(emptyCreateForm());
        }}
        size="lg"
        scrollBody={false}
        className="h-[min(100dvh-2rem,760px)]"
        title="Créer un rôle"
        description="Identité du rôle, portée, puis permissions du catalogue."
        dirty={
          Boolean(createForm.name) ||
          Boolean(createForm.description) ||
          createForm.permissions.length > 0
        }
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setCreateForm(emptyCreateForm());
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={
                !createForm.name.trim() ||
                createForm.permissions.length === 0 ||
                create.isPending
              }
              onClick={() => create.mutate()}
            >
              {create.isPending ? "Création…" : "Créer le rôle"}
            </Button>
          </>
        }
      >
        <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-4)]">
          <div className="shrink-0 space-y-[var(--space-4)]">
            <div className="grid gap-[var(--space-4)] sm:grid-cols-2">
              <Field label="Nom" htmlFor="role-name" required>
                <Input
                  id="role-name"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="pharmacist"
                  autoComplete="off"
                  spellCheck={false}
                />
              </Field>
              <Field label="Description" htmlFor="desc">
                <Input
                  id="desc"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Optionnel"
                />
              </Field>
            </div>

            <fieldset className="min-w-0">
              <legend className="mb-[var(--space-2)] type-sm font-medium text-[var(--text-secondary)]">
                Portée <span className="text-[var(--danger)]">*</span>
              </legend>
              <div className="grid gap-[var(--space-2)] sm:grid-cols-2">
                {SCOPE_OPTIONS.map((opt) => {
                  const active = createForm.scope === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setCreateForm((f) => ({ ...f, scope: opt.id }))
                      }
                      aria-pressed={active}
                      className={cn(
                        "rounded-[var(--radius-md)] border px-[var(--space-4)] py-[var(--space-3)] text-left transition-colors",
                        active
                          ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                          : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]",
                      )}
                    >
                      <span className="block type-sm font-semibold text-[var(--text-primary)]">
                        {opt.label}
                      </span>
                      <span className="mt-[var(--space-1)] block type-xs text-[var(--text-secondary)]">
                        {opt.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-2)]">
            <div className="flex shrink-0 items-baseline justify-between gap-[var(--space-3)]">
              <p className="type-sm font-medium text-[var(--text-secondary)]">
                Permissions <span className="text-[var(--danger)]">*</span>
              </p>
              <p className="type-xs text-[var(--text-muted)]">
                Catalogue · resource:action
              </p>
            </div>
            {catalogQuery.isLoading ? (
              <Skeleton className="min-h-[220px] w-full flex-1" />
            ) : (
              <PermissionPicker
                fill
                permissions={catalog}
                selected={createForm.permissions}
                onChange={(permissions) =>
                  setCreateForm((f) => ({ ...f, permissions }))
                }
              />
            )}
            {create.isError ? (
              <p className="shrink-0 type-sm text-[var(--danger)]">
                {create.error instanceof Error
                  ? create.error.message
                  : "Création impossible."}
              </p>
            ) : null}
          </div>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(editRole)}
        onOpenChange={(o) => {
          if (!o) closeRoleDialog();
        }}
        size="lg"
        scrollBody={false}
        className="h-[min(100dvh-2rem,760px)]"
        title={
          editRole
            ? `${editReadOnly ? "Voir" : "Modifier"} · ${editRole.name}`
            : "Rôle"
        }
        description={
          editRole
            ? [
                `Portée ${editRole.scope === "tenant" ? "tenant" : "organisation"}`,
                isSystemRole(editRole) ? "Rôle système (lecture seule)" : null,
              ]
                .filter(Boolean)
                .join(" · ")
            : undefined
        }
        dirty={!editReadOnly}
        footer={
          editReadOnly ? (
            <Button type="button" variant="secondary" onClick={closeRoleDialog}>
              Fermer
            </Button>
          ) : (
            <>
              <Button type="button" variant="ghost" onClick={closeRoleDialog}>
                Annuler
              </Button>
              <Button
                type="button"
                disabled={update.isPending || editPermissions.length === 0}
                onClick={() => update.mutate()}
              >
                {update.isPending ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </>
          )
        }
      >
        <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-4)]">
          <div className="shrink-0">
            <Field label="Description" htmlFor="edit-desc">
              <Input
                id="edit-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Optionnel"
                disabled={editReadOnly}
              />
            </Field>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-2)]">
            <div className="flex shrink-0 items-baseline justify-between gap-[var(--space-3)]">
              <p className="type-sm font-medium text-[var(--text-secondary)]">
                Permissions
                {!editReadOnly ? (
                  <span className="text-[var(--danger)]"> *</span>
                ) : null}
              </p>
              <p className="type-xs text-[var(--text-muted)]">
                Catalogue · resource:action
              </p>
            </div>
            {catalogQuery.isLoading ? (
              <Skeleton className="min-h-[220px] w-full flex-1" />
            ) : (
              <PermissionPicker
                fill
                disabled={editReadOnly}
                permissions={catalog}
                selected={editPermissions}
                onChange={setEditPermissions}
              />
            )}
            {update.isError && !editReadOnly ? (
              <p className="shrink-0 type-sm text-[var(--danger)]">
                {update.error instanceof Error
                  ? update.error.message
                  : "Enregistrement impossible."}
              </p>
            ) : null}
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={deleteIds.length > 0}
        onOpenChange={(o) => {
          if (!o) setDeleteIds([]);
        }}
        title={
          deleteIds.length > 1
            ? `Supprimer ${deleteIds.length} rôles ?`
            : "Supprimer le rôle ?"
        }
        description="Seuls les rôles personnalisés peuvent être supprimés. Cette action est définitive."
        confirmLabel="Supprimer"
        tone="danger"
        loading={remove.isPending}
        onConfirm={() => {
          if (deleteIds.length) remove.mutate(deleteIds);
        }}
      />
    </FillSection>
  );
}

export default function RolesPage() {
  return (
    <FillPage>
      <PageHeader
        className="mb-[var(--space-4)]"
        title="Rôles & permissions"
        description="Rôles tenant ou organisation, et catalogue des permissions backend. Les portées fines (org / entrepôt) se gèrent sur les memberships."
      />
      <PermissionGate
        permission="roles:read"
        fallback={
          <EmptyState
            title="Accès restreint"
            description="Permission roles:read requise. Le catalogue nécessite aussi permissions:read."
          />
        }
      >
        <RolesPanel />
      </PermissionGate>
    </FillPage>
  );
}
