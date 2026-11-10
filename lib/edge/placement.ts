import { edgeApi } from "@/lib/api/edge";
import type {
  CancelPlacementInput,
  CapacityInventoryQuery,
  CapacityReservationsQuery,
  ConfirmPlacementInput,
  CreatePlacementPolicyInput,
  CreatePlacementRequestInput,
  EvaluatePlacementInput,
  PatchCapacityInventoryInput,
  PatchPlacementPolicyInput,
  PlacementHistoryQuery,
  PlacementListQuery,
  ReEvaluatePlacementInput,
  ReleaseReservationInput,
  UpsertCapacityInventoryInput,
} from "@/types/edge-placement";

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

export function unwrapPlacementList<T>(payload: unknown): {
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

export function redactPlacementMetadata(
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
    if (typeof value === "string" && /vault:\/\/|password=|token=/i.test(value)) {
      out[key] = redactSecretRef(value);
      continue;
    }
    out[key] = value;
  }
  return out;
}

export function placementErrMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Request failed";
}

export function placementStatusTone(status: string): BadgeTone {
  switch (status) {
    case "PLACED":
    case "ACTIVE":
    case "COMMITTED":
    case "COMPATIBLE":
      return "success";
    case "PENDING":
    case "EVALUATING":
    case "REQUIRES_REVIEW":
    case "HELD":
    case "DRAFT":
    case "STALE":
      return "warning";
    case "NO_CAPACITY":
    case "NO_COMPATIBLE_TARGET":
    case "REJECTED":
    case "EXPIRED":
    case "CANCELLED":
    case "FAILED":
    case "SUPERSEDED":
    case "RETIRED":
    case "SUSPENDED":
      return "danger";
    case "RELEASED":
    case "DEPRECATED":
      return "default";
    default:
      return "info";
  }
}

export function capacityUtilizationPct(row: {
  totalCapacity: number;
  reservedCapacity: number;
  allocatedCapacity: number;
  unavailableCapacity?: number;
}): number {
  if (!row.totalCapacity || row.totalCapacity <= 0) return 0;
  const used =
    Number(row.reservedCapacity ?? 0) + Number(row.allocatedCapacity ?? 0);
  return Math.min(100, Math.round((used / row.totalCapacity) * 100));
}

export function isInventoryFresh(validUntil: string | null | undefined): boolean {
  if (!validUntil) return false;
  const t = new Date(validUntil).getTime();
  return !Number.isNaN(t) && t > Date.now();
}

export const PLACEMENT_REQUEST_STATUS_OPTIONS = [
  "PENDING",
  "EVALUATING",
  "PLACED",
  "REQUIRES_REVIEW",
  "NO_CAPACITY",
  "NO_COMPATIBLE_TARGET",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
  "SUPERSEDED",
] as const;

export const CAPACITY_RESOURCE_TYPE_OPTIONS = [
  "CPU",
  "MEMORY",
  "STORAGE",
  "DATABASE",
  "CONNECTION",
  "TENANT_SLOT",
  "RUNTIME_INSTANCE",
  "BANDWIDTH",
] as const;

export const CAPACITY_INVENTORY_STATUS_OPTIONS = [
  "ACTIVE",
  "STALE",
  "SUSPENDED",
  "RETIRED",
] as const;

export const CAPACITY_RESERVATION_STATUS_OPTIONS = [
  "HELD",
  "COMMITTED",
  "RELEASED",
  "EXPIRED",
  "CANCELLED",
  "FAILED",
] as const;

export const PLACEMENT_POLICY_STATUS_OPTIONS = [
  "DRAFT",
  "ACTIVE",
  "DEPRECATED",
  "RETIRED",
] as const;

export const ENVIRONMENT_TYPE_OPTIONS = [
  "DEVELOPMENT",
  "TEST",
  "STAGING",
  "PRODUCTION",
] as const;

/** Typed Placement & Capacity API client (BFF via edgeApi / same auth+CSRF). */
export const placementApi = {
  listRequests: (opts?: PlacementListQuery) =>
    edgeApi.listPlacementRequests(opts),
  getRequest: (id: string) => edgeApi.getPlacementRequest(id),
  createRequest: (body: CreatePlacementRequestInput) =>
    edgeApi.createPlacementRequest(body),
  evaluateRequest: (id: string, body?: EvaluatePlacementInput) =>
    edgeApi.evaluatePlacementRequest(id, body),
  confirmRequest: (id: string, body?: ConfirmPlacementInput) =>
    edgeApi.confirmPlacementRequest(id, body),
  cancelRequest: (id: string, body?: CancelPlacementInput) =>
    edgeApi.cancelPlacementRequest(id, body),
  reEvaluateRequest: (id: string, body: ReEvaluatePlacementInput) =>
    edgeApi.reEvaluatePlacementRequest(id, body),

  getDecision: (id: string) => edgeApi.getPlacementDecision(id),
  listCandidates: (decisionId: string) =>
    edgeApi.listPlacementDecisionCandidates(decisionId),

  listHistory: (opts?: PlacementHistoryQuery) =>
    edgeApi.listPlacementHistory(opts),

  listInventory: (opts?: CapacityInventoryQuery) =>
    edgeApi.listCapacityInventory(opts),
  upsertInventory: (body: UpsertCapacityInventoryInput) =>
    edgeApi.upsertCapacityInventory(body),
  patchInventory: (id: string, body: PatchCapacityInventoryInput) =>
    edgeApi.patchCapacityInventory(id, body),

  listReservations: (opts?: CapacityReservationsQuery) =>
    edgeApi.listCapacityReservations(opts),
  getReservation: (id: string) => edgeApi.getCapacityReservation(id),
  releaseReservation: (id: string, body: ReleaseReservationInput) =>
    edgeApi.releaseCapacityReservation(id, body),
  expireReservation: (id: string, body: { expectedVersion: number }) =>
    edgeApi.expireCapacityReservation(id, body),

  listPolicies: (opts?: PlacementListQuery) =>
    edgeApi.listPlacementPolicies(opts),
  createPolicy: (body: CreatePlacementPolicyInput) =>
    edgeApi.createPlacementPolicy(body),
  patchPolicy: (id: string, body: PatchPlacementPolicyInput) =>
    edgeApi.patchPlacementPolicy(id, body),
};
