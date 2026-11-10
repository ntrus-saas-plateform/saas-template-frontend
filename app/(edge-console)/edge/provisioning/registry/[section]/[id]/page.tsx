"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import {
  RegistryInfoCard,
  RegistryRow,
  RegistryStatusBadge,
  RegistryTransitionForm,
  formatRegistryDate,
} from "@/components/edge/registry/shared";
import { edgeApi } from "@/lib/api/edge";
import {
  isRegistrySection,
  redactSecureConfigRef,
  registryErrMessage,
  unwrapEdgeData,
  type RegistrySection,
  type RegistryTransitionKind,
} from "@/lib/edge/registry";
import { hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type {
  CompatibilityEvaluation,
  DeploymentProfile,
  ProductControlContract,
  ProductPlatform,
  ProductRegistryRecord,
  ProductTechnicalVersion,
  RuntimeEnvironment,
} from "@/types/edge-registry";

const SECTION_META: Record<
  Exclude<RegistrySection, "history">,
  {
    title: string;
    read: string;
    manage?: string;
    certify?: string;
    transitionKind?: RegistryTransitionKind;
  }
> = {
  products: {
    title: "Product registry",
    read: "platform:product_registry:read",
    manage: "platform:product_registry:manage",
    certify: "platform:product_registry:certify",
    transitionKind: "product",
  },
  versions: {
    title: "Technical version",
    read: "platform:product_registry:read",
    manage: "platform:product_registry:manage",
    transitionKind: "version",
  },
  platforms: {
    title: "Platform",
    read: "platform:product_platforms:read",
    manage: "platform:product_platforms:manage",
    transitionKind: "platform",
  },
  environments: {
    title: "Runtime environment",
    read: "platform:runtime_environments:read",
    manage: "platform:runtime_environments:manage",
    transitionKind: "environment",
  },
  profiles: {
    title: "Deployment profile",
    read: "platform:deployment_profiles:read",
    manage: "platform:deployment_profiles:manage",
    transitionKind: "profile",
  },
  contracts: {
    title: "Control contract",
    read: "platform:product_control_contracts:read",
    manage: "platform:product_control_contracts:manage",
    certify: "platform:product_control_contracts:certify",
    transitionKind: "contract",
  },
  compatibility: {
    title: "Compatibility evaluation",
    read: "platform:registry_compatibility:evaluate",
  },
};

export default function RegistryDetailPage() {
  const params = useParams<{ section: string; id: string }>();
  const sectionRaw = params.section;
  const id = params.id;
  const queryClient = useQueryClient();
  const { permissions, isLoading: platformLoading } = useEdgePlatform();

  const sectionOk = isRegistrySection(sectionRaw) && sectionRaw !== "history";
  const section = sectionOk
    ? (sectionRaw as Exclude<RegistrySection, "history">)
    : null;
  const meta = section ? SECTION_META[section] : null;

  const canRead = meta
    ? hasEdgePermission(permissions, meta.read)
    : false;
  const canManage = meta?.manage
    ? hasEdgePermission(permissions, meta.manage)
    : false;

  const [toStatus, setToStatus] = useState("");
  const [reason, setReason] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: ["edge", "registry", section, id],
    queryFn: async () => {
      switch (section) {
        case "products":
          return edgeApi.getRegistryProduct(id);
        case "versions":
          return edgeApi.getRegistryVersion(id);
        case "platforms":
          return edgeApi.getRegistryPlatform(id);
        case "environments":
          return edgeApi.getRegistryEnvironment(id);
        case "profiles":
          return edgeApi.getRegistryDeploymentProfile(id);
        case "contracts":
          return edgeApi.getRegistryControlContract(id);
        case "compatibility":
          return edgeApi.getRegistryCompatibilityEvaluation(id);
        default:
          throw new Error("Unknown section");
      }
    },
    enabled: Boolean(section && canRead && id),
  });

  const record = useMemo(() => {
    return unwrapEdgeData<Record<string, unknown>>(detailQuery.data) ??
      (detailQuery.data as Record<string, unknown> | undefined);
  }, [detailQuery.data]);

  const currentStatus = useMemo(() => {
    if (!record || !section) return "";
    switch (section) {
      case "products":
        return String(record.registryStatus ?? "");
      case "versions":
        return String(record.versionStatus ?? "");
      case "platforms":
        return String(record.operationalStatus ?? "");
      case "environments":
        return String(record.environmentStatus ?? "");
      case "profiles":
        return String(record.profileStatus ?? "");
      case "contracts":
        return String(record.contractStatus ?? "");
      default:
        return String(record.result ?? "");
    }
  }, [record, section]);

  const transitionMutation = useMutation({
    mutationFn: async () => {
      const body = {
        toStatus,
        reason: reason.trim() || undefined,
      };
      switch (section) {
        case "products":
          return edgeApi.transitionRegistryProduct(id, body);
        case "versions":
          return edgeApi.transitionRegistryVersion(id, { toStatus });
        case "platforms":
          return edgeApi.transitionRegistryPlatform(id, body);
        case "environments":
          return edgeApi.transitionRegistryEnvironment(id, body);
        case "profiles":
          return edgeApi.transitionRegistryDeploymentProfile(id, body);
        case "contracts":
          return edgeApi.transitionRegistryControlContract(id, body);
        default:
          throw new Error("Transitions not supported");
      }
    },
    onSuccess: async () => {
      setToStatus("");
      setReason("");
      setActionError(null);
      await queryClient.invalidateQueries({
        queryKey: ["edge", "registry", section, id],
      });
      await queryClient.invalidateQueries({ queryKey: ["edge", "registry"] });
    },
    onError: (err) => setActionError(registryErrMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const name = editName.trim() || undefined;
      const description = editDescription.trim() || null;
      const expectedVersion =
        typeof record?.version === "number" ? record.version : undefined;
      switch (section) {
        case "products":
          return edgeApi.updateRegistryProduct(id, {
            name,
            description,
            expectedVersion,
          });
        case "platforms":
          return edgeApi.updateRegistryPlatform(id, {
            name,
            description,
            expectedVersion,
          });
        case "environments":
          return edgeApi.updateRegistryEnvironment(id, {
            name,
            expectedVersion,
          });
        case "profiles":
          return edgeApi.updateRegistryDeploymentProfile(id, {
            name,
            description,
          });
        case "contracts":
          return edgeApi.updateRegistryControlContract(id, {
            connectivityModel: editName.trim() || undefined,
            schemaVersion: editDescription.trim() || undefined,
          });
        default:
          throw new Error("Update not supported");
      }
    },
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({
        queryKey: ["edge", "registry", section, id],
      });
    },
    onError: (err) => setActionError(registryErrMessage(err)),
  });

  if (platformLoading) return <EdgeLoadingState />;
  if (!section || !meta) {
    return (
      <EdgeEmptyState
        title="Unknown registry section"
        description="Use the Registry Management tabs to open a valid resource."
      />
    );
  }
  if (!canRead) {
    return (
      <EdgeForbiddenState
        description={`Missing permission ${meta.read}`}
      />
    );
  }

  const onSeedEdit = () => {
    if (!record) return;
    if (section === "contracts") {
      setEditName(String(record.connectivityModel ?? ""));
      setEditDescription(String(record.schemaVersion ?? ""));
      return;
    }
    setEditName(String(record.name ?? ""));
    setEditDescription(
      record.description == null ? "" : String(record.description),
    );
  };

  const onUpdate = (e: FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <div className="space-y-[var(--space-6)] p-[var(--space-4)] md:p-[var(--space-6)]">
      <div className="flex flex-wrap items-center gap-[var(--space-3)]">
        <Link
          href="/edge/provisioning/registry"
          className="type-sm text-[var(--primary)] underline-offset-2 hover:underline"
        >
          ← Registry Management
        </Link>
      </div>

      {detailQuery.isLoading ? (
        <EdgeLoadingState />
      ) : detailQuery.isError ? (
        <EdgeErrorState
          description={registryErrMessage(detailQuery.error)}
          onRetry={() => void detailQuery.refetch()}
        />
      ) : !record ? (
        <EdgeEmptyState
          title="Not found"
          description="No registry resource matches this identifier."
        />
      ) : (
        <>
          <header className="space-y-[var(--space-2)]">
            <p className="type-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              {meta.title}
            </p>
            <h1 className="type-xl font-semibold text-[var(--text-primary)]">
              {String(
                record.name ??
                  record.code ??
                  record.contractCode ??
                  record.technicalVersion ??
                  record.result ??
                  id,
              )}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {currentStatus ? (
                <RegistryStatusBadge status={currentStatus} />
              ) : null}
              <span className="font-mono type-xs text-[var(--text-muted)]">
                {id}
              </span>
            </div>
          </header>

          {actionError ? (
            <p className="type-sm text-[var(--danger)]">{actionError}</p>
          ) : null}

          <section className="grid gap-[var(--space-4)] md:grid-cols-2">
            <DetailFields section={section} record={record} />
          </section>

          {canManage &&
          section !== "compatibility" &&
          section !== "versions" ? (
            <EdgePermissionGate permission={meta.manage!}>
              <section className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-4)]">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="type-md font-semibold">Update</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onSeedEdit}
                  >
                    Load current values
                  </Button>
                </div>
                <form
                  onSubmit={onUpdate}
                  className="grid gap-[var(--space-3)] md:grid-cols-2"
                >
                  <input
                    className={fieldControlClass}
                    placeholder={
                      section === "contracts" ? "Connectivity model" : "Name"
                    }
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  {section !== "environments" ? (
                    <input
                      className={fieldControlClass}
                      placeholder={
                        section === "contracts"
                          ? "Schema version"
                          : "Description"
                      }
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  ) : null}
                  <div className="md:col-span-2">
                    <Button
                      type="submit"
                      disabled={updateMutation.isPending || !editName.trim()}
                    >
                      {updateMutation.isPending ? "Saving…" : "Save changes"}
                    </Button>
                  </div>
                </form>
              </section>
            </EdgePermissionGate>
          ) : null}

          {canManage && meta.transitionKind ? (
            <EdgePermissionGate permission={meta.manage!}>
              <section className="space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--space-4)]">
                <h2 className="type-md font-semibold">Lifecycle transition</h2>
                <RegistryTransitionForm
                  kind={meta.transitionKind}
                  currentStatus={currentStatus}
                  toStatus={toStatus}
                  reason={reason}
                  busy={transitionMutation.isPending}
                  error={
                    transitionMutation.isError
                      ? registryErrMessage(transitionMutation.error)
                      : null
                  }
                  onToStatusChange={setToStatus}
                  onReasonChange={setReason}
                  onSubmit={() => transitionMutation.mutate()}
                />
              </section>
            </EdgePermissionGate>
          ) : null}
        </>
      )}
    </div>
  );
}

