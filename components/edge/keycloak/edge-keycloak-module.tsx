"use client";

/**
 * P7.7 — Edge Admin Console: Keycloak topology provisioning module.
 *
 * The Edge console is an INFRASTRUCTURE console. It manages Keycloak servers,
 * topology plans, realm/OIDC topology artifacts, and lifecycle state only.
 * It MUST NOT expose tenant end-users, tenant organizations, tenant business
 * roles/permissions, or customer invitations (P7.7 boundary).
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
  KeycloakCapabilitiesRecord,
  KeycloakHistoryRecord,
  KeycloakProviderRecord,
  KeycloakServerRecord,
  KeycloakTopologyDetail,
  KeycloakTopologyRecord,
} from "@/types/edge-keycloak";

const MASKED = "••••••••";

function statusTone(
  status: string | undefined,
): "default" | "success" | "warning" | "danger" | "info" {
  if (status === "READY" || status === "HEALTHY") return "success";
  if (status === "FAILED" || status === "QUARANTINED" || status === "UNHEALTHY") {
    return "danger";
  }
  if (status === "DEGRADED" || status === "RECONCILIATION_REQUIRED") return "warning";
  return "default";
}

/** State + artifacts panel for one topology (read-only execution state). */
export function KeycloakTopologyDetailPanel({
  detail,
}: {
  detail: KeycloakTopologyDetail;
}) {
  const topology = detail.topology;
  return (
    <div className="flex flex-col gap-[var(--space-4)]" data-testid="kc-topology-detail">
      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
        <Badge tone={statusTone(topology.status)}>{topology.status}</Badge>
        <Badge tone="info">{topology.topologyType}</Badge>
        {topology.deletionProtection ? (
          <Badge tone="warning">Protection activée</Badge>
        ) : null}
      </div>

      <dl className="grid gap-[var(--space-2)] type-sm md:grid-cols-2">
        <div>
          <dt className="text-[var(--text-muted)]">Tenant</dt>
          <dd data-testid="kc-detail-tenant">{topology.tenantId}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Product</dt>
          <dd>{topology.productId}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Server</dt>
          <dd>{topology.serverId}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Workflow</dt>
          <dd>{topology.workflowId ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Desired / applied version</dt>
          <dd>
            {topology.desiredConfigVersion} / {topology.appliedConfigVersion ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Dernier health check</dt>
          <dd>
            {topology.lastHealthCheckAt
              ? new Date(topology.lastHealthCheckAt).toLocaleString("fr-FR")
              : "jamais"}
          </dd>
        </div>
      </dl>

      {topology.statusReason ? (
        <Alert tone="warning" title="Raison du statut">
          {topology.statusReason}
        </Alert>
      ) : null}

      {/* Realm artifact (infrastructure only — never business data). */}
      {detail.realm ? (
        <Card>
          <CardHeader
            title={`Realm : ${detail.realm.realmName}`}
            action={<Badge tone={statusTone(detail.realm.status)}>{detail.realm.status}</Badge>}
          />
          <CardBody>
            <p className="type-sm text-[var(--text-muted)]">
              Fingerprint : {detail.realm.internalFingerprint ?? "—"} — OIDC issuer :{" "}
              {detail.oidc?.issuer ?? "—"}
            </p>
          </CardBody>
        </Card>
      ) : null}

      {/* Technical clients (contract-driven). */}
      {detail.clients.length > 0 ? (
        <Card>
          <CardHeader title={`Clients techniques (${detail.clients.length})`} />
          <CardBody>
            <ul className="flex flex-col gap-[var(--space-2)] type-sm" data-testid="kc-clients">
              {detail.clients.map((client) => (
                <li key={client.id} className="flex flex-wrap items-center gap-[var(--space-2)]">
                  <code className="rounded bg-[var(--surface-muted)] px-1">{client.clientId}</code>
                  <Badge tone="info">{client.clientKind}</Badge>
                  <span className="text-[var(--text-muted)]">{client.ownerFunction}</span>
                  <span className="text-[var(--text-muted)]">{client.status}</span>
                  {/* Secrets never rendered: only opaque vault refs. */}
                  <span className="text-[var(--text-muted)]" title="Référence opaque">
                    {client.secretCredentialRef ? MASKED : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}

      {/* Health checks. */}
      <Card>
        <CardHeader title="Vérifications de santé" />
        <CardBody>
          {detail.health.length === 0 ? (
            <p className="type-sm text-[var(--text-muted)]">Aucune vérification.</p>
          ) : (
            <ul className="flex flex-col gap-[var(--space-2)] type-sm" data-testid="kc-health">
              {detail.health.map((check) => (
                <li key={check.id} className="flex flex-wrap items-center gap-[var(--space-2)]">
                  <Badge tone={statusTone(check.outcome)}>{check.outcome}</Badge>
                  <span>{check.checkType}</span>
                  <span className="text-[var(--text-muted)]">{check.latencyMs} ms</span>
                  <span className="text-[var(--text-muted)]">
                    {new Date(check.checkedAt).toLocaleString("fr-FR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* Evidence + history (P7.1 traceability). */}
      <Card>
        <CardHeader title={`Evidence (${detail.evidence.length})`} />
        <CardBody>
          {detail.evidence.length === 0 ? (
            <p className="type-sm text-[var(--text-muted)]">Aucune evidence.</p>
          ) : (
            <ul className="flex flex-col gap-[var(--space-2)] type-sm" data-testid="kc-evidence">
              {detail.evidence.slice(0, 10).map((ev) => (
                <li key={ev.id} className="flex flex-wrap items-center gap-[var(--space-2)]">
                  <Badge tone={ev.outcome === "SUCCESS" ? "success" : "danger"}>
                    {ev.outcome}
                  </Badge>
                  <span>{ev.operation}</span>
                  <span className="text-[var(--text-muted)]">{ev.stepKey ?? "—"}</span>
                  <span className="text-[var(--text-muted)]">
                    {new Date(ev.performedAt).toLocaleString("fr-FR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

type TabId = "servers" | "topologies" | "history";

const TABS: { id: TabId; label: string; permission: string }[] = [
  { id: "servers", label: "Serveurs Keycloak", permission: "platform:keycloak:read" },
  { id: "topologies", label: "Topologies", permission: "platform:keycloak:read" },
  { id: "history", label: "Historique", permission: "platform:keycloak:history:read" },
];

export function EdgeKeycloakModule() {
  const { permissions } = useEdgePlatform();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabId>("servers");
  const [selectedTopologyId, setSelectedTopologyId] = useState<string>("");
  const [historyTopologyId, setHistoryTopologyId] = useState<string>("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    providerId: "",
    code: "",
    name: "",
    baseUrl: "",
    adminRealm: "master",
    adminClientId: "",
    adminCredential: "",
    environment: "production",
  });

  const canRead = hasEdgePermission(permissions, "platform:keycloak:read");
  const canManage = hasEdgePermission(permissions, "platform:keycloak:manage");
  const canCapabilities = hasEdgePermission(permissions, "platform:keycloak:capabilities");
  const canProvision = hasEdgePermission(permissions, "platform:keycloak:provision");
  const canReconcile = hasEdgePermission(permissions, "platform:keycloak:reconcile");
  const canDeprovision = hasEdgePermission(permissions, "platform:keycloak:deprovision");

  const providersQ = useQuery({
    queryKey: ["kc", "providers"],
    queryFn: () => edgeApi.listKeycloakProviders(),
    enabled: canRead && tab === "servers",
  });
  const serversQ = useQuery({
    queryKey: ["kc", "servers"],
    queryFn: () => edgeApi.listKeycloakServers(),
    enabled: canRead && tab === "servers",
  });
  const topologiesQ = useQuery({
    queryKey: ["kc", "topologies"],
    queryFn: () => edgeApi.listKeycloakTopologies({ limit: 50 }),
    enabled: canRead && (tab === "topologies" || tab === "history"),
  });
  const detailQ = useQuery({
    queryKey: ["kc", "topology", selectedTopologyId],
    queryFn: () => edgeApi.getKeycloakTopology(selectedTopologyId),
    enabled: canRead && Boolean(selectedTopologyId),
  });
  const historyQ = useQuery({
    queryKey: ["kc", "history", historyTopologyId],
    queryFn: () => edgeApi.listKeycloakHistory(historyTopologyId, { limit: 50 }),
    enabled: hasEdgePermission(permissions, "platform:keycloak:history:read") &&
      Boolean(historyTopologyId),
  });

  const providers = unwrapInfraList<KeycloakProviderRecord>(providersQ.data?.data);
  const servers = unwrapInfraList<KeycloakServerRecord>(serversQ.data?.data);
  const topologies = unwrapInfraList<KeycloakTopologyRecord>(topologiesQ.data?.data);
  const history = unwrapInfraList<KeycloakHistoryRecord>(historyQ.data?.data);
  const detail = detailQ.data?.data ?? null;
  const capabilities = useQuery({
    queryKey: ["kc", "capabilities", servers.items[0]?.id],
    queryFn: () => edgeApi.getKeycloakCapabilities(servers.items[0]!.id),
    enabled: canRead && tab === "servers" && servers.items.length > 0,
  });
  const caps: KeycloakCapabilitiesRecord | null = capabilities.data?.data ?? null;

  const registerServer = useMutation({
    mutationFn: () =>
      edgeApi.registerKeycloakServer({
        providerId: registerForm.providerId,
        code: registerForm.code,
        name: registerForm.name,
        baseUrl: registerForm.baseUrl,
        adminRealm: registerForm.adminRealm,
        adminClientId: registerForm.adminClientId,
        // Opaque secret: sent once to the vault, never echoed back.
        adminCredential: registerForm.adminCredential || undefined,
        environment: registerForm.environment,
      }),
    onSuccess: () => {
      setRegisterOpen(false);
      setRegisterForm((f) => ({ ...f, adminCredential: "" }));
      void qc.invalidateQueries({ queryKey: ["kc", "servers"] });
    },
  });

  const discover = useMutation({
    mutationFn: (serverId: string) => edgeApi.discoverKeycloakCapabilities(serverId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["kc"] }),
  });

  const reconcile = useMutation({
    mutationFn: (topologyId: string) =>
      edgeApi.reconcileKeycloakTopology(topologyId, { operation: "reconcile" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["kc"] }),
  });

  const deprovision = useMutation({
    mutationFn: (topologyId: string) =>
      edgeApi.deprovisionKeycloakTopology(topologyId, {
        authorized: true,
        confirmed: true,
        reason: "Deprovision depuis la console Edge",
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["kc"] }),
  });

  const historyItems = useMemo(() => history.items, [history.items]);

  if (!hasAnyEdgePermission(permissions, ["platform:keycloak:read"])) {
    return <EdgeForbiddenState />;
  }

  function onRegister(e: FormEvent) {
    e.preventDefault();
    registerServer.mutate();
  }

  return (
    <div className="flex flex-col gap-[var(--space-6)]" data-testid="kc-module">
      {registerServer.isError ? (
        <Alert tone="error" title="Enregistrement refusé">
          {(registerServer.error as Error).message}
        </Alert>
      ) : null}
      {reconcile.isError || deprovision.isError ? (
        <Alert tone="error" title="Action refusée">
          {((reconcile.error ?? deprovision.error) as Error).message}
        </Alert>
      ) : null}

      <Tabs
        tabs={TABS.filter((t) => hasEdgePermission(permissions, t.permission)).map((t) => ({
          id: t.id,
          label: t.label,
        }))}
        value={tab}
        onChange={(id) => setTab(id as TabId)}
      />

      {tab === "servers" && (
        <EdgePermissionGate permission="platform:keycloak:read">
          {serversQ.isLoading ? (
            <EdgeLoadingState label="Chargement des serveurs..." />
          ) : serversQ.isError ? (
            <EdgeErrorState description={(serversQ.error as Error).message} />
          ) : (
            <div className="flex flex-col gap-[var(--space-4)]">
              <div className="flex items-center justify-between">
                <p className="type-sm text-[var(--text-muted)]">
                  {servers.items.length} serveur(s) enregistré(s) — les credentials restent
                  chiffrés côté serveur (Vault), jamais affichés.
                </p>
                {canManage ? (
                  <Button type="button" onClick={() => setRegisterOpen((o) => !o)}>
                    {registerOpen ? "Annuler" : "Enregistrer un serveur"}
                  </Button>
                ) : null}
              </div>

              {registerOpen && canManage ? (
                <Card>
                  <CardHeader title="Enregistrer un serveur Keycloak" />
                  <CardBody>
                    <form onSubmit={onRegister} className="grid gap-[var(--space-3)] md:grid-cols-2">
                      <input
                        className={fieldControlClass}
                        placeholder="Provider ID"
                        required
                        value={registerForm.providerId}
                        onChange={(e) =>
                          setRegisterForm((f) => ({ ...f, providerId: e.target.value }))
                        }
                        aria-label="Provider ID"
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="Code (ex. kc-prod-1)"
                        required
                        value={registerForm.code}
                        onChange={(e) => setRegisterForm((f) => ({ ...f, code: e.target.value }))}
                        aria-label="Code"
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="Nom"
                        required
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm((f) => ({ ...f, name: e.target.value }))}
                        aria-label="Nom"
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="https://keycloak.example.com"
                        required
                        value={registerForm.baseUrl}
                        onChange={(e) =>
                          setRegisterForm((f) => ({ ...f, baseUrl: e.target.value }))
                        }
                        aria-label="Base URL"
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="Admin realm (master)"
                        value={registerForm.adminRealm}
                        onChange={(e) =>
                          setRegisterForm((f) => ({ ...f, adminRealm: e.target.value }))
                        }
                        aria-label="Admin realm"
                      />
                      <input
                        className={fieldControlClass}
                        placeholder="Admin client ID"
                        required
                        value={registerForm.adminClientId}
                        onChange={(e) =>
                          setRegisterForm((f) => ({ ...f, adminClientId: e.target.value }))
                        }
                        aria-label="Admin client ID"
                      />
                      <input
                        className={fieldControlClass}
                        type="password"
                        placeholder="Credential (secret → Vault)"
                        value={registerForm.adminCredential}
                        onChange={(e) =>
                          setRegisterForm((f) => ({ ...f, adminCredential: e.target.value }))
                        }
                        aria-label="Credential"
                        autoComplete="new-password"
                      />
                      <div className="md:col-span-2">
                        <Button type="submit" disabled={registerServer.isPending}>
                          {registerServer.isPending ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                      </div>
                    </form>
                  </CardBody>
                </Card>
              ) : null}

              {servers.items.length === 0 ? (
                <EdgeEmptyState
                  title="Aucun serveur Keycloak"
                  description="Enregistrez une origin administrateur Keycloak autorisée (P7.2/P7.4)."
                />
              ) : (
                <div className="grid gap-[var(--space-4)] md:grid-cols-2">
                  {servers.items.map((server) => (
                    <Card key={server.id}>
                      <CardHeader
                        title={server.name}
                        action={<Badge tone="info">{server.environment}</Badge>}
                      />
                      <CardBody>
                        <div className="flex flex-col gap-[var(--space-2)] type-sm">
                          <span className="text-[var(--text-muted)]">{server.baseUrl}</span>
                          <div className="flex flex-wrap items-center gap-[var(--space-2)]">
                            <Badge tone={server.adminCredentialRef ? "success" : "warning"}>
                              {server.adminCredentialRef ? "Credential en Vault" : "Sans credential"}
                            </Badge>
                            <Badge tone="info">{server.tlsMode}</Badge>
                            {server.discoveredVersion ? (
                              <Badge tone="default">KC {server.discoveredVersion}</Badge>
                            ) : null}
                          </div>
                          <span className="text-[var(--text-muted)]">
                            Dernière connexion :{" "}
                            {server.lastConnectivityAt
                              ? new Date(server.lastConnectivityAt).toLocaleString("fr-FR")
                              : "jamais"}{" "}
                            ({server.lastConnectivityStatus ?? "—"})
                          </span>
                          {canCapabilities ? (
                            <div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={discover.isPending}
                                onClick={() => discover.mutate(server.id)}
                                data-testid="kc-discover"
                              >
                                Découvrir les capacités
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}

              {caps ? (
                <Card>
                  <CardHeader title="Capacités vérifiées" />
                  <CardBody>
                    <div className="flex flex-wrap items-center gap-[var(--space-2)] type-sm">
                      <Badge tone={caps.adminApiReachable ? "success" : "danger"}>
                        Admin API {caps.adminApiReachable ? "joignable" : "injoignable"}
                      </Badge>
                      <Badge tone={caps.organizationsSupported ? "success" : "warning"}>
                        Organizations {caps.organizationsSupported ? "supportées" : "absentes"}
                      </Badge>
                      <Badge tone="info">{caps.keycloakVersion ?? "version inconnue"}</Badge>
                      <span className="text-[var(--text-muted)]">
                        Vérifié le {new Date(caps.verifiedAt).toLocaleString("fr-FR")}
                      </span>
                    </div>
                  </CardBody>
                </Card>
              ) : null}
            </div>
          )}
        </EdgePermissionGate>
      )}

      {tab === "topologies" && (
        <EdgePermissionGate permission="platform:keycloak:read">
          {topologiesQ.isLoading ? (
            <EdgeLoadingState label="Chargement des topologies..." />
          ) : topologiesQ.isError ? (
            <EdgeErrorState description={(topologiesQ.error as Error).message} />
          ) : topologies.items.length === 0 ? (
            <EdgeEmptyState
              title="Aucune topologie Keycloak"
              description="Les topologies sont créées via les workflows de provisioning (P7.4)."
            />
          ) : (
            <div className="flex flex-col gap-[var(--space-4)]">
              <div className="flex flex-wrap items-center gap-[var(--space-3)]">
                <label htmlFor="kc-topology-select" className="type-sm">
                  Topologie
                </label>
                <Select
                  id="kc-topology-select"
                  value={selectedTopologyId}
                  onChange={(e) => setSelectedTopologyId(e.target.value)}
                  aria-label="Choisir une topologie"
                >
                  <option value="">Choisir une topologie</option>
                  {topologies.items.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tenantId} — {t.topologyType} — {t.status}
                    </option>
                  ))}
                </Select>
                {canReconcile && selectedTopologyId ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={reconcile.isPending}
                    onClick={() => reconcile.mutate(selectedTopologyId)}
                    data-testid="kc-reconcile"
                  >
                    Réconcilier
                  </Button>
                ) : null}
                {canDeprovision && selectedTopologyId ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={deprovision.isPending}
                    onClick={() => deprovision.mutate(selectedTopologyId)}
                    data-testid="kc-deprovision"
                  >
                    Déprovisionner
                  </Button>
                ) : null}
              </div>

              {!selectedTopologyId ? (
                <EdgeEmptyState
                  title="Sélectionnez une topologie"
                  description="L'état d'exécution, les artefacts realm/OIDC et l'evidence s'affichent ici."
                />
              ) : detailQ.isLoading ? (
                <EdgeLoadingState label="Chargement de la topologie..." />
              ) : detailQ.isError ? (
                <EdgeErrorState description={(detailQ.error as Error).message} />
              ) : detail ? (
                <KeycloakTopologyDetailPanel detail={detail} />
              ) : null}

              {canProvision ? (
                <p className="type-xs text-[var(--text-muted)]">
                  La création de topologie passe par le workflow P7.4 (validate_plan → execute) :
                  aucune mutation directe de Keycloak n'est possible depuis la console.
                </p>
              ) : null}
            </div>
          )}
        </EdgePermissionGate>
      )}

      {tab === "history" && (
        <EdgePermissionGate permission="platform:keycloak:history:read">
          <div className="flex flex-col gap-[var(--space-4)]">
            <Select
              value={historyTopologyId}
              onChange={(e) => setHistoryTopologyId(e.target.value)}
              aria-label="Choisir une topologie pour l'historique"
            >
              <option value="">Choisir une topologie</option>
              {topologies.items.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.tenantId} — {t.topologyType}
                </option>
              ))}
            </Select>
            {!historyTopologyId ? (
              <EdgeEmptyState
                title="Sélectionnez une topologie"
                description="L'historique complet des transitions de statut s'affiche ici (P7.1 audit trail)."
              />
            ) : historyQ.isLoading ? (
              <EdgeLoadingState label="Chargement de l'historique..." />
            ) : historyItems.length === 0 ? (
              <EdgeEmptyState title="Aucun événement" description="Aucune transition de statut enregistrée." />
            ) : (
              <ul
                className="flex flex-col gap-[var(--space-2)] type-sm"
                data-testid="kc-history"
              >
                {historyItems.map((event) => (
                  <li
                    key={event.id}
                    className="flex flex-wrap items-center gap-[var(--space-2)] border-l-2 border-[var(--border)] pl-[var(--space-3)]"
                  >
                    <Badge tone="info">{event.action}</Badge>
                    <span>
                      {event.fromStatus ?? "∅"} → {event.toStatus ?? "∅"}
                    </span>
                    <span className="text-[var(--text-muted)]">{event.actorId ?? "—"}</span>
                    <span className="text-[var(--text-muted)]">
                      {new Date(event.createdAt).toLocaleString("fr-FR")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </EdgePermissionGate>
      )}
    </div>
  );
}
