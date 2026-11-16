"use client";

/**
 * P7.8 — Edge Admin Console: Configuration & Entitlement Deployment module.
 *
 * Registry (schemas / templates / bundles), tenant assignments, deploy/rollback
 * via P7.4 workflows. Secrets are never rendered — only vault refs / redacted JSON.
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
  ConfigurationBundleRecord,
  ConfigurationDeploymentRunRecord,
  ConfigurationEvidenceRecord,
  ConfigurationSchemaRecord,
  ConfigurationTemplateRecord,
  EntitlementDeploymentRecord,
  TenantConfigurationAssignmentRecord,
} from "@/types/edge-configuration";

const SECRET_KEY_RE =
  /(secret|password|token|credential|api[_-]?key|private[_-]?key|client[_-]?secret)/i;
const MASKED = "••••••••";

type TabId = "schemas" | "templates" | "bundles" | "assignments" | "history";

const TABS: { id: TabId; label: string; permission: string }[] = [
  { id: "schemas", label: "Schemas", permission: "platform:configuration:read" },
  { id: "templates", label: "Templates", permission: "platform:configuration:read" },
  { id: "bundles", label: "Bundles", permission: "platform:configuration:read" },
  {
    id: "assignments",
    label: "Tenant Assignments",
    permission: "platform:configuration:read",
  },
  {
    id: "history",
    label: "History",
    permission: "platform:configuration:history:read",
  },
];

function statusTone(
  status: string | undefined,
): "default" | "success" | "warning" | "danger" | "info" {
  if (!status) return "default";
  const s = status.toUpperCase();
  if (
    s === "ACTIVE" ||
    s === "PUBLISHED" ||
    s === "DEPLOYED" ||
    s === "SUCCEEDED" ||
    s === "NONE" ||
    s === "RESOLVED"
  ) {
    return "success";
  }
  if (
    s === "FAILED" ||
    s === "REVOKED" ||
    s === "RETIRED" ||
    s === "DETECTED"
  ) {
    return "danger";
  }
  if (
    s === "DEPLOYING" ||
    s === "ROLLBACK_PENDING" ||
    s === "DEPRECATED" ||
    s === "DRAFT" ||
    s === "REMEDIATING" ||
    s === "PARTIAL"
  ) {
    return "warning";
  }
  return "info";
}

/** Recursively redact secret-looking string values for display. */
export function redactConfigForDisplay(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactConfigForDisplay);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEY_RE.test(k) && typeof v === "string") {
        out[k] = MASKED;
      } else {
        out[k] = redactConfigForDisplay(v);
      }
    }
    return out;
  }
  return value;
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR");
  } catch {
    return iso;
  }
}

