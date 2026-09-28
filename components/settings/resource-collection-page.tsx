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
import { SettingFieldControl } from "@/components/settings/setting-field-control";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { RowActions } from "@/components/data/row-actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission } from "@/lib/access/permissions";
import type { FieldControl } from "@/lib/settings/field-catalog";
import type { SelectOption } from "@/lib/settings/options";
import { identityApi } from "@/lib/api/identity";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { useToast } from "@/components/feedback/toast";

export type ResourceField = {
  key: string;
  label: string;
  control?: FieldControl;
  options?: SelectOption[];
  getOptions?: () => SelectOption[];
  placeholder?: string;
  hint?: string;
  fullWidth?: boolean;
};

type CatalogRow = Record<string, unknown> & { id: string };

function asText(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return value.map((v) => String(v)).join(", ");
  return String(value);
}

function catalogCode(row: CatalogRow): string {
  return (
    asText(row.code) ||
    asText(row.key) ||
    asText(row.sku) ||
    asText(row.documentType) ||
    asText(row.provider) ||
    asText(row.alias) ||
    asText(row.invoiceNumber) ||
    asText(row.planCode) ||
    "—"
  );
}

function catalogLabel(row: CatalogRow): string {
  return (
    asText(row.name) ||
    asText(row.label) ||
    asText(row.displayName) ||
    asText(row.url) ||
    asText(row.jobType) ||
    "—"
  );
}

function catalogDescription(row: CatalogRow): string {
  return (
    asText(row.description) ||
    asText(row.reason) ||
    asText(row.category) ||
    [asText(row.country), asText(row.region)].filter(Boolean).join(" · ") ||
    asText(row.bodyHtml)?.slice(0, 80) ||
    "—"
  );
}

function catalogActive(row: CatalogRow): boolean | null {
  if (typeof row.isActive === "boolean") return row.isActive;
  if (typeof row.enabled === "boolean") return row.enabled;
  if (typeof row.status === "string") {
    const s = row.status.toUpperCase();
    if (["ACTIVE", "ENABLED", "ON"].includes(s)) return true;
    if (["INACTIVE", "DISABLED", "OFF", "SUSPENDED", "ARCHIVED"].includes(s)) {
      return false;
    }
  }
  return null;
}

function statusPatch(row: CatalogRow, next: boolean): Record<string, unknown> {
  if (typeof row.isActive === "boolean") return { isActive: next };
  if (typeof row.enabled === "boolean") return { enabled: next };
  if (typeof row.status === "string") {
    return { status: next ? "ACTIVE" : "INACTIVE" };
  }
  return { isActive: next };
}

function rowToForm(
  row: CatalogRow,
  fields: ResourceField[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of fields) {
    const raw = row[field.key];
    if (raw == null) {
      out[field.key] = field.control === "boolean" ? "false" : "";
      continue;
    }
    out[field.key] = asText(raw);
  }
  return out;
}

function formToBody(
  form: Record<string, string>,
  fields: ResourceField[],
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const f of fields) {
    const raw = form[f.key] ?? "";
    if (raw === "" && f.control !== "boolean") continue;
    const control = f.control ?? "text";
    if (control === "number") {
      const n = Number(raw);
      body[f.key] = Number.isFinite(n) ? n : raw;
    } else if (control === "boolean") {
      body[f.key] = raw === "true";
    } else if (control === "stringList" || control === "multiSelect") {
      body[f.key] = raw
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      body[f.key] = raw;
    }
  }
  return body;
}

