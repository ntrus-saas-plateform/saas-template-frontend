"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  ProductControlEmpty,
  ProductControlError,
  ProductControlForbidden,
  ProductControlInfoCard,
  ProductControlLoading,
  ProductControlRow,
  ProductControlStatusBadge,
  formatProductControlDate,
  shortId,
} from "@/components/edge/product-control/shared";
import {
  needsReconciliation,
  productControlApi,
  productControlErrMessage,
  redactProductControlMetadata,
  unwrapEdgeData,
} from "@/lib/edge/product-control";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type { ControlExchangeRecord } from "@/types/edge-product-control";

export default function ProductControlExchangeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { permissions, isLoading: platformLoading } = useEdgePlatform();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const canRead = hasEdgePermission(
    permissions,
    "platform:product_control:read",
  );
  const canReconcile = hasEdgePermission(
    permissions,
    "platform:product_control:reconcile",
  );

  const exchangeQuery = useQuery({
    queryKey: ["edge", "product-control", "exchanges", id],
    queryFn: () => productControlApi.getExchange(id),
    enabled: Boolean(id) && canRead,
  });

  const reconcile = useMutation({
    mutationFn: () => productControlApi.reconcileExchange(id),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({
        queryKey: ["edge", "product-control"],
      });
    },
    onError: (err) => setActionError(productControlErrMessage(err)),
  });

  const exchange = unwrapEdgeData<ControlExchangeRecord>(exchangeQuery.data);

  if (platformLoading) return <ProductControlLoading />;
  if (!canRead) {
    return (
      <ProductControlForbidden description="Exchange detail requires platform:product_control:read." />
    );
  }
  if (exchangeQuery.isLoading) {
    return <ProductControlLoading label="Loading exchange…" />;
  }
  if (exchangeQuery.isError) {
    return (
      <ProductControlError
        description={productControlErrMessage(exchangeQuery.error)}
        onRetry={() => void exchangeQuery.refetch()}
      />
    );
  }
  if (!exchange) {
    return (
      <ProductControlEmpty
        title="Exchange not found"
        description="This control exchange id returned no record."
      />
    );
  }

  const showReconcile =
    canReconcile &&
    needsReconciliation(
      String(exchange.status),
      String(exchange.reconciliationStatus),
    );

  const safeRequest = redactProductControlMetadata(exchange.requestPayload);
  const safeResponse = redactProductControlMetadata(exchange.responsePayload);
  const safeDiagnostics = redactProductControlMetadata(exchange.diagnostics);

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
            Control exchange
          </h1>
          <p className="mt-1 font-mono type-xs text-[var(--text-secondary)]">
            {exchange.id}
          </p>
        </div>
        <ProductControlStatusBadge status={exchange.status} />
      </div>

      {actionError ? (
        <p className="type-sm text-[var(--danger)]" role="alert">
          {actionError}
        </p>
      ) : null}

      {showReconcile ? (
        <Button
          type="button"
          disabled={reconcile.isPending}
          onClick={() => reconcile.mutate()}
        >
          {reconcile.isPending ? "Reconciling…" : "Reconcile"}
        </Button>
      ) : null}

      <div className="grid gap-[var(--space-4)] lg:grid-cols-2">
        <ProductControlInfoCard title="Exchange">
          <ProductControlRow
            label="Operation"
            value={exchange.operationCode}
            mono
          />
          <ProductControlRow
            label="Endpoint"
            value={
              <Link
                href={`/edge/provisioning/product-controls/endpoints/${exchange.endpointId}`}
                className="text-[var(--primary)] underline"
              >
                {shortId(exchange.endpointId)}
              </Link>
            }
          />
          <ProductControlRow
            label="Product"
            value={shortId(exchange.productId)}
            mono
          />
          <ProductControlRow
            label="Workflow"
            value={shortId(exchange.workflowId)}
            mono
          />
          <ProductControlRow
            label="Contract version"
            value={exchange.contractVersion}
          />
          <ProductControlRow
            label="Reconciliation"
            value={
              <ProductControlStatusBadge
                status={String(exchange.reconciliationStatus)}
              />
            }
          />
          <ProductControlRow
            label="Attempts"
            value={String(exchange.attemptCount)}
          />
          <ProductControlRow
            label="Retry eligible"
            value={exchange.retryEligible ? "Yes" : "No"}
          />
        </ProductControlInfoCard>

        <ProductControlInfoCard title="Correlation">
          <ProductControlRow
            label="Request ID"
            value={exchange.requestId}
            mono
          />
          <ProductControlRow
            label="Correlation ID"
            value={exchange.correlationId}
            mono
          />
          <ProductControlRow
            label="Idempotency key"
            value={exchange.idempotencyKey}
            mono
          />
          <ProductControlRow
            label="Request digest"
            value={exchange.requestDigest ?? "—"}
            mono
          />
          <ProductControlRow
            label="Response digest"
            value={exchange.responseDigest ?? "—"}
            mono
          />
          <ProductControlRow
            label="HTTP status"
            value={
              exchange.httpStatus != null ? String(exchange.httpStatus) : "—"
            }
          />
          <ProductControlRow
            label="Error class"
            value={exchange.errorClassification ?? "—"}
          />
          <ProductControlRow
            label="Duration"
            value={
              exchange.durationMs != null ? `${exchange.durationMs} ms` : "—"
            }
          />
          <ProductControlRow
            label="Requested"
            value={formatProductControlDate(exchange.requestTimestamp)}
          />
          <ProductControlRow
            label="Responded"
            value={formatProductControlDate(exchange.responseTimestamp)}
          />
        </ProductControlInfoCard>
      </div>

      <ProductControlInfoCard title="Request payload (redacted)">
        <pre className="overflow-x-auto whitespace-pre-wrap font-mono type-xs text-[var(--text-secondary)]">
          {JSON.stringify(safeRequest, null, 2)}
        </pre>
      </ProductControlInfoCard>

      <ProductControlInfoCard title="Response payload (redacted)">
        <pre className="overflow-x-auto whitespace-pre-wrap font-mono type-xs text-[var(--text-secondary)]">
          {JSON.stringify(safeResponse, null, 2)}
        </pre>
      </ProductControlInfoCard>

      <ProductControlInfoCard title="Diagnostics (redacted)">
        <pre className="overflow-x-auto whitespace-pre-wrap font-mono type-xs text-[var(--text-secondary)]">
          {JSON.stringify(safeDiagnostics, null, 2)}
        </pre>
      </ProductControlInfoCard>
    </div>
  );
}
