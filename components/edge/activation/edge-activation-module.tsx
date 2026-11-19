"use client";

/**
 * P7.10 — Edge Admin Console: Technical Readiness & Activation module.
 *
 * Evaluations, activation records, evaluate/activate via P7.4 workflows.
 * NEVER invents ACTIVE — status badges reflect API state only.
 * Technical ACTIVE ≠ commercial Subscription.ACTIVE.
 */
import { Suspense, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { fieldControlClass } from "@/components/ui/field-control";
import { Select } from "@/components/ui/select";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import {
  EdgeStudioShell,
  useStudioSectionParam,
  type StudioSectionGroup,
} from "@/components/edge/studio";
import { hasAnyEdgePermission, hasEdgePermission } from "@/lib/edge/permissions";
import { unwrapInfraList } from "@/lib/edge/infrastructure";
import { edgeApi } from "@/lib/api/edge";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type {
  ActivationEvidence,
  ActivationRecord,
  ActivationRun,
  ReadinessCheck,
  TenantReadinessEvaluation,
} from "@/types/edge-activation";

type TabId = "evaluations" | "records" | "history";

const TABS: { id: TabId; label: string; permission: string }[] = [
  {
    id: "evaluations",
    label: "Evaluations",
    permission: "platform:activation:read",
  },
  {
    id: "records",
    label: "Records",
    permission: "platform:activation:read",
  },
  {
    id: "history",
    label: "History",
    permission: "platform:activation:history:read",
  },
];

const ACT_SECTION_IDS = TABS.map((t) => t.id) as TabId[];

const ACT_STUDIO_GROUPS: { title: string; itemIds: TabId[] }[] = [
  { title: "Readiness", itemIds: ["evaluations", "records"] },
  { title: "Audit", itemIds: ["history"] },
];

function statusTone(
  status: string | undefined,
): "default" | "success" | "warning" | "danger" | "info" {
  if (!status) return "default";
  const s = status.toUpperCase();
  if (
    s === "ACTIVE" ||
    s === "READY" ||
    s === "READY_FOR_ACTIVATION" ||
    s === "PASSED" ||
    s === "SUCCEEDED" ||
    s === "SUCCESS"
  ) {
    return "success";
  }
  if (
    s === "FAILED" ||
    s === "BLOCKED" ||
    s === "ERROR" ||
    s === "EXPIRED" ||
    s === "NOT_READY"
  ) {
    return "danger";
  }
  if (
    s === "PENDING" ||
    s === "EVALUATING" ||
    s === "ACTIVATING" ||
    s === "SUPERSEDED" ||
    s === "SKIPPED"
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

export function EdgeActivationModule() {
  return (
    <Suspense fallback={<EdgeLoadingState label="Loading activation studio…" />}>
      <EdgeActivationStudio />
    </Suspense>
  );
}

function EdgeActivationStudio() {
  const { permissions } = useEdgePlatform();
  const qc = useQueryClient();
  const [tab, setTab] = useStudioSectionParam<TabId>("evaluations", ACT_SECTION_IDS);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [historyRecordId, setHistoryRecordId] = useState("");

  const [evalFormOpen, setEvalFormOpen] = useState(false);
  const [evalForm, setEvalForm] = useState({
    tenantId: "",
    productId: "",
    provisioningRequestId: "",
    subscriptionId: "",
    accountId: "",
  });

  const [recordFormOpen, setRecordFormOpen] = useState(false);
  const [recordForm, setRecordForm] = useState({
    tenantId: "",
    productId: "",
    provisioningRequestId: "",
    readinessEvaluationId: "",
    subscriptionId: "",
    accountId: "",
  });

  const canRead = hasEdgePermission(permissions, "platform:activation:read");
  const canEvaluate = hasEdgePermission(
    permissions,
    "platform:activation:evaluate",
  );
  const canActivate = hasEdgePermission(
    permissions,
    "platform:activation:activate",
  );
  const canHistory = hasEdgePermission(
    permissions,
    "platform:activation:history:read",
  );

  const evaluationsQ = useQuery({
    queryKey: ["act", "evaluations"],
    queryFn: () => edgeApi.listActivationEvaluations({ limit: 50 }),
    enabled: canRead && (tab === "evaluations" || tab === "records"),
  });
  const recordsQ = useQuery({
    queryKey: ["act", "records"],
    queryFn: () => edgeApi.listActivationRecords({ limit: 50 }),
    enabled: canRead && (tab === "records" || tab === "history"),
  });
  const evaluationDetailQ = useQuery({
    queryKey: ["act", "evaluation", selectedEvaluationId],
    queryFn: () => edgeApi.getActivationEvaluation(selectedEvaluationId),
    enabled:
      canRead && Boolean(selectedEvaluationId) && tab === "evaluations",
  });
  const recordDetailQ = useQuery({
    queryKey: ["act", "record", selectedRecordId],
    queryFn: () => edgeApi.getActivationRecord(selectedRecordId),
    enabled: canRead && Boolean(selectedRecordId) && tab === "records",
  });
  const runsQ = useQuery({
    queryKey: ["act", "runs", historyRecordId],
    queryFn: () => edgeApi.listActivationRuns(historyRecordId),
    enabled: canHistory && Boolean(historyRecordId) && tab === "history",
  });
  const evidenceQ = useQuery({
    queryKey: ["act", "evidence", historyRecordId],
    queryFn: () => edgeApi.listActivationEvidence(historyRecordId),
    enabled: canHistory && Boolean(historyRecordId) && tab === "history",
  });

  const evaluations = unwrapInfraList<TenantReadinessEvaluation>(
    evaluationsQ.data?.data,
  );
  const records = unwrapInfraList<ActivationRecord>(recordsQ.data?.data);
  const runs = unwrapInfraList<ActivationRun>(runsQ.data?.data);
  const evidence = unwrapInfraList<ActivationEvidence>(evidenceQ.data?.data);

  const evaluationDetail = evaluationDetailQ.data?.data ?? null;
  const selectedEvaluation =
    evaluationDetail?.evaluation ??
    evaluations.items.find((e) => e.id === selectedEvaluationId) ??
    null;
  const checks: ReadinessCheck[] = evaluationDetail?.checks ?? [];

  const recordDetail = recordDetailQ.data?.data ?? null;
  const selectedRecord =
    recordDetail?.record ??
    records.items.find((r) => r.id === selectedRecordId) ??
    null;

  const createEvaluation = useMutation({
    mutationFn: () =>
      edgeApi.createActivationEvaluation({
        tenantId: evalForm.tenantId,
        productId: evalForm.productId,
        provisioningRequestId: evalForm.provisioningRequestId,
        subscriptionId: evalForm.subscriptionId || undefined,
        accountId: evalForm.accountId || undefined,
      }),
    onSuccess: () => {
      setEvalFormOpen(false);
      setEvalForm({
        tenantId: "",
        productId: "",
        provisioningRequestId: "",
        subscriptionId: "",
        accountId: "",
      });
      void qc.invalidateQueries({ queryKey: ["act", "evaluations"] });
    },
  });

  const evaluateEvaluation = useMutation({
    mutationFn: (id: string) => edgeApi.evaluateActivationEvaluation(id, {}),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: ["act"] });
      void qc.invalidateQueries({ queryKey: ["act", "evaluation", id] });
    },
  });

  const createRecord = useMutation({
    mutationFn: () =>
      edgeApi.createActivationRecord({
        tenantId: recordForm.tenantId,
        productId: recordForm.productId,
        provisioningRequestId: recordForm.provisioningRequestId,
        readinessEvaluationId: recordForm.readinessEvaluationId || undefined,
        subscriptionId: recordForm.subscriptionId || undefined,
        accountId: recordForm.accountId || undefined,
      }),
    onSuccess: () => {
      setRecordFormOpen(false);
      setRecordForm({
        tenantId: "",
        productId: "",
        provisioningRequestId: "",
        readinessEvaluationId: "",
        subscriptionId: "",
        accountId: "",
      });
      void qc.invalidateQueries({ queryKey: ["act", "records"] });
    },
  });

  const evaluateRecord = useMutation({
    mutationFn: (id: string) => edgeApi.evaluateActivationRecord(id, {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["act"] }),
  });

  const activateRecord = useMutation({
    mutationFn: (id: string) => edgeApi.activateActivationRecord(id, {}),
    onSuccess: () => {
      // Invalidate only — never set ACTIVE locally; wait for API status.
      void qc.invalidateQueries({ queryKey: ["act"] });
    },
  });

  const studioGroups: StudioSectionGroup[] = useMemo(() => {
    const visibleIds = new Set(
      TABS.filter((t) => hasEdgePermission(permissions, t.permission)).map(
        (t) => t.id,
      ),
    );
    return ACT_STUDIO_GROUPS.map((g) => ({
      title: g.title,
      items: g.itemIds
        .filter((id) => visibleIds.has(id))
        .map((id) => {
          const t = TABS.find((x) => x.id === id)!;
          return { id: t.id, label: t.label };
        }),
    })).filter((g) => g.items.length > 0);
  }, [permissions]);

  if (!hasAnyEdgePermission(permissions, ["platform:activation:read"])) {
    return <EdgeForbiddenState />;
  }

  function onCreateEvaluation(e: FormEvent) {
    e.preventDefault();
    createEvaluation.mutate();
  }

  function onCreateRecord(e: FormEvent) {
    e.preventDefault();
    createRecord.mutate();
  }

  function confirmEvaluateEvaluation(id: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Lancer l'évaluation de readiness technique via le workflow P7.4 ? L'autorisation P7.1 sera revalidée.",
      )
    ) {
      return;
    }
    evaluateEvaluation.mutate(id);
  }

  function confirmEvaluateRecord(id: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Relancer l'évaluation liée à ce record d'activation via P7.4 ?",
      )
    ) {
      return;
    }
    evaluateRecord.mutate(id);
  }

  function confirmActivate(id: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Lancer l'activation technique (fail-closed) via P7.4 ? Ceci n'active PAS l'abonnement commercial.",
      )
    ) {
      return;
    }
    activateRecord.mutate(id);
  }

  const actionError =
    createEvaluation.error ??
    evaluateEvaluation.error ??
    createRecord.error ??
    evaluateRecord.error ??
    activateRecord.error;

  return (
    <EdgeStudioShell
      title="Activation studio"
      description="Technical readiness & activation via P7.4 — never invents ACTIVE. Technical ≠ commercial."
      groups={studioGroups}
      section={tab}
      onSectionChange={(id) => setTab(id as TabId)}
      testId="act-module"
    >
      {actionError ? (
        <Alert tone="error" title="Action refusée">
          {(actionError as Error).message}
        </Alert>
      ) : null}


      {tab === "evaluations" && (
        <EdgePermissionGate permission="platform:activation:read">
          {evaluationsQ.isLoading ? (
            <EdgeLoadingState label="Chargement des évaluations..." />
          ) : evaluationsQ.isError ? (
            <EdgeErrorState
              description={(evaluationsQ.error as Error).message}
            />
          ) : (
            <div className="flex flex-col gap-[var(--space-4)]">
              <div className="flex items-center justify-between">
                <p className="type-sm text-[var(--text-muted)]">
                  {evaluations.total} évaluation(s) de readiness
                </p>
                {canEvaluate ? (
                  <Button
                    type="button"
                    onClick={() => setEvalFormOpen((o) => !o)}
                    data-testid="act-eval-toggle"
                  >
                    {evalFormOpen ? "Annuler" : "Créer une évaluation"}
                  </Button>
                ) : null}
              </div>

              {evalFormOpen && canEvaluate ? (
                <Card>
                  <CardHeader title="Nouvelle évaluation de readiness" />
                  <CardBody>
                    <form
                      onSubmit={onCreateEvaluation}
                      className="grid gap-[var(--space-3)] md:grid-cols-2"
                    >
                      <input
                        className={fieldControlClass}
                        placeholder="tenantId"
                        required
                        value={evalForm.tenantId}
                        onChange={(e) =>
                          setEvalForm((f) => ({
                            ...f,
                            tenantId: e.target.value,
                          }))
                        }
                        aria-label="Tenant ID"
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="productId"
                        required
                        value={evalForm.productId}
                        onChange={(e) =>
                          setEvalForm((f) => ({
                            ...f,
                            productId: e.target.value,
                          }))
                        }
                        aria-label="Product ID"
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="provisioningRequestId (P7.1)"
                        required
                        value={evalForm.provisioningRequestId}
                        onChange={(e) =>
                          setEvalForm((f) => ({
                            ...f,
                            provisioningRequestId: e.target.value,
                          }))
                        }
                        aria-label="Provisioning request ID"
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="subscriptionId (optionnel)"
                        value={evalForm.subscriptionId}
                        onChange={(e) =>
                          setEvalForm((f) => ({
                            ...f,
                            subscriptionId: e.target.value,
                          }))
                        }
                        aria-label="Subscription ID"
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="accountId (optionnel)"
                        value={evalForm.accountId}
                        onChange={(e) =>
                          setEvalForm((f) => ({
                            ...f,
                            accountId: e.target.value,
                          }))
                        }
                        aria-label="Account ID"
                      />
                      <div className="md:col-span-2">
                        <Button
                          type="submit"
                          disabled={createEvaluation.isPending}
                        >
                          {createEvaluation.isPending
                            ? "Création..."
                            : "Créer"}
                        </Button>
                      </div>
                    </form>
                  </CardBody>
                </Card>
              ) : null}

              {evaluations.items.length === 0 ? (
                <EdgeEmptyState
                  title="Aucune évaluation"
                  description="Créez une évaluation liée à une provisioning request P7.1."
                />
              ) : (
                <>
                  <Select
                    value={selectedEvaluationId}
                    onChange={(e) => setSelectedEvaluationId(e.target.value)}
                    aria-label="Choisir une évaluation"
                  >
                    <option value="">Choisir une évaluation</option>
                    {evaluations.items.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.tenantId} — {ev.evaluationStatus}
                      </option>
                    ))}
                  </Select>

                  {!selectedEvaluationId ? (
                    <EdgeEmptyState
                      title="Sélectionnez une évaluation"
                      description="Statut, checks et lancement evaluate via P7.4."
                    />
                  ) : evaluationDetailQ.isLoading ? (
                    <EdgeLoadingState label="Chargement du détail..." />
                  ) : evaluationDetailQ.isError ? (
                    <EdgeErrorState
                      description={(evaluationDetailQ.error as Error).message}
                    />
                  ) : selectedEvaluation ? (
                    <div
                      className="flex flex-col gap-[var(--space-4)]"
                      data-testid="act-eval-detail"
                    >
                      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
                        <span data-testid="act-eval-status">
                          <Badge
                            tone={statusTone(
                              String(selectedEvaluation.evaluationStatus),
                            )}
                          >
                            {selectedEvaluation.evaluationStatus}
                          </Badge>
                        </span>
                        <span className="type-sm text-[var(--text-muted)]">
                          Score{" "}
                          {selectedEvaluation.overallScore ?? "—"}
                        </span>
                      </div>

                      <dl className="grid gap-[var(--space-2)] type-sm md:grid-cols-2">
                        <div>
                          <dt className="text-[var(--text-muted)]">Tenant</dt>
                          <dd>{selectedEvaluation.tenantId}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--text-muted)]">Product</dt>
                          <dd>{selectedEvaluation.productId}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--text-muted)]">
                            Provisioning request
                          </dt>
                          <dd>
                            {selectedEvaluation.provisioningRequestId}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[var(--text-muted)]">
                            Évalué le
                          </dt>
                          <dd>
                            {formatWhen(selectedEvaluation.evaluatedAt)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[var(--text-muted)]">Workflow</dt>
                          <dd>{selectedEvaluation.workflowId ?? "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--text-muted)]">
                            Codes bloquants
                          </dt>
                          <dd>
                            {selectedEvaluation.blockingCodes?.length
                              ? selectedEvaluation.blockingCodes.join(", ")
                              : "—"}
                          </dd>
                        </div>
                      </dl>

                      {canEvaluate ? (
                        <Button
                          type="button"
                          data-testid="act-evaluate"
                          disabled={evaluateEvaluation.isPending}
                          onClick={() =>
                            confirmEvaluateEvaluation(selectedEvaluation.id)
                          }
                        >
                          Evaluate
                        </Button>
                      ) : null}

                      <Card>
                        <CardHeader title={`Checks (${checks.length})`} />
                        <CardBody>
                          {checks.length === 0 ? (
                            <p className="type-sm text-[var(--text-muted)]">
                              Aucun check (créez puis lancez Evaluate).
                            </p>
                          ) : (
                            <ul
                              className="flex flex-col gap-[var(--space-2)] type-sm"
                              data-testid="act-checks"
                            >
                              {checks.map((c) => (
                                <li
                                  key={c.id}
                                  className="flex flex-wrap items-center gap-[var(--space-2)]"
                                  data-testid={`act-check-${c.checkCode}`}
                                >
                                  <Badge
                                    tone={statusTone(String(c.checkStatus))}
                                  >
                                    {c.checkStatus}
                                  </Badge>
                                  <code>{c.checkCode}</code>
                                  <Badge tone="info">{c.checkPhase}</Badge>
                                  {c.required ? (
                                    <span className="text-[var(--text-muted)]">
                                      required
                                    </span>
                                  ) : null}
                                  <span className="text-[var(--text-muted)]">
                                    {c.message ?? "—"}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </CardBody>
                      </Card>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          )}
        </EdgePermissionGate>
      )}

      {tab === "records" && (
        <EdgePermissionGate permission="platform:activation:read">
          {recordsQ.isLoading ? (
            <EdgeLoadingState label="Chargement des records..." />
          ) : recordsQ.isError ? (
            <EdgeErrorState description={(recordsQ.error as Error).message} />
          ) : (
            <div className="flex flex-col gap-[var(--space-4)]">
              <div className="flex items-center justify-between">
                <p className="type-sm text-[var(--text-muted)]">
                  {records.total} record(s) d&apos;activation
                </p>
                {canActivate ? (
                  <Button
                    type="button"
                    onClick={() => setRecordFormOpen((o) => !o)}
                    data-testid="act-record-toggle"
                  >
                    {recordFormOpen ? "Annuler" : "Créer un record"}
                  </Button>
                ) : null}
              </div>

              {recordFormOpen && canActivate ? (
                <Card>
                  <CardHeader title="Nouveau record d'activation" />
                  <CardBody>
                    <form
                      onSubmit={onCreateRecord}
                      className="grid gap-[var(--space-3)] md:grid-cols-2"
                    >
                      <input
                        className={fieldControlClass}
                        placeholder="tenantId"
                        required
                        value={recordForm.tenantId}
                        onChange={(e) =>
                          setRecordForm((f) => ({
                            ...f,
                            tenantId: e.target.value,
                          }))
                        }
                        aria-label="Tenant ID"
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="productId"
                        required
                        value={recordForm.productId}
                        onChange={(e) =>
                          setRecordForm((f) => ({
                            ...f,
                            productId: e.target.value,
                          }))
                        }
                        aria-label="Product ID"
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="provisioningRequestId (P7.1)"
                        required
                        value={recordForm.provisioningRequestId}
                        onChange={(e) =>
                          setRecordForm((f) => ({
                            ...f,
                            provisioningRequestId: e.target.value,
                          }))
                        }
                        aria-label="Provisioning request ID"
                      />
                      <Select
                        value={recordForm.readinessEvaluationId}
                        onChange={(e) =>
                          setRecordForm((f) => ({
                            ...f,
                            readinessEvaluationId: e.target.value,
                          }))
                        }
                        aria-label="Évaluation de readiness"
                      >
                        <option value="">Évaluation (optionnel)</option>
                        {evaluations.items.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.id.slice(0, 8)}… — {ev.evaluationStatus}
                          </option>
                        ))}
                      </Select>
                      <input
                        className={fieldControlClass}
                        placeholder="subscriptionId (optionnel)"
                        value={recordForm.subscriptionId}
                        onChange={(e) =>
                          setRecordForm((f) => ({
                            ...f,
                            subscriptionId: e.target.value,
                          }))
                        }
                        aria-label="Subscription ID"
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="accountId (optionnel)"
                        value={recordForm.accountId}
                        onChange={(e) =>
                          setRecordForm((f) => ({
                            ...f,
                            accountId: e.target.value,
                          }))
                        }
                        aria-label="Account ID"
                      />
                      <div className="md:col-span-2">
                        <Button
                          type="submit"
                          disabled={createRecord.isPending}
                        >
                          {createRecord.isPending ? "Création..." : "Créer"}
                        </Button>
                      </div>
                    </form>
                  </CardBody>
                </Card>
              ) : null}

              {records.items.length === 0 ? (
                <EdgeEmptyState
                  title="Aucun record"
                  description="Créez un record lié à une provisioning request P7.1 (n'active pas)."
                />
              ) : (
                <>
                  <Select
                    value={selectedRecordId}
                    onChange={(e) => setSelectedRecordId(e.target.value)}
                    aria-label="Choisir un record"
                  >
                    <option value="">Choisir un record</option>
                    {records.items.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.tenantId} — {r.activationStatus}
                      </option>
                    ))}
                  </Select>

                  {!selectedRecordId ? (
                    <EdgeEmptyState
                      title="Sélectionnez un record"
                      description="Statut API uniquement — Activate lance le workflow fail-closed."
                    />
                  ) : recordDetailQ.isLoading ? (
                    <EdgeLoadingState label="Chargement du détail..." />
                  ) : recordDetailQ.isError ? (
                    <EdgeErrorState
                      description={(recordDetailQ.error as Error).message}
                    />
                  ) : selectedRecord ? (
                    <div
                      className="flex flex-col gap-[var(--space-4)]"
                      data-testid="act-record-detail"
                    >
                      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
                        <span data-testid="act-record-status">
                          <Badge
                            tone={statusTone(
                              String(selectedRecord.activationStatus),
                            )}
                          >
                            {selectedRecord.activationStatus}
                          </Badge>
                        </span>
                        {selectedRecord.activatedAt ? (
                          <span className="type-sm text-[var(--text-muted)]">
                            Activé {formatWhen(selectedRecord.activatedAt)}
                          </span>
                        ) : null}
                      </div>

                      <dl className="grid gap-[var(--space-2)] type-sm md:grid-cols-2">
                        <div>
                          <dt className="text-[var(--text-muted)]">Tenant</dt>
                          <dd>{selectedRecord.tenantId}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--text-muted)]">Product</dt>
                          <dd>{selectedRecord.productId}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--text-muted)]">
                            Provisioning request
                          </dt>
                          <dd>{selectedRecord.provisioningRequestId}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--text-muted)]">
                            Évaluation liée
                          </dt>
                          <dd>
                            {selectedRecord.readinessEvaluationId ?? "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[var(--text-muted)]">Workflow</dt>
                          <dd>{selectedRecord.workflowId ?? "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--text-muted)]">Échec</dt>
                          <dd>
                            {selectedRecord.failureCode
                              ? `${selectedRecord.failureCode}: ${selectedRecord.failureMessage ?? ""}`
                              : "—"}
                          </dd>
                        </div>
                      </dl>

                      <div className="flex flex-wrap gap-[var(--space-2)]">
                        {canEvaluate ? (
                          <Button
                            type="button"
                            variant="outline"
                            data-testid="act-record-evaluate"
                            disabled={evaluateRecord.isPending}
                            onClick={() =>
                              confirmEvaluateRecord(selectedRecord.id)
                            }
                          >
                            Evaluate
                          </Button>
                        ) : null}
                        {canActivate ? (
                          <Button
                            type="button"
                            data-testid="act-activate"
                            disabled={activateRecord.isPending}
                            onClick={() => confirmActivate(selectedRecord.id)}
                          >
                            Activate
                          </Button>
                        ) : null}
                      </div>

                      <p className="type-xs text-[var(--text-muted)]">
                        L&apos;activation technique ne définit pas
                        Subscription.ACTIVE commercial. Le statut ACTIVE
                        n&apos;apparaît qu&apos;après confirmation API.
                      </p>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          )}
        </EdgePermissionGate>
      )}

      {tab === "history" && (
        <EdgePermissionGate permission="platform:activation:history:read">
          <div className="flex flex-col gap-[var(--space-4)]">
            <Select
              value={historyRecordId}
              onChange={(e) => setHistoryRecordId(e.target.value)}
              aria-label="Choisir un record pour l'historique"
            >
              <option value="">Choisir un record</option>
              {records.items.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.tenantId} — {r.activationStatus}
                </option>
              ))}
            </Select>

            {!historyRecordId ? (
              <EdgeEmptyState
                title="Sélectionnez un record"
                description="Runs d'activation et evidence P7.10."
              />
            ) : runsQ.isLoading || evidenceQ.isLoading ? (
              <EdgeLoadingState label="Chargement de l'historique..." />
            ) : (
              <>
                <Card>
                  <CardHeader title={`Activation runs (${runs.total})`} />
                  <CardBody>
                    {runs.items.length === 0 ? (
                      <p className="type-sm text-[var(--text-muted)]">
                        Aucun run.
                      </p>
                    ) : (
                      <ul
                        className="flex flex-col gap-[var(--space-2)] type-sm"
                        data-testid="act-runs"
                      >
                        {runs.items.map((r) => (
                          <li
                            key={r.id}
                            className="flex flex-wrap items-center gap-[var(--space-2)]"
                          >
                            <Badge tone={statusTone(String(r.outcome))}>
                              {r.outcome}
                            </Badge>
                            <span>{r.operation}</span>
                            <span className="text-[var(--text-muted)]">
                              {formatWhen(r.startedAt)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title={`Evidence (${evidence.total})`} />
                  <CardBody>
                    {evidence.items.length === 0 ? (
                      <p className="type-sm text-[var(--text-muted)]">
                        Aucune evidence.
                      </p>
                    ) : (
                      <ul
                        className="flex flex-col gap-[var(--space-2)] type-sm"
                        data-testid="act-evidence"
                      >
                        {evidence.items.slice(0, 30).map((ev) => (
                          <li
                            key={ev.id}
                            className="flex flex-wrap items-center gap-[var(--space-2)]"
                          >
                            <Badge
                              tone={
                                ev.outcome === "SUCCESS" ||
                                ev.outcome === "SUCCEEDED"
                                  ? "success"
                                  : "danger"
                              }
                            >
                              {ev.outcome}
                            </Badge>
                            <span>{ev.operation}</span>
                            <span className="text-[var(--text-muted)]">
                              {ev.stepKey ?? "—"}
                            </span>
                            <span className="text-[var(--text-muted)]">
                              {formatWhen(ev.createdAt)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardBody>
                </Card>
              </>
            )}
          </div>
        </EdgePermissionGate>
      )}
    </EdgeStudioShell>
  );
}
