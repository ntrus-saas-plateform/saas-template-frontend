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
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { RowActions } from "@/components/data/row-actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/feedback/toast";
import { identityApi, type IdentityProviderInfo } from "@/lib/api/identity";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { hasPermission } from "@/lib/access/permissions";
import Link from "next/link";

const PROVIDER_TYPES = [
  { value: "google", label: "Google" },
  { value: "microsoft", label: "Microsoft" },
  { value: "github", label: "GitHub" },
  { value: "oidc", label: "OpenID Connect" },
  { value: "saml", label: "SAML" },
];

function IdpFormDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: IdentityProviderInfo | null;
}) {
  const client = useApiClient();
  const { context } = usePlatform();
  const api = identityApi(client);
  const qc = useQueryClient();
  const toast = useToast();
  const editing = !!initial;

  const [alias, setAlias] = useState(initial?.alias ?? "");
  const [providerId, setProviderId] = useState(initial?.providerId ?? "google");
  const [displayName, setDisplayName] = useState(initial?.displayName ?? "");
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [linkOnly, setLinkOnly] = useState(initial?.linkOnly ?? false);
  const [clientId, setClientId] = useState(initial?.config?.clientId ?? "");
  const [clientSecret, setClientSecret] = useState("");
  const [authorizationUrl, setAuthorizationUrl] = useState(
    initial?.config?.authorizationUrl ?? "",
  );
  const [tokenUrl, setTokenUrl] = useState(initial?.config?.tokenUrl ?? "");
  const [defaultScope, setDefaultScope] = useState(
    initial?.config?.defaultScope ?? "openid email profile",
  );

  const save = useMutation({
    mutationFn: async () => {
      const config: Record<string, string> = {};
      if (clientId.trim()) config.clientId = clientId.trim();
      if (clientSecret.trim()) config.clientSecret = clientSecret.trim();
      if (authorizationUrl.trim())
        config.authorizationUrl = authorizationUrl.trim();
      if (tokenUrl.trim()) config.tokenUrl = tokenUrl.trim();
      if (defaultScope.trim()) config.defaultScope = defaultScope.trim();

      if (editing && initial) {
        return api.security.updateIdentityProvider(initial.alias, {
          displayName: displayName.trim() || null,
          enabled,
          linkOnly,
          config,
        });
      }
      return api.security.createIdentityProvider({
        alias: alias.trim().toLowerCase(),
        providerId,
        displayName: displayName.trim() || undefined,
        enabled,
        linkOnly,
        config,
      });
    },
    onSuccess: async () => {
      toast.push({
        title: editing ? "Identity provider updated" : "Identity provider created",
        tone: "success",
      });
      await qc.invalidateQueries({
        queryKey: qk.identity(context?.organizationId).identityProviders(),
      });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit identity provider" : "Add identity provider"}
    >
      <div className="grid max-h-[70vh] gap-3 overflow-y-auto pr-1">
        {!editing ? (
          <>
            <Field label="Alias">
              <Input
                value={alias}
                onChange={(e) => setAlias(e.target.value.toLowerCase())}
                placeholder="google"
              />
            </Field>
            <Field label="Provider type">
              <Select
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
              >
                {PROVIDER_TYPES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            Alias <span className="font-mono">{initial?.alias}</span> ·{" "}
            {initial?.providerId}
          </p>
        )}
        <Field label="Display name">
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Google"
          />
        </Field>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            Enabled
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={linkOnly} onCheckedChange={setLinkOnly} />
            Link only
          </label>
        </div>
        <Field label="Client ID">
          <Input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            autoComplete="off"
          />
        </Field>
        <Field label="Client secret">
          <Input
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder={editing ? "Leave blank to keep current" : ""}
            autoComplete="new-password"
          />
        </Field>
        {(providerId === "oidc" || editing) && (
          <>
            <Field label="Authorization URL">
              <Input
                value={authorizationUrl}
                onChange={(e) => setAuthorizationUrl(e.target.value)}
              />
            </Field>
            <Field label="Token URL">
              <Input
                value={tokenUrl}
                onChange={(e) => setTokenUrl(e.target.value)}
              />
            </Field>
          </>
        )}
        <Field label="Default scope">
          <Input
            value={defaultScope}
            onChange={(e) => setDefaultScope(e.target.value)}
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={
              save.isPending || (!editing && alias.trim().length < 2)
            }
            onClick={() => save.mutate()}
          >
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function IdentityProvidersPanel() {
  const client = useApiClient();
  const { context, capabilities } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const api = identityApi(client);
  const qc = useQueryClient();
  const toast = useToast();
  const canUpdate = hasPermission(
    capabilities?.permissions,
    "security:update",
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<IdentityProviderInfo | null>(null);
  const [deleteAlias, setDeleteAlias] = useState<string | null>(null);

  const query = useQuery({
    queryKey: idk.identityProviders(),
    queryFn: async () => api.security.identityProviders(),
  });

  const rows = (query.data?.data?.providers ?? []).map((p) => ({
    ...p,
    id: p.alias,
  }));
  const available = query.data?.data?.keycloakAvailable ?? false;

  const remove = useMutation({
    mutationFn: (alias: string) => api.security.deleteIdentityProvider(alias),
    onSuccess: async () => {
      setDeleteAlias(null);
      toast.push({ title: "Identity provider deleted", tone: "success" });
      await qc.invalidateQueries({ queryKey: idk.identityProviders() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const toggleEnabled = useMutation({
    mutationFn: (row: IdentityProviderInfo) =>
      api.security.updateIdentityProvider(row.alias, {
        enabled: !row.enabled,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: idk.identityProviders() });
    },
    onError: (e: Error) => toast.push({ title: e.message, tone: "danger" }),
  });

  const columns = useMemo<
    DataTableColumn<IdentityProviderInfo & { id: string }>[]
  >(
    () => [
      {
        id: "code",
        header: "Code",
        sortable: true,
        sortValue: (row) => row.alias,
        cell: (row) => (
          <span className="font-medium uppercase tracking-wide">
            {row.alias}
          </span>
        ),
      },
      {
        id: "label",
        header: "Libellé",
        sortable: true,
        sortValue: (row) => row.displayName || row.providerId,
        cell: (row) => (
          <span className="font-medium">
            {row.displayName || row.providerId}
          </span>
        ),
      },
      {
        id: "description",
        header: "Description",
        cell: (row) => (
          <span className="text-[var(--text-secondary)]">
            {row.providerId}
            {row.linkOnly ? " · lien uniquement" : " · connexion"}
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
              checked={row.enabled}
              disabled={!canUpdate || toggleEnabled.isPending}
              aria-label={row.alias}
              onCheckedChange={() => toggleEnabled.mutate(row)}
            />
          </div>
        ),
      },
      {
        id: "actions",
        header: "Action",
        actions: true,
        cell: (row) =>
          canUpdate ? (
            <RowActions
              onEdit={() => setEditRow(row)}
              onDelete={() => setDeleteAlias(row.alias)}
            />
          ) : null,
      },
    ],
    [canUpdate, toggleEnabled.isPending],
  );

  return (
    <>
      <FillPage>
        <PageHeader
          className="mb-[var(--space-4)]"
          title="Identity providers"
          description="Keycloak realm brokers (Google, Microsoft, SAML, OIDC…). Create and configure here; secrets stay in Keycloak."
        />
        <FillSection>
          <p className="shrink-0 text-sm text-[var(--text-muted)]">
            Users link accounts under{" "}
            <Link className="underline" href="/settings/security">
              My identity &amp; security
            </Link>
            .
          </p>

          {!available && !query.isLoading ? (
            <p className="shrink-0 text-sm text-amber-700">
              Keycloak admin unavailable — provider list empty.
            </p>
          ) : null}

          {query.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : query.isError ? (
            <ErrorState
              title="Couldn't load identity providers"
              description={
                query.error instanceof Error ? query.error.message : "Try again."
              }
              onRetry={() => void query.refetch()}
            />
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              onRefresh={() => void query.refetch()}
              refreshing={query.isFetching}
              addAction={
                canUpdate
                  ? { label: "Ajouter", onClick: () => setCreateOpen(true) }
                  : undefined
              }
              empty={
                <EmptyState
                  title="No identity providers"
                  description="Add a broker (Google, OIDC, SAML…) to enable federated login."
                />
              }
            />
          )}
        </FillSection>
      </FillPage>

      <IdpFormDialog
        key={createOpen ? "create-open" : "create-closed"}
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={null}
      />
      <IdpFormDialog
        key={editRow?.alias ?? "edit-closed"}
        open={!!editRow}
        onOpenChange={(open) => {
          if (!open) setEditRow(null);
        }}
        initial={editRow}
      />
      <ConfirmDialog
        open={!!deleteAlias}
        onOpenChange={(open) => {
          if (!open) setDeleteAlias(null);
        }}
        title="Delete identity provider?"
        description={
          deleteAlias
            ? `Remove “${deleteAlias}” from the Keycloak realm? Users will no longer be able to sign in with it.`
            : ""
        }
        confirmLabel="Delete"
        tone="danger"
        loading={remove.isPending}
        onConfirm={() => {
          if (deleteAlias) remove.mutate(deleteAlias);
        }}
      />
    </>
  );
}

export default function IdentityProvidersPage() {
  return (
    <PermissionGate permission="security:read">
      <IdentityProvidersPanel />
    </PermissionGate>
  );
}
