"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import {
  ProductControlEmpty,
  ProductControlError,
  ProductControlForbidden,
  ProductControlInfoCard,
  ProductControlLoading,
  ProductControlRow,
  ProductControlStatusBadge,
  ProductControlTableShell,
  formatProductControlDate,
  shortId,
} from "@/components/edge/product-control/shared";
import {
  canMutateEndpoint,
  productControlApi,
  productControlErrMessage,
  redactProductControlMetadata,
  redactSecretRef,
  unwrapEdgeData,
  unwrapProductControlList,
} from "@/lib/edge/product-control";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type {
  ControlExchangeRecord,
  NegotiatedContractRecord,
  ProductControlCapabilityRecord,
  ProductControlEndpointRecord,
  ProductControlHealthCheckRecord,
  ProductControlHistoryEntry,
} from "@/types/edge-product-control";

function unwrapArrayOrList<T>(payload: unknown): T[] {
  const raw = unwrapEdgeData<T[] | { items?: T[] }>(payload);
  if (Array.isArray(raw)) return raw;
  return raw?.items ?? [];
}

export default function ProductControlEndpointDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { permissions, isLoading: platformLoading } = useEdgePlatform();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [quarantineReason, setQuarantineReason] = useState("");

  const canRead = hasEdgePermission(
    permissions,
    "platform:product_control:read",
  );
  const canValidate = hasEdgePermission(
    permissions,
    "platform:product_control:validate",
  );
  const canHandshake = hasEdgePermission(
    permissions,
    "platform:product_control:handshake",
  );
  const canDiscover = hasEdgePermission(
    permissions,
    "platform:product_control:discover",
  );
  const canHealth = hasEdgePermission(
    permissions,
    "platform:product_control:health",
  );
  const canQuarantine = hasEdgePermission(
    permissions,
    "platform:product_control:quarantine",
  );
  const canHistory = hasEdgePermission(
    permissions,
    "platform:product_control:history:read",
  );

  const endpointQuery = useQuery({
    queryKey: ["edge", "product-control", "endpoints", id],
    queryFn: () => productControlApi.getEndpoint(id),
    enabled: Boolean(id) && canRead,
  });

  const contractsQuery = useQuery({
    queryKey: ["edge", "product-control", "endpoints", id, "contracts"],
    queryFn: () => productControlApi.listEndpointContracts(id),
    enabled: Boolean(id) && canRead,
    retry: false,
  });

  const capabilitiesQuery = useQuery({
    queryKey: ["edge", "product-control", "endpoints", id, "capabilities"],
    queryFn: () => productControlApi.listEndpointCapabilities(id),
    enabled: Boolean(id) && canRead,
    retry: false,
  });

  const exchangesQuery = useQuery({
    queryKey: ["edge", "product-control", "endpoints", id, "exchanges"],
    queryFn: () =>
      productControlApi.listEndpointExchanges(id, { limit: 20, offset: 0 }),
    enabled: Boolean(id) && canRead,
  });

  const healthQuery = useQuery({
    queryKey: ["edge", "product-control", "endpoints", id, "health-checks"],
    queryFn: () =>
      productControlApi.listEndpointHealthChecks(id, { limit: 10, offset: 0 }),
    enabled: Boolean(id) && canRead,
    retry: false,
  });

  const historyQuery = useQuery({
    queryKey: ["edge", "product-control", "endpoints", id, "history"],
    queryFn: () =>
      productControlApi.listEndpointHistory(id, { limit: 20, offset: 0 }),
    enabled: Boolean(id) && canHistory,
    retry: false,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["edge", "product-control"],
    });
  };

  const runAction = useMutation({
    mutationFn: async (
      action:
        | "validate"
        | "handshake"
        | "discoverContract"
        | "discoverCapabilities"
        | "health"
        | "quarantine",
    ) => {
      switch (action) {
        case "validate":
          return productControlApi.validateEndpoint(id);
        case "handshake":
          return productControlApi.handshake(id);
        case "discoverContract":
          return productControlApi.discoverContract(id);
        case "discoverCapabilities":
          return productControlApi.discoverCapabilities(id);
        case "health":
          return productControlApi.healthCheck(id);
        case "quarantine":
          return productControlApi.quarantine(id, {
            reason: quarantineReason.trim() || "Quarantined from console",
          });
      }
    },
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (err) => setActionError(productControlErrMessage(err)),
  });

  const endpoint = unwrapEdgeData<ProductControlEndpointRecord>(
    endpointQuery.data,
  );
  const contracts = contractsQuery.isError
    ? []
    : unwrapArrayOrList<NegotiatedContractRecord>(contractsQuery.data);
  const capabilities = capabilitiesQuery.isError
    ? []
    : unwrapArrayOrList<ProductControlCapabilityRecord>(capabilitiesQuery.data);
  const exchanges = unwrapProductControlList<ControlExchangeRecord>(
    exchangesQuery.data,
  );
  const healthChecks = healthQuery.isError
    ? []
    : unwrapArrayOrList<ProductControlHealthCheckRecord>(healthQuery.data);
  const history = canHistory
    ? unwrapProductControlList<ProductControlHistoryEntry>(historyQuery.data)
    : { items: [], total: 0 };

  if (platformLoading) return <ProductControlLoading />;
  if (!canRead) {
    return (
      <ProductControlForbidden description="Endpoint detail requires platform:product_control:read." />
    );
  }
  if (endpointQuery.isLoading) {
    return <ProductControlLoading label="Loading endpoint…" />;
  }
  if (endpointQuery.isError) {
    return (
      <ProductControlError
        description={productControlErrMessage(endpointQuery.error)}
        onRetry={() => void endpointQuery.refetch()}
      />
    );
  }
  if (!endpoint) {
    return (
      <ProductControlEmpty
        title="Endpoint not found"
        description="This Product Control endpoint id returned no record."
      />
    );
  }

  const mutable = canMutateEndpoint(endpoint.status);
  const safeMeta = redactProductControlMetadata(endpoint.metadata);
  const busy = runAction.isPending;

  return (
    <div className="space-y-[var(--space-6)]">
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
        <div>
          <p className="type-xs text-[var(--text-muted)]">
            <Link
              href="/edge/provisioning/product-controls"
              className="text-[var(--primary)] underline"
            >
              Product Control
            </Link>
          </p>
          <h1 className="mt-1 type-lg font-semibold text-[var(--text-primary)]">
            {endpoint.code}
          </h1>
          <p className="mt-1 font-mono type-xs text-[var(--text-secondary)]">
            {endpoint.id}
          </p>
        </div>
        <ProductControlStatusBadge status={endpoint.status} />
      </div>

      {actionError ? (
        <p className="type-sm text-[var(--danger)]" role="alert">
          {actionError}
        </p>
      ) : null}

      {!mutable ? (
        <p className="type-sm text-[var(--warning)]" role="status">
          This endpoint is {endpoint.status}. Control mutations are blocked.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-[var(--space-2)]">
        {canValidate ? (
          <Button
            type="button"
            variant="outline"
            disabled={busy || !mutable}
            onClick={() => runAction.mutate("validate")}
          >
            Validate
          </Button>
        ) : null}
        {canHandshake ? (
          <Button
            type="button"
            variant="outline"
            disabled={busy || !mutable}
            onClick={() => runAction.mutate("handshake")}
          >
            Handshake
          </Button>
        ) : null}
        {canDiscover ? (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={busy || !mutable}
              onClick={() => runAction.mutate("discoverContract")}
            >
              Discover contract
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy || !mutable}
              onClick={() => runAction.mutate("discoverCapabilities")}
            >
              Discover capabilities
            </Button>
          </>
        ) : null}
        {canHealth ? (
          <Button
            type="button"
            variant="outline"
            disabled={busy || !mutable}
            onClick={() => runAction.mutate("health")}
          >
            Health check
          </Button>
        ) : null}
      </div>

      {canQuarantine && mutable ? (
        <div className="flex flex-wrap items-end gap-[var(--space-2)]">
          <input
            className={fieldControlClass}
            placeholder="Quarantine reason"
            value={quarantineReason}
            onChange={(e) => setQuarantineReason(e.target.value)}
            aria-label="Quarantine reason"
          />
          <Button
            type="button"
            variant="danger"
            disabled={busy || !quarantineReason.trim()}
            onClick={() => runAction.mutate("quarantine")}
          >
            Quarantine
          </Button>
        </div>
      ) : null}

      <div className="grid gap-[var(--space-4)] lg:grid-cols-2">
        <ProductControlInfoCard title="Identity">
          <ProductControlRow label="Code" value={endpoint.code} />
          <ProductControlRow
            label="Product registry"
            value={shortId(endpoint.productRegistryId)}
            mono
          />
          <ProductControlRow
            label="Product"
            value={shortId(endpoint.productId)}
            mono
          />
          <ProductControlRow
            label="Platform"
            value={shortId(endpoint.platformId)}
            mono
          />
          <ProductControlRow
            label="Environment"
            value={shortId(endpoint.environmentId)}
            mono
          />
          <ProductControlRow label="Base URL" value={endpoint.baseUrl} mono />
          <ProductControlRow
            label="API version"
            value={endpoint.apiVersion}
          />
          <ProductControlRow
            label="Contract version"
            value={endpoint.contractVersion}
          />
          <ProductControlRow
            label="Auth profile"
            value={endpoint.authProfile}
          />
          <ProductControlRow
            label="Credential ref"
            value={redactSecretRef(endpoint.credentialRef)}
            mono
          />
          <ProductControlRow
            label="Registration source"
            value={endpoint.registrationSource}
          />
        </ProductControlInfoCard>

        <ProductControlInfoCard title="Health & handshake">
          <ProductControlRow
            label="Last handshake"
            value={formatProductControlDate(endpoint.lastHandshakeAt)}
          />
          <ProductControlRow
            label="Handshake status"
            value={endpoint.lastHandshakeStatus ?? "—"}
          />
          <ProductControlRow
            label="Handshake error"
            value={endpoint.lastHandshakeError ?? "—"}
          />
          <ProductControlRow
            label="Last health check"
            value={formatProductControlDate(endpoint.lastHealthCheckAt)}
          />
          <ProductControlRow
            label="Health status"
            value={endpoint.lastHealthStatus ?? "—"}
          />
          <ProductControlRow
            label="Contract fingerprint"
            value={endpoint.contractFingerprint ?? "—"}
            mono
          />
          <ProductControlRow
            label="Identity fingerprint"
            value={endpoint.identityFingerprint ?? "—"}
            mono
          />
          <ProductControlRow
            label="Updated"
            value={formatProductControlDate(endpoint.updatedAt)}
          />
        </ProductControlInfoCard>
      </div>

      <section className="space-y-[var(--space-3)]" aria-label="Negotiated contracts">
        <h2 className="type-sm font-semibold">Negotiated contracts</h2>
        {contracts.length === 0 ? (
          <ProductControlEmpty
            title="No negotiated contracts"
            description="Run Discover contract to capture a compatibility snapshot."
          />
        ) : (
          <ProductControlTableShell
            headers={["Version", "Status", "Fingerprint", "Discovered"]}
          >
            {contracts.map((row) => (
              <tr key={row.id} className="border-t border-[var(--border)]">
                <td className="px-3 py-2">{row.contractVersion}</td>
                <td className="px-3 py-2">
                  <ProductControlStatusBadge status={String(row.status)} />
                </td>
                <td className="px-3 py-2 font-mono type-xs">
                  {shortId(row.fingerprint)}
                </td>
                <td className="px-3 py-2 type-xs text-[var(--text-muted)]">
                  {formatProductControlDate(row.discoveredAt)}
                </td>
              </tr>
            ))}
          </ProductControlTableShell>
        )}
      </section>

      <section className="space-y-[var(--space-3)]" aria-label="Capabilities">
        <h2 className="type-sm font-semibold">Capabilities</h2>
        {capabilities.length === 0 ? (
          <ProductControlEmpty
            title="No capabilities"
            description="Run Discover capabilities to list declared product capabilities."
          />
        ) : (
          <ProductControlTableShell headers={["Capability", "Declared"]}>
            {capabilities.map((row) => (
              <tr key={row.id} className="border-t border-[var(--border)]">
                <td className="px-3 py-2 font-mono type-xs">
                  {row.capabilityCode}
                </td>
                <td className="px-3 py-2 type-xs text-[var(--text-muted)]">
                  {formatProductControlDate(row.declaredAt)}
                </td>
              </tr>
            ))}
          </ProductControlTableShell>
        )}
      </section>

      <section className="space-y-[var(--space-3)]" aria-label="Recent health checks">
        <h2 className="type-sm font-semibold">Recent health checks</h2>
        {healthChecks.length === 0 ? (
          <ProductControlEmpty
            title="No health checks"
            description="Run a health check to record connectivity results."
          />
        ) : (
          <ProductControlTableShell
            headers={["Result", "Latency", "HTTP", "Checked"]}
          >
            {healthChecks.map((row) => (
              <tr key={row.id} className="border-t border-[var(--border)]">
                <td className="px-3 py-2">
                  <ProductControlStatusBadge status={String(row.result)} />
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {row.latencyMs != null ? `${row.latencyMs} ms` : "—"}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {row.httpStatus ?? "—"}
                </td>
                <td className="px-3 py-2 type-xs text-[var(--text-muted)]">
                  {formatProductControlDate(row.checkedAt)}
                </td>
              </tr>
            ))}
          </ProductControlTableShell>
        )}
      </section>

      <section className="space-y-[var(--space-3)]" aria-label="Endpoint exchanges">
        <h2 className="type-sm font-semibold">Recent exchanges</h2>
        {exchangesQuery.isLoading ? (
          <ProductControlLoading label="Loading exchanges…" />
        ) : exchanges.items.length === 0 ? (
          <ProductControlEmpty
            title="No exchanges"
            description="Exchanges appear after control operations against this endpoint."
          />
        ) : (
          <ProductControlTableShell
            headers={["Operation", "Status", "Attempts", "Updated", ""]}
          >
            {exchanges.items.map((row) => (
              <tr key={row.id} className="border-t border-[var(--border)]">
                <td className="px-3 py-2 font-mono type-xs">
                  {row.operationCode}
                </td>
                <td className="px-3 py-2">
                  <ProductControlStatusBadge status={row.status} />
                </td>
                <td className="px-3 py-2 tabular-nums">{row.attemptCount}</td>
                <td className="px-3 py-2 type-xs text-[var(--text-muted)]">
                  {formatProductControlDate(row.updatedAt)}
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/edge/provisioning/product-controls/exchanges/${row.id}`}
                    className="text-[var(--primary)] underline"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </ProductControlTableShell>
        )}
      </section>

      {canHistory ? (
        <section className="space-y-[var(--space-3)]" aria-label="History">
          <h2 className="type-sm font-semibold">History</h2>
          {historyQuery.isLoading ? (
            <ProductControlLoading label="Loading history…" />
          ) : history.items.length === 0 ? (
            <ProductControlEmpty
              title="No history"
              description="Lifecycle actions will appear in this audit trail."
            />
          ) : (
            <ProductControlTableShell
              headers={["Action", "From", "To", "Actor", "When"]}
            >
              {history.items.map((row) => (
                <tr key={row.id} className="border-t border-[var(--border)]">
                  <td className="px-3 py-2">{row.action}</td>
                  <td className="px-3 py-2 type-xs">{row.fromStatus ?? "—"}</td>
                  <td className="px-3 py-2 type-xs">{row.toStatus ?? "—"}</td>
                  <td className="px-3 py-2 type-xs">{row.actorId}</td>
                  <td className="px-3 py-2 type-xs text-[var(--text-muted)]">
                    {formatProductControlDate(row.createdAt)}
                  </td>
                </tr>
              ))}
            </ProductControlTableShell>
          )}
        </section>
      ) : null}

      <ProductControlInfoCard title="Metadata (redacted)">
        <pre className="overflow-x-auto whitespace-pre-wrap font-mono type-xs text-[var(--text-secondary)]">
          {JSON.stringify(safeMeta, null, 2)}
        </pre>
      </ProductControlInfoCard>
    </div>
  );
}
