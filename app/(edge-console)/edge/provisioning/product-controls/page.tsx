"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  ProductControlCountCard,
  ProductControlEmpty,
  ProductControlError,
  ProductControlFilters,
  ProductControlForbidden,
  ProductControlLoading,
  ProductControlPagination,
  ProductControlStatusBadge,
  ProductControlTableShell,
  formatProductControlDate,
  shortId,
} from "@/components/edge/product-control/shared";
import { edgeApi } from "@/lib/api/edge";
import {
  CONTROL_EXCHANGE_STATUS_OPTIONS,
  CREDENTIAL_BINDING_STATUS_OPTIONS,
  PRODUCT_CONTROL_AUTH_PROFILE_OPTIONS,
  PRODUCT_CONTROL_ENDPOINT_STATUS_OPTIONS,
  aggregateOverviewCounts,
  emptyOverviewCounts,
  productControlApi,
  productControlErrMessage,
  redactSecretRef,
  unwrapProductControlList,
} from "@/lib/edge/product-control";
import { unwrapRegistryList } from "@/lib/edge/registry";
import {
  hasAnyEdgePermission,
  hasEdgePermission,
} from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type {
  ControlExchangeRecord,
  CredentialBindingRecord,
  ProductControlEndpointRecord,
} from "@/types/edge-product-control";
import type {
  ProductPlatform,
  ProductRegistryRecord,
  RuntimeEnvironment,
} from "@/types/edge-registry";

type TabId = "overview" | "endpoints" | "exchanges" | "credentials";

const TABS: { id: TabId; label: string; permissions: string[] }[] = [
  {
    id: "overview",
    label: "Overview",
    permissions: ["platform:product_control:read"],
  },
  {
    id: "endpoints",
    label: "Endpoints",
    permissions: ["platform:product_control:read"],
  },
  {
    id: "exchanges",
    label: "Exchanges",
    permissions: ["platform:product_control:read"],
  },
  {
    id: "credentials",
    label: "Credentials",
    permissions: ["platform:product_control:read"],
  },
];

const LIMIT = 20;

