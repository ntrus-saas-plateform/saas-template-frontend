"use client";

/**
 * P7.14 — Edge Admin Console: Connectivity Agent Registry.
 *
 * Register / command / revoke via P7.4. outbound_only always.
 * Vault public_key_ref only. Nonce anti-replay. Never invent ACTIVE/REVOKED.
 */
import { Suspense, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { fieldControlClass } from "@/components/ui/field-control";
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
import { hasEdgePermission } from "@/lib/edge/permissions";
import { unwrapInfraList } from "@/lib/edge/infrastructure";
import { edgeApi } from "@/lib/api/edge";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type {
  AgentCommand,
  AgentEvidence,
  ConnectivityAgent,
} from "@/types/edge-connectivity-agent";

type TabId = "agents" | "commands" | "history";

const TABS: { id: TabId; label: string; permission: string }[] = [
  { id: "agents", label: "Agents", permission: "platform:agents:read" },
  { id: "commands", label: "Commands", permission: "platform:agents:read" },
  {
    id: "history",
    label: "History",
    permission: "platform:agents:history:read",
  },
];

const AGENTS_SECTION_IDS = TABS.map((t) => t.id) as TabId[];

const AGENTS_STUDIO_GROUPS: { title: string; itemIds: TabId[] }[] = [
  { title: "Registry", itemIds: ["agents"] },
  { title: "Actions", itemIds: ["commands"] },
  { title: "Governance", itemIds: ["history"] },
];

function statusTone(
  status: string | undefined,
): "default" | "success" | "warning" | "danger" | "info" {
  if (!status) return "default";
  const s = status.toUpperCase();
  if (s === "ACTIVE" || s === "SUCCEEDED" || s === "ACKED") return "success";
  if (s === "FAILED" || s === "REVOKED" || s === "EXPIRED") return "danger";
  if (s === "PENDING" || s === "REGISTERING" || s === "REVOKING" || s === "DEGRADED") {
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

function randomNonce(): string {
  const bytes = new Uint8Array(32);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function EdgeAgentsModule() {
  return (
    <Suspense fallback={<EdgeLoadingState label="Loading agents studio…" />}>
      <EdgeAgentsStudio />
    </Suspense>
  );
}

function EdgeAgentsStudio() {
  const { permissions } = useEdgePlatform();
  const qc = useQueryClient();
  const [tab, setTab] = useStudioSectionParam<TabId>("agents", AGENTS_SECTION_IDS);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    agentCode: "",
    displayName: "",
    publicKeyRef: "vault:agents/pubkey/",
  });
  const [commandType, setCommandType] = useState("HEALTH_CHECK");

  const canRead = hasEdgePermission(permissions, "platform:agents:read");
  const canManage = hasEdgePermission(permissions, "platform:agents:manage");
  const canCommand = hasEdgePermission(permissions, "platform:agents:command");
  const canRevoke = hasEdgePermission(permissions, "platform:agents:revoke");
  const canHistory = hasEdgePermission(permissions, "platform:agents:history:read");

  const agentsQ = useQuery({
    queryKey: ["agents", "list"],
    queryFn: () => edgeApi.listConnectivityAgents({ limit: 50 }),
    enabled: canRead,
  });

  const detailQ = useQuery({
    queryKey: ["agents", "detail", selectedAgentId],
    queryFn: () => edgeApi.getConnectivityAgent(selectedAgentId),
    enabled: canRead && Boolean(selectedAgentId),
  });

  const evidenceQ = useQuery({
    queryKey: ["agents", "evidence", selectedAgentId],
    queryFn: () => edgeApi.listConnectivityAgentEvidence(selectedAgentId, { limit: 50 }),
    enabled: canHistory && Boolean(selectedAgentId) && tab === "history",
  });

  const globalHistoryQ = useQuery({
    queryKey: ["agents", "agent-history"],
    queryFn: () => edgeApi.listConnectivityAgentHistory({ limit: 50 }),
    enabled: canHistory && tab === "history",
  });

  const agents = useMemo(
    () => unwrapInfraList<ConnectivityAgent>(agentsQ.data?.data),
    [agentsQ.data],
  );
  const detail = detailQ.data?.data ?? null;
  const evidence = useMemo(() => {
    const raw = evidenceQ.data?.data;
    if (Array.isArray(raw)) return raw as AgentEvidence[];
    return unwrapInfraList<AgentEvidence>(raw).items;
  }, [evidenceQ.data]);
  const globalHistory = useMemo(() => {
    const raw = globalHistoryQ.data?.data ?? globalHistoryQ.data;
    if (Array.isArray(raw)) return raw as Array<Record<string, unknown>>;
    if (raw && typeof raw === "object" && Array.isArray((raw as { items?: unknown }).items)) {
      return (raw as { items: Array<Record<string, unknown>> }).items;
    }
    return [] as Array<Record<string, unknown>>;
  }, [globalHistoryQ.data]);

  const createM = useMutation({
    mutationFn: () =>
      edgeApi.createConnectivityAgent({
        agentCode: form.agentCode,
        displayName: form.displayName,
        publicKeyRef: form.publicKeyRef,
        outboundOnly: true,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["agents"] });
      setFormOpen(false);
    },
  });

  const registerM = useMutation({
    mutationFn: (id: string) => edgeApi.registerConnectivityAgent(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["agents"] }),
  });

  const commandM = useMutation({
    mutationFn: (id: string) =>
      edgeApi.commandConnectivityAgent(id, {
        commandType,
        nonce: randomNonce(),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["agents"] }),
  });

  const revokeM = useMutation({
    mutationFn: (id: string) =>
      edgeApi.revokeConnectivityAgent(id, { reason: "Operator revoke" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["agents"] }),
  });

  const studioGroups: StudioSectionGroup[] = useMemo(() => {
    return AGENTS_STUDIO_GROUPS.map((g) => ({
      title: g.title,
      items: g.itemIds
        .filter((id) => {
          const t = TABS.find((x) => x.id === id);
          return t ? hasEdgePermission(permissions, t.permission) : false;
        })
        .map((id) => {
          const t = TABS.find((x) => x.id === id)!;
          return { id: t.id, label: t.label };
        }),
    })).filter((g) => g.items.length > 0);
  }, [permissions]);

  if (!canRead && !agentsQ.isLoading) {
    return <EdgeForbiddenState />;
  }

  if (agentsQ.isLoading) return <EdgeLoadingState />;
  if (agentsQ.isError) {
    return (
      <EdgeErrorState description="Impossible de charger le registre agents." />
    );
  }

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    createM.mutate();
  };

  return (
    <EdgeStudioShell
      title="Agents studio"
      description="Agents outbound-only. Clés vault uniquement. Commandes avec nonce anti-replay. Mutations via P7.4."
      groups={studioGroups}
      section={tab}
      onSectionChange={(id) => setTab(id as TabId)}
      testId="agents-module"
      actions={
        <Alert tone="info">
          Fail-closed revoke — commandes actives → REVOKED.
        </Alert>
      }
    >
      {tab === "agents" && (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <Card>
            <CardHeader
              title="Registre"
              action={
                <EdgePermissionGate permission="platform:agents:manage">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setFormOpen((v) => !v)}
                    data-testid="agents-create-toggle"
                  >
                    Nouveau
                  </Button>
                </EdgePermissionGate>
              }
            />
            <CardBody className="space-y-2">
              {formOpen && (
                <form className="space-y-2 border-b pb-3" onSubmit={onCreate}>
                  <input
                    className={fieldControlClass}
                    placeholder="agent_code"
                    value={form.agentCode}
                    onChange={(e) => setForm((f) => ({ ...f, agentCode: e.target.value }))}
                    required
                    data-testid="agents-form-code"
                  />
                  <input
                    className={fieldControlClass}
                    placeholder="display name"
                    value={form.displayName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, displayName: e.target.value }))
                    }
                    required
                  />
                  <input
                    className={fieldControlClass}
                    placeholder="vault:agents/pubkey/…"
                    value={form.publicKeyRef}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, publicKeyRef: e.target.value }))
                    }
                    required
                    data-testid="agents-form-pubkey"
                  />
                  <p className="type-xs text-[var(--text-muted)]">
                    outbound_only=true (forcé). Pas de clé en clair.
                  </p>
                  <Button type="submit" size="sm" disabled={createM.isPending}>
                    Créer (PENDING)
                  </Button>
                </form>
              )}
              {agents.items.length === 0 ? (
                <EdgeEmptyState title="Aucun agent" description="Créez un agent outbound-only." />
              ) : (
                <ul className="space-y-1" aria-label="Liste des agents">
                  {agents.items.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-[var(--surface-muted)]"
                        aria-label={`Choisir l'agent ${a.agentCode}`}
                        onClick={() => setSelectedAgentId(a.id)}
                        data-testid={`agents-pick-${a.id}`}
                      >
                        <span className="truncate type-sm">{a.agentCode}</span>
                        <Badge tone={statusTone(a.agentStatus)}>{a.agentStatus}</Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Détail" />
            <CardBody>
              {!selectedAgentId ? (
                <EdgeEmptyState
                  title="Sélectionnez un agent"
                  description="Statut API uniquement — jamais inventé."
                />
              ) : detailQ.isLoading ? (
                <EdgeLoadingState />
              ) : !detail?.agent ? (
                <EdgeEmptyState
                  title="Agent introuvable"
                  description="L’agent demandé n’existe pas ou n’est plus accessible."
                />
              ) : (
                <div className="space-y-3" data-testid="agents-detail">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="type-lg font-semibold">{detail.agent.displayName}</h2>
                    <span data-testid="agents-status">
                      <Badge tone={statusTone(detail.agent.agentStatus)}>
                        {detail.agent.agentStatus}
                      </Badge>
                    </span>
                    {detail.agent.outboundOnly ? (
                      <span data-testid="agents-outbound">
                        <Badge tone="info">outbound_only</Badge>
                      </span>
                    ) : null}
                  </div>
                  <dl className="grid gap-1 type-sm text-[var(--text-muted)]">
                    <div>
                      <dt className="inline font-medium text-[var(--text)]">Code · </dt>
                      <dd className="inline">{detail.agent.agentCode}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium text-[var(--text)]">
                        public_key_ref ·{" "}
                      </dt>
                      <dd className="inline font-mono">{detail.agent.publicKeyRef}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium text-[var(--text)]">Last seen · </dt>
                      <dd className="inline">{formatWhen(detail.agent.lastSeenAt)}</dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap gap-2">
                    {canManage && (
                      <Button
                        size="sm"
                        data-testid="agents-register"
                        onClick={() => registerM.mutate(detail.agent.id)}
                        disabled={registerM.isPending}
                      >
                        Register (P7.4)
                      </Button>
                    )}
                    {canCommand && (
                      <>
                        <input
                          className={fieldControlClass + " max-w-[160px]"}
                          value={commandType}
                          onChange={(e) => setCommandType(e.target.value)}
                          aria-label="Type de commande"
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          data-testid="agents-command"
                          onClick={() => commandM.mutate(detail.agent.id)}
                          disabled={commandM.isPending}
                        >
                          Command + nonce
                        </Button>
                      </>
                    )}
                    {canRevoke && (
                      <Button
                        size="sm"
                        variant="danger"
                        data-testid="agents-revoke"
                        onClick={() => revokeM.mutate(detail.agent.id)}
                        disabled={revokeM.isPending}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                  {(detail.commands?.length ?? 0) > 0 && (
                    <div className="space-y-1">
                      <h3 className="type-sm font-medium">Commandes récentes</h3>
                      <ul className="space-y-1">
                        {(detail.commands as AgentCommand[]).slice(0, 8).map((c) => (
                          <li
                            key={c.id}
                            className="flex items-center justify-between type-sm"
                          >
                            <span>
                              {c.commandType} · {c.nonce.slice(0, 8)}…
                            </span>
                            <Badge tone={statusTone(c.commandStatus)}>
                              {c.commandStatus}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {tab === "commands" && (
        <Card>
          <CardHeader title="Commandes (agent sélectionné)" />
          <CardBody>
            {!selectedAgentId ? (
              <EdgeEmptyState
                title="Sélectionnez un agent"
                description="Ouvrez l’onglet Agents puis choisissez une entrée."
              />
            ) : !detail?.commands?.length ? (
              <EdgeEmptyState
                title="Aucune commande"
                description="Aucune commande pour cet agent."
              />
            ) : (
              <ul className="space-y-2" data-testid="agents-commands-list">
                {detail.commands.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b py-2"
                  >
                    <div className="type-sm">
                      <div className="font-medium">{c.commandType}</div>
                      <div className="text-[var(--text-muted)] font-mono type-xs">
                        nonce={c.nonce.slice(0, 16)}…
                      </div>
                    </div>
                    <Badge tone={statusTone(c.commandStatus)}>{c.commandStatus}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}

      {tab === "history" && canHistory && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Agent history (global)" />
            <CardBody>
              <p className="type-xs text-[var(--text-muted)] mb-2">
                GET /agent-history — pas un filtre client de l’evidence agent.
              </p>
              {globalHistoryQ.isLoading ? (
                <EdgeLoadingState />
              ) : globalHistory.length === 0 ? (
                <EdgeEmptyState
                  title="Aucun événement d’historique"
                  description="La liste globale est vide."
                />
              ) : (
                <ul className="space-y-2" data-testid="agents-global-history-list">
                  {globalHistory.map((row, i) => {
                    const id = String(row.id ?? i);
                    return (
                      <li key={id} className="type-sm border-b py-2">
                        <div className="font-medium">
                          {String(row.operation ?? row.eventType ?? row.kind ?? id)}
                          {row.outcome ? ` · ${String(row.outcome)}` : ""}
                        </div>
                        <div className="text-[var(--text-muted)]">
                          {formatWhen(
                            (row.createdAt as string | undefined) ??
                              (row.occurredAt as string | undefined),
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Evidence (agent sélectionné)" />
            <CardBody>
              {!selectedAgentId ? (
                <EdgeEmptyState
                  title="Sélectionnez un agent"
                  description="Choisissez un agent pour afficher l’evidence."
                />
              ) : evidenceQ.isLoading ? (
                <EdgeLoadingState />
              ) : evidence.length === 0 ? (
                <EdgeEmptyState
                  title="Aucune evidence"
                  description="Pas encore d’evidence workflow pour cet agent."
                />
              ) : (
                <ul className="space-y-2" data-testid="agents-evidence-list">
                  {evidence.map((ev) => (
                    <li key={ev.id} className="type-sm border-b py-2">
                      <div className="font-medium">
                        {ev.operation} · {ev.outcome}
                      </div>
                      <div className="text-[var(--text-muted)]">
                        {formatWhen(ev.createdAt)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </EdgeStudioShell>
  );
}
