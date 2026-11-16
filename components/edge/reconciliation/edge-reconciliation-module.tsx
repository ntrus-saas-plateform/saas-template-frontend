"use client";

/**
 * P7.13 — Edge Admin Console: Reconciliation & Operational Governance.
 *
 * Observe / remediate via P7.4. UNKNOWN ≠ deleted. Never invent REMEDIATED.
 * Auto-remediate only when eligible + policy + reversible; else approval.
 */
import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { fieldControlClass } from "@/components/ui/field-control";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { hasAnyEdgePermission, hasEdgePermission } from "@/lib/edge/permissions";
import { unwrapInfraList } from "@/lib/edge/infrastructure";
import { edgeApi } from "@/lib/api/edge";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type {
  ReconciliationEvidence,
  ReconciliationFinding,
  ReconciliationPolicy,
  ReconciliationRun,
} from "@/types/edge-reconciliation";

type TabId = "runs" | "policies" | "history";

const TABS: { id: TabId; label: string; permission: string }[] = [
  { id: "runs", label: "Runs", permission: "platform:reconciliation:read" },
  { id: "policies", label: "Policies", permission: "platform:reconciliation:read" },
  {
    id: "history",
    label: "History",
    permission: "platform:reconciliation:history:read",
  },
];

function statusTone(
  status: string | undefined,
): "default" | "success" | "warning" | "danger" | "info" {
  if (!status) return "default";
  const s = status.toUpperCase();
  if (s === "SUCCEEDED" || s === "REMEDIATED" || s === "ACTIVE" || s === "APPROVED") {
    return "success";
  }
  if (s === "FAILED" || s === "REJECTED" || s === "CANCELLED" || s === "CONFLICT") {
    return "danger";
  }
  if (
    s === "WAITING_APPROVAL" ||
    s === "PENDING" ||
    s === "UNKNOWN" ||
    s === "PARTIAL" ||
    s === "QUARANTINED"
  ) {
    return "warning";
  }
  return "info";
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR");
  } catch {
    return iso;
  }
}