export function ResourceCollectionPage({
  title,
  description,
  resource,
  permission = "settings:read",
  createFields,
  hideHeader = false,
  surface = "full",
}: {
  title: string;
  description: string;
  resource: string;
  permission?: string;
  createFields: ResourceField[];
  hideHeader?: boolean;
  surface?: "full" | "list" | "form";
}) {
  const client = useApiClient();
  const api = identityApi(client);
  const { context, capabilities } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const qc = useQueryClient();
  const { push } = useToast();
  const perms = capabilities?.permissions ?? context?.permissions ?? [];
  const canUpdate = hasPermission(perms, "settings:update");
  const [form, setForm] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<CatalogRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: [...idk.settings(resource), "resource"],
    queryFn: async () => api.tenantSettings.list(resource),
  });

  const rows = useMemo<CatalogRow[]>(
    () =>
      (query.data?.data ?? []).map((r) => ({
        ...r,
        id: String(r.id),
      })),
    [query.data?.data],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = [catalogCode(r), catalogLabel(r), catalogDescription(r)]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  const invalidate = async () => {
    await qc.invalidateQueries({
      queryKey: [...idk.settings(resource), "resource"],
    });
  };

  const patch = useMutation({
    mutationFn: (input: { id: string; body: Record<string, unknown> }) =>
      api.tenantSettings.update(resource, input.id, input.body),
    onSuccess: async () => {
      await invalidate();
    },
    onError: () => push({ title: "Mise à jour impossible", tone: "danger" }),
  });

  const create = useMutation({
    mutationFn: async () =>
      api.tenantSettings.create(resource, formToBody(form, createFields)),
    onSuccess: async () => {
      setForm({});
      setDialogMode(null);
      await invalidate();
      push({ title: "Créé", tone: "success" });
    },
    onError: () => push({ title: "Création impossible", tone: "danger" }),
  });

  const update = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      return api.tenantSettings.update(
        resource,
        editing.id,
        formToBody(form, createFields),
      );
    },
    onSuccess: async () => {
      setEditing(null);
      setDialogMode(null);
      setForm({});
      await invalidate();
      push({ title: "Enregistré", tone: "success" });
    },
    onError: () => push({ title: "Enregistrement impossible", tone: "danger" }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.tenantSettings.remove(resource, id),
    onSuccess: async () => {
      setDeleteId(null);
      await invalidate();
      push({ title: "Supprimé", tone: "success" });
    },
    onError: () => push({ title: "Suppression impossible", tone: "danger" }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({});
    setDialogMode("create");
  };

  const openEdit = (row: CatalogRow) => {
    setEditing(row);
    setForm(rowToForm(row, createFields));
    setDialogMode("edit");
  };

  const columns = useMemo<DataTableColumn<CatalogRow>[]>(() => {
    const showStatus = rows.some((row) => catalogActive(row) !== null);
    const cols: DataTableColumn<CatalogRow>[] = [
      {
        id: "code",
        header: "Code",
        sortable: true,
        sortValue: (row) => catalogCode(row),
        cell: (row) => (
          <span className="font-medium uppercase tracking-wide">
            {catalogCode(row)}
          </span>
        ),
      },
      {
        id: "label",
        header: "Libellé",
        sortable: true,
        sortValue: (row) => catalogLabel(row),
        cell: (row) => (
          <span className="font-medium">{catalogLabel(row)}</span>
        ),
      },
      {
        id: "description",
        header: "Description",
        sortable: true,
        sortValue: (row) => catalogDescription(row),
        cell: (row) => (
          <span className="text-[var(--text-secondary)]">
            {catalogDescription(row)}
          </span>
        ),
      },
    ];
    if (showStatus) {
      cols.push({
        id: "status",
        header: "Statut",
        align: "center",
        sortable: true,
        sortValue: (row) => (catalogActive(row) ? 1 : 0),
        cell: (row) => {
          const active = catalogActive(row);
          if (active == null) return "—";
          return (
            <div className="flex justify-center">
              <Switch
                checked={active}
                disabled={!canUpdate || patch.isPending}
                aria-label={`Statut de ${catalogLabel(row)}`}
                onCheckedChange={(next) =>
                  patch.mutate({ id: row.id, body: statusPatch(row, next) })
                }
              />
            </div>
          );
        },
      });
    }
    cols.push({
      id: "actions",
      header: "Action",
      actions: true,
      hideable: false,
      cell: (row) =>
        canUpdate ? (
          <RowActions
            onEdit={() => openEdit(row)}
            onDelete={() => setDeleteId(row.id)}
          />
        ) : null,
    });
    return cols;
  }, [canUpdate, patch.isPending, rows]);

  const formFields = (
    <>
      {createFields.map((f) => (
        <div key={f.key} className={f.fullWidth ? "sm:col-span-2" : undefined}>
          <SettingFieldControl
            meta={{
              key: f.key,
              label: f.label,
              control: f.control ?? "text",
              options: f.options,
              getOptions: f.getOptions,
              placeholder: f.placeholder,
              hint: f.hint,
              fullWidth: f.fullWidth,
            }}
            value={form[f.key] ?? (f.control === "boolean" ? "false" : "")}
            onChange={(next) =>
              setForm((prev) => ({ ...prev, [f.key]: next }))
            }
          />
        </div>
      ))}
    </>
  );

  const table = (
    <>
      <DataTable
        columns={columns}
        rows={filtered}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: `Rechercher dans ${title.toLowerCase()}…`,
        }}
        onRefresh={() => void query.refetch()}
        refreshing={query.isFetching}
        addAction={
          canUpdate ? { label: "Ajouter", onClick: openCreate } : undefined
        }
        empty={
          <EmptyState
            title="Aucun enregistrement"
            description={description}
            actionLabel={canUpdate ? "Ajouter" : undefined}
            onAction={canUpdate ? openCreate : undefined}
          />
        }
      />
      <Dialog
        open={dialogMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialogMode(null);
            setEditing(null);
          }
        }}
        title={dialogMode === "edit" ? "Modifier" : "Ajouter"}
        description={title}
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDialogMode(null);
                setEditing(null);
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={create.isPending || update.isPending}
              onClick={() =>
                dialogMode === "edit" ? update.mutate() : create.mutate()
              }
            >
              {create.isPending || update.isPending
                ? "Enregistrement…"
                : dialogMode === "edit"
                  ? "Enregistrer"
                  : "Ajouter"}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">{formFields}</div>
      </Dialog>
      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Supprimer cet enregistrement ?"
        description="Cette action est définitive."
        confirmLabel="Supprimer"
        tone="danger"
        loading={remove.isPending}
        onConfirm={() => {
          if (deleteId) remove.mutate(deleteId);
        }}
      />
    </>
  );

  const body = query.isLoading ? (
    <Skeleton className="min-h-0 w-full flex-1" />
  ) : query.isError ? (
    <ErrorState
      title="Impossible de charger la collection"
      description="Réessayez ou vérifiez vos permissions."
      onRetry={() => void query.refetch()}
    />
  ) : surface === "form" ? (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {formFields}
      <div className="flex justify-end sm:col-span-2">
        <Button disabled={create.isPending || !canUpdate} onClick={() => create.mutate()}>
          {create.isPending ? "Création…" : "Ajouter"}
        </Button>
      </div>
    </div>
  ) : (
    table
  );

  return (
    <PermissionGate permission={permission}>
      <FillPage>
        {hideHeader ? null : (
          <PageHeader
            className="mb-[var(--space-4)]"
            title={title}
            description={description}
          />
        )}
        <FillSection>{body}</FillSection>
      </FillPage>
    </PermissionGate>
  );
}
