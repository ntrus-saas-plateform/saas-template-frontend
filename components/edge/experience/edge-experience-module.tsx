"use client";

/**
 * P7.9 — Edge Admin Console: Product Experience Provisioning module.
 *
 * Profiles, applications, tenant assignments, domains, provision/deactivate
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
  ExperienceApplication,
  ExperienceDeploymentRun,
  ExperienceDomainBinding,
  ExperienceProfile,
  TenantExperienceAssignment,
} from "@/types/edge-experience";

const SECRET_KEY_RE =
  /(secret|password|token|credential|api[_-]?key|private[_-]?key|client[_-]?secret)/i;
const MASKED = "••••••••";

type TabId =
  | "profiles"
  | "applications"
  | "assignments"
  | "domains"
  | "history";

const TABS: { id: TabId; label: string; permission: string }[] = [
  { id: "profiles", label: "Profiles", permission: "platform:experience:read" },
  {
    id: "applications",
    label: "Applications",
    permission: "platform:experience:read",
  },
  {
    id: "assignments",
    label: "Assignments",
    permission: "platform:experience:read",
  },
  {
    id: "domains",
    label: "Domains",
    permission: "platform:experience:domains",
  },
  {
    id: "history",
    label: "History",
    permission: "platform:experience:history:read",
  },
];

const APPLICATION_KINDS = [
  "WEB",
  "MOBILE",
  "DESKTOP",
  "POS",
  "OPERATIONS",
  "CUSTOMER",
  "KIOSK",
  "DISPLAY",
  "DEVICE",
  "OTHER",
] as const;

function statusTone(
  status: string | undefined,
): "default" | "success" | "warning" | "danger" | "info" {
  if (!status) return "default";
  const s = status.toUpperCase();
  if (
    s === "ACTIVE" ||
    s === "PUBLISHED" ||
    s === "READY" ||
    s === "SUCCEEDED" ||
    s === "VERIFIED" ||
    s === "NONE" ||
    s === "RESOLVED"
  ) {
    return "success";
  }
  if (
    s === "FAILED" ||
    s === "REVOKED" ||
    s === "RETIRED" ||
    s === "DEACTIVATED" ||
    s === "DETECTED" ||
    s === "EXPIRED"
  ) {
    return "danger";
  }
  if (
    s === "PROVISIONING" ||
    s === "DEACTIVATING" ||
    s === "DEPRECATED" ||
    s === "DRAFT" ||
    s === "PENDING" ||
    s === "REMEDIATING" ||
    s === "PARTIAL"
  ) {
    return "warning";
  }
  return "info";
}

/** Recursively redact secret-looking string values for display. */
export function redactExperienceForDisplay(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactExperienceForDisplay);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEY_RE.test(k) && typeof v === "string") {
        out[k] = MASKED;
      } else {
        out[k] = redactExperienceForDisplay(v);
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

export function EdgeExperienceModule() {
  const { permissions } = useEdgePlatform();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabId>("profiles");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [historyAssignmentId, setHistoryAssignmentId] = useState("");
  const [domainsAssignmentId, setDomainsAssignmentId] = useState("");

  const [profileFormOpen, setProfileFormOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ code: "", name: "" });

  const [appFormOpen, setAppFormOpen] = useState(false);
  const [appForm, setAppForm] = useState({
    code: "",
    name: "",
    applicationKind: "WEB",
    experienceProfileId: "",
    draftManifest: '{\n  "applications": [],\n  "clients": [],\n  "domains": []\n}',
  });

  const [assignFormOpen, setAssignFormOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    tenantId: "",
    productId: "",
    provisioningRequestId: "",
    profileId: "",
    desiredManifest:
      '{\n  "applications": [],\n  "clients": [],\n  "domains": []\n}',
  });

  const [domainForm, setDomainForm] = useState({
    hostname: "",
    domainKind: "CUSTOM" as "SUBDOMAIN" | "CUSTOM",
  });

  const canRead = hasEdgePermission(permissions, "platform:experience:read");
  const canManage = hasEdgePermission(permissions, "platform:experience:manage");
  const canDeploy = hasEdgePermission(permissions, "platform:experience:deploy");
  const canDomains = hasEdgePermission(
    permissions,
    "platform:experience:domains",
  );
  const canHistory = hasEdgePermission(
    permissions,
    "platform:experience:history:read",
  );

  const profilesQ = useQuery({
    queryKey: ["exp", "profiles"],
    queryFn: () => edgeApi.listExperienceProfiles({ limit: 50 }),
    enabled: canRead && (tab === "profiles" || tab === "applications" || tab === "assignments"),
  });
  const applicationsQ = useQuery({
    queryKey: ["exp", "applications"],
    queryFn: () => edgeApi.listExperienceApplications({ limit: 50 }),
    enabled: canRead && tab === "applications",
  });
  const assignmentsQ = useQuery({
    queryKey: ["exp", "assignments"],
    queryFn: () => edgeApi.listTenantExperienceAssignments({ limit: 50 }),
    enabled:
      canRead &&
      (tab === "assignments" || tab === "history" || tab === "domains"),
  });
  const detailQ = useQuery({
    queryKey: ["exp", "assignment", selectedAssignmentId],
    queryFn: () => edgeApi.getTenantExperienceAssignment(selectedAssignmentId),
    enabled: canRead && Boolean(selectedAssignmentId) && tab === "assignments",
  });
  const domainsQ = useQuery({
    queryKey: ["exp", "domains", domainsAssignmentId],
    queryFn: () => edgeApi.listExperienceDomains(domainsAssignmentId),
    enabled: canDomains && Boolean(domainsAssignmentId) && tab === "domains",
  });
  const runsQ = useQuery({
    queryKey: ["exp", "runs", historyAssignmentId],
    queryFn: () => edgeApi.listExperienceDeploymentRuns(historyAssignmentId),
    enabled: canHistory && Boolean(historyAssignmentId) && tab === "history",
  });
  const evidenceQ = useQuery({
    queryKey: ["exp", "evidence", historyAssignmentId],
    queryFn: () => edgeApi.listExperienceEvidence(historyAssignmentId),
    enabled: canHistory && Boolean(historyAssignmentId) && tab === "history",
  });

  const profiles = unwrapInfraList<ExperienceProfile>(profilesQ.data?.data);
  const applications = unwrapInfraList<ExperienceApplication>(
    applicationsQ.data?.data,
  );
  const assignments = unwrapInfraList<TenantExperienceAssignment>(
    assignmentsQ.data?.data,
  );
  const domains = unwrapInfraList<ExperienceDomainBinding>(domainsQ.data?.data);
  const runs = unwrapInfraList<ExperienceDeploymentRun>(runsQ.data?.data);
  const evidence = unwrapInfraList(evidenceQ.data?.data);
  const detail = detailQ.data?.data ?? null;
  const selectedAssignment =
    detail?.assignment ??
    assignments.items.find((a) => a.id === selectedAssignmentId) ??
    null;

  const createProfile = useMutation({
    mutationFn: () =>
      edgeApi.createExperienceProfile({
        code: profileForm.code,
        name: profileForm.name,
      }),
    onSuccess: () => {
      setProfileFormOpen(false);
      setProfileForm({ code: "", name: "" });
      void qc.invalidateQueries({ queryKey: ["exp", "profiles"] });
    },
  });

  const publishProfile = useMutation({
    mutationFn: (p: ExperienceProfile) =>
      edgeApi.publishExperienceProfile(p.id, { expectedVersion: p.version }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["exp", "profiles"] }),
  });

  const createApplication = useMutation({
    mutationFn: async () => {
      const draftManifest = JSON.parse(appForm.draftManifest) as Record<
        string,
        unknown
      >;
      return edgeApi.createExperienceApplication({
        code: appForm.code,
        name: appForm.name,
        applicationKind: appForm.applicationKind,
        experienceProfileId: appForm.experienceProfileId || undefined,
        draftManifest,
      });
    },
    onSuccess: () => {
      setAppFormOpen(false);
      setAppForm({
        code: "",
        name: "",
        applicationKind: "WEB",
        experienceProfileId: "",
        draftManifest:
          '{\n  "applications": [],\n  "clients": [],\n  "domains": []\n}',
      });
      void qc.invalidateQueries({ queryKey: ["exp", "applications"] });
    },
  });

  const publishApplication = useMutation({
    mutationFn: (a: ExperienceApplication) =>
      edgeApi.publishExperienceApplication(a.id, {
        expectedVersion: a.version,
        versionNumber: Math.max(1, a.latestVersion || 1),
      }),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["exp", "applications"] }),
  });

  const assignExperience = useMutation({
    mutationFn: async () => {
      const desiredManifest = JSON.parse(assignForm.desiredManifest) as Record<
        string,
        unknown
      >;
      return edgeApi.assignTenantExperience({
        tenantId: assignForm.tenantId,
        productId: assignForm.productId,
        provisioningRequestId: assignForm.provisioningRequestId,
        experienceProfileId: assignForm.profileId || undefined,
        desiredManifest,
      });
    },
    onSuccess: () => {
      setAssignFormOpen(false);
      setAssignForm({
        tenantId: "",
        productId: "",
        provisioningRequestId: "",
        profileId: "",
        desiredManifest:
          '{\n  "applications": [],\n  "clients": [],\n  "domains": []\n}',
      });
      void qc.invalidateQueries({ queryKey: ["exp", "assignments"] });
    },
  });

  const provision = useMutation({
    mutationFn: (assignmentId: string) =>
      edgeApi.provisionTenantExperience(assignmentId, {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["exp"] }),
  });

  const deactivate = useMutation({
    mutationFn: (assignmentId: string) =>
      edgeApi.deactivateTenantExperience(assignmentId, {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["exp"] }),
  });

  const createDomain = useMutation({
    mutationFn: () =>
      edgeApi.createExperienceDomain({
        assignmentId: domainsAssignmentId,
        hostname: domainForm.hostname,
        domainKind: domainForm.domainKind,
      }),
    onSuccess: () => {
      setDomainForm({ hostname: "", domainKind: "CUSTOM" });
      void qc.invalidateQueries({
        queryKey: ["exp", "domains", domainsAssignmentId],
      });
    },
  });

  const visibleTabs = useMemo(
    () => TABS.filter((t) => hasEdgePermission(permissions, t.permission)),
    [permissions],
  );

  if (!hasAnyEdgePermission(permissions, ["platform:experience:read"])) {
    return <EdgeForbiddenState />;
  }

  function onCreateProfile(e: FormEvent) {
    e.preventDefault();
    createProfile.mutate();
  }

  function onCreateApplication(e: FormEvent) {
    e.preventDefault();
    createApplication.mutate();
  }

  function onAssign(e: FormEvent) {
    e.preventDefault();
    assignExperience.mutate();
  }

  function onCreateDomain(e: FormEvent) {
    e.preventDefault();
    createDomain.mutate();
  }

  function confirmProvision(id: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Provisionner cette expérience via le workflow P7.4 ? L'autorisation P7.1 sera revalidée.",
      )
    ) {
      return;
    }
    provision.mutate(id);
  }

  function confirmDeactivate(id: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Désactiver cette expérience tenant ? Clients, domaines et routes seront révoqués.",
      )
    ) {
      return;
    }
    deactivate.mutate(id);
  }

  const actionError =
    createProfile.error ??
    publishProfile.error ??
    createApplication.error ??
    publishApplication.error ??
    assignExperience.error ??
    provision.error ??
    deactivate.error ??
    createDomain.error;

  return (
    <div className="flex flex-col gap-[var(--space-6)]" data-testid="exp-module">
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

      {tab === "profiles" && (
        <EdgePermissionGate permission="platform:experience:read">
          {profilesQ.isLoading ? (
            <EdgeLoadingState label="Chargement des profils..." />
          ) : profilesQ.isError ? (
            <EdgeErrorState description={(profilesQ.error as Error).message} />
          ) : (
            <div className="flex flex-col gap-[var(--space-4)]">
              <div className="flex items-center justify-between">
                <p className="type-sm text-[var(--text-muted)]">
                  {profiles.total} profil(s) d&apos;expérience
                </p>
                {canManage ? (
                  <Button
                    type="button"
                    onClick={() => setProfileFormOpen((o) => !o)}
                    data-testid="exp-profile-toggle"
                  >
                    {profileFormOpen ? "Annuler" : "Créer un profil"}
                  </Button>
                ) : null}
              </div>

              {profileFormOpen && canManage ? (
                <Card>
                  <CardHeader title="Nouveau profil d'expérience" />
                  <CardBody>
                    <form
                      onSubmit={onCreateProfile}
                      className="grid gap-[var(--space-3)] md:grid-cols-2"
                    >
                      <input
                        className={fieldControlClass}
                        placeholder="code (ex. retail-pos)"
                        required
                        value={profileForm.code}
                        onChange={(e) =>
                          setProfileForm((f) => ({ ...f, code: e.target.value }))
                        }
                        aria-label="Code profil"
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="Nom"
                        required
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm((f) => ({ ...f, name: e.target.value }))
                        }
                        aria-label="Nom profil"
                      />
                      <div className="md:col-span-2">
                        <Button type="submit" disabled={createProfile.isPending}>
                          {createProfile.isPending ? "Création..." : "Créer"}
                        </Button>
                      </div>
                    </form>
                  </CardBody>
                </Card>
              ) : null}

              {profiles.items.length === 0 ? (
                <EdgeEmptyState
                  title="Aucun profil"
                  description="Créez un profil d'expérience publié avant d'assigner un tenant."
                />
              ) : (
                <div className="overflow-x-auto" data-testid="exp-profiles-table">
                  <table className="w-full type-sm text-left">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                        <th className="py-2 pr-3 font-medium">Code</th>
                        <th className="py-2 pr-3 font-medium">Nom</th>
                        <th className="py-2 pr-3 font-medium">Statut</th>
                        <th className="py-2 pr-3 font-medium">Version</th>
                        <th className="py-2 pr-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.items.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b border-[var(--border)]"
                          data-testid={`exp-profile-row-${p.code}`}
                        >
                          <td className="py-2 pr-3">
                            <code>{p.code}</code>
                          </td>
                          <td className="py-2 pr-3">{p.name}</td>
                          <td className="py-2 pr-3">
                            <Badge tone={statusTone(String(p.profileStatus))}>
                              {p.profileStatus}
                            </Badge>
                          </td>
                          <td className="py-2 pr-3">v{p.version}</td>
                          <td className="py-2 pr-3">
                            {canManage && p.profileStatus === "DRAFT" ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={publishProfile.isPending}
                                onClick={() => publishProfile.mutate(p)}
                              >
                                Publier
                              </Button>
                            ) : null}
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

      {tab === "applications" && (
        <EdgePermissionGate permission="platform:experience:read">
          {applicationsQ.isLoading ? (
            <EdgeLoadingState label="Chargement des applications..." />
          ) : applicationsQ.isError ? (
            <EdgeErrorState
              description={(applicationsQ.error as Error).message}
            />
          ) : (
            <div className="flex flex-col gap-[var(--space-4)]">
              <div className="flex items-center justify-between">
                <p className="type-sm text-[var(--text-muted)]">
                  {applications.total} application(s)
                </p>
                {canManage ? (
                  <Button
                    type="button"
                    onClick={() => setAppFormOpen((o) => !o)}
                    data-testid="exp-app-toggle"
                  >
                    {appFormOpen ? "Annuler" : "Créer une application"}
                  </Button>
                ) : null}
              </div>

              {appFormOpen && canManage ? (
                <Card>
                  <CardHeader title="Nouvelle application" />
                  <CardBody>
                    <form
                      onSubmit={onCreateApplication}
                      className="grid gap-[var(--space-3)] md:grid-cols-2"
                    >
                      <input
                        className={fieldControlClass}
                        placeholder="code"
                        required
                        value={appForm.code}
                        onChange={(e) =>
                          setAppForm((f) => ({ ...f, code: e.target.value }))
                        }
                        aria-label="Code application"
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="Nom"
                        required
                        value={appForm.name}
                        onChange={(e) =>
                          setAppForm((f) => ({ ...f, name: e.target.value }))
                        }
                        aria-label="Nom application"
                      />
                      <Select
                        value={appForm.applicationKind}
                        onChange={(e) =>
                          setAppForm((f) => ({
                            ...f,
                            applicationKind: e.target.value,
                          }))
                        }
                        aria-label="Type d'application"
                        required
                      >
                        {APPLICATION_KINDS.map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </Select>
                      <Select
                        value={appForm.experienceProfileId}
                        onChange={(e) =>
                          setAppForm((f) => ({
                            ...f,
                            experienceProfileId: e.target.value,
                          }))
                        }
                        aria-label="Profil d'expérience"
                      >
                        <option value="">Profil (optionnel)</option>
                        {profiles.items.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code}
                          </option>
                        ))}
                      </Select>
                      <textarea
                        className={`${fieldControlClass} md:col-span-2 min-h-[120px] font-mono type-sm`}
                        value={appForm.draftManifest}
                        onChange={(e) =>
                          setAppForm((f) => ({
                            ...f,
                            draftManifest: e.target.value,
                          }))
                        }
                        aria-label="Manifest JSON"
                      />
                      <div className="md:col-span-2">
                        <Button
                          type="submit"
                          disabled={createApplication.isPending}
                        >
                          Créer
                        </Button>
                      </div>
                    </form>
                  </CardBody>
                </Card>
              ) : null}

              {applications.items.length === 0 ? (
                <EdgeEmptyState
                  title="Aucune application"
                  description="Les applications lient un kind et un manifest versionné."
                />
              ) : (
                <ul
                  className="flex flex-col gap-[var(--space-2)]"
                  data-testid="exp-applications-list"
                >
                  {applications.items.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center gap-[var(--space-2)] type-sm"
                    >
                      <code>{a.code}</code>
                      <span>{a.name}</span>
                      <Badge tone="info">{a.applicationKind}</Badge>
                      <Badge tone={statusTone(String(a.applicationStatus))}>
                        {a.applicationStatus}
                      </Badge>
                      <span className="text-[var(--text-muted)]">
                        v{a.latestVersion}
                      </span>
                      {canManage && a.applicationStatus === "DRAFT" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={publishApplication.isPending}
                          onClick={() => publishApplication.mutate(a)}
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
        <EdgePermissionGate permission="platform:experience:read">
          {assignmentsQ.isLoading ? (
            <EdgeLoadingState label="Chargement des assignments..." />
          ) : assignmentsQ.isError ? (
            <EdgeErrorState
              description={(assignmentsQ.error as Error).message}
            />
          ) : (
            <div className="flex flex-col gap-[var(--space-4)]">
              <div className="flex items-center justify-between">
                <p className="type-sm text-[var(--text-muted)]">
                  {assignments.total} assignment(s) tenant
                </p>
                {canDeploy ? (
                  <Button
                    type="button"
                    onClick={() => setAssignFormOpen((o) => !o)}
                    data-testid="exp-assign-toggle"
                  >
                    {assignFormOpen ? "Annuler" : "Assigner un tenant"}
                  </Button>
                ) : null}
              </div>

              {assignFormOpen && canDeploy ? (
                <Card>
                  <CardHeader title="Nouvelle assignation d'expérience" />
                  <CardBody>
                    <form
                      onSubmit={onAssign}
                      className="grid gap-[var(--space-3)] md:grid-cols-2"
                    >
                      <input
                        className={fieldControlClass}
                        placeholder="tenantId"
                        required
                        value={assignForm.tenantId}
                        onChange={(e) =>
                          setAssignForm((f) => ({
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
                        value={assignForm.productId}
                        onChange={(e) =>
                          setAssignForm((f) => ({
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
                        value={assignForm.provisioningRequestId}
                        onChange={(e) =>
                          setAssignForm((f) => ({
                            ...f,
                            provisioningRequestId: e.target.value,
                          }))
                        }
                        aria-label="Provisioning request ID"
                      />
                      <Select
                        value={assignForm.profileId}
                        onChange={(e) =>
                          setAssignForm((f) => ({
                            ...f,
                            profileId: e.target.value,
                          }))
                        }
                        aria-label="Profil d'expérience"
                      >
                        <option value="">Profil (optionnel)</option>
                        {profiles.items.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} — {p.profileStatus}
                          </option>
                        ))}
                      </Select>
                      <textarea
                        className={`${fieldControlClass} md:col-span-2 min-h-[120px] font-mono type-sm`}
                        value={assignForm.desiredManifest}
                        onChange={(e) =>
                          setAssignForm((f) => ({
                            ...f,
                            desiredManifest: e.target.value,
                          }))
                        }
                        aria-label="Desired manifest JSON"
                      />
                      <div className="md:col-span-2">
                        <Button
                          type="submit"
                          disabled={assignExperience.isPending}
                        >
                          Assigner
                        </Button>
                      </div>
                    </form>
                  </CardBody>
                </Card>
              ) : null}

              {assignments.items.length === 0 ? (
                <EdgeEmptyState
                  title="Aucun assignment"
                  description="Assignez un profil publié à un tenant (P7.1 provisioning request requis)."
                />
              ) : (
                <>
                  <Select
                    value={selectedAssignmentId}
                    onChange={(e) => setSelectedAssignmentId(e.target.value)}
                    aria-label="Choisir un assignment"
                  >
                    <option value="">Choisir un assignment</option>
                    {assignments.items.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.tenantId} — {a.assignmentStatus} — drift{" "}
                        {a.driftStatus}
                      </option>
                    ))}
                  </Select>

                  {!selectedAssignmentId ? (
                    <EdgeEmptyState
                      title="Sélectionnez un assignment"
                      description="Statut, drift, manifest appliqué et actions provision/deactivate."
                    />
                  ) : detailQ.isLoading ? (
                    <EdgeLoadingState label="Chargement du détail..." />
                  ) : detailQ.isError ? (
                    <EdgeErrorState
                      description={(detailQ.error as Error).message}
                    />
                  ) : selectedAssignment ? (
                    <div
                      className="flex flex-col gap-[var(--space-4)]"
                      data-testid="exp-assignment-detail"
                    >
                      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
                        <Badge
                          tone={statusTone(
                            String(selectedAssignment.assignmentStatus),
                          )}
                        >
                          {selectedAssignment.assignmentStatus}
                        </Badge>
                        <Badge
                          tone={statusTone(
                            String(selectedAssignment.driftStatus),
                          )}
                        >
                          Drift: {selectedAssignment.driftStatus}
                        </Badge>
                        <span className="type-sm text-[var(--text-muted)]">
                          Profil{" "}
                          {selectedAssignment.experienceProfileId?.slice(0, 8) ??
                            "—"}
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
                          <dt className="text-[var(--text-muted)]">
                            Provisioning request
                          </dt>
                          <dd>
                            {selectedAssignment.provisioningRequestId ?? "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[var(--text-muted)]">
                            Dernier déploiement
                          </dt>
                          <dd>
                            {formatWhen(selectedAssignment.lastDeployedAt)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[var(--text-muted)]">Workflow</dt>
                          <dd>{selectedAssignment.workflowId ?? "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--text-muted)]">Checksum</dt>
                          <dd>
                            {selectedAssignment.appliedChecksum
                              ? `${selectedAssignment.appliedChecksum.slice(0, 12)}…`
                              : "—"}
                          </dd>
                        </div>
                      </dl>

                      <div className="flex flex-wrap gap-[var(--space-2)]">
                        {canDeploy ? (
                          <Button
                            type="button"
                            data-testid="exp-provision"
                            disabled={provision.isPending}
                            onClick={() =>
                              confirmProvision(selectedAssignment.id)
                            }
                          >
                            Provision
                          </Button>
                        ) : null}
                        {canDeploy ? (
                          <Button
                            type="button"
                            variant="outline"
                            data-testid="exp-deactivate"
                            disabled={deactivate.isPending}
                            onClick={() =>
                              confirmDeactivate(selectedAssignment.id)
                            }
                          >
                            Deactivate
                          </Button>
                        ) : null}
                      </div>

                      <Card>
                        <CardHeader title="Applied manifest (redacted)" />
                        <CardBody>
                          <pre
                            className="max-h-48 overflow-auto rounded bg-[var(--surface-muted)] p-3 type-xs"
                            data-testid="exp-applied-manifest"
                          >
                            {JSON.stringify(
                              redactExperienceForDisplay(
                                selectedAssignment.appliedManifest,
                              ),
                              null,
                              2,
                            )}
                          </pre>
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

      {tab === "domains" && (
        <EdgePermissionGate permission="platform:experience:domains">
          <div className="flex flex-col gap-[var(--space-4)]">
            <Select
              value={domainsAssignmentId}
              onChange={(e) => setDomainsAssignmentId(e.target.value)}
              aria-label="Choisir un assignment pour les domaines"
            >
              <option value="">Choisir un assignment</option>
              {assignments.items.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.tenantId} — {a.assignmentStatus}
                </option>
              ))}
            </Select>

            {!domainsAssignmentId ? (
              <EdgeEmptyState
                title="Sélectionnez un assignment"
                description="Bind de domaine (ownership challenge PENDING)."
              />
            ) : (
              <>
                <Card>
                  <CardHeader title="Lier un domaine" />
                  <CardBody>
                    <form
                      onSubmit={onCreateDomain}
                      className="grid gap-[var(--space-3)] md:grid-cols-3"
                    >
                      <input
                        className={fieldControlClass}
                        placeholder="hostname (ex. app.tenant.example.com)"
                        required
                        value={domainForm.hostname}
                        onChange={(e) =>
                          setDomainForm((f) => ({
                            ...f,
                            hostname: e.target.value,
                          }))
                        }
                        aria-label="Hostname"
                      />
                      <Select
                        value={domainForm.domainKind}
                        onChange={(e) =>
                          setDomainForm((f) => ({
                            ...f,
                            domainKind: e.target.value as
                              | "SUBDOMAIN"
                              | "CUSTOM",
                          }))
                        }
                        aria-label="Type de domaine"
                      >
                        <option value="CUSTOM">CUSTOM</option>
                        <option value="SUBDOMAIN">SUBDOMAIN</option>
                      </Select>
                      <Button type="submit" disabled={createDomain.isPending}>
                        {createDomain.isPending ? "Liaison..." : "Lier"}
                      </Button>
                    </form>
                  </CardBody>
                </Card>

                {domainsQ.isLoading ? (
                  <EdgeLoadingState label="Chargement des domaines..." />
                ) : domainsQ.isError ? (
                  <EdgeErrorState
                    description={(domainsQ.error as Error).message}
                  />
                ) : domains.items.length === 0 ? (
                  <EdgeEmptyState
                    title="Aucun domaine"
                    description="Aucun binding de domaine pour cet assignment."
                  />
                ) : (
                  <ul
                    className="flex flex-col gap-[var(--space-2)] type-sm"
                    data-testid="exp-domains-list"
                  >
                    {domains.items.map((d) => (
                      <li
                        key={d.id}
                        className="flex flex-wrap items-center gap-[var(--space-2)]"
                      >
                        <code>{d.hostname}</code>
                        <Badge tone="info">{d.domainKind}</Badge>
                        <Badge tone={statusTone(String(d.bindingStatus))}>
                          {d.bindingStatus}
                        </Badge>
                        <Badge tone={statusTone(String(d.ownershipStatus))}>
                          ownership: {d.ownershipStatus}
                        </Badge>
                        <Badge tone={statusTone(String(d.tlsStatus))}>
                          tls: {d.tlsStatus}
                        </Badge>
                        <span className="text-[var(--text-muted)]">
                          cert: {d.certificateRef ?? "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </EdgePermissionGate>
      )}

      {tab === "history" && (
        <EdgePermissionGate permission="platform:experience:history:read">
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
                description="Runs de provisionnement et evidence P7.1."
              />
            ) : runsQ.isLoading || evidenceQ.isLoading ? (
              <EdgeLoadingState label="Chargement de l'historique..." />
            ) : (
              <>
                <Card>
                  <CardHeader title={`Deployment runs (${runs.total})`} />
                  <CardBody>
                    {runs.items.length === 0 ? (
                      <p className="type-sm text-[var(--text-muted)]">
                        Aucun run.
                      </p>
                    ) : (
                      <ul
                        className="flex flex-col gap-[var(--space-2)] type-sm"
                        data-testid="exp-runs"
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
                        data-testid="exp-evidence"
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
    </div>
  );
}