function DetailFields({
  section,
  record,
}: {
  section: Exclude<RegistrySection, "history">;
  record: Record<string, unknown>;
}) {
  if (section === "products") {
    const r = record as unknown as ProductRegistryRecord;
    return (
      <>
        <RegistryInfoCard title="Identity">
          <RegistryRow label="Code" value={r.code} />
          <RegistryRow label="Name" value={r.name} />
          <RegistryRow label="Product ID" value={r.productId} mono />
          <RegistryRow
            label="Vertical category"
            value={r.verticalCategory ?? "—"}
          />
          <RegistryRow label="Description" value={r.description ?? "—"} />
        </RegistryInfoCard>
        <RegistryInfoCard title="Lifecycle">
          <RegistryRow
            label="Registry status"
            value={<RegistryStatusBadge status={r.registryStatus} />}
          />
          <RegistryRow
            label="Certification"
            value={<RegistryStatusBadge status={r.certificationStatus} />}
          />
          <RegistryRow
            label="Provisionable"
            value={r.provisionable ? "Yes" : "No"}
          />
          <RegistryRow label="Version" value={String(r.version)} />
          <RegistryRow
            label="Updated"
            value={formatRegistryDate(r.updatedAt)}
          />
        </RegistryInfoCard>
      </>
    );
  }

  if (section === "versions") {
    const r = record as unknown as ProductTechnicalVersion;
    return (
      <>
        <RegistryInfoCard title="Version">
          <RegistryRow label="Technical version" value={r.technicalVersion} />
          <RegistryRow label="Release channel" value={r.releaseChannel} />
          <RegistryRow
            label="Product registry"
            value={r.productRegistryId}
            mono
          />
          <RegistryRow label="Change summary" value={r.changeSummary ?? "—"} />
        </RegistryInfoCard>
        <RegistryInfoCard title="Lifecycle">
          <RegistryRow
            label="Status"
            value={<RegistryStatusBadge status={r.versionStatus} />}
          />
          <RegistryRow
            label="Available from"
            value={formatRegistryDate(r.availableFrom)}
          />
          <RegistryRow
            label="Support ends"
            value={formatRegistryDate(r.supportEndsAt)}
          />
          <RegistryRow
            label="Immutable after publish"
            value={r.immutableAfterPublish ? "Yes" : "No"}
          />
        </RegistryInfoCard>
      </>
    );
  }

  if (section === "platforms") {
    const r = record as unknown as ProductPlatform;
    return (
      <>
        <RegistryInfoCard title="Platform">
          <RegistryRow label="Code" value={r.code} />
          <RegistryRow label="Name" value={r.name} />
          <RegistryRow label="Type" value={r.platformType} />
          <RegistryRow label="Description" value={r.description ?? "—"} />
          <RegistryRow
            label="Business backend"
            value={r.businessBackendId ?? "—"}
            mono
          />
          <RegistryRow
            label="Secure config ref"
            value={redactSecureConfigRef(r.secureConfigRef)}
          />
          <RegistryRow
            label="Connectivity reference"
            value={r.connectivityReference ?? "—"}
          />
        </RegistryInfoCard>
        <RegistryInfoCard title="Lifecycle">
          <RegistryRow
            label="Operational status"
            value={<RegistryStatusBadge status={r.operationalStatus} />}
          />
          <RegistryRow
            label="Certification"
            value={<RegistryStatusBadge status={r.certificationStatus} />}
          />
          <RegistryRow label="Version" value={String(r.version)} />
          <RegistryRow
            label="Updated"
            value={formatRegistryDate(r.updatedAt)}
          />
        </RegistryInfoCard>
      </>
    );
  }

  if (section === "environments") {
    const r = record as unknown as RuntimeEnvironment;
    return (
      <>
        <RegistryInfoCard title="Environment">
          <RegistryRow label="Code" value={r.code} />
          <RegistryRow label="Name" value={r.name} />
          <RegistryRow label="Type" value={r.environmentType} />
          <RegistryRow label="Platform" value={r.platformId} mono />
          <RegistryRow label="Region" value={r.region ?? "—"} />
          <RegistryRow label="Geo zone" value={r.geoZone ?? "—"} />
        </RegistryInfoCard>
        <RegistryInfoCard title="Lifecycle">
          <RegistryRow
            label="Status"
            value={<RegistryStatusBadge status={r.environmentStatus} />}
          />
          <RegistryRow
            label="Security classification"
            value={r.securityClassification ?? "—"}
          />
          <RegistryRow
            label="Data classification"
            value={r.dataClassification ?? "—"}
          />
          <RegistryRow label="Version" value={String(r.version)} />
        </RegistryInfoCard>
      </>
    );
  }

  if (section === "profiles") {
    const r = record as unknown as DeploymentProfile;
    return (
      <>
        <RegistryInfoCard title="Profile">
          <RegistryRow label="Code" value={r.code} />
          <RegistryRow label="Name" value={r.name} />
          <RegistryRow label="Description" value={r.description ?? "—"} />
          <RegistryRow label="Isolation" value={r.isolationModel} />
          <RegistryRow label="Connectivity" value={r.connectivityModel} />
        </RegistryInfoCard>
        <RegistryInfoCard title="Lifecycle">
          <RegistryRow
            label="Status"
            value={<RegistryStatusBadge status={r.profileStatus} />}
          />
          <RegistryRow
            label="Certification"
            value={<RegistryStatusBadge status={r.certificationStatus} />}
          />
          <RegistryRow
            label="Profile version"
            value={String(r.profileVersion)}
          />
        </RegistryInfoCard>
      </>
    );
  }

  if (section === "contracts") {
    const r = record as unknown as ProductControlContract;
    return (
      <>
        <RegistryInfoCard title="Contract">
          <RegistryRow label="Code" value={r.contractCode} />
          <RegistryRow label="Version" value={r.contractVersion} />
          <RegistryRow label="Schema version" value={r.schemaVersion} />
          <RegistryRow label="Product" value={r.productId} mono />
          <RegistryRow label="Platform" value={r.platformId} mono />
          <RegistryRow label="Connectivity" value={r.connectivityModel} />
        </RegistryInfoCard>
        <RegistryInfoCard title="Lifecycle">
          <RegistryRow
            label="Status"
            value={<RegistryStatusBadge status={r.contractStatus} />}
          />
          <RegistryRow label="Immutable" value={r.immutable ? "Yes" : "No"} />
          <RegistryRow
            label="Backward compatible"
            value={r.backwardCompatible ? "Yes" : "No"}
          />
          <RegistryRow
            label="Forward compatible"
            value={r.forwardCompatible ? "Yes" : "No"}
          />
        </RegistryInfoCard>
      </>
    );
  }

  const r = record as unknown as CompatibilityEvaluation;
  return (
    <>
      <RegistryInfoCard title="Evaluation">
        <RegistryRow
          label="Result"
          value={<RegistryStatusBadge status={r.result} />}
        />
        <RegistryRow label="Correlation" value={r.correlationId} mono />
        <RegistryRow
          label="Evaluated at"
          value={formatRegistryDate(r.evaluatedAt)}
        />
        <RegistryRow label="Evaluated by" value={r.evaluatedBy ?? "—"} mono />
      </RegistryInfoCard>
      <RegistryInfoCard title="Refs & reasons">
        <RegistryRow
          label="Product registry"
          value={r.productRegistryId ?? "—"}
          mono
        />
        <RegistryRow
          label="Technical version"
          value={r.technicalVersionId ?? "—"}
          mono
        />
        <RegistryRow label="Platform" value={r.platformId ?? "—"} mono />
        <RegistryRow
          label="Environment"
          value={r.environmentId ?? "—"}
          mono
        />
        <RegistryRow label="Profile" value={r.profileId ?? "—"} mono />
        <RegistryRow label="Contract" value={r.contractId ?? "—"} mono />
        <RegistryRow
          label="Rules applied"
          value={(r.rulesApplied ?? []).join(", ") || "—"}
        />
        <RegistryRow
          label="Reasons"
          value={(r.reasons ?? []).join("; ") || "—"}
        />
      </RegistryInfoCard>
    </>
  );
}
