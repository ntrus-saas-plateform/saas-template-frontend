type BadgeTone = "default" | "danger" | "success" | "warning" | "info";

/** Unwrap edgeApi / edgeRequest payloads that nest under `.data`. */
export function unwrapEdgeData<T>(payload: unknown): T | undefined {
  if (payload == null) return undefined;
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export function unwrapRegistryList<T>(payload: unknown): {
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

/** Never render opaque secure config refs in clear — placeholder only. */
export function redactSecureConfigRef(
  value: string | null | undefined,
): string {
  if (value == null || value === "") return "—";
  return "•••••••• (ref present)";
}

export function registryErrMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Request failed";
}

export function registryStatusTone(status: string): BadgeTone {
  switch (status) {
    case "CERTIFIED":
    case "ACTIVE":
    case "PUBLISHED":
    case "COMPATIBLE":
      return "success";
    case "SUSPENDED":
    case "DEPRECATED":
    case "REQUIRES_REVIEW":
    case "PENDING":
    case "VALIDATING":
      return "warning";
    case "RETIRED":
    case "REVOKED":
    case "INCOMPATIBLE":
    case "FAILED":
      return "danger";
    case "DRAFT":
    case "UNCERTIFIED":
      return "default";
    default:
      return "info";
  }
}

const PRODUCT_TRANSITIONS: Record<string, readonly string[]> = {
  DRAFT: ["VALIDATING", "RETIRED"],
  VALIDATING: ["CERTIFIED", "DRAFT", "SUSPENDED"],
  CERTIFIED: ["SUSPENDED", "DEPRECATED"],
  SUSPENDED: ["CERTIFIED", "DEPRECATED", "RETIRED"],
  DEPRECATED: ["RETIRED"],
  RETIRED: [],
};

const VERSION_TRANSITIONS: Record<string, readonly string[]> = {
  DRAFT: ["VALIDATING", "RETIRED"],
  VALIDATING: ["PUBLISHED", "DRAFT"],
  PUBLISHED: ["DEPRECATED", "RETIRED"],
  DEPRECATED: ["RETIRED"],
  RETIRED: [],
};

const PLATFORM_TRANSITIONS: Record<string, readonly string[]> = {
  DRAFT: ["VALIDATING", "RETIRED"],
  VALIDATING: ["ACTIVE", "DRAFT", "SUSPENDED"],
  ACTIVE: ["SUSPENDED", "DEPRECATED"],
  SUSPENDED: ["ACTIVE", "DEPRECATED", "RETIRED"],
  DEPRECATED: ["RETIRED"],
  RETIRED: [],
};

const ENV_TRANSITIONS: Record<string, readonly string[]> = {
  DRAFT: ["VALIDATING", "RETIRED"],
  VALIDATING: ["ACTIVE", "DRAFT", "SUSPENDED"],
  ACTIVE: ["SUSPENDED", "DEPRECATED"],
  SUSPENDED: ["ACTIVE", "DEPRECATED", "RETIRED"],
  DEPRECATED: ["RETIRED"],
  RETIRED: [],
};

const PROFILE_TRANSITIONS: Record<string, readonly string[]> = {
  DRAFT: ["VALIDATING", "RETIRED"],
  VALIDATING: ["ACTIVE", "DRAFT", "SUSPENDED"],
  ACTIVE: ["SUSPENDED", "DEPRECATED"],
  SUSPENDED: ["ACTIVE", "DEPRECATED", "RETIRED"],
  DEPRECATED: ["RETIRED"],
  RETIRED: [],
};

const CONTRACT_TRANSITIONS: Record<string, readonly string[]> = {
  DRAFT: ["VALIDATING", "RETIRED"],
  VALIDATING: ["CERTIFIED", "DRAFT"],
  CERTIFIED: ["PUBLISHED"],
  PUBLISHED: ["DEPRECATED", "RETIRED"],
  DEPRECATED: ["RETIRED"],
  RETIRED: [],
};

export type RegistryTransitionKind =
  | "product"
  | "version"
  | "platform"
  | "environment"
  | "profile"
  | "contract";

const TRANSITION_MAP: Record<
  RegistryTransitionKind,
  Record<string, readonly string[]>
> = {
  product: PRODUCT_TRANSITIONS,
  version: VERSION_TRANSITIONS,
  platform: PLATFORM_TRANSITIONS,
  environment: ENV_TRANSITIONS,
  profile: PROFILE_TRANSITIONS,
  contract: CONTRACT_TRANSITIONS,
};

export function nextRegistryStatuses(
  kind: RegistryTransitionKind,
  from: string,
): string[] {
  return [...(TRANSITION_MAP[kind][from] ?? [])];
}

/** Sensitive transitions that require a non-empty reason in the UI. */
export function registryTransitionNeedsReason(
  kind: RegistryTransitionKind,
  toStatus: string,
): boolean {
  if (kind === "product" || kind === "platform") {
    return (
      toStatus === "SUSPENDED" ||
      toStatus === "DEPRECATED" ||
      toStatus === "RETIRED"
    );
  }
  if (kind === "contract") {
    return toStatus === "DEPRECATED" || toStatus === "RETIRED";
  }
  return false;
}

export const REGISTRY_STATUS_OPTIONS = {
  product: [
    "DRAFT",
    "VALIDATING",
    "CERTIFIED",
    "SUSPENDED",
    "DEPRECATED",
    "RETIRED",
  ],
  version: ["DRAFT", "VALIDATING", "PUBLISHED", "DEPRECATED", "RETIRED"],
  platform: [
    "DRAFT",
    "VALIDATING",
    "ACTIVE",
    "SUSPENDED",
    "DEPRECATED",
    "RETIRED",
  ],
  environment: [
    "DRAFT",
    "VALIDATING",
    "ACTIVE",
    "SUSPENDED",
    "DEPRECATED",
    "RETIRED",
  ],
  profile: [
    "DRAFT",
    "VALIDATING",
    "ACTIVE",
    "SUSPENDED",
    "DEPRECATED",
    "RETIRED",
  ],
  contract: [
    "DRAFT",
    "VALIDATING",
    "CERTIFIED",
    "PUBLISHED",
    "DEPRECATED",
    "RETIRED",
  ],
  compatibility: ["COMPATIBLE", "INCOMPATIBLE", "REQUIRES_REVIEW"],
} as const;

export const PLATFORM_TYPE_OPTIONS = [
  "SHARED_SAAS_PLATFORM",
  "DEDICATED_PLATFORM",
  "PRIVATE_PLATFORM",
  "ON_PREMISE_PLATFORM",
] as const;

export const ENVIRONMENT_TYPE_OPTIONS = [
  "DEVELOPMENT",
  "TEST",
  "STAGING",
  "PRODUCTION",
] as const;

export type RegistrySection =
  | "products"
  | "versions"
  | "platforms"
  | "environments"
  | "profiles"
  | "contracts"
  | "compatibility"
  | "history";

export function isRegistrySection(value: string): value is RegistrySection {
  return (
    value === "products" ||
    value === "versions" ||
    value === "platforms" ||
    value === "environments" ||
    value === "profiles" ||
    value === "contracts" ||
    value === "compatibility" ||
    value === "history"
  );
}
