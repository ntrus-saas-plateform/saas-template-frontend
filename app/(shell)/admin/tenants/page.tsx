"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AdminGate } from "@/components/shell/admin-gate";
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api/admin";
import { qk } from "@/lib/query/keys";
import { useApiClient } from "@/providers/platform-provider";

function TenantsAdmin() {
  const client = useApiClient();
  const api = adminApi(client);

  const [slug, setSlug] = useState("");
  const [region, setRegion] = useState("");
  const [environment, setEnvironment] = useState("");
  const [ownerIdentityId, setOwner] = useState("");
  const [defaultOrgName, setDefaultOrgName] = useState("");
  const [lookupId, setLookupId] = useState("");
  const [activeTenantId, setActiveTenantId] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [hardDelete, setHardDelete] = useState(false);
  const [lastProvision, setLastProvision] = useState<Record<
    string,
    unknown
  > | null>(null);

  const healthQuery = useQuery({
    queryKey: qk.admin.tenantHealth(activeTenantId),
    enabled: Boolean(activeTenantId),
    queryFn: async () => api.tenants.health(activeTenantId),
  });

  const provision = useMutation({
    mutationFn: () =>
      api.tenants.provision(
        {
          slug,
          region: region || undefined,
          environment: environment || undefined,
          ownerIdentityId: ownerIdentityId || undefined,
          bootstrapOrganization: true,
          defaultOrganizationName: defaultOrgName || undefined,
          defaultOrganizationSlug: defaultOrgName
            ? defaultOrgName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")
            : undefined,
        },
        crypto.randomUUID(),
      ),
    onSuccess: (res) => {
      setLastProvision(res.data as Record<string, unknown>);
      if (res.data?.tenantId) {
        setActiveTenantId(String(res.data.tenantId));
        setLookupId(String(res.data.tenantId));
      }
    },
  });

  const retry = useMutation({
    mutationFn: () => api.tenants.retryProvisioning(activeTenantId),
    onSuccess: (res) => {
      setLastProvision(res.data as Record<string, unknown>);
      void healthQuery.refetch();
    },
  });

  const transition = useMutation({
    mutationFn: () => api.tenants.status(activeTenantId, status),
    onSuccess: () => void healthQuery.refetch(),
  });

  const remove = useMutation({
    mutationFn: () => api.tenants.delete(activeTenantId, hardDelete),
    onSuccess: () => {
      setDeleteOpen(false);
      setActiveTenantId("");
    },
  });

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Provision tenant</h2>
        <Field label="Slug" htmlFor="slug">
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="tenant-slug"
          />
        </Field>
        <Field label="Region" htmlFor="region">
          <Input
            id="region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="Optional"
          />
        </Field>
        <Field label="Environment" htmlFor="env">
          <Input
            id="env"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            placeholder="Optional"
          />
        </Field>
        <Field label="Owner identity id" htmlFor="owner">
          <Input
            id="owner"
            value={ownerIdentityId}
            onChange={(e) => setOwner(e.target.value)}
          />
        </Field>
        <Field label="Default org name" htmlFor="org">
          <Input
            id="org"
            value={defaultOrgName}
            onChange={(e) => setDefaultOrgName(e.target.value)}
          />
        </Field>
        <Button
          type="button"
          disabled={!slug || provision.isPending}
          onClick={() => provision.mutate()}
        >
          {provision.isPending ? "Provisioning…" : "Provision"}
        </Button>
        {provision.isError ? (
          <p className="text-sm text-[var(--danger)]">
            {provision.error instanceof Error
              ? provision.error.message
              : "Provision failed"}
          </p>
        ) : null}
        {lastProvision ? (
          <pre className="overflow-auto rounded-md bg-[var(--secondary)] p-3 text-xs">
            {JSON.stringify(lastProvision, null, 2)}
          </pre>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Manage tenant</h2>
        <Field label="Tenant id" htmlFor="tid">
          <div className="flex gap-2">
            <Input
              id="tid"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTenantId(lookupId.trim())}
            >
              Load
            </Button>
          </div>
        </Field>

        {activeTenantId ? (
          <>
            <p className="text-xs text-[var(--text-muted)]">
              Active:{" "}
              <span className="font-mono">{activeTenantId}</span>
            </p>
            {healthQuery.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : healthQuery.isError ? (
              <ErrorState
                title="Health check failed"
                description={
                  healthQuery.error instanceof Error
                    ? healthQuery.error.message
                    : "Try again."
                }
                onRetry={() => void healthQuery.refetch()}
              />
            ) : healthQuery.data?.data ? (
              <div className="space-y-2 rounded-md border border-[var(--border)] p-3 text-sm">
                <div className="flex items-center gap-2">
                  <span>Database</span>
                  <Badge
                    tone={
                      healthQuery.data.data.database?.reachable
                        ? "success"
                        : "danger"
                    }
                  >
                    {healthQuery.data.data.database?.reachable
                      ? "reachable"
                      : "unreachable"}
                  </Badge>
                </div>
                <pre className="max-h-48 overflow-auto text-xs">
                  {JSON.stringify(healthQuery.data.data, null, 2)}
                </pre>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={retry.isPending}
                onClick={() => retry.mutate()}
              >
                Retry provisioning
              </Button>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-40"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="PROVISIONING">PROVISIONING</option>
                <option value="DELETED">DELETED</option>
              </Select>
              <Button
                type="button"
                variant="outline"
                disabled={transition.isPending}
                onClick={() => transition.mutate()}
              >
                Set status
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  setHardDelete(false);
                  setDeleteOpen(true);
                }}
              >
                Soft delete
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  setHardDelete(true);
                  setDeleteOpen(true);
                }}
              >
                Hard delete
              </Button>
            </div>
          </>
        ) : (
          <EmptyState
            title="Select a tenant"
            description="Enter a tenant UUID and load health, status, retry, or delete."
          />
        )}
      </section>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={hardDelete ? "Hard delete tenant?" : "Soft delete tenant?"}
        description={
          hardDelete
            ? "Drops database and role when possible. Irreversible."
            : "Marks the tenant DELETED without dropping infrastructure."
        }
        confirmLabel="Delete"
        tone="danger"
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}

export default function AdminTenantsPage() {
  return (
    <div>
      <PageHeader
        title="Tenant provisioning"
        description="Platform-admin tools to provision, inspect, and deprovision tenants."
      />
      <AdminGate>
        <TenantsAdmin />
      </AdminGate>
    </div>
  );
}