export function EdgeReconciliationModule() {
  const { permissions } = useEdgePlatform();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabId>("runs");
  const [selectedRunId, setSelectedRunId] = useState("");
  const [historyRunId, setHistoryRunId] = useState("");
  const [runFormOpen, setRunFormOpen] = useState(false);
  const [runForm, setRunForm] = useState({
    tenantId: "",
    productId: "",
    policyId: "",
    providerUnreachable: false,
  });
  const [policyFormOpen, setPolicyFormOpen] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    code: "",
    name: "",
    autoRemediate: false,
    requireApproval: true,
  });

  const canRead = hasEdgePermission(permissions, "platform:reconciliation:read");
  const canRun = hasEdgePermission(permissions, "platform:reconciliation:run");
  const canRemediate = hasEdgePermission(
    permissions,
    "platform:reconciliation:remediate",
  );
  const canApprove = hasEdgePermission(
    permissions,
    "platform:reconciliation:approve",
  );
  const canQuarantine = hasEdgePermission(
    permissions,
    "platform:reconciliation:quarantine",
  );
  const canHistory = hasEdgePermission(
    permissions,
    "platform:reconciliation:history:read",
  );

  const runsQ = useQuery({
    queryKey: ["recon", "runs"],
    queryFn: () => edgeApi.listReconciliationRuns({ limit: 50 }),
    enabled: canRead,
  });

  const policiesQ = useQuery({
    queryKey: ["recon", "policies"],
    queryFn: () => edgeApi.listReconciliationPolicies({ limit: 50 }),
    enabled: canRead && (tab === "policies" || runFormOpen),
  });

  const runDetailQ = useQuery({
    queryKey: ["recon", "run", selectedRunId],
    queryFn: () => edgeApi.getReconciliationRun(selectedRunId),
    enabled: canRead && Boolean(selectedRunId),
  });

  const historyQ = useQuery({
    queryKey: ["recon", "evidence", historyRunId],
    queryFn: () => edgeApi.listReconciliationEvidence(historyRunId, { limit: 50 }),
    enabled: canHistory && Boolean(historyRunId),
  });

  const runs = useMemo(
    () => unwrapInfraList<ReconciliationRun>(runsQ.data?.data),
    [runsQ.data],
  );
  const policies = useMemo(
    () => unwrapInfraList<ReconciliationPolicy>(policiesQ.data?.data),
    [policiesQ.data],
  );
  const detail = runDetailQ.data?.data ?? null;
  const evidence = useMemo(
    () => unwrapInfraList<ReconciliationEvidence>(historyQ.data?.data).items,
    [historyQ.data],
  );

  const createRunM = useMutation({
    mutationFn: () =>
      edgeApi.createReconciliationRun({
        tenantId: runForm.tenantId || undefined,
        productId: runForm.productId || undefined,
        policyId: runForm.policyId || undefined,
        metadata: runForm.providerUnreachable
          ? { providerUnreachable: true }
          : {},
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["recon", "runs"] });
      setRunFormOpen(false);
    },
  });

  const observeM = useMutation({
    mutationFn: (runId: string) =>
      edgeApi.observeReconciliationRun(runId, {
        providerUnreachable: runForm.providerUnreachable || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["recon"] });
    },
  });

  const remediateM = useMutation({
    mutationFn: (runId: string) => edgeApi.remediateReconciliationRun(runId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["recon"] });
    },
  });

  const approveM = useMutation({
    mutationFn: (args: { runId: string; remediationId: string }) =>
      edgeApi.decideReconciliationRemediation(args.runId, args.remediationId, {
        decision: "APPROVE",
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["recon"] });
    },
  });

  const quarantineM = useMutation({
    mutationFn: (findingId: string) =>
      edgeApi.quarantineReconciliationFinding(findingId, {
        reason: "Quarantine UNKNOWN / uncertain from console",
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["recon"] });
    },
  });

  const createPolicyM = useMutation({
    mutationFn: () =>
      edgeApi.createReconciliationPolicy({
        code: policyForm.code,
        name: policyForm.name,
        autoRemediate: policyForm.autoRemediate,
        requireApproval: policyForm.requireApproval,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["recon", "policies"] });
      setPolicyFormOpen(false);
    },
  });

  if (!hasAnyEdgePermission(permissions, ["platform:reconciliation:read"])) {
    return <EdgeForbiddenState />;
  }

  const onCreateRun = (e: FormEvent) => {
    e.preventDefault();
    createRunM.mutate();
  };

  const onCreatePolicy = (e: FormEvent) => {
    e.preventDefault();
    createPolicyM.mutate();
  };

  return (
    <div className="space-y-4" data-testid="recon-module">
      <Tabs
        tabs={TABS.filter((t) => hasEdgePermission(permissions, t.permission)).map(
          (t) => ({ id: t.id, label: t.label }),
        )}
        value={tab}
        onChange={(id) => setTab(id as TabId)}
      />

      {tab === "runs" ? (
        <EdgePermissionGate permission="platform:reconciliation:read">
          {runsQ.isLoading ? (
            <EdgeLoadingState label="Chargement des runs de réconciliation..." />
          ) : runsQ.isError ? (
            <EdgeErrorState
              title="Impossible de charger les runs"
              description="Vérifiez les permissions platform:reconciliation:read."
            />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="type-sm text-[var(--text-muted)]">
                  {runs.total} runs — UNKNOWN ≠ deleted · remédiations via P7.4
                </p>
                {canRun ? (
                  <Button
                    type="button"
                    size="sm"
                    data-testid="recon-create-run"
                    onClick={() => setRunFormOpen((o) => !o)}
                  >
                    Nouveau run
                  </Button>
                ) : null}
              </div>

              {runFormOpen ? (
                <Card>
                  <CardHeader title="Créer un run" />
                  <CardBody>
                    <form className="grid gap-3 md:grid-cols-2" onSubmit={onCreateRun}>
                      <input
                        className={fieldControlClass}
                        placeholder="tenantId (UUID)"
                        value={runForm.tenantId}
                        onChange={(e) =>
                          setRunForm((f) => ({ ...f, tenantId: e.target.value }))
                        }
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="productId (UUID)"
                        value={runForm.productId}
                        onChange={(e) =>
                          setRunForm((f) => ({ ...f, productId: e.target.value }))
                        }
                      />
                      <label className="flex items-center gap-2 type-sm md:col-span-2">
                        <input
                          type="checkbox"
                          checked={runForm.providerUnreachable}
                          onChange={(e) =>
                            setRunForm((f) => ({
                              ...f,
                              providerUnreachable: e.target.checked,
                            }))
                          }
                        />
                        Simuler providerUnreachable (⇒ UNKNOWN, jamais deleted)
                      </label>
                      <div className="md:col-span-2">
                        <Button type="submit" disabled={createRunM.isPending}>
                          Créer
                        </Button>
                      </div>
                    </form>
                  </CardBody>
                </Card>
              ) : null}

              {runs.items.length === 0 ? (
                <EdgeEmptyState
                  title="Aucun run de réconciliation"
                  description="Créez un run puis lancez observe via P7.4."
                />
              ) : (
                <Select
                  aria-label="Choisir un run de réconciliation"
                  value={selectedRunId}
                  onChange={(e) => setSelectedRunId(e.target.value)}
                >
                  <option value="">Choisir un run</option>
                  {runs.items.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.id.slice(0, 8)} — {r.runStatus} (drifts={r.driftCount})
                    </option>
                  ))}
                </Select>
              )}

              {selectedRunId && detail?.run ? (
                <div data-testid="recon-run-detail">
                <Card>
                  <CardHeader title="Détail du run" />
                  <p className="mb-[var(--space-3)] type-sm text-[var(--text-muted)]">
                    Statuts issus de l&apos;API uniquement — jamais inventés.
                  </p>
                  <CardBody className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span data-testid="recon-run-status">
                        <Badge tone={statusTone(detail.run.runStatus)}>
                          {detail.run.runStatus}
                        </Badge>
                      </span>
                      <span className="type-sm text-[var(--text-muted)]">
                        drifts={detail.run.driftCount} · démarré{" "}
                        {formatWhen(detail.run.startedAt)}
                      </span>
                    </div>

                    <Alert>
                      Timeout / unreachable ⇒ ObservationClass.UNKNOWN — jamais traité
                      comme deleted. Pas de suppressions aveugles.
                    </Alert>

                    <div className="flex flex-wrap gap-2">
                      {canRun ? (
                        <Button
                          type="button"
                          size="sm"
                          data-testid="recon-observe"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Lancer observe via P7.4 ? P7.1 sera revalidé si provisioningRequestId lié.",
                              )
                            ) {
                              observeM.mutate(selectedRunId);
                            }
                          }}
                        >
                          Observe
                        </Button>
                      ) : null}
                      {canRemediate ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          data-testid="recon-remediate"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Lancer remediate (evidence-only) ? Auto seulement si eligible+policy+reversible.",
                              )
                            ) {
                              remediateM.mutate(selectedRunId);
                            }
                          }}
                        >
                          Remediate
                        </Button>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <h3 className="type-sm font-medium">Findings</h3>
                      {(detail.findings ?? []).length === 0 ? (
                        <p className="type-sm text-[var(--text-muted)]">Aucun finding.</p>
                      ) : (
                        <ul className="space-y-2">
                          {(detail.findings as ReconciliationFinding[]).map((f) => (
                            <li
                              key={f.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--border)] p-2"
                              data-testid={`recon-finding-${f.id}`}
                            >
                              <div className="space-y-1">
                                <div className="flex flex-wrap gap-2">
                                  <Badge tone={statusTone(f.findingStatus)}>
                                    {f.findingStatus}
                                  </Badge>
                                  <Badge tone={statusTone(f.observationClass)}>
                                    {f.observationClass}
                                  </Badge>
                                </div>
                                <p className="type-sm">
                                  {f.findingCode} · {f.resourceType}/{f.resourceRef}
                                </p>
                                {f.message ? (
                                  <p className="type-xs text-[var(--text-muted)]">
                                    {f.message}
                                  </p>
                                ) : null}
                              </div>
                              {canQuarantine && f.findingStatus === "OPEN" ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => quarantineM.mutate(f.id)}
                                >
                                  Quarantine
                                </Button>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h3 className="type-sm font-medium">Remediations</h3>
                      {(detail.remediations ?? []).length === 0 ? (
                        <p className="type-sm text-[var(--text-muted)]">
                          Aucune remediation planifiée.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {detail.remediations.map((r) => (
                            <li
                              key={r.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--border)] p-2"
                            >
                              <div className="flex flex-wrap gap-2">
                                <Badge tone={statusTone(r.remediationStatus)}>
                                  {r.remediationStatus}
                                </Badge>
                                <span className="type-sm">
                                  reversible={String(r.reversible)}
                                </span>
                              </div>
                              {canApprove &&
                              r.remediationStatus === "WAITING_APPROVAL" ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  data-testid={`recon-approve-${r.id}`}
                                  onClick={() =>
                                    approveM.mutate({
                                      runId: selectedRunId,
                                      remediationId: r.id,
                                    })
                                  }
                                >
                                  Approve
                                </Button>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </CardBody>
                </Card>
                </div>
              ) : null}
            </div>
          )}
        </EdgePermissionGate>
      ) : null}

      {tab === "policies" ? (
        <EdgePermissionGate permission="platform:reconciliation:read">
          {policiesQ.isLoading ? (
            <EdgeLoadingState label="Chargement des policies..." />
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between gap-2">
                <p className="type-sm text-[var(--text-muted)]">
                  {policies.total} policies
                </p>
                {canApprove ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setPolicyFormOpen((o) => !o)}
                  >
                    Nouvelle policy
                  </Button>
                ) : null}
              </div>
              {policyFormOpen ? (
                <Card>
                  <CardBody>
                    <form className="grid gap-3" onSubmit={onCreatePolicy}>
                      <input
                        className={fieldControlClass}
                        placeholder="code"
                        value={policyForm.code}
                        onChange={(e) =>
                          setPolicyForm((f) => ({ ...f, code: e.target.value }))
                        }
                        required
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="name"
                        value={policyForm.name}
                        onChange={(e) =>
                          setPolicyForm((f) => ({ ...f, name: e.target.value }))
                        }
                        required
                      />
                      <label className="flex items-center gap-2 type-sm">
                        <input
                          type="checkbox"
                          checked={policyForm.autoRemediate}
                          onChange={(e) =>
                            setPolicyForm((f) => ({
                              ...f,
                              autoRemediate: e.target.checked,
                            }))
                          }
                        />
                        autoRemediate (seulement si finding eligible + reversible)
                      </label>
                      <Button type="submit" disabled={createPolicyM.isPending}>
                        Créer
                      </Button>
                    </form>
                  </CardBody>
                </Card>
              ) : null}
              {policies.items.length === 0 ? (
                <EdgeEmptyState
                  title="Aucune policy"
                  description="Créez une policy avant d’attacher un run."
                />
              ) : (
                <ul className="space-y-2">
                  {policies.items.map((p) => (
                    <li
                      key={p.id}
                      className="rounded border border-[var(--border)] p-3"
                    >
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={statusTone(p.policyStatus)}>{p.policyStatus}</Badge>
                        <span className="type-sm font-medium">
                          {p.code} — {p.name}
                        </span>
                      </div>
                      <p className="type-xs text-[var(--text-muted)]">
                        autoRemediate={String(p.autoRemediate)} · requireApproval=
                        {String(p.requireApproval)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </EdgePermissionGate>
      ) : null}

      {tab === "history" ? (
        <EdgePermissionGate permission="platform:reconciliation:history:read">
          <div className="space-y-4">
            <Select
              aria-label="Choisir un run pour l’historique"
              value={historyRunId}
              onChange={(e) => setHistoryRunId(e.target.value)}
            >
              <option value="">Choisir un run</option>
              {runs.items.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id.slice(0, 8)} — {r.runStatus}
                </option>
              ))}
            </Select>
            {historyQ.isLoading ? (
              <EdgeLoadingState label="Chargement evidence..." />
            ) : evidence.length === 0 ? (
              <EdgeEmptyState
                title="Aucune evidence"
                description="Evidence de réconciliation (P7.13)."
              />
            ) : (
              <ul className="space-y-2">
                {evidence.map((e) => (
                  <li
                    key={e.id}
                    className="rounded border border-[var(--border)] p-2 type-sm"
                  >
                    <Badge tone={statusTone(e.outcome)}>{e.outcome}</Badge>{" "}
                    {e.operation} · {formatWhen(e.createdAt)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </EdgePermissionGate>
      ) : null}
    </div>
  );
}
