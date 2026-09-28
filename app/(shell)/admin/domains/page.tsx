"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminGate } from "@/components/shell/admin-gate";
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/shell/page-header";
import { FillPage, FillSection } from "@/components/shell/fill-page";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { RowActions } from "@/components/data/row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, type TenantDomain } from "@/lib/api/admin";
import { qk } from "@/lib/query/keys";
import { useApiClient } from "@/providers/platform-provider";

function DomainsWizard() {
  const client = useApiClient();
  const api = adminApi(client);
  const qc = useQueryClient();
  const [tenantId, setTenantId] = useState("");
  const [loadedId, setLoadedId] = useState("");
  const [hostname, setHostname] = useState("");
  const [type, setType] = useState("CUSTOM");
  const [verifyInfo, setVerifyInfo] = useState<{
    domainId: string;
    txtName: string;
    token: string;
    instructions: string;
  } | null>(null);
  const [checkToken, setCheckToken] = useState("");

  const query = useQuery({
    queryKey: qk.admin.domains(loadedId),
    enabled: Boolean(loadedId),
    queryFn: async () => api.domains.list(loadedId),
  });

  const register = useMutation({
    mutationFn: () =>
      api.domains.register(loadedId, { hostname, type }),
    onSuccess: async () => {
      setHostname("");
      await qc.invalidateQueries({ queryKey: qk.admin.domains(loadedId) });
    },
  });

  const verifyStart = useMutation({
    mutationFn: (domainId: string) =>
      api.domains.verifyStart(loadedId, domainId),
    onSuccess: (res, domainId) => {
      setVerifyInfo({
        domainId,
        txtName: res.data.txtName,
        token: res.data.token,
        instructions: res.data.instructions,
      });
      setCheckToken(res.data.token);
    },
  });

  const verifyCheck = useMutation({
    mutationFn: () =>
      api.domains.verifyCheck(
        loadedId,
        verifyInfo!.domainId,
        checkToken || verifyInfo!.token,
      ),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.admin.domains(loadedId) });
    },
  });

  const columns = useMemo<DataTableColumn<TenantDomain>[]>(
    () => [
      {
        id: "code",
        header: "Code",
        sortable: true,
        sortValue: (row) => row.hostname,
        cell: (row) => (
          <span className="font-medium uppercase tracking-wide">
            {row.hostname}
          </span>
        ),
      },
      {
        id: "label",
        header: "Libellé",
        sortable: true,
        sortValue: (row) => row.type,
        cell: (row) => <span className="font-medium">{row.type}</span>,
      },
      {
        id: "description",
        header: "Description",
        cell: (row) => (
          <span className="text-[var(--text-secondary)]">{row.status}</span>
        ),
      },
      {
        id: "status",
        header: "Statut",
        cell: (row) => (
          <Badge tone={row.status === "ACTIVE" ? "success" : "info"}>
            {row.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Action",
        actions: true,
        cell: (row) =>
          row.status !== "ACTIVE" ? (
            <RowActions
              onEdit={() => verifyStart.mutate(row.id)}
              editLabel="Démarrer la vérification"
            />
          ) : null,
      },
    ],
    [verifyStart],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-4)] overflow-hidden">
      <div className="flex shrink-0 max-w-xl flex-wrap gap-2">
        <Input
          className="max-w-md"
          placeholder="Tenant UUID"
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
        />
        <Button
          type="button"
          onClick={() => setLoadedId(tenantId.trim())}
          disabled={!tenantId.trim()}
        >
          Load domains
        </Button>
      </div>

      {!loadedId ? (
        <EmptyState
          title="Enter a tenant id"
          description="Register and verify custom domains for a provisioned tenant."
        />
      ) : query.isLoading ? (
        <Skeleton className="min-h-0 w-full flex-1" />
      ) : query.isError ? (
        <ErrorState
          title="Couldn't load domains"
          description={
            query.error instanceof Error
              ? query.error.message
              : "Try again."
          }
          onRetry={() => void query.refetch()}
        />
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <DataTable
              columns={columns}
              rows={query.data?.data ?? []}
              onRefresh={() => void query.refetch()}
              refreshing={query.isFetching}
              addAction={{
                label: "Ajouter",
                onClick: () => {
                  if (hostname) register.mutate();
                },
                disabled: !hostname || register.isPending,
              }}
              empty={
                <EmptyState
                  title="No domains"
                  description="Register a hostname to begin verification."
                />
              }
            />
          </div>

          <section className="max-w-lg shrink-0 space-y-3 overflow-y-auto rounded-md border border-[var(--border)] p-4">
            <h2 className="text-sm font-semibold">Register domain</h2>
            <Field label="Hostname" htmlFor="host">
              <Input
                id="host"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                placeholder="example.com"
              />
            </Field>
            <Field label="Type" htmlFor="type">
              <Select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="CUSTOM">CUSTOM</option>
                <option value="SUBDOMAIN">SUBDOMAIN</option>
              </Select>
            </Field>
            <Button
              type="button"
              disabled={!hostname || register.isPending}
              onClick={() => register.mutate()}
            >
              {register.isPending ? "Registering…" : "Register"}
            </Button>
          </section>

          {verifyInfo ? (
            <section className="max-w-xl shrink-0 space-y-3 overflow-y-auto rounded-md border border-[var(--border)] p-4">
              <h2 className="text-sm font-semibold">DNS verification</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {verifyInfo.instructions}
              </p>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-[var(--text-muted)]">TXT name</dt>
                  <dd className="font-mono text-xs">{verifyInfo.txtName}</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">Token</dt>
                  <dd className="break-all font-mono text-xs">
                    {verifyInfo.token}
                  </dd>
                </div>
              </dl>
              <Field label="Confirm token" htmlFor="tok">
                <Input
                  id="tok"
                  value={checkToken}
                  onChange={(e) => setCheckToken(e.target.value)}
                />
              </Field>
              <Button
                type="button"
                disabled={!checkToken || verifyCheck.isPending}
                onClick={() => verifyCheck.mutate()}
              >
                {verifyCheck.isPending ? "Checking…" : "Verify check"}
              </Button>
              {verifyCheck.isError ? (
                <p className="text-sm text-[var(--danger)]">
                  {verifyCheck.error instanceof Error
                    ? verifyCheck.error.message
                    : "Verification failed"}
                </p>
              ) : null}
              {verifyCheck.isSuccess ? (
                <p className="text-sm text-emerald-700">Domain verified.</p>
              ) : null}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function AdminDomainsPage() {
  return (
    <FillPage>
      <PageHeader
        className="mb-[var(--space-4)]"
        title="Tenant domains"
        description="Register hostnames and complete DNS TXT verification."
      />
      <AdminGate>
        <FillSection>
          <DomainsWizard />
        </FillSection>
      </AdminGate>
    </FillPage>
  );
}
