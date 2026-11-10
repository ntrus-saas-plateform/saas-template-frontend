import { edgeApi } from "@/lib/api/edge";
import type {
  PatchProductControlEndpointInput,
  ProductControlListQuery,
  ProductControlOverviewCounts,
  QuarantineProductControlEndpointInput,
  RegisterProductControlEndpointInput,
} from "@/types/edge-product-control";

type BadgeTone = "default" | "danger" | "success" | "warning" | "info";

const SENSITIVE_KEY =
  /secret|password|token|credential|apikey|api_key|private.?key|secure.?config/i;

/** Unwrap edgeApi / edgeRequest payloads that nest under `.data`. */
export function unwrapEdgeData<T>(payload: unknown): T | undefined {
  if (payload == null) return undefined;
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export function unwrapProductControlList<T>(payload: unknown): {
  items: T[];
  total: number;
} {
  const raw = unwrapEdgeData<{ items?: T[]; total?: number } | T[]>(payload);
  if (Array.isArray(raw)) return { items: raw, total: raw.length };
  if (raw && typeof raw === "object" && Array.isArray(raw.items)) {
    return { items: raw.items, total: Number(raw.total ?? raw.items.length) };
  }
  return { items: [], total: 0 };
}

/** Never render opaque secure refs / secrets in clear — placeholder only. */
export function redactSecretRef(value: string | null | undefined): string {
  if (value == null || value === "") return "—";
  return "•••••••• (ref present)";
}

export function redactProductControlMetadata(
  meta: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!meta) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_KEY.test(key)) {
      out[key] = redactSecretRef(
        typeof value === "string" ? value : "present",
      );
      continue;
    }
    if (
      typeof value === "string" &&
      /vault:\/\/|password=|token=/i.test(value)
    ) {
      out[key] = redactSecretRef(value);
      continue;
    }
    out[key] = value;
  }
  return out;
}

export function productControlErrMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Request failed";
}

export function productControlStatusTone(status: string): BadgeTone {
  switch (status) {
    case "ACTIVE":
    case "SUCCEEDED":
    case "HEALTHY":
    case "COMPATIBLE":
    case "RECONCILED":
    case "ACKNOWLEDGED":
      return "success";
    case "PENDING_VALIDATION":
    case "VALIDATING":
    case "DISCOVERED":
    case "CREATED":
    case "QUEUED":
    case "SENDING":
    case "SENT":
    case "RETRY_PENDING":
    case "ROTATING":
    case "IN_PROGRESS":
      return "info";
    case "DEGRADED":
    case "UNAVAILABLE":
    case "UNKNOWN":
    case "UNKNOWN_OUTCOME":
    case "RECONCILIATION_REQUIRED":
    case "REQUIRED":
    case "EXPIRED":
      return "warning";
    case "QUARANTINED":
    case "REVOKED":
    case "FAILED":
    case "CANCELLED":
    case "INCOMPATIBLE":
    case "ABANDONED":
      return "danger";
    case "DEPRECATED":
    case "NONE":
      return "default";
    default:
      return "info";
  }
}

export function emptyOverviewCounts(): ProductControlOverviewCounts {
  return {
    endpoints: 0,
    active: 0,
    degraded: 0,
    quarantined: 0,
    failedExchanges: 0,
    reconciliationRequired: 0,
  };
}

export function aggregateOverviewCounts(
  endpoints: Array<{ status: string }>,
  exchanges: Array<{ status: string; reconciliationStatus?: string }>,
): ProductControlOverviewCounts {
  const counts = emptyOverviewCounts();
  counts.endpoints = endpoints.length;
  for (const row of endpoints) {
    if (row.status === "ACTIVE") counts.active += 1;
    if (row.status === "DEGRADED" || row.status === "UNAVAILABLE") {
      counts.degraded += 1;
    }
    if (row.status === "QUARANTINED" || row.status === "REVOKED") {
      counts.quarantined += 1;
    }
  }
  for (const row of exchanges) {
    if (row.status === "FAILED") counts.failedExchanges += 1;
    if (
      row.status === "RECONCILIATION_REQUIRED" ||
      row.status === "UNKNOWN_OUTCOME" ||
      row.reconciliationStatus === "REQUIRED" ||
      row.reconciliationStatus === "IN_PROGRESS"
    ) {
      counts.reconciliationRequired += 1;
    }
  }
  return counts;
}

