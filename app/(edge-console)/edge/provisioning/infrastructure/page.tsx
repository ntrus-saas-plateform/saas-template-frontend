"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  InfraCountCard,
  InfraEmpty,
  InfraError,
  InfraFilters,
  InfraForbidden,
  InfraLoading,
  InfraPagination,
  InfraStatusBadge,
  InfraTableShell,
  formatInfraDate,
} from "@/components/edge/infrastructure/shared";
import { edgeApi } from "@/lib/api/edge";
import {
  DATABASE_ENGINE_OPTIONS,
  PLAN_STATUS_OPTIONS,
  RESOURCE_STATUS_OPTIONS,
  aggregateInfraOverview,
  emptyInfraOverviewCounts,
  infrastructureErrMessage,
  redactSecretRef,
  shortId,
  unwrapInfraList,
} from "@/lib/edge/infrastructure";
import { unwrapRegistryList } from "@/lib/edge/registry";
import {
  hasAnyEdgePermission,
  hasEdgePermission,
} from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type {
  DatabaseResourceRecord,
  InfrastructureProviderRecord,
  InfrastructureResourceRecord,
  ResourcePlanRecord,
} from "@/types/edge-infrastructure";

type TabId =
  | "overview"
  | "providers"
  | "plans"
  | "resources"
  | "databases"
  | "backups";

const TABS: { id: TabId; label: string; permissions: string[] }[] = [
  { id: "overview", label: "Overview", permissions: ["platform:infrastructure:read"] },
  { id: "providers", label: "Providers", permissions: ["platform:infrastructure:read"] },
  { id: "plans", label: "Resource Plans", permissions: ["platform:infrastructure:read"] },
  { id: "resources", label: "Resources", permissions: ["platform:infrastructure:read"] },
  { id: "databases", label: "Databases", permissions: ["platform:database:read"] },
  { id: "backups", label: "Backup & Restore", permissions: ["platform:database:backup"] },
];

