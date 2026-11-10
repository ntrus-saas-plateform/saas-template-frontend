"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
} from "@/lib/edge/placement";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type {
  PlacementCandidateEvaluation,
  PlacementDecisionRecord,
} from "@/types/edge-placement";

export default function PlacementDecisionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { permissions, isLoading: platformLoading } = useEdgePlatform();
  const canRead = hasEdgePermission(permissions, "platform:placement:read");

  const decisionQuery = useQuery({
    queryKey: ["edge", "placement", "decisions", id],
    queryFn: () => placementApi.getDecision(id),
    enabled: Boolean(id) && canRead,
  });

  const candidatesQuery = useQuery({
    queryKey: ["edge", "placement", "decisions", id, "candidates"],
    queryFn: () => placementApi.listCandidates(id),
    enabled: Boolean(id) && canRead,
  });

  if (platformLoading) return <PlacementLoading />;
  if (!canRead) {
    return (
      <PlacementForbidden description="Decision detail requires platform:placement:read." />
    );
  }
  if (decisionQuery.isLoading) {
    return <PlacementLoading label="Loading decision…" />;
  }
  if (decisionQuery.isError) {
    return (
      <PlacementError
        description={placementErrMessage(decisionQuery.error)}
        onRetry={() => void decisionQuery.refetch()}
      />
    );
  }

  const decision = unwrapEdgeData<PlacementDecisionRecord>(decisionQuery.data);
  if (!decision) {
    return (
      <PlacementEmpty
        title="Decision not found"
        description="No placement decision exists for this id."
      />
    );
  }

  const candidatesRaw = unwrapEdgeData<
    PlacementCandidateEvaluation[] | { items?: PlacementCandidateEvaluation[] }
  >(candidatesQuery.data);
  const candidates = Array.isArray(candidatesRaw)
    ? candidatesRaw
    : (candidatesRaw?.items ?? []);

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
          Placement decision
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="type-xl font-semibold font-mono">{shortId(decision.id)}</h1>
          <PlacementStatusBadge status={decision.decisionStatus} />
        </div>
      </div>

      <div className="grid gap-[var(--space-4)] lg:grid-cols-2">
        <PlacementInfoCard title="Decision">
          <PlacementRow label="Full ID" value={decision.id} mono />
          <PlacementRow
            label="Request"
            value={
              <Link
                href={`/edge/provisioning/capacity/requests/${decision.placementRequestId}`}
                className="text-[var(--primary)] underline-offset-2 hover:underline"
              >
                {decision.placementRequestId}
              </Link>
            }
            mono
          />
          <PlacementRow
            label="Policy version"
            value={
              decision.policyVersion != null
                ? `v${decision.policyVersion}`
                : "—"
            }
          />
          <PlacementRow
            label="Algorithm"
            value={`${decision.algorithmName}@${decision.algorithmVersion}`}
          />
          <PlacementRow
            label="Selected environment"
            value={shortId(decision.selectedEnvironmentId)}
            mono
          />
          <PlacementRow
            label="Decided at"
            value={formatPlacementDate(decision.decidedAt)}
          />
          <PlacementRow
            label="Rejection"
            value={decision.rejectionSummary ?? "—"}
          />
        </PlacementInfoCard>

        <PlacementInfoCard title="Evaluation snapshots">
          <PlacementRow
            label="Scoring"
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
          <PlacementRow
            label="Policy evaluation"
            value={
              <pre className="whitespace-pre-wrap font-mono type-xs">
                {JSON.stringify(
                  redactPlacementMetadata(decision.policyEvaluationSnapshot),
                  null,
                  2,
                )}
              </pre>
            }
          />
          <PlacementRow
            label="Registry / evaluation snapshot"
            value={
              <pre className="whitespace-pre-wrap font-mono type-xs">
                {JSON.stringify(
                  redactPlacementMetadata(decision.evaluationSnapshot),
                  null,
                  2,
                )}
              </pre>
            }
          />
        </PlacementInfoCard>
      </div>

      <section className="space-y-[var(--space-3)]">
        <h2 className="type-md font-semibold">Candidates</h2>
        {candidatesQuery.isLoading ? (
          <PlacementLoading label="Loading candidates…" />
        ) : candidatesQuery.isError ? (
          <PlacementError
            description={placementErrMessage(candidatesQuery.error)}
            onRetry={() => void candidatesQuery.refetch()}
          />
        ) : candidates.length === 0 ? (
          <PlacementEmpty
            title="No candidates"
            description="This decision has no stored candidate evaluations."
          />
        ) : (
          <PlacementTableShell
            headers={[
              "Rank",
              "Platform",
              "Environment",
              "Score",
              "Compat",
              "Eligible",
              "Failures",
            ]}
          >
            {candidates.map((c) => (
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
                    <PlacementStatusBadge
                      status={String(c.compatibilityResult)}
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2">
                  {c.excluded || !c.passedHardConstraints ? "No" : "Yes"}
                </td>
                <td className="px-3 py-2 type-xs text-[var(--text-secondary)]">
                  {c.hardConstraintFailures?.join("; ") ||
                    c.exclusionReason ||
                    "—"}
                </td>
              </tr>
            ))}
          </PlacementTableShell>
        )}
      </section>
    </div>
  );
}