export function canMutateEndpoint(status: string): boolean {
  return status !== "QUARANTINED" && status !== "REVOKED";
}

export function needsReconciliation(status: string, reconciliationStatus?: string): boolean {
  return (
    status === "UNKNOWN_OUTCOME" ||
    status === "RECONCILIATION_REQUIRED" ||
    reconciliationStatus === "REQUIRED" ||
    reconciliationStatus === "IN_PROGRESS"
  );
}

export const PRODUCT_CONTROL_ENDPOINT_STATUS_OPTIONS = [
  "PENDING_VALIDATION",
  "VALIDATING",
  "ACTIVE",
  "DEGRADED",
  "UNAVAILABLE",
  "QUARANTINED",
  "REVOKED",
] as const;

export const CONTROL_EXCHANGE_STATUS_OPTIONS = [
  "CREATED",
  "QUEUED",
  "SENDING",
  "SENT",
  "ACKNOWLEDGED",
  "SUCCEEDED",
  "FAILED",
  "RETRY_PENDING",
  "UNKNOWN_OUTCOME",
  "RECONCILIATION_REQUIRED",
  "RECONCILED",
  "CANCELLED",
] as const;

export const CREDENTIAL_BINDING_STATUS_OPTIONS = [
  "ACTIVE",
  "ROTATING",
  "REVOKED",
  "EXPIRED",
] as const;

export const PRODUCT_CONTROL_AUTH_PROFILE_OPTIONS = [
  "OAUTH2_CC",
  "MTLS",
  "OAUTH2_CC_MTLS",
  "HMAC_SIGNED",
  "CUSTOM",
] as const;

/** Typed Product Control API client (BFF via edgeApi / same auth+CSRF). */
export const productControlApi = {
  listEndpoints: (opts?: ProductControlListQuery) =>
    edgeApi.listProductControlEndpoints(opts),
  getEndpoint: (id: string) => edgeApi.getProductControlEndpoint(id),
  createEndpoint: (body: RegisterProductControlEndpointInput) =>
    edgeApi.createProductControlEndpoint(body),
  patchEndpoint: (id: string, body: PatchProductControlEndpointInput) =>
    edgeApi.patchProductControlEndpoint(id, body),
  validateEndpoint: (id: string) => edgeApi.validateProductControlEndpoint(id),
  handshake: (id: string) => edgeApi.handshakeProductControlEndpoint(id),
  discoverContract: (id: string) =>
    edgeApi.discoverProductControlContract(id),
  discoverCapabilities: (id: string) =>
    edgeApi.discoverProductControlCapabilities(id),
  healthCheck: (id: string) => edgeApi.healthCheckProductControlEndpoint(id),
  quarantine: (id: string, body: QuarantineProductControlEndpointInput) =>
    edgeApi.quarantineProductControlEndpoint(id, body),

  listEndpointExchanges: (id: string, opts?: ProductControlListQuery) =>
    edgeApi.listProductControlEndpointExchanges(id, opts),
  listEndpointContracts: (id: string) =>
    edgeApi.listProductControlEndpointContracts(id),
  listEndpointCapabilities: (id: string) =>
    edgeApi.listProductControlEndpointCapabilities(id),
  listEndpointHealthChecks: (id: string, opts?: ProductControlListQuery) =>
    edgeApi.listProductControlEndpointHealthChecks(id, opts),
  listEndpointHistory: (id: string, opts?: ProductControlListQuery) =>
    edgeApi.listProductControlEndpointHistory(id, opts),

  listExchanges: (opts?: ProductControlListQuery) =>
    edgeApi.listProductControlExchanges(opts),
  getExchange: (id: string) => edgeApi.getProductControlExchange(id),
  reconcileExchange: (id: string) =>
    edgeApi.reconcileProductControlExchange(id),

  listCredentials: (opts?: ProductControlListQuery) =>
    edgeApi.listProductControlCredentials(opts),
};
