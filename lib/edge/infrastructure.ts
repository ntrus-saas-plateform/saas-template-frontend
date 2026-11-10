import type {
  DatabaseResourceRecord,
  InfrastructureProviderRecord,
  InfrastructureResourceRecord,
  ResourceBackupRecord,
  ResourcePlanRecord,
} from "@/types/edge-infrastructure";

export const RESOURCE_STATUS_OPTIONS = [
  "PLANNED",
  "VALIDATING",
  "RESERVED",
  "PROVISIONING",
  "CONFIGURING",
  "VERIFYING",
  "READY",
  "DEGRADED",
  "FAILED",
  "UNKNOWN",
  "RECONCILIATION_REQUIRED",
  "DEPROVISIONING",
  "DEPROVISIONED",
  "QUARANTINED",
] as const;

export const PLAN_STATUS_OPTIONS = [
  "DRAFT",
  "VALIDATING",
  "VALIDATED",
  "REJECTED",
  "COMMITTED",
  "SUPERSEDED",
  "CANCELLED",
] as const;

export const DATABASE_ENGINE_OPTIONS = [
  "POSTGRESQL",
  "MONGODB",
  "SURREALDB",
] as const;

export function infrastructureErrMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unexpected infrastructure error";
}

export function unwrapInfraList<T>(payload: unknown): { items: T[]; total: number } {
  if (Array.isArray(payload)) {
    return { items: payload as T[], total: payload.length };
  }
  if (payload && typeof payload === "object") {
    const obj = payload as { items?: T[]; data?: T[]; total?: number };
    const items = obj.items ?? obj.data ?? [];
    return { items, total: obj.total ?? items.length };
  }
  return { items: [], total: 0 };
}

export function redactSecretRef(ref: string | null | undefined): string {
  if (!ref) return "—";
  if (ref.length <= 12) return `${ref.slice(0, 4)}…`;
  return `${ref.slice(0, 8)}…${ref.slice(-4)}`;
}

export function infraStatusTone(
  status: string,
): "neutral" | "success" | "warning" | "danger" {
  if (["READY", "VALIDATED", "COMMITTED", "VERIFIED", "SUCCEEDED"].includes(status)) {
    return "success";
  }
  if (
    ["FAILED", "REJECTED", "QUARANTINED", "CORRUPT", "DEPROVISIONED"].includes(status)
  ) {
    return "danger";
  }
  if (
    [
      "DEGRADED",
      "RECONCILIATION_REQUIRED",
      "UNKNOWN",
      "PROVISIONING",
      "VERIFYING",
      "VALIDATING",
    ].includes(status)
  ) {
    return "warning";
  }
  return "neutral";
}

export type InfraOverviewCounts = {
  providers: number;
  plans: number;
  resources: number;
  databases: number;
  readyDatabases: number;
  drift: number;
  failed: number;
};

export function emptyInfraOverviewCounts(): InfraOverviewCounts {
  return {
    providers: 0,
    plans: 0,
    resources: 0,
    databases: 0,
    readyDatabases: 0,
    drift: 0,
    failed: 0,
  };
}

export function aggregateInfraOverview(input: {
  providers: InfrastructureProviderRecord[];
  plans: ResourcePlanRecord[];
  resources: InfrastructureResourceRecord[];
  databases: DatabaseResourceRecord[];
}): InfraOverviewCounts {
  return {
    providers: input.providers.length,
    plans: input.plans.length,
    resources: input.resources.length,
    databases: input.databases.length,
    readyDatabases: input.databases.filter((d) => d.status === "READY").length,
    drift: input.resources.filter((r) => r.driftStatus === "DETECTED").length,
    failed: input.resources.filter((r) => r.status === "FAILED").length,
  };
}

export function shortId(id: string): string {
  return id.length > 10 ? `${id.slice(0, 8)}…` : id;
}

export type { ResourceBackupRecord };
