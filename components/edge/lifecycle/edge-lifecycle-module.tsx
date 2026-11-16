"use client";

/**
 * P7.11 — Edge Admin Console: Tenant Technical Lifecycle module.
 *
 * Records, suspend / resume / deprovision via P7.4 workflows.
 * NEVER invents SUSPENDED/DEPROVISIONED — status badges reflect API state only.
 * Technical lifecycle ≠ commercial Subscription status.
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
  LifecycleEvidence,
  LifecycleRun,
  TenantLifecycleRecord,
} from "@/types/edge-lifecycle";

type TabId = "records" | "history";

const TABS: { id: TabId; label: string; permission: string }[] = [
  { id: "records", label: "Records", permission: "platform:lifecycle:read" },
  {
    id: "history",
    label: "History",
    permission: "platform:lifecycle:history:read",
  },
];

function statusTone(
  status: string | undefined,
): "default" | "success" | "warning" | "danger" | "info" {
  if (!status) return "default";
  const s = status.toUpperCase();
  if (s === "ACTIVE" || s === "SUCCEEDED" || s === "SUCCESS") return "success";
  if (
    s === "FAILED" ||
    s === "DEPROVISIONED" ||
    s === "DATA_PURGED" ||
    s === "ERROR"
  ) {
    return "danger";
  }
  if (
    s === "SUSPENDING" ||
    s === "SUSPENDED" ||
    s === "RESUMING" ||
    s === "DEPROVISIONING" ||
    s === "WAITING_APPROVAL" ||
    s === "PENDING" ||
    s === "PARTIAL" ||
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

export function EdgeLifecycleModule() {
  const { permissions } = useEdgePlatform();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabId>("records");
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [historyRecordId, setHistoryRecordId] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    activationRecordId: "",
    retentionPolicyRef: "",
    exportEvidenceRef: "",
  });

  const [deprovisionOpen, setDeprovisionOpen] = useState(false);
  const [deprovisionForm, setDeprovisionForm] = useState({
    reason: "",
    exportEvidenceRef: "",
    authorized: false,
    confirmed: false,
  });

  const canRead = hasEdgePermission(permissions, "platform:lifecycle:read");
  const canSuspend = hasEdgePermission(
    permissions,
    "platform:lifecycle:suspend",
  );
  const canResume = hasEdgePermission(permissions, "platform:lifecycle:resume");
  const canDeprovision = hasEdgePermission(
    permissions,
    "platform:lifecycle:deprovision",
  );
  const canHistory = hasEdgePermission(
    permissions,
    "platform:lifecycle:history:read",
  );

  const recordsQ = useQuery({
    queryKey: ["lc", "records"],
    queryFn: () => edgeApi.listLifecycleRecords({ limit: 50 }),
    enabled: canRead,
  });
  const recordDetailQ = useQuery({
    queryKey: ["lc", "record", selectedRecordId],
    queryFn: () => edgeApi.getLifecycleRecord(selectedRecordId),
    enabled: canRead && Boolean(selectedRecordId) && tab === "records",
  });
  const runsQ = useQuery({
    queryKey: ["lc", "runs", historyRecordId],
    queryFn: () => edgeApi.listLifecycleRuns(historyRecordId),
    enabled: canHistory && Boolean(historyRecordId) && tab === "history",
  });
  const evidenceQ = useQuery({
    queryKey: ["lc", "evidence", historyRecordId],
    queryFn: () => edgeApi.listLifecycleEvidence(historyRecordId),
    enabled: canHistory && Boolean(historyRecordId) && tab === "history",
  });

  const records = unwrapInfraList<TenantLifecycleRecord>(recordsQ.data?.data);
  const runs = unwrapInfraList<LifecycleRun>(runsQ.data?.data);
  const evidence = unwrapInfraList<LifecycleEvidence>(evidenceQ.data?.data);

  const recordDetail = recordDetailQ.data?.data ?? null;
  const selectedRecord =
    recordDetail?.record ??
    records.items.find((r) => r.id === selectedRecordId) ??
    null;

  const createRecord = useMutation({
    mutationFn: () =>
      edgeApi.createLifecycleRecord({
        activationRecordId: form.activationRecordId,
        retentionPolicyRef: form.retentionPolicyRef || undefined,
        exportEvidenceRef: form.exportEvidenceRef || undefined,
      }),
    onSuccess: () => {
      setFormOpen(false);
      setForm({
        activationRecordId: "",
        retentionPolicyRef: "",
        exportEvidenceRef: "",
      });
      void qc.invalidateQueries({ queryKey: ["lc", "records"] });
    },
  });

  const suspendRecord = useMutation({
    mutationFn: (id: string) => edgeApi.suspendLifecycleRecord(id, {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["lc"] }),
  });

  const resumeRecord = useMutation({
    mutationFn: (id: string) => edgeApi.resumeLifecycleRecord(id, {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["lc"] }),
  });

  const deprovisionRecord = useMutation({
    mutationFn: (id: string) =>
      edgeApi.deprovisionLifecycleRecord(id, {
        authorized: true,
        confirmed: true,
        reason: deprovisionForm.reason,
        exportEvidenceRef: deprovisionForm.exportEvidenceRef || undefined,
      }),
    onSuccess: () => {
      setDeprovisionOpen(false);
      setDeprovisionForm({
        reason: "",
        exportEvidenceRef: "",
        authorized: false,
        confirmed: false,
      });
      void qc.invalidateQueries({ queryKey: ["lc"] });
    },
  });

  const visibleTabs = useMemo(
    () => TABS.filter((t) => hasEdgePermission(permissions, t.permission)),
    [permissions],
  );

  if (!hasAnyEdgePermission(permissions, ["platform:lifecycle:read"])) {
    return <EdgeForbiddenState />;
  }

  function onCreate(e: FormEvent) {
    e.preventDefault();
    createRecord.mutate();
  }

  function confirmSuspend(id: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Lancer la suspension technique via le workflow P7.4 ? L'autorisation P7.1 sera revalidée.",
      )
    ) {
      return;
    }
    suspendRecord.mutate(id);
  }

  function confirmResume(id: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Lancer la reprise technique via le workflow P7.4 ?",
      )
    ) {
      return;
    }
    resumeRecord.mutate(id);
  }

  function onDeprovision(e: FormEvent) {
    e.preventDefault();
    if (
      !deprovisionForm.authorized ||
      !deprovisionForm.confirmed ||
      !deprovisionForm.reason.trim()
    ) {
      return;
    }
    if (!selectedRecordId) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Déprovisionnement technique destructif — confirmation finale ?",
      )
    ) {
      return;
    }
    deprovisionRecord.mutate(selectedRecordId);
  }

  const actionError =
    createRecord.error ??
    suspendRecord.error ??
    resumeRecord.error ??
    deprovisionRecord.error;

  return (
    <div className="flex flex-col gap-[var(--space-6)]" data-testid="lc-module">
      {actionError ? (
        <Alert tone="error" title="Action refusée">
          {(actionError as Error).message}
        </Alert>
      ) : null}

      <Tabs
        tabs={visibleTabs.map((t) => ({ id: t.id, label: t.label }))}
        value={tab}
        onChange={(id) => setTab(id as TabId)}
      />

      {tab === "records" && (
        <EdgePermissionGate permission="platform:lifecycle:read">
          {recordsQ.isLoading ? (
            <EdgeLoadingState label="Chargement des records lifecycle..." />
          ) : recordsQ.isError ? (
            <EdgeErrorState description={(recordsQ.error as Error).message} />
          ) : (
            <div className="flex flex-col gap-[var(--space-4)]">
              <div className="flex items-center justify-between">
                <p className="type-sm text-[var(--text-muted)]">
                  {records.total} record(s) lifecycle
                </p>
                {canSuspend ? (
                  <Button
                    type="button"
                    onClick={() => setFormOpen((o) => !o)}
                    data-testid="lc-create-toggle"
                  >
                    {formOpen ? "Annuler" : "Créer un record"}
                  </Button>
                ) : null}
              </div>

              {formOpen && canSuspend ? (
                <Card>
                  <CardHeader title="Nouveau record lifecycle (depuis Activation ACTIVE)" />
                  <CardBody>
                    <form
                      onSubmit={onCreate}
                      className="grid gap-[var(--space-3)] md:grid-cols-2"
                    >
                      <input
                        className={fieldControlClass}
                        placeholder="activationRecordId (P7.10 ACTIVE)"
                        required
                        value={form.activationRecordId}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            activationRecordId: e.target.value,
                          }))
                        }
                        aria-label="Activation Record ID"
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="retentionPolicyRef (optionnel)"
                        value={form.retentionPolicyRef}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            retentionPolicyRef: e.target.value,
                          }))
                        }
                        aria-label="Retention policy ref"
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="exportEvidenceRef (optionnel)"
                        value={form.exportEvidenceRef}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            exportEvidenceRef: e.target.value,
                          }))
                        }
                        aria-label="Export evidence ref"
                      />
                      <div className="md:col-span-2">
                        <Button type="submit" disabled={createRecord.isPending}>
                          {createRecord.isPending ? "Création..." : "Créer"}
                        </Button>
                      </div>
                    </form>
                  </CardBody>
                </Card>
              ) : null}

              {records.items.length === 0 ? (
                <EdgeEmptyState
                  title="Aucun record lifecycle"
                  description="Créez un record lié à une Activation Record ACTIVE (P7.10)."
                />
              ) : (
                <>
                  <Select
                    value={selectedRecordId}
                    onChange={(e) => setSelectedRecordId(e.target.value)}
                    aria-label="Choisir un record lifecycle"
                  >
                    <option value="">Choisir un record</option>
                    {records.items.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.tenantId} — {r.lifecycleStatus}
                      </option>
                    ))}
                  </Select>

                  {!selectedRecordId ? (
                    <EdgeEmptyState
                      title="Sélectionnez un record"
                      description="Suspend / Resume / Deprovision via workflows P7.4 uniquement."
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
                      data-testid="lc-record-detail"
                    >
                      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
                        <span data-testid="lc-record-status">
                          <Badge
                            tone={statusTone(
                              String(selectedRecord.lifecycleStatus),
                            )}
                          >
                            {selectedRecord.lifecycleStatus}
                          </Badge>
                        </span>
                        {selectedRecord.deletionProtection ? (
                          <Badge tone="warning">deletion_protection</Badge>
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
                            Activation record
                          </dt>
                          <dd>{selectedRecord.activationRecordId}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--text-muted)]">Workflow</dt>
                          <dd>{selectedRecord.workflowId ?? "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--text-muted)]">
                            Suspendu le
                          </dt>
                          <dd>
                            {formatWhen(selectedRecord.lastSuspendedAt)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[var(--text-muted)]">
                            Repris le
                          </dt>
                          <dd>{formatWhen(selectedRecord.lastResumedAt)}</dd>
                        </div>
                      </dl>

                      <div className="flex flex-wrap gap-[var(--space-2)]">
                        {canSuspend ? (
                          <Button
                            type="button"
                            data-testid="lc-suspend"
                            disabled={suspendRecord.isPending}
                            onClick={() => confirmSuspend(selectedRecord.id)}
                          >
                            Suspend
                          </Button>
                        ) : null}
                        {canResume ? (
                          <Button
                            type="button"
                            variant="outline"
                            data-testid="lc-resume"
                            disabled={resumeRecord.isPending}
                            onClick={() => confirmResume(selectedRecord.id)}
                          >
                            Resume
                          </Button>
                        ) : null}
                        {canDeprovision ? (
                          <Button
                            type="button"
                            variant="outline"
                            data-testid="lc-deprovision-toggle"
                            onClick={() => setDeprovisionOpen((o) => !o)}
                          >
                            {deprovisionOpen ? "Annuler" : "Deprovision"}
                          </Button>
                        ) : null}
                      </div>

                      {deprovisionOpen && canDeprovision ? (
                        <Card>
                          <CardHeader title="Déprovisionnement technique (destructif)" />
                          <CardBody>
                            <form
                              onSubmit={onDeprovision}
                              className="grid gap-[var(--space-3)]"
                              data-testid="lc-deprovision-form"
                            >
                              <input
                                className={fieldControlClass}
                                placeholder="reason (obligatoire)"
                                required
                                value={deprovisionForm.reason}
                                onChange={(e) =>
                                  setDeprovisionForm((f) => ({
                                    ...f,
                                    reason: e.target.value,
                                  }))
                                }
                                aria-label="Reason"
                              />
                              <input
                                className={fieldControlClass}
                                placeholder="exportEvidenceRef"
                                value={deprovisionForm.exportEvidenceRef}
                                onChange={(e) =>
                                  setDeprovisionForm((f) => ({
                                    ...f,
                                    exportEvidenceRef: e.target.value,
                                  }))
                                }
                                aria-label="Export evidence ref"
                              />
                              <label className="flex items-center gap-2 type-sm">
                                <input
                                  type="checkbox"
                                  checked={deprovisionForm.authorized}
                                  onChange={(e) =>
                                    setDeprovisionForm((f) => ({
                                      ...f,
                                      authorized: e.target.checked,
                                    }))
                                  }
                                  data-testid="lc-deprovision-authorized"
                                />
                                authorized === true
                              </label>
                              <label className="flex items-center gap-2 type-sm">
                                <input
                                  type="checkbox"
                                  checked={deprovisionForm.confirmed}
                                  onChange={(e) =>
                                    setDeprovisionForm((f) => ({
                                      ...f,
                                      confirmed: e.target.checked,
                                    }))
                                  }
                                  data-testid="lc-deprovision-confirmed"
                                />
                                confirmed === true
                              </label>
                              <Button
                                type="submit"
                                data-testid="lc-deprovision-submit"
                                disabled={
                                  deprovisionRecord.isPending ||
                                  !deprovisionForm.authorized ||
                                  !deprovisionForm.confirmed ||
                                  !deprovisionForm.reason.trim()
                                }
                              >
                                {deprovisionRecord.isPending
                                  ? "Lancement..."
                                  : "Lancer deprovision"}
                              </Button>
                            </form>
                          </CardBody>
                        </Card>
                      ) : null}

                      <p className="type-xs text-[var(--text-muted)]">
                        Le lifecycle technique ne gère pas l&apos;IAM métier ni
                        le statut commercial Subscription. Les coordinations
                        sont des signaux locaux (metadata), pas des mutators
                        étrangers.
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
        <EdgePermissionGate permission="platform:lifecycle:history:read">
          <div className="flex flex-col gap-[var(--space-4)]">
            <Select
              value={historyRecordId}
              onChange={(e) => setHistoryRecordId(e.target.value)}
              aria-label="Choisir un record pour l'historique"
            >
              <option value="">Choisir un record</option>
              {records.items.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.tenantId} — {r.lifecycleStatus}
                </option>
              ))}
            </Select>

            {!historyRecordId ? (
              <EdgeEmptyState
                title="Sélectionnez un record"
                description="Runs lifecycle et evidence P7.11."
              />
            ) : runsQ.isLoading || evidenceQ.isLoading ? (
              <EdgeLoadingState label="Chargement de l'historique..." />
            ) : (
              <>
                <Card>
                  <CardHeader title={`Lifecycle runs (${runs.total})`} />
                  <CardBody>
                    {runs.items.length === 0 ? (
                      <p className="type-sm text-[var(--text-muted)]">
                        Aucun run.
                      </p>
                    ) : (
                      <ul
                        className="flex flex-col gap-[var(--space-2)] type-sm"
                        data-testid="lc-runs"
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
                        data-testid="lc-evidence"
                      >
                        {evidence.items.slice(0, 30).map((ev) => (
                          <li
                            key={ev.id}
                            className="flex flex-wrap items-center gap-[var(--space-2)]"
                          >
                            <Badge tone={statusTone(String(ev.outcome))}>
                              {ev.outcome}
                            </Badge>
                            <span>{ev.operation}</span>
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
    </div>
  );
}