export function EdgeConfigurationModule() {
  const { permissions } = useEdgePlatform();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabId>("schemas");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [historyAssignmentId, setHistoryAssignmentId] = useState("");
  const [schemaFormOpen, setSchemaFormOpen] = useState(false);
  const [schemaForm, setSchemaForm] = useState({
    code: "",
    name: "",
    schemaJson: '{\n  "type": "object",\n  "properties": {}\n}',
  });
  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    code: "",
    name: "",
    schemaId: "",
    draftPayload: "{}",
  });
  const [bundleFormOpen, setBundleFormOpen] = useState(false);
  const [bundleForm, setBundleForm] = useState({
    code: "",
    name: "",
    templateId: "",
    templateVersion: "1",
  });

  const canRead = hasEdgePermission(permissions, "platform:configuration:read");
  const canManage = hasEdgePermission(permissions, "platform:configuration:manage");
  const canDeploy = hasEdgePermission(permissions, "platform:configuration:deploy");
  const canRollback = hasEdgePermission(
    permissions,
    "platform:configuration:rollback",
  );
  const canHistory = hasEdgePermission(
    permissions,
    "platform:configuration:history:read",
  );
  const canEntitlementRead = hasEdgePermission(
    permissions,
    "platform:entitlement:read",
  );
  const canEntitlementReconcile = hasEdgePermission(
    permissions,
    "platform:entitlement:reconcile",
  );

  const schemasQ = useQuery({
    queryKey: ["cfg", "schemas"],
    queryFn: () => edgeApi.listConfigurationSchemas({ limit: 50 }),
    enabled: canRead && (tab === "schemas" || tab === "templates" || tab === "bundles"),
  });
  const templatesQ = useQuery({
    queryKey: ["cfg", "templates"],
    queryFn: () => edgeApi.listConfigurationTemplates({ limit: 50 }),
    enabled: canRead && (tab === "templates" || tab === "bundles"),
  });
  const bundlesQ = useQuery({
    queryKey: ["cfg", "bundles"],
    queryFn: () => edgeApi.listConfigurationBundles({ limit: 50 }),
    enabled: canRead && (tab === "bundles" || tab === "assignments"),
  });
  const assignmentsQ = useQuery({
    queryKey: ["cfg", "assignments"],
    queryFn: () => edgeApi.listTenantConfigurationAssignments({ limit: 50 }),
    enabled: canRead && (tab === "assignments" || tab === "history"),
  });
  const detailQ = useQuery({
    queryKey: ["cfg", "assignment", selectedAssignmentId],
    queryFn: () => edgeApi.getTenantConfigurationAssignment(selectedAssignmentId),
    enabled: canRead && Boolean(selectedAssignmentId) && tab === "assignments",
  });
  const runsQ = useQuery({
    queryKey: ["cfg", "runs", historyAssignmentId],
    queryFn: () => edgeApi.listConfigurationDeploymentRuns(historyAssignmentId),
    enabled: canHistory && Boolean(historyAssignmentId) && tab === "history",
  });
  const evidenceQ = useQuery({
    queryKey: ["cfg", "evidence", historyAssignmentId],
    queryFn: () => edgeApi.listConfigurationEvidence(historyAssignmentId),
    enabled: canHistory && Boolean(historyAssignmentId) && tab === "history",
  });
  const entitlementsQ = useQuery({
    queryKey: ["cfg", "entitlements", selectedAssignmentId],
    queryFn: () => edgeApi.listEntitlementDeployments(selectedAssignmentId),
    enabled:
      canEntitlementRead &&
      Boolean(selectedAssignmentId) &&
      tab === "assignments",
  });

  const schemas = unwrapInfraList<ConfigurationSchemaRecord>(schemasQ.data?.data);
  const templates = unwrapInfraList<ConfigurationTemplateRecord>(
    templatesQ.data?.data,
  );
  const bundles = unwrapInfraList<ConfigurationBundleRecord>(bundlesQ.data?.data);
  const assignments = unwrapInfraList<TenantConfigurationAssignmentRecord>(
    assignmentsQ.data?.data,
  );
  const runs = unwrapInfraList<ConfigurationDeploymentRunRecord>(runsQ.data?.data);
  const evidence = unwrapInfraList<ConfigurationEvidenceRecord>(
    evidenceQ.data?.data,
  );
  const entitlements = unwrapInfraList<EntitlementDeploymentRecord>(
    entitlementsQ.data?.data,
  );
  const detail = detailQ.data?.data ?? null;
  const selectedAssignment =
    detail?.assignment ??
    assignments.items.find((a) => a.id === selectedAssignmentId) ??
    null;

  const createSchema = useMutation({
    mutationFn: async () => {
      const jsonSchema = JSON.parse(schemaForm.schemaJson) as Record<
        string,
        unknown
      >;
      return edgeApi.createConfigurationSchema({
        code: schemaForm.code,
        name: schemaForm.name,
        jsonSchema,
      });
    },
    onSuccess: () => {
      setSchemaFormOpen(false);
      setSchemaForm({
        code: "",
        name: "",
        schemaJson: '{\n  "type": "object",\n  "properties": {}\n}',
      });
      void qc.invalidateQueries({ queryKey: ["cfg", "schemas"] });
    },
  });

  const createTemplate = useMutation({
    mutationFn: async () => {
      const draftPayload = JSON.parse(templateForm.draftPayload) as Record<
        string,
        unknown
      >;
      return edgeApi.createConfigurationTemplate({
        code: templateForm.code,
        name: templateForm.name,
        schemaId: templateForm.schemaId,
        draftPayload,
      });
    },
    onSuccess: () => {
      setTemplateFormOpen(false);
      setTemplateForm({ code: "", name: "", schemaId: "", draftPayload: "{}" });
      void qc.invalidateQueries({ queryKey: ["cfg", "templates"] });
    },
  });

  const publishTemplate = useMutation({
    mutationFn: (t: ConfigurationTemplateRecord) =>
      edgeApi.publishConfigurationTemplate(t.id, {
        expectedVersion: t.version,
        versionNumber: Math.max(1, t.latestVersion || 1),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cfg", "templates"] }),
  });

  const createBundle = useMutation({
    mutationFn: () =>
      edgeApi.createConfigurationBundle({
        code: bundleForm.code,
        name: bundleForm.name,
        templateRefs: [
          {
            templateId: bundleForm.templateId,
            versionNumber: Number(bundleForm.templateVersion) || 1,
          },
        ],
      }),
    onSuccess: () => {
      setBundleFormOpen(false);
      setBundleForm({ code: "", name: "", templateId: "", templateVersion: "1" });
      void qc.invalidateQueries({ queryKey: ["cfg", "bundles"] });
    },
  });

  const publishBundle = useMutation({
    mutationFn: (b: ConfigurationBundleRecord) =>
      edgeApi.publishConfigurationBundle(b.id, {
        expectedVersion: b.version,
        versionNumber: Math.max(1, b.latestVersion || 1),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cfg", "bundles"] }),
  });

  const deploy = useMutation({
    mutationFn: (assignmentId: string) =>
      edgeApi.deployTenantConfiguration(assignmentId, {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cfg"] }),
  });

  const rollback = useMutation({
    mutationFn: (assignmentId: string) =>
      edgeApi.rollbackTenantConfiguration(assignmentId, {
        reason: "Rollback depuis la console Edge",
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cfg"] }),
  });

  const reconcile = useMutation({
    mutationFn: (assignmentId: string) =>
      edgeApi.reconcileTenantEntitlements(assignmentId, {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cfg"] }),
  });

  const visibleTabs = useMemo(
    () => TABS.filter((t) => hasEdgePermission(permissions, t.permission)),
    [permissions],
  );

  if (!hasAnyEdgePermission(permissions, ["platform:configuration:read"])) {
    return <EdgeForbiddenState />;
  }

  function onCreateSchema(e: FormEvent) {
    e.preventDefault();
    createSchema.mutate();
  }

  function onCreateTemplate(e: FormEvent) {
    e.preventDefault();
    createTemplate.mutate();
  }

  function onCreateBundle(e: FormEvent) {
    e.preventDefault();
    createBundle.mutate();
  }

  function confirmDeploy(id: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Déployer cette configuration via le workflow P7.4 ? L'autorisation P7.1 sera revalidée.",
      )
    ) {
      return;
    }
    deploy.mutate(id);
  }

  function confirmRollback(id: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Lancer un rollback contrôlé ? Les entitlements révoqués bloquent le rollback.",
      )
    ) {
      return;
    }
    rollback.mutate(id);
  }

  const actionError =
    createSchema.error ??
    createTemplate.error ??
    createBundle.error ??
    publishTemplate.error ??
    publishBundle.error ??
    deploy.error ??
    rollback.error ??
    reconcile.error;

  return (
    <div className="flex flex-col gap-[var(--space-6)]" data-testid="cfg-module">
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

      {tab === "schemas" && (
        <EdgePermissionGate permission="platform:configuration:read">
          {schemasQ.isLoading ? (
            <EdgeLoadingState label="Chargement des schemas..." />
          ) : schemasQ.isError ? (
            <EdgeErrorState description={(schemasQ.error as Error).message} />
          ) : (
            <div className="flex flex-col gap-[var(--space-4)]">
              <div className="flex items-center justify-between">
                <p className="type-sm text-[var(--text-muted)]">
                  {schemas.total} schema(s) — JSON Schema versionné, checksum immuable.
                </p>
                {canManage ? (
                  <Button
                    type="button"
                    onClick={() => setSchemaFormOpen((o) => !o)}
                    data-testid="cfg-schema-toggle"
                  >
                    {schemaFormOpen ? "Annuler" : "Créer un schema"}
                  </Button>
                ) : null}
              </div>

              {schemaFormOpen && canManage ? (
                <Card>
                  <CardHeader title="Nouveau schema de configuration" />
                  <CardBody>
                    <form
                      onSubmit={onCreateSchema}
                      className="grid gap-[var(--space-3)] md:grid-cols-2"
                    >
                      <input
                        className={fieldControlClass}
                        placeholder="code (ex. runtime-knobs)"
                        required
                        value={schemaForm.code}
                        onChange={(e) =>
                          setSchemaForm((f) => ({ ...f, code: e.target.value }))
                        }
                        aria-label="Code schema"
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="Nom"
                        required
                        value={schemaForm.name}
                        onChange={(e) =>
                          setSchemaForm((f) => ({ ...f, name: e.target.value }))
                        }
                        aria-label="Nom schema"
                      />
                      <textarea
                        className={`${fieldControlClass} md:col-span-2 min-h-[120px] font-mono type-sm`}
                        value={schemaForm.schemaJson}
                        onChange={(e) =>
                          setSchemaForm((f) => ({
                            ...f,
                            schemaJson: e.target.value,
                          }))
                        }
                        aria-label="JSON Schema"
                      />
                      <div className="md:col-span-2">
                        <Button type="submit" disabled={createSchema.isPending}>
                          {createSchema.isPending ? "Création..." : "Créer"}
                        </Button>
                      </div>
                    </form>
                  </CardBody>
                </Card>
              ) : null}

              {schemas.items.length === 0 ? (
                <EdgeEmptyState
                  title="Aucun schema"
                  description="Créez un JSON Schema pour valider les templates et bundles."
                />
              ) : (
                <div className="overflow-x-auto" data-testid="cfg-schemas-table">
                  <table className="w-full type-sm text-left">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                        <th className="py-2 pr-3 font-medium">Code</th>
                        <th className="py-2 pr-3 font-medium">Nom</th>
                        <th className="py-2 pr-3 font-medium">Version</th>
                        <th className="py-2 pr-3 font-medium">Statut</th>
                        <th className="py-2 pr-3 font-medium">Checksum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schemas.items.map((s) => (
                        <tr
                          key={s.id}
                          className="border-b border-[var(--border)]"
                          data-testid={`cfg-schema-row-${s.code}`}
                        >
                          <td className="py-2 pr-3">
                            <code>{s.code}</code>
                          </td>
                          <td className="py-2 pr-3">{s.name}</td>
                          <td className="py-2 pr-3">v{s.schemaVersion}</td>
                          <td className="py-2 pr-3">
                            <Badge tone={statusTone(s.status)}>{s.status}</Badge>
                          </td>
                          <td className="py-2 pr-3 text-[var(--text-muted)]">
                            {s.checksum.slice(0, 12)}…
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </EdgePermissionGate>
      )}

      {tab === "templates" && (
        <EdgePermissionGate permission="platform:configuration:read">
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
                {canManage ? (
                  <Button
                    type="button"
                    onClick={() => setTemplateFormOpen((o) => !o)}
                  >
                    {templateFormOpen ? "Annuler" : "Créer un template"}
                  </Button>
                ) : null}
              </div>

              {templateFormOpen && canManage ? (
                <Card>
                  <CardHeader title="Nouveau template" />
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
                          setTemplateForm((f) => ({ ...f, code: e.target.value }))
                        }
                        aria-label="Code template"
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="Nom"
                        required
                        value={templateForm.name}
                        onChange={(e) =>
                          setTemplateForm((f) => ({ ...f, name: e.target.value }))
                        }
                        aria-label="Nom template"
                      />
                      <Select
                        value={templateForm.schemaId}
                        onChange={(e) =>
                          setTemplateForm((f) => ({
                            ...f,
                            schemaId: e.target.value,
                          }))
                        }
                        aria-label="Schema"
                        required
                      >
                        <option value="">Schema</option>
                        {schemas.items.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.code} (v{s.schemaVersion})
                          </option>
                        ))}
                      </Select>
                      <textarea
                        className={`${fieldControlClass} md:col-span-2 min-h-[80px] font-mono type-sm`}
                        value={templateForm.draftPayload}
                        onChange={(e) =>
                          setTemplateForm((f) => ({
                            ...f,
                            draftPayload: e.target.value,
                          }))
                        }
                        aria-label="Draft payload JSON"
                      />
                      <div className="md:col-span-2">
                        <Button type="submit" disabled={createTemplate.isPending}>
                          Créer
                        </Button>
                      </div>
                    </form>
                  </CardBody>
                </Card>
              ) : null}

              {templates.items.length === 0 ? (
                <EdgeEmptyState
                  title="Aucun template"
                  description="Les templates lient un schema à un payload versionné."
                />
              ) : (
                <ul className="flex flex-col gap-[var(--space-2)]" data-testid="cfg-templates-list">
                  {templates.items.map((t) => (
                    <li
                      key={t.id}
                      className="flex flex-wrap items-center gap-[var(--space-2)] type-sm"
                    >
                      <code>{t.code}</code>
                      <span>{t.name}</span>
                      <Badge tone={statusTone(String(t.templateStatus))}>
                        {t.templateStatus}
                      </Badge>
                      <span className="text-[var(--text-muted)]">
                        v{t.latestVersion}
                      </span>
                      {canManage && t.templateStatus === "DRAFT" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={publishTemplate.isPending}
                          onClick={() => publishTemplate.mutate(t)}
                        >
                          Publier
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </EdgePermissionGate>
      )}

      {tab === "bundles" && (
        <EdgePermissionGate permission="platform:configuration:read">
          {bundlesQ.isLoading ? (
            <EdgeLoadingState label="Chargement des bundles..." />
          ) : bundlesQ.isError ? (
            <EdgeErrorState description={(bundlesQ.error as Error).message} />
          ) : (
            <div className="flex flex-col gap-[var(--space-4)]">
              <div className="flex items-center justify-between">
                <p className="type-sm text-[var(--text-muted)]">
                  {bundles.total} bundle(s) — unités déployables
                </p>
                {canManage ? (
                  <Button
                    type="button"
                    onClick={() => setBundleFormOpen((o) => !o)}
                  >
                    {bundleFormOpen ? "Annuler" : "Créer un bundle"}
                  </Button>
                ) : null}
              </div>

              {bundleFormOpen && canManage ? (
                <Card>
                  <CardHeader title="Nouveau bundle" />
                  <CardBody>
                    <form
                      onSubmit={onCreateBundle}
                      className="grid gap-[var(--space-3)] md:grid-cols-2"
                    >
                      <input
                        className={fieldControlClass}
                        placeholder="code"
                        required
                        value={bundleForm.code}
                        onChange={(e) =>
                          setBundleForm((f) => ({ ...f, code: e.target.value }))
                        }
                        aria-label="Code bundle"
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="Nom"
                        required
                        value={bundleForm.name}
                        onChange={(e) =>
                          setBundleForm((f) => ({ ...f, name: e.target.value }))
                        }
                        aria-label="Nom bundle"
                      />
                      <Select
                        value={bundleForm.templateId}
                        onChange={(e) =>
                          setBundleForm((f) => ({
                            ...f,
                            templateId: e.target.value,
                          }))
                        }
                        aria-label="Template"
                        required
                      >
                        <option value="">Template</option>
                        {templates.items.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.code} (v{t.latestVersion})
                          </option>
                        ))}
                      </Select>
                      <input
                        className={fieldControlClass}
                        placeholder="Version template"
                        value={bundleForm.templateVersion}
                        onChange={(e) =>
                          setBundleForm((f) => ({
                            ...f,
                            templateVersion: e.target.value,
                          }))
                        }
                        aria-label="Version template"
                      />
                      <div className="md:col-span-2">
                        <Button type="submit" disabled={createBundle.isPending}>
                          Créer
                        </Button>
                      </div>
                    </form>
                  </CardBody>
                </Card>
              ) : null}

              {bundles.items.length === 0 ? (
                <EdgeEmptyState
                  title="Aucun bundle"
                  description="Un bundle agrège des templates publiés pour déploiement tenant."
                />
              ) : (
                <ul className="flex flex-col gap-[var(--space-2)]" data-testid="cfg-bundles-list">
                  {bundles.items.map((b) => (
                    <li
                      key={b.id}
                      className="flex flex-wrap items-center gap-[var(--space-2)] type-sm"
                    >
                      <code>{b.code}</code>
                      <span>{b.name}</span>
                      <Badge tone={statusTone(String(b.bundleStatus))}>
                        {b.bundleStatus}
                      </Badge>
                      <span className="text-[var(--text-muted)]">
                        v{b.latestVersion}
                      </span>
                      {canManage && b.bundleStatus === "DRAFT" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={publishBundle.isPending}
                          onClick={() => publishBundle.mutate(b)}
                        >
                          Publier
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </EdgePermissionGate>
      )}

      {tab === "assignments" && (
        <EdgePermissionGate permission="platform:configuration:read">
          {assignmentsQ.isLoading ? (
            <EdgeLoadingState label="Chargement des assignments..." />
          ) : assignmentsQ.isError ? (
            <EdgeErrorState description={(assignmentsQ.error as Error).message} />
          ) : assignments.items.length === 0 ? (
            <EdgeEmptyState
              title="Aucun assignment"
              description="Assignez un bundle publié à un tenant (P7.1 provisioning request requis)."
            />
          ) : (
            <div className="flex flex-col gap-[var(--space-4)]">
              <Select
                value={selectedAssignmentId}
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                aria-label="Choisir un assignment"
              >
                <option value="">Choisir un assignment</option>
                {assignments.items.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.tenantId} — {a.assignmentStatus} — drift {a.driftStatus}
                  </option>
                ))}
              </Select>

              {!selectedAssignmentId ? (
                <EdgeEmptyState
                  title="Sélectionnez un assignment"
                  description="Statut, drift, version d'entitlement et actions deploy/rollback."
                />
              ) : detailQ.isLoading ? (
                <EdgeLoadingState label="Chargement du détail..." />
              ) : detailQ.isError ? (
                <EdgeErrorState description={(detailQ.error as Error).message} />
              ) : selectedAssignment ? (
                <div
                  className="flex flex-col gap-[var(--space-4)]"
                  data-testid="cfg-assignment-detail"
                >
                  <div className="flex flex-wrap items-center gap-[var(--space-2)]">
                    <Badge tone={statusTone(String(selectedAssignment.assignmentStatus))}>
                      {selectedAssignment.assignmentStatus}
                    </Badge>
                    <Badge tone={statusTone(String(selectedAssignment.driftStatus))}>
                      Drift: {selectedAssignment.driftStatus}
                    </Badge>
                    <Badge tone="info">
                      Entitlement v{selectedAssignment.entitlementVersion ?? "—"}
                    </Badge>
                    <span className="type-sm text-[var(--text-muted)]">
                      Bundle {selectedAssignment.bundleId.slice(0, 8)}… v
                      {selectedAssignment.bundleVersion}
                    </span>
                  </div>

                  <dl className="grid gap-[var(--space-2)] type-sm md:grid-cols-2">
                    <div>
                      <dt className="text-[var(--text-muted)]">Tenant</dt>
                      <dd>{selectedAssignment.tenantId}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--text-muted)]">Product</dt>
                      <dd>{selectedAssignment.productId}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--text-muted)]">Snapshot ref</dt>
                      <dd>{selectedAssignment.entitlementSnapshotRef ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--text-muted)]">Dernier déploiement</dt>
                      <dd>{formatWhen(selectedAssignment.lastDeployedAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--text-muted)]">Workflow</dt>
                      <dd>{selectedAssignment.workflowId ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--text-muted)]">Stratégie</dt>
                      <dd>{selectedAssignment.deploymentStrategy}</dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap gap-[var(--space-2)]">
                    {canDeploy ? (
                      <Button
                        type="button"
                        data-testid="cfg-deploy"
                        disabled={deploy.isPending}
                        onClick={() => confirmDeploy(selectedAssignment.id)}
                      >
                        Deploy
                      </Button>
                    ) : null}
                    {canRollback ? (
                      <Button
                        type="button"
                        variant="outline"
                        data-testid="cfg-rollback"
                        disabled={rollback.isPending}
                        onClick={() => confirmRollback(selectedAssignment.id)}
                      >
                        Rollback
                      </Button>
                    ) : null}
                    {canEntitlementReconcile ? (
                      <Button
                        type="button"
                        variant="outline"
                        data-testid="cfg-reconcile"
                        disabled={reconcile.isPending}
                        onClick={() => reconcile.mutate(selectedAssignment.id)}
                      >
                        Reconcile entitlements
                      </Button>
                    ) : null}
                  </div>

                  <Card>
                    <CardHeader title="Applied config (redacted)" />
                    <CardBody>
                      <pre
                        className="max-h-48 overflow-auto rounded bg-[var(--surface-muted)] p-3 type-xs"
                        data-testid="cfg-applied-config"
                      >
                        {JSON.stringify(
                          redactConfigForDisplay(selectedAssignment.appliedConfig),
                          null,
                          2,
                        )}
                      </pre>
                    </CardBody>
                  </Card>

                  {canEntitlementRead ? (
                    <Card>
                      <CardHeader
                        title={`Entitlement deployments (${entitlements.total})`}
                      />
                      <CardBody>
                        {entitlements.items.length === 0 ? (
                          <p className="type-sm text-[var(--text-muted)]">
                            Aucun déploiement d&apos;entitlement.
                          </p>
                        ) : (
                          <ul
                            className="flex flex-col gap-[var(--space-2)] type-sm"
                            data-testid="cfg-entitlements"
                          >
                            {entitlements.items.map((ent) => (
                              <li
                                key={ent.id}
                                className="flex flex-wrap items-center gap-[var(--space-2)]"
                              >
                                <Badge
                                  tone={statusTone(String(ent.deploymentStatus))}
                                >
                                  {ent.deploymentStatus}
                                </Badge>
                                <span>v{ent.entitlementVersion}</span>
                                <span className="text-[var(--text-muted)]">
                                  {ent.payloadDigest.slice(0, 12)}…
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardBody>
                    </Card>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </EdgePermissionGate>
      )}

      {tab === "history" && (
        <EdgePermissionGate permission="platform:configuration:history:read">
          <div className="flex flex-col gap-[var(--space-4)]">
            <Select
              value={historyAssignmentId}
              onChange={(e) => setHistoryAssignmentId(e.target.value)}
              aria-label="Choisir un assignment pour l'historique"
            >
              <option value="">Choisir un assignment</option>
              {assignments.items.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.tenantId} — {a.assignmentStatus}
                </option>
              ))}
            </Select>

            {!historyAssignmentId ? (
              <EdgeEmptyState
                title="Sélectionnez un assignment"
                description="Runs de déploiement et evidence P7.1."
              />
            ) : runsQ.isLoading || evidenceQ.isLoading ? (
              <EdgeLoadingState label="Chargement de l'historique..." />
            ) : (
              <>
                <Card>
                  <CardHeader title={`Deployment runs (${runs.total})`} />
                  <CardBody>
                    {runs.items.length === 0 ? (
                      <p className="type-sm text-[var(--text-muted)]">Aucun run.</p>
                    ) : (
                      <ul
                        className="flex flex-col gap-[var(--space-2)] type-sm"
                        data-testid="cfg-runs"
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
                              {r.fromBundleVersion ?? "∅"} → {r.toBundleVersion ?? "∅"}
                            </span>
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
                        data-testid="cfg-evidence"
                      >
                        {evidence.items.slice(0, 30).map((ev) => (
                          <li
                            key={ev.id}
                            className="flex flex-wrap items-center gap-[var(--space-2)]"
                          >
                            <Badge
                              tone={
                                ev.outcome === "SUCCESS" || ev.outcome === "SUCCEEDED"
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
    </div>
  );
}