export default function ProductControlPage() {
  const { permissions, isLoading: platformLoading } = useEdgePlatform();
  const queryClient = useQueryClient();

  const canReadAny = useMemo(
    () => TABS.some((t) => hasAnyEdgePermission(permissions, t.permissions)),
    [permissions],
  );

  const [tab, setTab] = useState<TabId>("overview");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [offset, setOffset] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const [endpointForm, setEndpointForm] = useState({
    productRegistryId: "",
    platformId: "",
    environmentId: "",
    code: "",
    baseUrl: "",
    contractVersion: "",
    authProfile: "OAUTH2_CC",
    credentialRef: "",
  });

  useEffect(() => {
    const allowed = TABS.find((t) =>
      hasAnyEdgePermission(permissions, t.permissions),
    )?.id;
    if (
      allowed &&
      !hasAnyEdgePermission(
        permissions,
        TABS.find((t) => t.id === tab)?.permissions ?? [],
      )
    ) {
      setTab(allowed);
    }
  }, [permissions, tab]);

  const canManage = hasEdgePermission(
    permissions,
    "platform:product_control:manage",
  );
  const canReconcile = hasEdgePermission(
    permissions,
    "platform:product_control:reconcile",
  );
  const resetOffset = () => setOffset(0);

  const endpointsQuery = useQuery({
    queryKey: ["edge", "product-control", "endpoints", { q, status, offset, tab }],
    queryFn: () =>
      productControlApi.listEndpoints({
        q: q || undefined,
        status: status || undefined,
        limit: tab === "overview" ? 100 : LIMIT,
        offset: tab === "overview" ? 0 : offset,
      }),
    enabled:
      canReadAny &&
      (tab === "overview" || tab === "endpoints") &&
      hasEdgePermission(permissions, "platform:product_control:read"),
  });

  const exchangesQuery = useQuery({
    queryKey: ["edge", "product-control", "exchanges", { q, status, offset, tab }],
    queryFn: () =>
      productControlApi.listExchanges({
        q: q || undefined,
        status: status || undefined,
        limit: tab === "overview" ? 100 : LIMIT,
        offset: tab === "overview" ? 0 : offset,
      }),
    enabled:
      canReadAny &&
      (tab === "overview" || tab === "exchanges") &&
      hasEdgePermission(permissions, "platform:product_control:read"),
  });

  const credentialsQuery = useQuery({
    queryKey: [
      "edge",
      "product-control",
      "credentials",
      { q, status, offset },
    ],
    queryFn: () =>
      productControlApi.listCredentials({
        q: q || undefined,
        status: status || undefined,
        limit: LIMIT,
        offset,
      }),
    enabled:
      canReadAny &&
      tab === "credentials" &&
      hasEdgePermission(permissions, "platform:product_control:read"),
  });

  const registryProductsQuery = useQuery({
    queryKey: ["edge", "registry", "products", "product-control-form"],
    queryFn: () => edgeApi.listRegistryProducts({ limit: 100, offset: 0 }),
    enabled: canManage && tab === "endpoints",
    retry: false,
  });

  const platformsQuery = useQuery({
    queryKey: ["edge", "registry", "platforms", "product-control-form"],
    queryFn: () => edgeApi.listRegistryPlatforms({ limit: 100, offset: 0 }),
    enabled: canManage && tab === "endpoints",
    retry: false,
  });

  const environmentsQuery = useQuery({
    queryKey: [
      "edge",
      "registry",
      "environments",
      endpointForm.platformId,
      "product-control-form",
    ],
    queryFn: () =>
      edgeApi.listRegistryEnvironments({
        limit: 100,
        offset: 0,
        platformId: endpointForm.platformId || undefined,
      }),
    enabled: canManage && tab === "endpoints" && Boolean(endpointForm.platformId),
    retry: false,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["edge", "product-control"],
    });
  };

  const createEndpoint = useMutation({
    mutationFn: () => {
      const product = unwrapRegistryList<ProductRegistryRecord>(
        registryProductsQuery.data,
      ).items.find((p) => p.id === endpointForm.productRegistryId);
      if (!product) {
        throw new Error("Select a product from the registry");
      }
      return productControlApi.createEndpoint({
        productRegistryId: product.id,
        productId: product.productId,
        platformId: endpointForm.platformId,
        environmentId: endpointForm.environmentId || null,
        code: endpointForm.code.trim(),
        baseUrl: endpointForm.baseUrl.trim(),
        contractVersion: endpointForm.contractVersion.trim(),
        authProfile: endpointForm.authProfile,
        credentialRef: endpointForm.credentialRef.trim(),
      });
    },
    onSuccess: async () => {
      setFormError(null);
      setEndpointForm({
        productRegistryId: "",
        platformId: "",
        environmentId: "",
        code: "",
        baseUrl: "",
        contractVersion: "",
        authProfile: "OAUTH2_CC",
        credentialRef: "",
      });
      await invalidate();
    },
    onError: (err) => setFormError(productControlErrMessage(err)),
  });

  const reconcile = useMutation({
    mutationFn: (id: string) => productControlApi.reconcileExchange(id),
    onSuccess: async () => {
      setFormError(null);
      await invalidate();
    },
    onError: (err) => setFormError(productControlErrMessage(err)),
  });

  const endpoints = unwrapProductControlList<ProductControlEndpointRecord>(
    endpointsQuery.data,
  );
  const exchanges = unwrapProductControlList<ControlExchangeRecord>(
    exchangesQuery.data,
  );
  const credentials = unwrapProductControlList<CredentialBindingRecord>(
    credentialsQuery.data,
  );
  const registryProducts = unwrapRegistryList<ProductRegistryRecord>(
    registryProductsQuery.data,
  ).items;
  const platforms = unwrapRegistryList<ProductPlatform>(platformsQuery.data)
    .items;
  const environments = unwrapRegistryList<RuntimeEnvironment>(
    environmentsQuery.data,
  ).items;

  const overview = useMemo(() => {
    if (tab !== "overview") return emptyOverviewCounts();
    return aggregateOverviewCounts(endpoints.items, exchanges.items);
  }, [tab, endpoints.items, exchanges.items]);

  const onCreateEndpoint = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    createEndpoint.mutate();
  };

  if (platformLoading) return <ProductControlLoading />;
  if (!canReadAny) {
    return (
      <ProductControlForbidden description="Product Control requires platform:product_control:read." />
    );
  }

  const activeQuery =
    tab === "endpoints"
      ? endpointsQuery
      : tab === "exchanges"
        ? exchangesQuery
        : tab === "credentials"
          ? credentialsQuery
          : null;

  return (
    <div className="space-y-[var(--space-6)]">
      <div>
        <h1 className="type-lg font-semibold text-[var(--text-primary)]">
          Product Control
        </h1>
        <p className="mt-1 type-sm text-[var(--text-secondary)]">
          Endpoint registry, exchanges, health and credential bindings — secrets
          never displayed.
        </p>
      </div>

      <div
        className="flex flex-wrap gap-[var(--space-2)]"
        role="tablist"
        aria-label="Product Control tabs"
      >
        {TABS.map((t) => {
          const allowed = hasAnyEdgePermission(permissions, t.permissions);
          return (
            <Button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              variant={tab === t.id ? "default" : "outline"}
              disabled={!allowed}
              onClick={() => {
                setTab(t.id);
                setQ("");
                setStatus("");
                setOffset(0);
                setFormError(null);
              }}
            >
              {t.label}
            </Button>
          );
        })}
      </div>

      {formError ? (
        <p className="type-sm text-[var(--danger)]" role="alert">
          {formError}
        </p>
      ) : null}

      {tab === "overview" ? (
        <section className="space-y-[var(--space-4)]" aria-label="Overview">
          {endpointsQuery.isLoading || exchangesQuery.isLoading ? (
            <ProductControlLoading label="Loading overview…" />
          ) : endpointsQuery.isError ? (
            <ProductControlError
              description={productControlErrMessage(endpointsQuery.error)}
              onRetry={() => void endpointsQuery.refetch()}
            />
          ) : (
            <>
              <div className="grid gap-[var(--space-3)] sm:grid-cols-2 lg:grid-cols-3">
                <ProductControlCountCard
                  label="Endpoints"
                  count={overview.endpoints}
                />
                <ProductControlCountCard label="Active" count={overview.active} />
                <ProductControlCountCard
                  label="Degraded / unavailable"
                  count={overview.degraded}
                />
                <ProductControlCountCard
                  label="Quarantined / revoked"
                  count={overview.quarantined}
                />
                <ProductControlCountCard
                  label="Failed exchanges"
                  count={overview.failedExchanges}
                />
                <ProductControlCountCard
                  label="Reconciliation required"
                  count={overview.reconciliationRequired}
                />
              </div>

              <div className="space-y-[var(--space-3)]">
                <h2 className="type-sm font-semibold">Recent endpoints</h2>
                {endpoints.items.length === 0 ? (
                  <ProductControlEmpty
                    title="No endpoints"
                    description="Register a Product Control endpoint to begin integration."
                  />
                ) : (
                  <ProductControlTableShell
                    headers={[
                      "Code",
                      "Status",
                      "Contract",
                      "Handshake",
                      "Health",
                      "",
                    ]}
                  >
                    {endpoints.items.slice(0, 8).map((row) => (
                      <tr
                        key={row.id}
                        className="border-t border-[var(--border)]"
                      >
                        <td className="px-3 py-2 font-mono type-xs">
                          {row.code}
                        </td>
                        <td className="px-3 py-2">
                          <ProductControlStatusBadge status={row.status} />
                        </td>
                        <td className="px-3 py-2">{row.contractVersion}</td>
                        <td className="px-3 py-2 type-xs text-[var(--text-muted)]">
                          {row.lastHandshakeStatus ?? "—"}
                        </td>
                        <td className="px-3 py-2 type-xs text-[var(--text-muted)]">
                          {row.lastHealthStatus ?? "—"}
                        </td>
                        <td className="px-3 py-2">
                          <Link
                            href={`/edge/provisioning/product-controls/endpoints/${row.id}`}
                            className="text-[var(--primary)] underline"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </ProductControlTableShell>
                )}
              </div>
            </>
          )}
        </section>
      ) : null}

      {tab === "endpoints" ? (
        <section className="space-y-[var(--space-4)]" aria-label="Endpoints">
          <ProductControlFilters
            q={q}
            status={status}
            statusOptions={PRODUCT_CONTROL_ENDPOINT_STATUS_OPTIONS}
            onQChange={(value) => {
              setQ(value);
              resetOffset();
            }}
            onStatusChange={(value) => {
              setStatus(value);
              resetOffset();
            }}
            searchLabel="Search endpoints"
          />

          <EdgePermissionGate permission="platform:product_control:manage">
            <form
              noValidate
              onSubmit={onCreateEndpoint}
              className="grid gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-4)] md:grid-cols-2"
            >
              <p className="type-sm font-semibold md:col-span-2">
                Register endpoint
              </p>
              <p className="type-xs text-[var(--text-muted)] md:col-span-2">
                Select product, platform and environment from the registry. Use
                an opaque credential reference — never paste secrets.
              </p>
              <select
                className={fieldControlClass}
                required
                value={endpointForm.productRegistryId}
                onChange={(e) =>
                  setEndpointForm((prev) => ({
                    ...prev,
                    productRegistryId: e.target.value,
                  }))
                }
                aria-label="Product registry"
              >
                <option value="">Product registry…</option>
                {registryProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
              <select
                className={fieldControlClass}
                required
                value={endpointForm.platformId}
                onChange={(e) =>
                  setEndpointForm((prev) => ({
                    ...prev,
                    platformId: e.target.value,
                    environmentId: "",
                  }))
                }
                aria-label="Platform"
              >
                <option value="">Platform…</option>
                {platforms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
              <select
                className={fieldControlClass}
                value={endpointForm.environmentId}
                onChange={(e) =>
                  setEndpointForm((prev) => ({
                    ...prev,
                    environmentId: e.target.value,
                  }))
                }
                aria-label="Environment"
              >
                <option value="">Environment (optional)…</option>
                {environments.map((env) => (
                  <option key={env.id} value={env.id}>
                    {env.code} — {env.name}
                  </option>
                ))}
              </select>
              <input
                className={fieldControlClass}
                required
                placeholder="Endpoint code"
                value={endpointForm.code}
                onChange={(e) =>
                  setEndpointForm((prev) => ({ ...prev, code: e.target.value }))
                }
                aria-label="Endpoint code"
              />
              <input
                className={fieldControlClass}
                required
                placeholder="https://product-control.example"
                value={endpointForm.baseUrl}
                onChange={(e) =>
                  setEndpointForm((prev) => ({
                    ...prev,
                    baseUrl: e.target.value,
                  }))
                }
                aria-label="Base URL"
              />
              <input
                className={fieldControlClass}
                required
                placeholder="Contract version"
                value={endpointForm.contractVersion}
                onChange={(e) =>
                  setEndpointForm((prev) => ({
                    ...prev,
                    contractVersion: e.target.value,
                  }))
                }
                aria-label="Contract version"
              />
              <select
                className={fieldControlClass}
                required
                value={endpointForm.authProfile}
                onChange={(e) =>
                  setEndpointForm((prev) => ({
                    ...prev,
                    authProfile: e.target.value,
                  }))
                }
                aria-label="Auth profile"
              >
                {PRODUCT_CONTROL_AUTH_PROFILE_OPTIONS.map((profile) => (
                  <option key={profile} value={profile}>
                    {profile}
                  </option>
                ))}
              </select>
              <input
                className={fieldControlClass}
                required
                placeholder="Credential reference (opaque)"
                value={endpointForm.credentialRef}
                onChange={(e) =>
                  setEndpointForm((prev) => ({
                    ...prev,
                    credentialRef: e.target.value,
                  }))
                }
                aria-label="Credential reference"
                autoComplete="off"
              />
              <div className="md:col-span-2">
                <Button type="submit" disabled={createEndpoint.isPending}>
                  {createEndpoint.isPending ? "Registering…" : "Register"}
                </Button>
              </div>
            </form>
          </EdgePermissionGate>

          {endpointsQuery.isLoading ? (
            <ProductControlLoading label="Loading endpoints…" />
          ) : endpointsQuery.isError ? (
            <ProductControlError
              description={productControlErrMessage(endpointsQuery.error)}
              onRetry={() => void endpointsQuery.refetch()}
            />
          ) : endpoints.items.length === 0 ? (
            <ProductControlEmpty
              title="No endpoints"
              description="No Product Control endpoints match the current filters."
            />
          ) : (
            <>
              <ProductControlTableShell
                headers={[
                  "Code",
                  "Status",
                  "Product",
                  "Platform",
                  "Contract",
                  "Updated",
                  "",
                ]}
              >
                {endpoints.items.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--border)]">
                    <td className="px-3 py-2 font-mono type-xs">{row.code}</td>
                    <td className="px-3 py-2">
                      <ProductControlStatusBadge status={row.status} />
                    </td>
                    <td className="px-3 py-2 font-mono type-xs">
                      {shortId(row.productId)}
                    </td>
                    <td className="px-3 py-2 font-mono type-xs">
                      {shortId(row.platformId)}
                    </td>
                    <td className="px-3 py-2">{row.contractVersion}</td>
                    <td className="px-3 py-2 type-xs text-[var(--text-muted)]">
                      {formatProductControlDate(row.updatedAt)}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/edge/provisioning/product-controls/endpoints/${row.id}`}
                        className="text-[var(--primary)] underline"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </ProductControlTableShell>
              <ProductControlPagination
                offset={offset}
                limit={LIMIT}
                total={endpoints.total}
                onOffsetChange={setOffset}
              />
            </>
          )}
        </section>
      ) : null}

      {tab === "exchanges" ? (
        <section className="space-y-[var(--space-4)]" aria-label="Exchanges">
          <ProductControlFilters
            q={q}
            status={status}
            statusOptions={CONTROL_EXCHANGE_STATUS_OPTIONS}
            onQChange={(value) => {
              setQ(value);
              resetOffset();
            }}
            onStatusChange={(value) => {
              setStatus(value);
              resetOffset();
            }}
            searchLabel="Search exchanges"
          />

          {exchangesQuery.isLoading ? (
            <ProductControlLoading label="Loading exchanges…" />
          ) : exchangesQuery.isError ? (
            <ProductControlError
              description={productControlErrMessage(exchangesQuery.error)}
              onRetry={() => void exchangesQuery.refetch()}
            />
          ) : exchanges.items.length === 0 ? (
            <ProductControlEmpty
              title="No exchanges"
              description="Control exchanges will appear here after handshake, discover or health operations."
            />
          ) : (
            <>
              <ProductControlTableShell
                headers={[
                  "Operation",
                  "Status",
                  "Reconciliation",
                  "Attempts",
                  "Updated",
                  "",
                ]}
              >
                {exchanges.items.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--border)]">
                    <td className="px-3 py-2 font-mono type-xs">
                      {row.operationCode}
                    </td>
                    <td className="px-3 py-2">
                      <ProductControlStatusBadge status={row.status} />
                    </td>
                    <td className="px-3 py-2">
                      <ProductControlStatusBadge
                        status={String(row.reconciliationStatus)}
                      />
                    </td>
                    <td className="px-3 py-2 tabular-nums">{row.attemptCount}</td>
                    <td className="px-3 py-2 type-xs text-[var(--text-muted)]">
                      {formatProductControlDate(row.updatedAt)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/edge/provisioning/product-controls/exchanges/${row.id}`}
                          className="text-[var(--primary)] underline"
                        >
                          Details
                        </Link>
                        {canReconcile &&
                        (row.status === "UNKNOWN_OUTCOME" ||
                          row.status === "RECONCILIATION_REQUIRED" ||
                          row.reconciliationStatus === "REQUIRED") ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={reconcile.isPending}
                            onClick={() => reconcile.mutate(row.id)}
                          >
                            Reconcile
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </ProductControlTableShell>
              <ProductControlPagination
                offset={offset}
                limit={LIMIT}
                total={exchanges.total}
                onOffsetChange={setOffset}
              />
            </>
          )}
        </section>
      ) : null}

      {tab === "credentials" ? (
        <section className="space-y-[var(--space-4)]" aria-label="Credentials">
          <ProductControlFilters
            q={q}
            status={status}
            statusOptions={CREDENTIAL_BINDING_STATUS_OPTIONS}
            onQChange={(value) => {
              setQ(value);
              resetOffset();
            }}
            onStatusChange={(value) => {
              setStatus(value);
              resetOffset();
            }}
            searchLabel="Search credentials"
          />
          <p className="type-xs text-[var(--text-muted)]">
            Only opaque credential references are shown. Secret material is never
            returned by the API.
          </p>

          {credentialsQuery.isLoading ? (
            <ProductControlLoading label="Loading credentials…" />
          ) : credentialsQuery.isError ? (
            <ProductControlError
              description={productControlErrMessage(credentialsQuery.error)}
              onRetry={() => void credentialsQuery.refetch()}
            />
          ) : credentials.items.length === 0 ? (
            <ProductControlEmpty
              title="No credential bindings"
              description="Credential bindings appear when endpoints are registered with a credential reference."
            />
          ) : (
            <>
              <ProductControlTableShell
                headers={[
                  "Endpoint",
                  "Auth profile",
                  "Credential ref",
                  "Status",
                  "Bound",
                ]}
              >
                {credentials.items.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--border)]">
                    <td className="px-3 py-2">
                      <Link
                        href={`/edge/provisioning/product-controls/endpoints/${row.endpointId}`}
                        className="font-mono type-xs text-[var(--primary)] underline"
                      >
                        {shortId(row.endpointId)}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{row.authProfile}</td>
                    <td className="px-3 py-2 font-mono type-xs">
                      {redactSecretRef(row.credentialRef)}
                    </td>
                    <td className="px-3 py-2">
                      <ProductControlStatusBadge status={row.status} />
                    </td>
                    <td className="px-3 py-2 type-xs text-[var(--text-muted)]">
                      {formatProductControlDate(row.boundAt)}
                    </td>
                  </tr>
                ))}
              </ProductControlTableShell>
              <ProductControlPagination
                offset={offset}
                limit={LIMIT}
                total={credentials.total}
                onOffsetChange={setOffset}
              />
            </>
          )}
        </section>
      ) : null}

      {activeQuery?.isFetching && !activeQuery.isLoading ? (
        <p className="type-xs text-[var(--text-muted)]">Refreshing…</p>
      ) : null}
    </div>
  );
}
