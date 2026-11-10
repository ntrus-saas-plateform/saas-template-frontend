"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { edgeApi, EdgeApiError } from "@/lib/api/edge";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";

function unwrap<T>(payload: unknown): T | undefined {
  if (payload == null) return undefined;
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Request failed";
}

type RequestDetail = {
  id: string;
  requestNumber: string;
  authorizationId: string;
  authorizationVersion: number;
  authorizationRowId: string | null;
  operation: string;
  accountId: string;
  productId: string;
  subscriptionId: string;
  productTenantId: string | null;
  correlationId: string;
  requestStatus: string;
  environmentSlot: string;
  idempotencyKey: string;
  rejectionReasonCode: string | null;
  cancellationReason: string | null;
  receivedAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  lastTransitionAt: string;
  metadata: Record<string, unknown>;
};

type HistoryEntry = {
  id: string;
  previousStatus: string | null;
  newStatus: string;
  actorType: string;
  actorId: string | null;
  source: string;
  reasonCode: string | null;
  occurredAt: string;
};

export default function ProvisioningRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const { permissions, isLoading: platformLoading } = useEdgePlatform();
  const canRead = hasEdgePermission(
    permissions,
    "platform:provisioning_requests:read",
  );
  const canHistory = hasEdgePermission(
    permissions,
    "platform:provisioning_requests:read_history",
  );
  const canCancel = hasEdgePermission(
    permissions,
    "platform:provisioning_requests:cancel",
  );
  const canAuth = hasEdgePermission(
    permissions,
    "platform:provisioning_authorizations:read",
  );
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const detailQuery = useQuery({
    queryKey: ["edge", "provisioning-requests", id],
    queryFn: () => edgeApi.getProvisioningRequest(id),
    enabled: canRead && Boolean(id),
  });

  const historyQuery = useQuery({
    queryKey: ["edge", "provisioning-requests", id, "history"],
    queryFn: () => edgeApi.getProvisioningRequestHistory(id),
    enabled: canHistory && Boolean(id),
  });

  const authQuery = useQuery({
    queryKey: ["edge", "provisioning-requests", id, "authorization"],
    queryFn: () => edgeApi.getProvisioningRequestAuthorization(id),
    enabled: canAuth && Boolean(id),
  });

  const cancelMutation = useMutation({
    mutationFn: () => edgeApi.cancelProvisioningRequest(id, reason.trim()),
    onSuccess: async () => {
      setConfirmOpen(false);
      setReason("");
      await queryClient.invalidateQueries({
        queryKey: ["edge", "provisioning-requests", id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["edge", "provisioning-requests"],
      });
    },
  });

  if (platformLoading) return <EdgeLoadingState />;
  if (!canRead) {
    return (
      <EdgeForbiddenState description="Missing provisioning read permission" />
    );
  }

  const request =
    unwrap<RequestDetail>(detailQuery.data) ??
    (detailQuery.data as RequestDetail | undefined);
  const historyRaw = unwrap<HistoryEntry[]>(historyQuery.data);
  const history = Array.isArray(historyRaw)
    ? historyRaw
    : Array.isArray(historyQuery.data)
      ? (historyQuery.data as HistoryEntry[])
      : [];
  const authorization =
    unwrap<Record<string, unknown>>(authQuery.data) ??
    (authQuery.data as Record<string, unknown> | undefined);

  return (
    <div className="space-y-[var(--space-6)] p-[var(--space-4)] md:p-[var(--space-6)]">
      <div className="flex flex-wrap items-center gap-[var(--space-3)]">
        <Link
          href="/edge/provisioning-requests"
          className="type-sm text-[var(--primary)] underline-offset-2 hover:underline"
        >
          ← Provisioning requests
        </Link>
      </div>

      {detailQuery.isLoading ? (
        <EdgeLoadingState />
      ) : detailQuery.isError ? (
        <EdgeErrorState
          description={errMessage(detailQuery.error)}
          onRetry={() => void detailQuery.refetch()}
        />
      ) : !request ? (
        <EdgeEmptyState
          title="Request not found"
          description="No provisioning request matches this identifier."
        />
      ) : (
        <>
          <header className="space-y-[var(--space-2)]">
            <h1 className="type-xl font-semibold text-[var(--text-primary)]">
              {request.requestNumber}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{request.requestStatus}</Badge>
              <span className="type-xs text-[var(--text-muted)]">
                Not a technical ACTIVE tenant
              </span>
            </div>
          </header>

          <section className="grid gap-[var(--space-4)] md:grid-cols-2">
            <InfoCard title="Request">
              <Row label="Request ID" value={request.id} mono />
              <Row label="Operation" value={request.operation} />
              <Row label="Environment slot" value={request.environmentSlot} />
              <Row label="Correlation ID" value={request.correlationId} mono />
              <Row label="Idempotency key" value={request.idempotencyKey} mono />
              <Row
                label="Received"
                value={new Date(request.receivedAt).toLocaleString()}
              />
              <Row
                label="Last transition"
                value={new Date(request.lastTransitionAt).toLocaleString()}
              />
              {request.rejectionReasonCode ? (
                <Row label="Rejection" value={request.rejectionReasonCode} />
              ) : null}
              {request.cancellationReason ? (
                <Row label="Cancellation" value={request.cancellationReason} />
              ) : null}
            </InfoCard>

            <InfoCard title="References">
              <Row label="Account" value={request.accountId} mono />
              <Row label="Product" value={request.productId} mono />
              <Row label="Subscription" value={request.subscriptionId} mono />
              <Row
                label="Product tenant"
                value={request.productTenantId ?? "— (not provisioned)"}
                mono={Boolean(request.productTenantId)}
              />
              <Row label="Authorization ID" value={request.authorizationId} mono />
              <Row
                label="Authorization version"
                value={String(request.authorizationVersion)}
              />
            </InfoCard>
          </section>

          {canAuth ? (
            <section className="space-y-[var(--space-3)]">
              <h2 className="type-md font-semibold">Authorization summary</h2>
              {authQuery.isLoading ? (
                <EdgeLoadingState label="Loading authorization…" />
              ) : authQuery.isError ? (
                <EdgeErrorState
                  description={errMessage(authQuery.error)}
                  onRetry={() => void authQuery.refetch()}
                />
              ) : authorization ? (
                <InfoCard title="Verified authorization (no secrets)">
                  <Row
                    label="Verification"
                    value={String(authorization.verificationStatus ?? "—")}
                  />
                  <Row
                    label="Auth status"
                    value={String(authorization.authorizationStatus ?? "—")}
                  />
                  <Row
                    label="Revocation"
                    value={String(authorization.revocationStatus ?? "—")}
                  />
                  <Row label="Issuer" value={String(authorization.issuer ?? "—")} />
                  <Row
                    label="Audience"
                    value={String(authorization.audience ?? "—")}
                  />
                  <Row label="Key ID" value={String(authorization.keyId ?? "—")} mono />
                  <Row
                    label="Algorithm"
                    value={String(authorization.signatureAlgorithm ?? "—")}
                  />
                  <Row
                    label="Payload digest"
                    value={String(authorization.payloadDigest ?? "—")}
                    mono
                  />
                </InfoCard>
              ) : (
                <EdgeEmptyState
                  title="No authorization summary"
                  description="This request has no linked authorization row."
                />
              )}
            </section>
          ) : null}

          {canHistory ? (
            <section className="space-y-[var(--space-3)]">
              <h2 className="type-md font-semibold">History</h2>
              {historyQuery.isLoading ? (
                <EdgeLoadingState label="Loading history…" />
              ) : historyQuery.isError ? (
                <EdgeErrorState
                  description={errMessage(historyQuery.error)}
                  onRetry={() => void historyQuery.refetch()}
                />
              ) : history.length === 0 ? (
                <EdgeEmptyState
                  title="No history entries"
                  description="Transitions will appear here as the request evolves."
                />
              ) : (
                <ol className="space-y-2 border-l border-[var(--border)] pl-4">
                  {history.map((h) => (
                    <li key={h.id} className="type-sm">
                      <p className="font-medium text-[var(--text-primary)]">
                        {h.previousStatus ?? "∅"} → {h.newStatus}
                      </p>
                      <p className="type-xs text-[var(--text-muted)]">
                        {new Date(h.occurredAt).toLocaleString()} · {h.actorType}
                        {h.actorId ? ` · ${h.actorId}` : ""} · {h.source}
                        {h.reasonCode ? ` · ${h.reasonCode}` : ""}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ) : null}

          {canCancel &&
          (request.requestStatus === "REQUESTED" ||
            request.requestStatus === "ACCEPTED") ? (
            <section className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-4)]">
              <h2 className="type-md font-semibold">Cancel request</h2>
              <p className="type-sm text-[var(--text-secondary)]">
                Cancels the P7 request only. Does not revoke the P5 authorization,
                refund, or destroy technical resources.
              </p>
              {!confirmOpen ? (
                <Button type="button" variant="outline" onClick={() => setConfirmOpen(true)}>
                  Cancel this request…
                </Button>
              ) : (
                <div className="space-y-[var(--space-3)]">
                  <textarea
                    className={fieldControlClass}
                    rows={3}
                    placeholder="Justification (required)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  {cancelMutation.isError ? (
                    <p className="type-sm text-[var(--danger)]">
                      {cancelMutation.error instanceof EdgeApiError
                        ? cancelMutation.error.message
                        : "Cancellation failed"}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={!reason.trim() || cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate()}
                    >
                      Confirm cancellation
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setConfirmOpen(false)}
                    >
                      Back
                    </Button>
                  </div>
                </div>
              )}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-[var(--space-4)] space-y-2">
      <h3 className="type-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      <dl className="space-y-1">{children}</dl>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="type-xs text-[var(--text-muted)] sm:w-40 shrink-0">{label}</dt>
      <dd
        className={`type-sm text-[var(--text-primary)] break-all ${mono ? "font-mono type-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
