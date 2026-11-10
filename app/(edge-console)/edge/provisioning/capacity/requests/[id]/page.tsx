"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import {
  PlacementEmpty,
  PlacementError,
  PlacementForbidden,
  PlacementInfoCard,
  PlacementLoading,
  PlacementRow,
  PlacementStatusBadge,
  PlacementTableShell,
  formatPlacementDate,
  shortId,
} from "@/components/edge/placement/shared";
import {
  placementApi,
  placementErrMessage,
  redactPlacementMetadata,
  unwrapEdgeData,
  unwrapPlacementList,
} from "@/lib/edge/placement";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type {
  CapacityReservationRecord,
  EvaluatePlacementResult,
  PlacementCandidateEvaluation,
  PlacementDecisionRecord,
  PlacementRequestRecord,
} from "@/types/edge-placement";

function newIdempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `idem-${Date.now()}`;
}

export default function PlacementRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { permissions, isLoading: platformLoading } = useEdgePlatform();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [evalResult, setEvalResult] = useState<EvaluatePlacementResult | null>(
    null,
  );

  const canRead = hasEdgePermission(permissions, "platform:placement:read");
  const canEvaluate = hasEdgePermission(
    permissions,
    "platform:placement:evaluate",
  );
  const canConfirm = hasEdgePermission(
    permissions,
    "platform:placement:confirm",
  );
  const canCancel = hasEdgePermission(permissions, "platform:placement:cancel");

  const requestQuery = useQuery({
    queryKey: ["edge", "placement", "requests", id],
    queryFn: () => placementApi.getRequest(id),
    enabled: Boolean(id) && canRead,
  });

  const reservationsQuery = useQuery({
    queryKey: ["edge", "capacity", "reservations", { placementRequestId: id }],
    queryFn: () =>
      placementApi.listReservations({ placementRequestId: id, limit: 50 }),
    enabled: Boolean(id) && canRead,
  });

  const decisionIdFromReservation = useMemo(() => {
    const list = unwrapPlacementList<CapacityReservationRecord>(
      reservationsQuery.data,
    );
    const withDecision = list.items.find((r) => r.placementDecisionId);
    return withDecision?.placementDecisionId ?? null;
  }, [reservationsQuery.data]);

  const activeDecisionId =
    evalResult?.decision.id ?? decisionIdFromReservation ?? null;

  const decisionQuery = useQuery({
    queryKey: ["edge", "placement", "decisions", activeDecisionId],
    queryFn: () => placementApi.getDecision(activeDecisionId!),
    enabled: Boolean(activeDecisionId) && canRead && !evalResult,
  });

  const candidatesQuery = useQuery({
    queryKey: [
      "edge",
      "placement",
      "decisions",
      activeDecisionId,
      "candidates",
    ],
    queryFn: () => placementApi.listCandidates(activeDecisionId!),
    enabled: Boolean(activeDecisionId) && canRead && !evalResult,
  });

  const decision: PlacementDecisionRecord | null =
    evalResult?.decision ??
    unwrapEdgeData<PlacementDecisionRecord>(decisionQuery.data) ??
    null;

  const candidates: PlacementCandidateEvaluation[] =
    evalResult?.candidates ??
    (() => {
      const raw = unwrapEdgeData<
        PlacementCandidateEvaluation[] | { items?: PlacementCandidateEvaluation[] }
      >(candidatesQuery.data);
      if (Array.isArray(raw)) return raw;
      return raw?.items ?? [];
    })();

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["edge", "placement"],
    });
    await queryClient.invalidateQueries({
      queryKey: ["edge", "capacity"],
    });
  };

  const evaluate = useMutation({
    mutationFn: () =>
      placementApi.evaluateRequest(id, {
        idempotencyKey: newIdempotencyKey(),
      }),
    onSuccess: async (res) => {
      const payload = unwrapEdgeData<EvaluatePlacementResult>(res);
      if (payload?.decision) setEvalResult(payload);
      setActionError(null);
      await invalidate();
    },
    onError: (err) => setActionError(placementErrMessage(err)),
  });

  const confirm = useMutation({
    mutationFn: () =>
      placementApi.confirmRequest(id, {
        decisionId: decision?.id,
      }),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (err) => setActionError(placementErrMessage(err)),
  });

  const cancel = useMutation({
    mutationFn: () =>
      placementApi.cancelRequest(id, {
        reason: cancelReason.trim() || "Cancelled from detail",
      }),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (err) => setActionError(placementErrMessage(err)),
  });

  if (platformLoading) return <PlacementLoading />;
  if (!canRead) {
    return (
      <PlacementForbidden description="Placement request detail requires platform:placement:read." />
    );
  }
  if (requestQuery.isLoading) {
    return <PlacementLoading label="Loading placement request…" />;
  }
  if (requestQuery.isError) {
    return (
      <PlacementError
        description={placementErrMessage(requestQuery.error)}
        onRetry={() => void requestQuery.refetch()}
      />
    );
  }

  const request = unwrapEdgeData<PlacementRequestRecord>(requestQuery.data);
  if (!request) {
    return (
      <PlacementEmpty
        title="Request not found"
        description="This placement request id returned no record."
      />
    );
  }

  const registrySnapshot = {
    productRegistryId: request.productRegistryId,
    technicalVersionId: request.technicalVersionId,
    contractId: request.contractId,
    deploymentProfileId: request.deploymentProfileId,
    platformId: request.platformId,
  };

  const eligible = candidates.filter((c) => !c.excluded && c.passedHardConstraints);
  const excluded = candidates.filter((c) => c.excluded || !c.passedHardConstraints);

  return (
    <div className="space-y-[var(--space-6)] p-[var(--space-4)] md:p-[var(--space-6)]">
      <div className="space-y-[var(--space-2)]">
        <Link
          href="/edge/provisioning/capacity"
          className="type-xs text-[var(--primary)] underline-offset-2 hover:underline"
        >
          ← Placement & Capacity
        </Link>
        <p className="type-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          Placement request
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="type-xl font-semibold font-mono">
            {shortId(request.id)}
          </h1>
          <PlacementStatusBadge status={request.requestStatus} />
        </div>
      </div>

      {actionError ? (
        <p className="type-sm text-[var(--danger)]" role="alert">
          {actionError}
        </p>
      ) : null}

      <div className="grid gap-[var(--space-4)] lg:grid-cols-2">
        <PlacementInfoCard title="Request">
          <PlacementRow label="Full ID" value={request.id} mono />
          <PlacementRow
            label="Provisioning request"
            value={request.provisioningRequestId}
            mono
          />
          <PlacementRow
            label="Authorization"
            value={`${shortId(request.authorizationId)} v${request.authorizationVersion}`}
            mono
          />
          <PlacementRow
            label="Account / Subscription"
            value={`${shortId(request.accountId)} / ${shortId(request.subscriptionId)}`}
            mono
          />
          <PlacementRow
            label="Environment type"
            value={request.requestedEnvironmentType}
          />
          <PlacementRow
            label="Deployment model"
            value={request.requestedDeploymentModel}
          />
          <PlacementRow
            label="Region"
            value={request.requestedRegion ?? "—"}
          />
          <PlacementRow
            label="Capacity requirements"
            value={
              <pre className="whitespace-pre-wrap font-mono type-xs">
                {JSON.stringify(request.capacityRequirements ?? {}, null, 2)}
              </pre>
            }
          />
          <PlacementRow
            label="Metadata"
            value={
              <pre className="whitespace-pre-wrap font-mono type-xs">
                {JSON.stringify(
                  redactPlacementMetadata(request.metadata),
                  null,
                  2,
                )}
              </pre>
            }
          />
          <PlacementRow
            label="Updated"
            value={formatPlacementDate(request.updatedAt)}
          />
        </PlacementInfoCard>

        <PlacementInfoCard title="Registry snapshot refs">
          {Object.entries(registrySnapshot).map(([k, v]) => (
            <PlacementRow key={k} label={k} value={v ?? "—"} mono />
          ))}
        </PlacementInfoCard>
      </div>

      <div className="flex flex-wrap gap-2 rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-4)]">
        {canEvaluate ? (
          <Button
            type="button"
            disabled={evaluate.isPending}
            onClick={() => evaluate.mutate()}
          >
            {evaluate.isPending ? "Evaluating…" : "Evaluate"}
          </Button>
        ) : null}
        {canConfirm ? (
          <Button
            type="button"
            variant="outline"
            disabled={confirm.isPending || !decision}
            onClick={() => confirm.mutate()}
          >
            {confirm.isPending ? "Confirming…" : "Confirm placement"}
          </Button>
        ) : null}
        {canCancel ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              className={fieldControlClass}
              placeholder="Cancel reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              aria-label="Cancel reason"
            />
            <Button
              type="button"
              variant="ghost"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate()}
            >
              {cancel.isPending ? "Cancelling…" : "Cancel"}
            </Button>
          </div>
        ) : null}
      </div>

      <section className="space-y-[var(--space-3)]">
        <h2 className="type-md font-semibold">Decision panel</h2>
        {!decision && !decisionQuery.isLoading ? (
          <PlacementEmpty
            title="No decision yet"
            description="Run Evaluate to produce a placement decision and candidate scores."
          />
        ) : decisionQuery.isLoading && !decision ? (
          <PlacementLoading label="Loading decision…" />
        ) : decision ? (
          <div className="grid gap-[var(--space-4)] lg:grid-cols-2">
            <PlacementInfoCard title="Decision">
              <PlacementRow
                label="Decision ID"
                value={
                  <Link
                    href={`/edge/provisioning/capacity/decisions/${decision.id}`}
                    className="text-[var(--primary)] underline-offset-2 hover:underline"
                  >
                    {decision.id}
                  </Link>
                }
                mono
              />
              <PlacementRow
                label="Status"
                value={<PlacementStatusBadge status={decision.decisionStatus} />}
              />
              <PlacementRow
                label="Policy version"
                value={
                  decision.policyVersion != null
                    ? `v${decision.policyVersion} (${shortId(decision.policyId)})`
                    : "—"
                }
              />
              <PlacementRow
                label="Algorithm"
                value={`${decision.algorithmName}@${decision.algorithmVersion}`}
              />
              <PlacementRow
                label="Selected platform"
                value={shortId(decision.selectedPlatformId)}
                mono
              />
              <PlacementRow
                label="Selected environment"
                value={shortId(decision.selectedEnvironmentId)}
                mono
              />
              <PlacementRow
                label="Selected profile"
                value={shortId(decision.selectedProfileId)}
                mono
              />
              <PlacementRow
                label="Selected contract"
                value={
                  decision.selectedContractId
                    ? `${shortId(decision.selectedContractId)}@${decision.selectedContractVersion ?? "?"}`
                    : "—"
                }
                mono
              />
              <PlacementRow
                label="Reservation"
                value={shortId(decision.capacityReservationId)}
                mono
              />
              <PlacementRow
                label="Rejection"
                value={decision.rejectionSummary ?? "—"}
              />
              <PlacementRow
                label="Scoring breakdown"
                value={
                  <pre className="whitespace-pre-wrap font-mono type-xs">
                    {JSON.stringify(
                      redactPlacementMetadata(decision.scoringBreakdown),
                      null,
                      2,
                    )}
                  </pre>
                }
              />
            </PlacementInfoCard>

            <div className="space-y-[var(--space-3)]">
              <h3 className="type-sm font-semibold">
                Eligible candidates ({eligible.length})
              </h3>
              {eligible.length === 0 ? (
                <p className="type-sm text-[var(--text-muted)]">
                  No eligible candidates in this evaluation.
                </p>
              ) : (
                <CandidateTable rows={eligible} />
              )}
              <h3 className="type-sm font-semibold">
                Excluded / hard failures ({excluded.length})
              </h3>
              {excluded.length === 0 ? (
                <p className="type-sm text-[var(--text-muted)]">
                  No excluded candidates.
                </p>
              ) : (
                <CandidateTable rows={excluded} showFailures />
              )}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function CandidateTable({
  rows,
  showFailures,
}: {
  rows: PlacementCandidateEvaluation[];
  showFailures?: boolean;
}) {
  return (
    <PlacementTableShell
      headers={[
        "Rank",
        "Platform",
        "Environment",
        "Score",
        "Compat",
        showFailures ? "Failures / reason" : "Status",
      ]}
    >
      {rows.map((c) => (
        <tr key={c.id} className="border-t border-[var(--border)]">
          <td className="px-3 py-2">{c.rank ?? "—"}</td>
          <td className="px-3 py-2 font-mono type-xs">
            {shortId(c.platformId)}
          </td>
          <td className="px-3 py-2 font-mono type-xs">
            {shortId(c.environmentId)}
          </td>
          <td className="px-3 py-2">{c.score ?? "—"}</td>
          <td className="px-3 py-2">
            {c.compatibilityResult ? (
              <PlacementStatusBadge status={String(c.compatibilityResult)} />
            ) : (
              "—"
            )}
          </td>
          <td className="px-3 py-2 type-xs text-[var(--text-secondary)]">
            {showFailures
              ? c.hardConstraintFailures?.length
                ? c.hardConstraintFailures.join("; ")
                : (c.exclusionReason ?? "excluded")
              : c.excluded
                ? "excluded"
                : "eligible"}
          </td>
        </tr>
      ))}
    </PlacementTableShell>
  );
}