export default function InfrastructurePage() {
  const { permissions } = useEdgePlatform();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabId>("overview");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const [confirmDeprovisionId, setConfirmDeprovisionId] = useState<string | null>(null);

  const canRead = hasEdgePermission(permissions, "platform:infrastructure:read");
  const canManage = hasEdgePermission(permissions, "platform:infrastructure:manage");
  const canDbRead = hasEdgePermission(permissions, "platform:database:read");

  const providersQ = useQuery({
    queryKey: ["infra", "providers"],
    queryFn: () => edgeApi.listInfrastructureProviders(),
    enabled: canRead,
  });
  const plansQ = useQuery({
    queryKey: ["infra", "plans", status, offset],
    queryFn: () =>
      edgeApi.listResourcePlans({ limit, offset, status: status || undefined }),
    enabled: canRead && (tab === "plans" || tab === "overview"),
  });
  const resourcesQ = useQuery({
    queryKey: ["infra", "resources", status, offset],
    queryFn: () =>
      edgeApi.listInfrastructureResources({
        limit,
        offset,
        status: status || undefined,
      }),
    enabled: canRead && (tab === "resources" || tab === "overview" || tab === "backups"),
  });
  const databasesQ = useQuery({
    queryKey: ["infra", "databases", status, offset],
    queryFn: () =>
      edgeApi.listDatabaseResources({
        limit,
        offset,
        status: status || undefined,
      }),
    enabled: canDbRead && (tab === "databases" || tab === "overview"),
  });

  const productsQ = useQuery({
    queryKey: ["registry", "products-for-infra"],
    queryFn: () => edgeApi.listRegistryProducts({ limit: 100 }),
    enabled: canManage,
  });
  const providersList = unwrapInfraList<InfrastructureProviderRecord>(providersQ.data);
  const plans = unwrapInfraList<ResourcePlanRecord>(plansQ.data);
  const resources = unwrapInfraList<InfrastructureResourceRecord>(resourcesQ.data);
  const databases = unwrapInfraList<DatabaseResourceRecord>(databasesQ.data);
  const products = unwrapRegistryList(productsQ.data);

  const counts = useMemo(() => {
    if (!canRead) return emptyInfraOverviewCounts();
    return aggregateInfraOverview({
      providers: providersList.items,
      plans: plans.items,
      resources: resources.items,
      databases: databases.items,
    });
  }, [canRead, providersList.items, plans.items, resources.items, databases.items]);

  const [planForm, setPlanForm] = useState({
    tenantId: "",
    productId: "",
    providerId: "",
    region: "local",
    databaseEngine: "POSTGRESQL",
    authorizationId: "",
    placementDecisionId: "",
    reservationId: "",
  });

  const createPlan = useMutation({
    mutationFn: () =>
      edgeApi.createResourcePlan({
        ...planForm,
        encryptionPolicy: { tls: true },
        networkRequirements: { mode: "PRIVATE" },
        backupPolicy: { enabled: true, schedule: "daily" },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["infra", "plans"] });
    },
  });

  const validatePlan = useMutation({
    mutationFn: (id: string) =>
      edgeApi.validateResourcePlan(id, {
        authorizationValid: true,
        authorizationExpired: false,
        authorizationRevoked: false,
        placementValid: true,
        reservationValid: true,
        reservationCommitted: true,
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["infra"] }),
  });

  const reconcile = useMutation({
    mutationFn: (id: string) => edgeApi.reconcileInfrastructureResource(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["infra"] }),
  });

  const deprovision = useMutation({
    mutationFn: (id: string) =>
      edgeApi.deprovisionResource(id, { confirmed: true, authorized: true }),
    onSuccess: () => {
      setConfirmDeprovisionId(null);
      void qc.invalidateQueries({ queryKey: ["infra"] });
    },
  });

  const backup = useMutation({
    mutationFn: (id: string) => edgeApi.createResourceBackup(id, {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["infra"] }),
  });

  if (!hasAnyEdgePermission(permissions, ["platform:infrastructure:read", "platform:database:read"])) {
    return <InfraForbidden />;
  }

  function onCreatePlan(e: FormEvent) {
    e.preventDefault();
    createPlan.mutate();
  }

  return (
    <div className="flex flex-col gap-[var(--space-6)] p-[var(--space-6)]">
      <header>
        <h1 className="type-xl font-semibold">Infrastructure & Database Management</h1>
        <p className="type-sm text-[var(--text-muted)] mt-1">
          Resource plans, local-managed provisioning, dedicated tenant databases, backups and
          reconciliation. Secrets are never displayed.
        </p>
      </header>

      <div className="flex flex-wrap gap-[var(--space-2)]">
        {TABS.map((t) => {
          if (!hasAnyEdgePermission(permissions, t.permissions)) return null;
          return (
            <Button
              key={t.id}
              type="button"
              variant={tab === t.id ? "default" : "outline"}
              onClick={() => {
                setTab(t.id);
                setOffset(0);
              }}
            >
              {t.label}
            </Button>
          );
        })}
      </div>

      {tab === "overview" && (
        <EdgePermissionGate permission="platform:infrastructure:read">
          {providersQ.isLoading || plansQ.isLoading ? (
            <InfraLoading />
          ) : providersQ.isError ? (
            <InfraError message={infrastructureErrMessage(providersQ.error)} />
          ) : (
            <div className="grid gap-[var(--space-3)] sm:grid-cols-2 lg:grid-cols-4">
              <InfraCountCard label="Providers" value={counts.providers} />
              <InfraCountCard label="Plans" value={counts.plans} />
              <InfraCountCard label="Resources" value={counts.resources} />
              <InfraCountCard label="DB Ready" value={counts.readyDatabases} />
              <InfraCountCard label="Drift" value={counts.drift} />
              <InfraCountCard label="Failed" value={counts.failed} />
            </div>
          )}
        </EdgePermissionGate>
      )}

      {tab === "providers" && (
        <EdgePermissionGate permission="platform:infrastructure:read">
          {providersQ.isLoading ? (
            <InfraLoading />
          ) : providersQ.isError ? (
            <InfraError message={infrastructureErrMessage(providersQ.error)} />
          ) : providersList.items.length === 0 ? (
            <InfraEmpty title="No providers registered" />
          ) : (
            <InfraTableShell
              headers={["Code", "Kind", "Status", "Engines", "Regions", "Version"]}
            >
              {providersList.items.map((p) => (
                <tr key={p.id} className="border-t border-[var(--border)]">
                  <td className="px-3 py-2 font-medium">{p.code}</td>
                  <td className="px-3 py-2">{p.providerKind}</td>
                  <td className="px-3 py-2">
                    <InfraStatusBadge status={p.operationalStatus} />
                  </td>
                  <td className="px-3 py-2 type-xs">
                    {(p.supportedDatabaseEngines ?? []).join(", ")}
                  </td>
                  <td className="px-3 py-2 type-xs">
                    {(p.supportedRegions ?? []).join(", ")}
                  </td>
                  <td className="px-3 py-2">{p.providerVersion}</td>
                </tr>
              ))}
            </InfraTableShell>
          )}
        </EdgePermissionGate>
      )}

      {tab === "plans" && (
        <EdgePermissionGate permission="platform:infrastructure:read">
          <InfraFilters
            q={q}
            status={status}
            statusOptions={PLAN_STATUS_OPTIONS}
            onQChange={setQ}
            onStatusChange={(v) => {
              setStatus(v);
              setOffset(0);
            }}
            searchLabel="Filter plans"
          />
          {canManage && (
            <form
              onSubmit={onCreatePlan}
              className="grid gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-4)] lg:grid-cols-3"
            >
              <input
                className={fieldControlClass}
                placeholder="Tenant ID (UUID)"
                value={planForm.tenantId}
                onChange={(e) => setPlanForm((s) => ({ ...s, tenantId: e.target.value }))}
                required
              />
              <select
                className={fieldControlClass}
                value={planForm.productId}
                onChange={(e) => setPlanForm((s) => ({ ...s, productId: e.target.value }))}
                required
              >
                <option value="">Product (registry)</option>
                {products.items.map((p) => (
                  <option key={p.id} value={p.productId}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
              <select
                className={fieldControlClass}
                value={planForm.providerId}
                onChange={(e) => setPlanForm((s) => ({ ...s, providerId: e.target.value }))}
                required
              >
                <option value="">Provider</option>
                {providersList.items.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code}
                  </option>
                ))}
              </select>
              <select
                className={fieldControlClass}
                value={planForm.databaseEngine}
                onChange={(e) =>
                  setPlanForm((s) => ({ ...s, databaseEngine: e.target.value }))
                }
              >
                {DATABASE_ENGINE_OPTIONS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
              <input
                className={fieldControlClass}
                placeholder="Authorization ID"
                value={planForm.authorizationId}
                onChange={(e) =>
                  setPlanForm((s) => ({ ...s, authorizationId: e.target.value }))
                }
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Placement decision ID"
                value={planForm.placementDecisionId}
                onChange={(e) =>
                  setPlanForm((s) => ({ ...s, placementDecisionId: e.target.value }))
                }
                required
              />
              <input
                className={fieldControlClass}
                placeholder="Reservation ID"
                value={planForm.reservationId}
                onChange={(e) =>
                  setPlanForm((s) => ({ ...s, reservationId: e.target.value }))
                }
                required
              />
              <Button type="submit" disabled={createPlan.isPending}>
                Create plan
              </Button>
              {createPlan.isError && (
                <p className="type-sm text-[var(--danger)] lg:col-span-3">
                  {infrastructureErrMessage(createPlan.error)}
                </p>
              )}
            </form>
          )}
          {plansQ.isLoading ? (
            <InfraLoading />
          ) : plansQ.isError ? (
            <InfraError message={infrastructureErrMessage(plansQ.error)} />
          ) : plans.items.length === 0 ? (
            <InfraEmpty title="No resource plans" />
          ) : (
            <>
              <InfraTableShell
                headers={[
                  "Plan",
                  "Tenant",
                  "Engine",
                  "Region",
                  "Status",
                  "Fingerprint",
                  "Actions",
                ]}
              >
                {plans.items
                  .filter((p) => !q || p.id.includes(q) || p.tenantId.includes(q))
                  .map((p) => (
                    <tr key={p.id} className="border-t border-[var(--border)]">
                      <td className="px-3 py-2">
                        <Link
                          className="underline"
                          href={`/edge/provisioning/infrastructure/plans/${p.id}`}
                        >
                          {shortId(p.id)}
                        </Link>
                      </td>
                      <td className="px-3 py-2 type-xs">{shortId(p.tenantId)}</td>
                      <td className="px-3 py-2">{p.databaseEngine}</td>
                      <td className="px-3 py-2">{p.region}</td>
                      <td className="px-3 py-2">
                        <InfraStatusBadge status={p.status} />
                      </td>
                      <td className="px-3 py-2 type-xs">
                        {shortId(p.planFingerprint)}
                      </td>
                      <td className="px-3 py-2">
                        {hasEdgePermission(
                          permissions,
                          "platform:infrastructure:manage",
                        ) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={validatePlan.isPending}
                            onClick={() => validatePlan.mutate(p.id)}
                          >
                            Validate
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
              </InfraTableShell>
              <InfraPagination
                offset={offset}
                limit={limit}
                total={plans.total}
                onOffsetChange={setOffset}
              />
            </>
          )}
        </EdgePermissionGate>
      )}

      {tab === "resources" && (
        <EdgePermissionGate permission="platform:infrastructure:read">
          <InfraFilters
            q={q}
            status={status}
            statusOptions={RESOURCE_STATUS_OPTIONS}
            onQChange={setQ}
            onStatusChange={(v) => {
              setStatus(v);
              setOffset(0);
            }}
          />
          {resourcesQ.isLoading ? (
            <InfraLoading />
          ) : resourcesQ.isError ? (
            <InfraError message={infrastructureErrMessage(resourcesQ.error)} />
          ) : resources.items.length === 0 ? (
            <InfraEmpty title="No infrastructure resources" />
          ) : (
            <>
              <InfraTableShell
                headers={[
                  "Resource",
                  "Type",
                  "Status",
                  "Health",
                  "Drift",
                  "Updated",
                  "Actions",
                ]}
              >
                {resources.items.map((r) => (
                  <tr key={r.id} className="border-t border-[var(--border)]">
                    <td className="px-3 py-2">
                      <Link
                        className="underline"
                        href={`/edge/provisioning/infrastructure/resources/${r.id}`}
                      >
                        {shortId(r.id)}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{r.resourceType}</td>
                    <td className="px-3 py-2">
                      <InfraStatusBadge status={r.status} />
                    </td>
                    <td className="px-3 py-2">{r.healthStatus}</td>
                    <td className="px-3 py-2">{r.driftStatus}</td>
                    <td className="px-3 py-2 type-xs">
                      {formatInfraDate(r.updatedAt)}
                    </td>
                    <td className="px-3 py-2 flex gap-2">
                      {hasEdgePermission(
                        permissions,
                        "platform:infrastructure:reconcile",
                      ) && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => reconcile.mutate(r.id)}
                        >
                          Reconcile
                        </Button>
                      )}
                      {hasEdgePermission(
                        permissions,
                        "platform:infrastructure:deprovision",
                      ) && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmDeprovisionId(r.id)}
                        >
                          Deprovision
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </InfraTableShell>
              {confirmDeprovisionId && (
                <div className="rounded-[var(--radius-md)] border border-[var(--danger)] p-[var(--space-4)]">
                  <p className="type-sm">
                    Confirmer la suppression contrôlée de {shortId(confirmDeprovisionId)} ?
                    La compensation reste bloquée si des données existent ou si l&apos;état
                    est ambigu.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      onClick={() => deprovision.mutate(confirmDeprovisionId)}
                    >
                      Confirmer
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setConfirmDeprovisionId(null)}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
              <InfraPagination
                offset={offset}
                limit={limit}
                total={resources.total}
                onOffsetChange={setOffset}
              />
            </>
          )}
        </EdgePermissionGate>
      )}

      {tab === "databases" && (
        <EdgePermissionGate permission="platform:database:read">
          <InfraFilters
            q={q}
            status={status}
            statusOptions={RESOURCE_STATUS_OPTIONS}
            onQChange={setQ}
            onStatusChange={(v) => {
              setStatus(v);
              setOffset(0);
            }}
          />
          {databasesQ.isLoading ? (
            <InfraLoading />
          ) : databasesQ.isError ? (
            <InfraError message={infrastructureErrMessage(databasesQ.error)} />
          ) : databases.items.length === 0 ? (
            <InfraEmpty title="No database resources" />
          ) : (
            <>
              <InfraTableShell
                headers={[
                  "Database",
                  "Engine",
                  "Name",
                  "Status",
                  "Conn",
                  "Isolation",
                  "Credential",
                  "Actions",
                ]}
              >
                {databases.items.map((d) => (
                  <tr key={d.id} className="border-t border-[var(--border)]">
                    <td className="px-3 py-2">
                      <Link
                        className="underline"
                        href={`/edge/provisioning/infrastructure/databases/${d.id}`}
                      >
                        {shortId(d.id)}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{d.databaseEngine}</td>
                    <td className="px-3 py-2">{d.databaseName}</td>
                    <td className="px-3 py-2">
                      <InfraStatusBadge status={d.status} />
                    </td>
                    <td className="px-3 py-2">
                      {d.connectivityVerified ? "OK" : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {d.isolationVerified ? "OK" : "—"}
                    </td>
                    <td className="px-3 py-2 type-xs">
                      {redactSecretRef(d.credentialRef)}
                    </td>
                    <td className="px-3 py-2">
                      {hasEdgePermission(permissions, "platform:database:verify") && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => edgeApi.verifyDatabaseResource(d.id)}
                        >
                          Verify
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </InfraTableShell>
              <InfraPagination
                offset={offset}
                limit={limit}
                total={databases.total}
                onOffsetChange={setOffset}
              />
            </>
          )}
        </EdgePermissionGate>
      )}

      {tab === "backups" && (
        <EdgePermissionGate permission="platform:database:backup">
          {resources.items.length === 0 ? (
            <InfraEmpty title="No resources to back up" />
          ) : (
            <InfraTableShell headers={["Resource", "Type", "Status", "Backup"]}>
              {resources.items.map((r) => (
                <tr key={r.id} className="border-t border-[var(--border)]">
                  <td className="px-3 py-2">{shortId(r.id)}</td>
                  <td className="px-3 py-2">{r.resourceType}</td>
                  <td className="px-3 py-2">
                    <InfraStatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={backup.isPending}
                      onClick={() => backup.mutate(r.id)}
                    >
                      Create backup
                    </Button>
                  </td>
                </tr>
              ))}
            </InfraTableShell>
          )}
        </EdgePermissionGate>
      )}
    </div>
  );
}
