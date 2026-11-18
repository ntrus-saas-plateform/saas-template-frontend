"use client";

/**
 * P7.12 — Edge Admin Console: Onboarding Operations module.
 *
 * Templates, journeys, start / advance / approve / close via P7.4 workflows.
 * NEVER invents CLOSED/PASSED — status badges reflect API state only.
 * Operational onboarding ≠ CRM / business invites / Subscription.ACTIVE.
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
import { ListOrUuidField } from "@/components/edge/list-or-uuid-field";
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
  OnboardingEvidence,
  OnboardingJourney,
  OnboardingRun,
  OnboardingTemplate,
} from "@/types/edge-onboarding";

type TabId = "journeys" | "templates" | "history" | "cs";

const TABS: { id: TabId; label: string; permission: string }[] = [
  { id: "journeys", label: "Journeys", permission: "platform:onboarding:read" },
  { id: "templates", label: "Templates", permission: "platform:onboarding:read" },
  {
    id: "history",
    label: "History",
    permission: "platform:onboarding:history:read",
  },
  { id: "cs", label: "CS / Aha", permission: "platform:onboarding:read" },
];

function statusTone(
  status: string | undefined,
): "default" | "success" | "warning" | "danger" | "info" {
  if (!status) return "default";
  const s = status.toUpperCase();
  if (s === "CLOSED" || s === "PASSED" || s === "SUCCEEDED" || s === "PUBLISHED") {
    return "success";
  }
  if (s === "FAILED" || s === "REJECTED" || s === "CANCELLED" || s === "ERROR") {
    return "danger";
  }
  if (
    s === "WAITING_APPROVAL" ||
    s === "PENDING" ||
    s === "STARTING" ||
    s === "CLOSING" ||
    s === "BLOCKED" ||
    s === "DRAFT" ||
    s === "PARTIAL"
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

export function EdgeOnboardingModule() {
  const { permissions } = useEdgePlatform();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabId>("journeys");
  const [selectedJourneyId, setSelectedJourneyId] = useState("");
  const [historyJourneyId, setHistoryJourneyId] = useState("");

  const [journeyFormOpen, setJourneyFormOpen] = useState(false);
  const [journeyForm, setJourneyForm] = useState({
    activationRecordId: "",
    templateId: "",
  });

  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    code: "",
    name: "",
    description: "",
  });

  const [csSegment, setCsSegment] = useState<
    "RETAIL_PHARMACY" | "WHOLESALE" | "RESTAURANT"
  >("RETAIL_PHARMACY");
  const [csSubscriptionId, setCsSubscriptionId] = useState("");
  const [csIngestCode, setCsIngestCode] = useState("pharmacy.first_sale");
  const [csHealthResult, setCsHealthResult] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [csChurnResult, setCsChurnResult] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [csExpansionResult, setCsExpansionResult] = useState<Record<
    string,
    unknown
  > | null>(null);

  const canRead = hasEdgePermission(permissions, "platform:onboarding:read");
  const canAnalytics = hasEdgePermission(
    permissions,
    "platform:subscriptions:read_analytics",
  );
  const canStart = hasEdgePermission(permissions, "platform:onboarding:start");
  const canAdvance = hasEdgePermission(
    permissions,
    "platform:onboarding:advance",
  );
  const canApprove = hasEdgePermission(
    permissions,
    "platform:onboarding:approve",
  );
  const canClose = hasEdgePermission(permissions, "platform:onboarding:close");
  const canHistory = hasEdgePermission(
    permissions,
    "platform:onboarding:history:read",
  );

  const journeysQ = useQuery({
    queryKey: ["ob", "journeys"],
    queryFn: () => edgeApi.listOnboardingJourneys({ limit: 50 }),
    enabled: canRead,
  });
  const journeyDetailQ = useQuery({
    queryKey: ["ob", "journey", selectedJourneyId],
    queryFn: () => edgeApi.getOnboardingJourney(selectedJourneyId),
    enabled: canRead && Boolean(selectedJourneyId) && tab === "journeys",
  });
  const templatesQ = useQuery({
    queryKey: ["ob", "templates"],
    queryFn: () => edgeApi.listOnboardingTemplates({ limit: 50 }),
    enabled: canRead && tab === "templates",
  });
  const runsQ = useQuery({
    queryKey: ["ob", "runs", historyJourneyId],
    queryFn: () => edgeApi.listOnboardingRuns(historyJourneyId),
    enabled: canHistory && Boolean(historyJourneyId) && tab === "history",
  });
  const evidenceQ = useQuery({
    queryKey: ["ob", "evidence", historyJourneyId],
    queryFn: () => edgeApi.listOnboardingEvidence(historyJourneyId),
    enabled: canHistory && Boolean(historyJourneyId) && tab === "history",
  });
  const ahaQ = useQuery({
    queryKey: ["ob", "cs", "aha", csSegment],
    queryFn: () => edgeApi.listAhaMoments(csSegment),
    enabled: canRead && tab === "cs",
  });
  const subscriptionsPickQ = useQuery({
    queryKey: ["ob", "subscriptions-pick"],
    queryFn: async () => {
      const { data } = await edgeApi.listSubscriptions({ limit: 100 });
      return data;
    },
    enabled: canRead && tab === "cs",
    retry: false,
  });
  const subscriptionPickOptions = useMemo(() => {
    const raw = subscriptionsPickQ.data as
      | { items?: Record<string, unknown>[] }
      | Record<string, unknown>[]
      | undefined;
    const items = Array.isArray(raw) ? raw : (raw?.items ?? []);
    return items
      .map((s) => {
        const id = String(s.id ?? "").trim();
        if (!id) return null;
        return {
          id,
          label: `${String(s.subscriptionNumber ?? id).slice(0, 20)} · ${String(s.status ?? "")}`,
        };
      })
      .filter((o): o is { id: string; label: string } => Boolean(o));
  }, [subscriptionsPickQ.data]);
  const adoptionQ = useQuery({
    queryKey: ["ob", "cs", "adoption", csSubscriptionId, csSegment],
    queryFn: () =>
      edgeApi.listAdoptionEvents({
        subscriptionId: csSubscriptionId,
        segment: csSegment,
      }),
    enabled: canRead && tab === "cs" && Boolean(csSubscriptionId),
  });

  const journeys = unwrapInfraList<OnboardingJourney>(journeysQ.data?.data);
  const templates = unwrapInfraList<OnboardingTemplate>(templatesQ.data?.data);
  const runs = unwrapInfraList<OnboardingRun>(runsQ.data?.data);
  const evidence = unwrapInfraList<OnboardingEvidence>(evidenceQ.data?.data);

  const journeyDetail = journeyDetailQ.data?.data ?? null;
  const selectedJourney =
    journeyDetail?.journey ??
    journeys.items.find((j) => j.id === selectedJourneyId) ??
    null;
  const openTasks =
    journeyDetail?.tasks?.filter((t) => t.taskStatus === "OPEN") ?? [];

  const createJourney = useMutation({
    mutationFn: () =>
      edgeApi.createOnboardingJourney({
        activationRecordId: journeyForm.activationRecordId,
        templateId: journeyForm.templateId || undefined,
      }),
    onSuccess: () => {
      setJourneyFormOpen(false);
      setJourneyForm({ activationRecordId: "", templateId: "" });
      void qc.invalidateQueries({ queryKey: ["ob", "journeys"] });
    },
  });

  const createTemplate = useMutation({
    mutationFn: () =>
      edgeApi.createOnboardingTemplate({
        code: templateForm.code,
        name: templateForm.name,
        description: templateForm.description || undefined,
      }),
    onSuccess: () => {
      setTemplateFormOpen(false);
      setTemplateForm({ code: "", name: "", description: "" });
      void qc.invalidateQueries({ queryKey: ["ob", "templates"] });
    },
  });

  const publishTemplate = useMutation({
    mutationFn: (t: OnboardingTemplate) =>
      edgeApi.publishOnboardingTemplate(t.id, { expectedVersion: t.version }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["ob", "templates"] }),
  });

  const startJourney = useMutation({
    mutationFn: (id: string) => edgeApi.startOnboardingJourney(id, {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["ob"] }),
  });

  const advanceJourney = useMutation({
    mutationFn: (id: string) => edgeApi.advanceOnboardingJourney(id, {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["ob"] }),
  });

  const closeJourney = useMutation({
    mutationFn: (id: string) => edgeApi.closeOnboardingJourney(id, {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["ob"] }),
  });

  const decideTask = useMutation({
    mutationFn: (input: {
      journeyId: string;
      taskId: string;
      decision: "APPROVE" | "REJECT";
    }) =>
      edgeApi.decideOnboardingTask(input.journeyId, input.taskId, {
        decision: input.decision,
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["ob"] }),
  });

  const ingestAdoption = useMutation({
    mutationFn: () =>
      edgeApi.ingestAdoptionEvent({
        subscriptionId: csSubscriptionId,
        eventCode: csIngestCode,
        source: "EDGE_OPS",
      }),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["ob", "cs", "adoption"] }),
  });

  const runHealth = useMutation({
    mutationFn: async () => {
      const ahaPct = Number(
        (adoptionQ.data?.data?.ahaCompletion as { completionPct?: number } | undefined)
          ?.completionPct ?? null,
      );
      const res = await edgeApi.computeCustomerHealthScore({
        ahaCompletionPct: Number.isFinite(ahaPct) ? ahaPct : null,
        adoptionScore: Number.isFinite(ahaPct) ? ahaPct : null,
        paymentHealthScore: 100,
        supportLoadInverseScore: 80,
      });
      setCsHealthResult(res.data ?? null);
      return res;
    },
  });

  const runChurn = useMutation({
    mutationFn: async () => {
      const health = csHealthResult as {
        band?: "HIGH" | "MID" | "LOW" | "UNKNOWN";
        score?: number | null;
      } | null;
      const ahaPct = Number(
        (adoptionQ.data?.data?.ahaCompletion as { completionPct?: number } | undefined)
          ?.completionPct ?? null,
      );
      const res = await edgeApi.computeChurnRisk({
        healthBand: health?.band ?? "UNKNOWN",
        healthScore: health?.score ?? null,
        ahaCompletionPct: Number.isFinite(ahaPct) ? ahaPct : null,
        daysToRenewal: 30,
      });
      setCsChurnResult(res.data ?? null);
      return res;
    },
  });

  const runExpansion = useMutation({
    mutationFn: async () => {
      const res = await edgeApi.evaluateExpansionSignals({
        signals: [
          { kind: "USERS", observed: 48, granted: 50 },
          { kind: "MODULES", observed: 3, granted: 3 },
          { kind: "SITES", observed: 2, granted: 2 },
        ],
      });
      setCsExpansionResult(res.data ?? null);
      return res;
    },
  });

  const visibleTabs = useMemo(
    () => TABS.filter((t) => hasEdgePermission(permissions, t.permission)),
    [permissions],
  );

  if (!hasAnyEdgePermission(permissions, ["platform:onboarding:read"])) {
    return <EdgeForbiddenState />;
  }

  function onCreateJourney(e: FormEvent) {
    e.preventDefault();
    createJourney.mutate();
  }

  function onCreateTemplate(e: FormEvent) {
    e.preventDefault();
    createTemplate.mutate();
  }

  function confirmStart(id: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Lancer le démarrage onboarding via le workflow P7.4 ? L'autorisation P7.1 sera revalidée.",
      )
    ) {
      return;
    }
    startJourney.mutate(id);
  }

  function confirmAdvance(id: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Avancer l'étape suivante via le workflow P7.4 ?")
    ) {
      return;
    }
    advanceJourney.mutate(id);
  }

  function confirmClose(id: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Clôturer le parcours ? Tous les steps requis doivent être PASSED.",
      )
    ) {
      return;
    }
    closeJourney.mutate(id);
  }

  const actionError =
    createJourney.error ??
    createTemplate.error ??
    publishTemplate.error ??
    startJourney.error ??
    advanceJourney.error ??
    closeJourney.error ??
    decideTask.error ??
    ingestAdoption.error ??
    runHealth.error ??
    runChurn.error ??
    runExpansion.error;

  return (
    <div className="flex flex-col gap-[var(--space-6)]" data-testid="ob-module">
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

      {tab === "journeys" && (
        <EdgePermissionGate permission="platform:onboarding:read">
          {journeysQ.isLoading ? (
            <EdgeLoadingState label="Chargement des parcours onboarding..." />
          ) : journeysQ.isError ? (
            <EdgeErrorState description={(journeysQ.error as Error).message} />
          ) : (
            <div className="flex flex-col gap-[var(--space-4)]">
              <div className="flex items-center justify-between">
                <p className="type-sm text-[var(--text-muted)]">
                  {journeys.total} parcours onboarding
                </p>
                {canStart ? (
                  <Button
                    type="button"
                    onClick={() => setJourneyFormOpen((o) => !o)}
                    data-testid="ob-create-journey-toggle"
                  >
                    {journeyFormOpen ? "Annuler" : "Créer un parcours"}
                  </Button>
                ) : null}
              </div>

              {journeyFormOpen && canStart ? (
                <Card>
                  <CardHeader title="Nouveau parcours (depuis Activation ACTIVE)" />
                  <CardBody>
                    <form
                      onSubmit={onCreateJourney}
                      className="grid gap-[var(--space-3)] md:grid-cols-2"
                    >
                      <input
                        className={fieldControlClass}
                        placeholder="activationRecordId (P7.10 ACTIVE)"
                        required
                        value={journeyForm.activationRecordId}
                        onChange={(e) =>
                          setJourneyForm((f) => ({
                            ...f,
                            activationRecordId: e.target.value,
                          }))
                        }
                        aria-label="Activation Record ID"
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="templateId (optionnel, PUBLISHED)"
                        value={journeyForm.templateId}
                        onChange={(e) =>
                          setJourneyForm((f) => ({
                            ...f,
                            templateId: e.target.value,
                          }))
                        }
                        aria-label="Template ID"
                      />
                      <div className="md:col-span-2">
                        <Button
                          type="submit"
                          disabled={createJourney.isPending}
                        >
                          {createJourney.isPending ? "Création..." : "Créer"}
                        </Button>
                      </div>
                    </form>
                  </CardBody>
                </Card>
              ) : null}

              {journeys.items.length === 0 ? (
                <EdgeEmptyState
                  title="Aucun parcours onboarding"
                  description="Créez un parcours lié à une Activation Record ACTIVE (P7.10). Pas de CRM / invites business."
                />
              ) : (
                <>
                  <Select
                    value={selectedJourneyId}
                    onChange={(e) => setSelectedJourneyId(e.target.value)}
                    aria-label="Choisir un parcours onboarding"
                  >
                    <option value="">Choisir un parcours</option>
                    {journeys.items.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.tenantId} — {j.journeyStatus}
                      </option>
                    ))}
                  </Select>

                  {!selectedJourneyId ? (
                    <EdgeEmptyState
                      title="Sélectionnez un parcours"
                      description="Start / Advance / Approve / Close via workflows P7.4 uniquement."
                    />
                  ) : journeyDetailQ.isLoading ? (
                    <EdgeLoadingState label="Chargement du détail..." />
                  ) : journeyDetailQ.isError ? (
                    <EdgeErrorState
                      description={(journeyDetailQ.error as Error).message}
                    />
                  ) : selectedJourney ? (
                    <div
                      className="flex flex-col gap-[var(--space-4)]"
                      data-testid="ob-journey-detail"
                    >
                      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
                        <span data-testid="ob-journey-status">
                          <Badge
                            tone={statusTone(
                              String(selectedJourney.journeyStatus),
                            )}
                          >
                            {selectedJourney.journeyStatus}
                          </Badge>
                        </span>
                      </div>

                      <dl className="grid gap-[var(--space-2)] type-sm md:grid-cols-2">
                        <div>
                          <dt className="text-[var(--text-muted)]">Tenant</dt>
                          <dd>{selectedJourney.tenantId}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--text-muted)]">Product</dt>
                          <dd>{selectedJourney.productId}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--text-muted)]">
                            Activation record
                          </dt>
                          <dd>{selectedJourney.activationRecordId}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--text-muted)]">
                            Current step
                          </dt>
                          <dd>{selectedJourney.currentStepKey ?? "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--text-muted)]">Workflow</dt>
                          <dd>{selectedJourney.workflowId ?? "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--text-muted)]">
                            Handover ref
                          </dt>
                          <dd>
                            {selectedJourney.handoverEvidenceRef ?? "—"}
                          </dd>
                        </div>
                      </dl>

                      {journeyDetail?.steps && journeyDetail.steps.length > 0 ? (
                        <Card>
                          <CardHeader
                            title={`Steps (${journeyDetail.steps.length})`}
                          />
                          <CardBody>
                            <ul
                              className="flex flex-col gap-[var(--space-2)]"
                              data-testid="ob-steps-list"
                            >
                              {journeyDetail.steps.map((s) => (
                                <li
                                  key={s.id}
                                  className="flex flex-wrap items-center gap-[var(--space-2)] type-sm"
                                >
                                  <span className="font-medium">
                                    {s.stepOrder}. {s.stepKey}
                                  </span>
                                  <Badge tone="default">{s.stepKind}</Badge>
                                  <Badge tone={statusTone(String(s.stepStatus))}>
                                    {s.stepStatus}
                                  </Badge>
                                  {s.required ? (
                                    <Badge tone="info">required</Badge>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          </CardBody>
                        </Card>
                      ) : null}

                      <div className="flex flex-wrap gap-[var(--space-2)]">
                        {canStart ? (
                          <Button
                            type="button"
                            data-testid="ob-start"
                            disabled={startJourney.isPending}
                            onClick={() => confirmStart(selectedJourney.id)}
                          >
                            Start
                          </Button>
                        ) : null}
                        {canAdvance ? (
                          <Button
                            type="button"
                            data-testid="ob-advance"
                            disabled={advanceJourney.isPending}
                            onClick={() => confirmAdvance(selectedJourney.id)}
                          >
                            Advance
                          </Button>
                        ) : null}
                        {canClose ? (
                          <Button
                            type="button"
                            data-testid="ob-close"
                            disabled={closeJourney.isPending}
                            onClick={() => confirmClose(selectedJourney.id)}
                          >
                            Close
                          </Button>
                        ) : null}
                      </div>

                      {openTasks.length > 0 && canApprove ? (
                        <Card>
                          <CardHeader title="Tâches humaines ouvertes" />
                          <CardBody>
                            <ul className="flex flex-col gap-[var(--space-3)]">
                              {openTasks.map((t) => (
                                <li
                                  key={t.id}
                                  className="flex flex-wrap items-center gap-[var(--space-2)]"
                                  data-testid={`ob-task-${t.id}`}
                                >
                                  <span className="type-sm">{t.title}</span>
                                  <Button
                                    type="button"
                                    data-testid="ob-approve"
                                    disabled={decideTask.isPending}
                                    onClick={() =>
                                      decideTask.mutate({
                                        journeyId: selectedJourney.id,
                                        taskId: t.id,
                                        decision: "APPROVE",
                                      })
                                    }
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    data-testid="ob-reject"
                                    disabled={decideTask.isPending}
                                    onClick={() =>
                                      decideTask.mutate({
                                        journeyId: selectedJourney.id,
                                        taskId: t.id,
                                        decision: "REJECT",
                                      })
                                    }
                                  >
                                    Reject
                                  </Button>
                                </li>
                              ))}
                            </ul>
                            <p className="mt-[var(--space-2)] type-xs text-[var(--text-muted)]">
                              L&apos;approbation humaine ne contourne pas P7.1 —
                              revalidation obligatoire.
                            </p>
                          </CardBody>
                        </Card>
                      ) : null}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          )}
        </EdgePermissionGate>
      )}

      {tab === "templates" && (
        <EdgePermissionGate permission="platform:onboarding:read">
          {templatesQ.isLoading ? (
            <EdgeLoadingState label="Chargement des templates..." />
          ) : templatesQ.isError ? (
            <EdgeErrorState description={(templatesQ.error as Error).message} />
          ) : (
            <div className="flex flex-col gap-[var(--space-4)]">
              <div className="flex items-center justify-between">
                <p className="type-sm text-[var(--text-muted)]">
                  {templates.total} template(s)
                </p>
                {canStart ? (
                  <Button
                    type="button"
                    onClick={() => setTemplateFormOpen((o) => !o)}
                    data-testid="ob-create-template-toggle"
                  >
                    {templateFormOpen ? "Annuler" : "Créer un template"}
                  </Button>
                ) : null}
              </div>

              {templateFormOpen && canStart ? (
                <Card>
                  <CardHeader title="Nouveau template DRAFT" />
                  <CardBody>
                    <form
                      onSubmit={onCreateTemplate}
                      className="grid gap-[var(--space-3)] md:grid-cols-2"
                    >
                      <input
                        className={fieldControlClass}
                        placeholder="code"
                        required
                        value={templateForm.code}
                        onChange={(e) =>
                          setTemplateForm((f) => ({
                            ...f,
                            code: e.target.value,
                          }))
                        }
                        aria-label="Template code"
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="name"
                        required
                        value={templateForm.name}
                        onChange={(e) =>
                          setTemplateForm((f) => ({
                            ...f,
                            name: e.target.value,
                          }))
                        }
                        aria-label="Template name"
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="description"
                        value={templateForm.description}
                        onChange={(e) =>
                          setTemplateForm((f) => ({
                            ...f,
                            description: e.target.value,
                          }))
                        }
                        aria-label="Template description"
                      />
                      <div className="md:col-span-2">
                        <Button
                          type="submit"
                          disabled={createTemplate.isPending}
                        >
                          {createTemplate.isPending ? "Création..." : "Créer"}
                        </Button>
                      </div>
                    </form>
                  </CardBody>
                </Card>
              ) : null}

              {templates.items.length === 0 ? (
                <EdgeEmptyState
                  title="Aucun template"
                  description="Les templates définissent le plan d'étapes opérationnelles (pas de CRM)."
                />
              ) : (
                <ul
                  className="flex flex-col gap-[var(--space-3)]"
                  data-testid="ob-templates-list"
                >
                  {templates.items.map((t) => (
                    <li key={t.id}>
                      <Card>
                        <CardBody>
                          <div className="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
                            <div>
                              <p className="font-medium">{t.name}</p>
                              <p className="type-sm text-[var(--text-muted)]">
                                {t.code}
                              </p>
                            </div>
                            <div className="flex items-center gap-[var(--space-2)]">
                              <Badge
                                tone={statusTone(String(t.templateStatus))}
                              >
                                {t.templateStatus}
                              </Badge>
                              {canStart &&
                              (t.templateStatus === "DRAFT" ||
                                t.templateStatus === "VALIDATED") ? (
                                <Button
                                  type="button"
                                  data-testid="ob-publish-template"
                                  disabled={publishTemplate.isPending}
                                  onClick={() => publishTemplate.mutate(t)}
                                >
                                  Publish
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </EdgePermissionGate>
      )}

      {tab === "history" && (
        <EdgePermissionGate permission="platform:onboarding:history:read">
          <div className="flex flex-col gap-[var(--space-4)]">
            <Select
              value={historyJourneyId}
              onChange={(e) => setHistoryJourneyId(e.target.value)}
              aria-label="Choisir un parcours pour l'historique"
            >
              <option value="">Choisir un parcours</option>
              {journeys.items.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.tenantId} — {j.journeyStatus}
                </option>
              ))}
            </Select>

            {!historyJourneyId ? (
              <EdgeEmptyState
                title="Sélectionnez un parcours"
                description="Runs et evidence onboarding (P7.12)."
              />
            ) : (
              <>
                <Card>
                  <CardHeader title={`Runs (${runs.total})`} />
                  <CardBody>
                    {runsQ.isLoading ? (
                      <EdgeLoadingState label="Chargement des runs..." />
                    ) : runs.items.length === 0 ? (
                      <EdgeEmptyState
                        title="Aucun run"
                        description="Aucun run d'onboarding pour ce parcours."
                      />
                    ) : (
                      <ul className="flex flex-col gap-[var(--space-2)] type-sm">
                        {runs.items.map((r) => (
                          <li key={r.id}>
                            {r.operation} — {r.outcome} —{" "}
                            {formatWhen(r.startedAt)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader title={`Evidence (${evidence.total})`} />
                  <CardBody>
                    {evidenceQ.isLoading ? (
                      <EdgeLoadingState label="Chargement evidence..." />
                    ) : evidence.items.length === 0 ? (
                      <EdgeEmptyState
                        title="Aucune evidence"
                        description="Aucune evidence enregistrée pour ce parcours."
                      />
                    ) : (
                      <ul className="flex flex-col gap-[var(--space-2)] type-sm">
                        {evidence.items.map((ev) => (
                          <li key={ev.id}>
                            {ev.operation} — {ev.outcome} —{" "}
                            {formatWhen(ev.createdAt)}
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

      {tab === "cs" && (
        <EdgePermissionGate permission="platform:onboarding:read">
          <div
            className="flex flex-col gap-[var(--space-4)]"
            data-testid="ob-cs-panel"
          >
            <div className="flex flex-wrap items-end gap-[var(--space-3)]">
              <label className="flex flex-col gap-1 type-sm">
                Segment
                <Select
                  value={csSegment}
                  onChange={(e) =>
                    setCsSegment(
                      e.target.value as
                        | "RETAIL_PHARMACY"
                        | "WHOLESALE"
                        | "RESTAURANT",
                    )
                  }
                >
                  <option value="RETAIL_PHARMACY">Retail Pharmacy</option>
                  <option value="WHOLESALE">Wholesale</option>
                  <option value="RESTAURANT">Restaurant</option>
                </Select>
              </label>
              <label className="flex flex-col gap-1 type-sm min-w-[16rem]">
                Subscription ID
                <ListOrUuidField
                  value={csSubscriptionId}
                  onChange={setCsSubscriptionId}
                  options={subscriptionPickOptions}
                  placeholder="Select subscription"
                  fallbackPlaceholder="UUID subscription"
                />
              </label>
            </div>

            <Card>
              <CardHeader title="Aha moments (registry)" />
              <CardBody>
                {ahaQ.isLoading ? (
                  <EdgeLoadingState label="Chargement Aha..." />
                ) : ahaQ.isError ? (
                  <EdgeErrorState description={(ahaQ.error as Error).message} />
                ) : (
                  <ul className="flex flex-col gap-[var(--space-2)] type-sm">
                    {(
                      (
                        ahaQ.data?.data?.moments as
                          | Array<{
                              code: string;
                              title: string;
                              targetDay: number;
                            }>
                          | undefined
                      ) ?? []
                    ).map((m) => (
                      <li key={m.code}>
                        <Badge tone="info">J{m.targetDay}</Badge> {m.code} —{" "}
                        {m.title}
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Ingestion adoption (BB → Edge)" />
              <CardBody>
                <div className="flex flex-wrap items-end gap-[var(--space-3)]">
                  <label className="flex flex-col gap-1 type-sm min-w-[14rem]">
                    Event code
                    <input
                      className={fieldControlClass}
                      value={csIngestCode}
                      onChange={(e) => setCsIngestCode(e.target.value)}
                    />
                  </label>
                  <Button
                    type="button"
                    disabled={
                      !canAdvance ||
                      !csSubscriptionId ||
                      ingestAdoption.isPending
                    }
                    onClick={() => ingestAdoption.mutate()}
                  >
                    Ingest event
                  </Button>
                </div>
                {adoptionQ.data?.data?.ahaCompletion ? (
                  <p className="type-sm text-[var(--text-muted)] mt-[var(--space-3)]">
                    Aha completion:{" "}
                    {String(
                      (
                        adoptionQ.data.data.ahaCompletion as {
                          completionPct?: number;
                        }
                      ).completionPct ?? "—",
                    )}
                    %
                  </p>
                ) : null}
              </CardBody>
            </Card>

            <div className="flex flex-wrap gap-[var(--space-3)]">
              <Button
                type="button"
                disabled={!canAnalytics || runHealth.isPending}
                onClick={() => runHealth.mutate()}
              >
                Health score
              </Button>
              <Button
                type="button"
                disabled={!canAnalytics || runChurn.isPending}
                onClick={() => runChurn.mutate()}
              >
                Churn risk
              </Button>
              <Button
                type="button"
                disabled={!canAnalytics || runExpansion.isPending}
                onClick={() => runExpansion.mutate()}
              >
                Expansion signals
              </Button>
            </div>

            {csHealthResult ? (
              <Card>
                <CardHeader title="Health" />
                <CardBody>
                  <pre className="type-xs overflow-auto">
                    {JSON.stringify(csHealthResult, null, 2)}
                  </pre>
                </CardBody>
              </Card>
            ) : null}
            {csChurnResult ? (
              <Card>
                <CardHeader title="Churn risk" />
                <CardBody>
                  <pre className="type-xs overflow-auto">
                    {JSON.stringify(csChurnResult, null, 2)}
                  </pre>
                </CardBody>
              </Card>
            ) : null}
            {csExpansionResult ? (
              <Card>
                <CardHeader title="Expansion (quote path only)" />
                <CardBody>
                  <pre className="type-xs overflow-auto">
                    {JSON.stringify(csExpansionResult, null, 2)}
                  </pre>
                </CardBody>
              </Card>
            ) : null}
          </div>
        </EdgePermissionGate>
      )}
    </div>
  );
}
