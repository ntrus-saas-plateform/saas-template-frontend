"use client";

/**
 * P7.15 — Edge Admin Console: Production Certification & Evidence Pack.
 *
 * Assemble / certify / revoke via P7.4. Cannot CERTIFY if required evidence
 * MISSING/FAILED. Revoke clears CERTIFIED. p714_agents optional for Shared SaaS.
 */
import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  CertificationEvidenceItem,
  CertificationPackage,
} from "@/types/edge-certification";

type TabId = "packages" | "evidence";

const TABS: { id: TabId; label: string; permission: string }[] = [
  { id: "packages", label: "Packages", permission: "platform:certification:read" },
  {
    id: "evidence",
    label: "Evidence viewer",
    permission: "platform:certification:history:read",
  },
];

function statusTone(
  status: string | undefined,
): "default" | "success" | "warning" | "danger" | "info" {
  if (!status) return "default";
  const s = status.toUpperCase();
  if (s === "CERTIFIED" || s === "VERIFIED" || s === "ATTACHED" || s === "READY") {
    return "success";
  }
  if (s === "FAILED" || s === "REVOKED" || s === "MISSING") {
    return "danger";
  }
  if (s === "ASSEMBLING" || s === "DRAFT" || s === "WAIVED" || s === "PARTIAL") {
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

export type EdgeCertificationModuleProps = {
  /** When true, opens on the evidence viewer tab (cross-cutting Evidence page). */
  initialTab?: TabId;
};

export function EdgeCertificationModule({
  initialTab = "packages",
}: EdgeCertificationModuleProps) {
  const { permissions } = useEdgePlatform();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabId>(initialTab);
  const [selectedId, setSelectedId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ code: "", name: "" });
  const [attachKey, setAttachKey] = useState("p713_reconciliation");
  const [attachRef, setAttachRef] = useState("docs/edge/p7/p7.13");

  const canRead = hasEdgePermission(permissions, "platform:certification:read");
  const canManage = hasEdgePermission(permissions, "platform:certification:manage");
  const canCertify = hasEdgePermission(permissions, "platform:certification:certify");
  const canRevoke = hasEdgePermission(permissions, "platform:certification:revoke");
  const canHistory = hasEdgePermission(
    permissions,
    "platform:certification:history:read",
  );

  const packagesQ = useQuery({
    queryKey: ["cert", "packages"],
    queryFn: () => edgeApi.listCertificationPackages({ limit: 50 }),
    enabled: canRead,
  });

  const detailQ = useQuery({
    queryKey: ["cert", "package", selectedId],
    queryFn: () => edgeApi.getCertificationPackage(selectedId),
    enabled: canRead && Boolean(selectedId),
  });

  const globalHistoryQ = useQuery({
    queryKey: ["cert", "history-global"],
    queryFn: () => edgeApi.listCertificationHistory({ limit: 50 }),
    enabled: canHistory && tab === "evidence",
  });

  const packages = useMemo(
    () => unwrapInfraList<CertificationPackage>(packagesQ.data?.data),
    [packagesQ.data],
  );
  const detail = detailQ.data?.data ?? null;
  const evidenceItems: CertificationEvidenceItem[] = detail?.evidenceItems ?? [];
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
      edgeApi.createCertificationPackage({
        code: form.code,
        name: form.name,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["cert", "packages"] });
      setFormOpen(false);
    },
  });

  const assembleM = useMutation({
    mutationFn: (id: string) => edgeApi.assembleCertificationPackage(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["cert"] });
    },
  });

  const certifyM = useMutation({
    mutationFn: (id: string) => edgeApi.certifyCertificationPackage(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["cert"] });
    },
  });

  const revokeM = useMutation({
    mutationFn: (id: string) =>
      edgeApi.revokeCertificationPackage(id, { reason: "Revoked from console" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["cert"] });
    },
  });

  const attachM = useMutation({
    mutationFn: (id: string) =>
      edgeApi.attachCertificationEvidence(id, {
        evidenceKey: attachKey,
        itemStatus: "VERIFIED",
        sourceRef: attachRef,
        required: attachKey !== "p714_agents",
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["cert"] });
    },
  });

  if (!hasAnyEdgePermission(permissions, ["platform:certification:read"])) {
    return <EdgeForbiddenState />;
  }

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    createM.mutate();
  };

  return (
    <div className="space-y-4" data-testid="cert-module">
      <Tabs
        tabs={TABS.filter((t) => hasEdgePermission(permissions, t.permission)).map(
          (t) => ({ id: t.id, label: t.label }),
        )}
        value={tab}
        onChange={(id) => setTab(id as TabId)}
      />

      {tab === "packages" ? (
        <EdgePermissionGate permission="platform:certification:read">
          {packagesQ.isLoading ? (
            <EdgeLoadingState label="Chargement des packages de certification..." />
          ) : packagesQ.isError ? (
            <EdgeErrorState
              title="Impossible de charger les packages"
              description="Vérifiez les permissions platform:certification:read."
            />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="type-sm text-[var(--text-muted)]">
                  {packages.total} packages — fail-closed si evidence requise MISSING/FAILED
                </p>
                {canManage ? (
                  <Button
                    type="button"
                    size="sm"
                    data-testid="cert-create-package"
                    onClick={() => setFormOpen((o) => !o)}
                  >
                    Nouveau package
                  </Button>
                ) : null}
              </div>

              {formOpen ? (
                <Card>
                  <CardHeader title="Créer un package" />
                  <CardBody>
                    <form className="grid gap-3 md:grid-cols-2" onSubmit={onCreate}>
                      <label className="space-y-1">
                        <span className="type-xs text-[var(--text-muted)]">Code</span>
                        <input
                          className={fieldControlClass}
                          value={form.code}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, code: e.target.value }))
                          }
                          required
                          data-testid="cert-form-code"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="type-xs text-[var(--text-muted)]">Nom</span>
                        <input
                          className={fieldControlClass}
                          value={form.name}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, name: e.target.value }))
                          }
                          required
                        />
                      </label>
                      <div className="md:col-span-2">
                        <Button type="submit" size="sm" disabled={createM.isPending}>
                          Créer
                        </Button>
                      </div>
                    </form>
                  </CardBody>
                </Card>
              ) : null}

              {packages.items.length === 0 ? (
                <EdgeEmptyState
                  title="Aucun package de certification"
                  description="Créez un package pour assembler le evidence pack P7.15."
                />
              ) : (
                <Select
                  aria-label="Choisir un package de certification"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  data-testid="cert-package-select"
                >
                  <option value="">Sélectionner…</option>
                  {packages.items.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.packageStatus}
                    </option>
                  ))}
                </Select>
              )}

              {selectedId && detailQ.isLoading ? (
                <EdgeLoadingState label="Chargement du détail..." />
              ) : null}

              {detail ? (
                <div data-testid="cert-package-detail">
                <Card>
                  <CardHeader
                    title={detail.package.name}
                    action={
                      <Badge tone={statusTone(detail.package.packageStatus)}>
                        <span data-testid="cert-package-status">
                          {detail.package.packageStatus}
                        </span>
                      </Badge>
                    }
                  />
                  <CardBody className="space-y-3">
                    <p className="type-sm text-[var(--text-muted)]">
                      code={detail.package.code} · certifiedAt=
                      {formatWhen(detail.package.certifiedAt)} · revokedAt=
                      {formatWhen(detail.package.revokedAt)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {canManage ? (
                        <Button
                          type="button"
                          size="sm"
                          data-testid="cert-assemble"
                          onClick={() => assembleM.mutate(detail.package.id)}
                          disabled={assembleM.isPending}
                        >
                          Assemble
                        </Button>
                      ) : null}
                      {canCertify ? (
                        <Button
                          type="button"
                          size="sm"
                          data-testid="cert-certify"
                          onClick={() => certifyM.mutate(detail.package.id)}
                          disabled={certifyM.isPending}
                        >
                          Certify
                        </Button>
                      ) : null}
                      {canRevoke ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          data-testid="cert-revoke"
                          onClick={() => revokeM.mutate(detail.package.id)}
                          disabled={revokeM.isPending}
                        >
                          Revoke
                        </Button>
                      ) : null}
                      <Link
                        href="/edge/provisioning/evidence"
                        className="type-sm underline"
                        data-testid="cert-evidence-link"
                      >
                        Evidence viewer
                      </Link>
                    </div>

                    {canManage ? (
                      <div className="flex flex-wrap items-end gap-2">
                        <label className="space-y-1">
                          <span className="type-xs text-[var(--text-muted)]">
                            Evidence key
                          </span>
                          <input
                            className={fieldControlClass}
                            value={attachKey}
                            onChange={(e) => setAttachKey(e.target.value)}
                            data-testid="cert-attach-key"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="type-xs text-[var(--text-muted)]">
                            Source ref
                          </span>
                          <input
                            className={fieldControlClass}
                            value={attachRef}
                            onChange={(e) => setAttachRef(e.target.value)}
                          />
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          data-testid="cert-attach"
                          onClick={() => attachM.mutate(detail.package.id)}
                          disabled={attachM.isPending}
                        >
                          Attach / verify
                        </Button>
                      </div>
                    ) : null}

                    <div className="space-y-2" data-testid="cert-evidence-items">
                      <h3 className="type-sm font-medium">Evidence items</h3>
                      {evidenceItems.length === 0 ? (
                        <p className="type-sm text-[var(--text-muted)]">
                          Aucun item — lancer Assemble pour seeder le manifeste.
                        </p>
                      ) : (
                        <ul className="space-y-1">
                          {evidenceItems.map((item) => (
                            <li
                              key={item.id}
                              className="flex flex-wrap items-center gap-2 type-sm"
                              data-testid={`cert-item-${item.evidenceKey}`}
                            >
                              <span>{item.phaseCode}</span>
                              <code>{item.evidenceKey}</code>
                              <Badge tone={statusTone(String(item.itemStatus))}>
                                {item.itemStatus}
                              </Badge>
                              {item.required ? (
                                <span className="text-[var(--text-muted)]">required</span>
                              ) : (
                                <span className="text-[var(--text-muted)]">optional</span>
                              )}
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

      {tab === "evidence" ? (
        <EdgePermissionGate permission="platform:certification:history:read">
          {!canHistory ? (
            <EdgeForbiddenState />
          ) : packagesQ.isLoading ? (
            <EdgeLoadingState label="Chargement evidence..." />
          ) : (
            <div className="space-y-4" data-testid="cert-evidence-viewer">
              <div className="space-y-2" data-testid="cert-global-history">
                <h3 className="type-sm font-medium">Certification history</h3>
                <p className="type-xs text-[var(--text-muted)]">
                  GET /certification/history
                </p>
                {globalHistoryQ.isLoading ? (
                  <EdgeLoadingState label="Chargement historique..." />
                ) : globalHistory.length === 0 ? (
                  <EdgeEmptyState
                    title="Aucun historique"
                    description="Pas d’evidence transversale pour le moment."
                  />
                ) : (
                  <ul className="space-y-2">
                    {globalHistory.map((row, i) => {
                      const id = String(row.id ?? i);
                      return (
                        <li
                          key={id}
                          className="rounded border border-[var(--border)] p-2 type-sm"
                        >
                          <span className="font-medium">
                            {String(row.evidenceKey ?? row.operation ?? id)}
                          </span>
                          {row.outcome ? (
                            <>
                              {" "}
                              <Badge tone={statusTone(String(row.outcome))}>
                                {String(row.outcome)}
                              </Badge>
                            </>
                          ) : null}
                          <span className="text-[var(--text-muted)]">
                            {" "}
                            ·{" "}
                            {formatWhen(
                              (row.createdAt as string | undefined) ??
                                (row.recordedAt as string | undefined),
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <p className="type-sm text-[var(--text-muted)]">
                Vue transversale des packages de certification et liens vers le détail.
              </p>
              {packages.items.length === 0 ? (
                <EdgeEmptyState
                  title="Aucune evidence de certification"
                  description="Attachez ou vérifiez les evidence items requis avant certify."
                />
              ) : (
                <ul className="space-y-2">
                  {packages.items.map((p) => (
                    <li key={p.id}>
                      <Card>
                        <CardBody className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="type-sm font-medium">{p.name}</p>
                            <p className="type-xs text-[var(--text-muted)]">
                              {p.code} · certifiedAt={formatWhen(p.certifiedAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge tone={statusTone(p.packageStatus)}>
                              {p.packageStatus}
                            </Badge>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setSelectedId(p.id);
                                setTab("packages");
                              }}
                            >
                              Ouvrir
                            </Button>
                            <Link
                              href="/edge/provisioning/certification"
                              className="type-sm underline"
                            >
                              Certification
                            </Link>
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
      ) : null}
    </div>
  );
}
