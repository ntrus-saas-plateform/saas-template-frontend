import type { ApiClient } from "@/lib/api/client";
import { v1 } from "@/lib/api/paths";

export type BusinessProfileSummary = {
  code: string;
  name: string;
  description: string;
  industry: string;
  category: string;
  version: number;
  status: string;
  defaultCapabilities: string[];
};

export type CapabilityDefinition = {
  code: string;
  name: string;
  description: string;
  category: string;
  version: number;
  status: string;
  requiredModules: string[];
  requiredPermissions: string[];
  supportedVerticals: string[];
  dependsOn: string[];
  conflictsWith: string[];
};

export type TenantCapabilityState = {
  capabilityCode: string;
  state: "ENABLED" | "DISABLED" | "SUSPENDED";
  source: string;
  reason?: string | null;
};

export type TenantBusinessConfiguration = {
  organizationId: string;
  profileCode: string | null;
  industry: string;
  businessType: string;
  status: string;
  version: number;
  enabledModules: string[];
  featureFlags: Record<string, boolean>;
  capabilities: TenantCapabilityState[];
};

export type BusinessContext = {
  tenantId: string;
  organizationId: string;
  businessProfile: string | null;
  industry: string;
  businessType: string;
  configVersion: number;
  enabledModules: string[];
  enabledCapabilities: string[];
  featureFlags: Record<string, boolean>;
  resolvedAt: string;
};

export type CapabilityListPayload = {
  definitions: CapabilityDefinition[];
  tenant: TenantBusinessConfiguration | null;
};

export type ExplainCapabilityPayload = {
  explanation: string;
};

export type ConfigurationDiff = {
  fromVersion: number | null;
  toVersion: number | null;
  fromProfile: string | null;
  toProfile: string | null;
  capabilityAdded: string[];
  capabilityRemoved: string[];
  moduleAdded: string[];
  moduleRemoved: string[];
};

export type ConfigurationVersion = {
  id: string;
  organizationId: string;
  version: number;
  status: string;
  reason: string | null;
  createdAt: string;
};

export type MigrationPlan = {
  id: string;
  organizationId: string;
  fromProfile: string | null;
  toProfile: string;
  fromVersion: number | null;
  status: string;
  plan: {
    analysis: string;
    blockers: Array<{ code: string; message: string; severity: string }>;
    diff: ConfigurationDiff;
    requiresApproval: boolean;
  };
};

export type DryRunResult = {
  valid: boolean;
  errors: Array<{ code: string; message: string }>;
  warnings: Array<{ code: string; message: string }>;
  diff?: ConfigurationDiff;
  blockers?: Array<{ code: string; message: string; severity: string }>;
};

export function businessConfigApi(client: ApiClient) {
  return {
    context: () => client.get<BusinessContext>(v1("business-context")),
    listProfiles: () =>
      client.get<BusinessProfileSummary[]>(v1("business-profiles")),
    getProfile: (code: string) =>
      client.get<BusinessProfileSummary>(v1(`business-profiles/${code}`)),
    assignProfile: (body: { profileCode: string; expectedVersion?: number }) =>
      client.post<TenantBusinessConfiguration>(
        v1("business-config/assign-profile"),
        body,
      ),
    saveDraft: (body: { profileCode: string; expectedVersion?: number }) =>
      client.post<TenantBusinessConfiguration>(v1("business-config/draft"), body),
    activate: (body?: { expectedVersion?: number }) =>
      client.post<TenantBusinessConfiguration>(
        v1("business-config/activate"),
        body ?? {},
      ),
    rollback: (body: { targetVersion: number; expectedVersion?: number }) =>
      client.post<TenantBusinessConfiguration>(
        v1("business-config/rollback"),
        body,
      ),
    listVersions: () =>
      client.get<ConfigurationVersion[]>(v1("business-config/versions")),
    diff: (params: {
      fromVersion?: number;
      toVersion?: number;
      profileCode?: string;
    }) => {
      const q = new URLSearchParams();
      if (params.fromVersion != null) q.set("fromVersion", String(params.fromVersion));
      if (params.toVersion != null) q.set("toVersion", String(params.toVersion));
      if (params.profileCode) q.set("profileCode", params.profileCode);
      const qs = q.toString();
      return client.get<ConfigurationDiff>(
        `${v1("business-config/diff")}${qs ? `?${qs}` : ""}`,
      );
    },
    listCapabilities: () =>
      client.get<CapabilityListPayload>(v1("business-config/capabilities")),
    enableCapability: (code: string, expectedVersion?: number) =>
      client.post<TenantBusinessConfiguration>(
        v1(`business-config/capabilities/${code}/enable`),
        { expectedVersion },
      ),
    disableCapability: (code: string, expectedVersion?: number) =>
      client.post<TenantBusinessConfiguration>(
        v1(`business-config/capabilities/${code}/disable`),
        { expectedVersion },
      ),
    explainCapability: (code: string) =>
      client.get<{
        capabilityCode: string;
        enabled: boolean;
        available: boolean;
        summary: string;
        narrative: string;
        reasons: Array<{ code: string; message: string }>;
        explanation?: string;
      }>(v1(`business-config/capabilities/${code}/explain`)),
    listVerticalExtensions: (verticalCode?: string) => {
      const qs = verticalCode
        ? `?verticalCode=${encodeURIComponent(verticalCode)}`
        : "";
      return client.get<
        Array<{
          verticalCode: string;
          extensionKey: string;
          label: string;
          requiredCapabilities: string[];
          status: string;
        }>
      >(v1(`business-config/vertical-extensions${qs}`));
    },
    listProductExtensions: (productId: string) =>
      client.get<
        Array<{
          verticalCode: string;
          extensionKey: string;
          payload: Record<string, unknown>;
        }>
      >(v1(`business-config/products/${productId}/extensions`)),
    publishOfflineSnapshot: () =>
      client.post<{
        snapshotVersion: number;
        configVersion: number;
        checksum: string | null;
      }>(v1("business-config/offline-snapshots/publish"), {}),
    latestOfflineSnapshot: () =>
      client.get<{
        snapshotVersion: number;
        configVersion: number;
        businessProfile: string | null;
        checksum: string | null;
      } | null>(v1("business-config/offline-snapshots/latest")),
    deepPos: () =>
      client.get<{
        configuration: Record<string, unknown>;
        configVersion: number;
        offlineSnapshotVersion: number | null;
      }>(v1("business-config/pos-configuration/deep")),
    listLicensingPacks: () =>
      client.get<
        Array<{
          code: string;
          name: string;
          description: string;
          packKind: string;
          targetProfileCode: string | null;
          capabilityCodes: string[];
        }>
      >(v1("business-config/licensing-packs")),
    listPackSubscriptions: () =>
      client.get<
        Array<{ packCode: string; status: string; packVersion: number }>
      >(v1("business-config/pack-subscriptions")),
    installPack: (body: {
      packCode: string;
      activateProfile?: boolean;
      expectedVersion?: number;
    }) =>
      client.post<{
        subscription: { packCode: string; status: string };
        enabled: string[];
      }>(v1("business-config/licensing-packs/install"), body),
    uninstallPack: (code: string) =>
      client.post<{ packCode: string; status: string }>(
        v1(`business-config/licensing-packs/${code}/uninstall`),
        {},
      ),
    validate: (body: { profileCode?: string; capabilities?: string[] }) =>
      client.post<DryRunResult>(v1("business-config/validate"), body),
    createMigrationPlan: (toProfile: string) =>
      client.post<MigrationPlan>(v1("business-config/migration-plans"), {
        toProfile,
      }),
    listMigrationPlans: () =>
      client.get<MigrationPlan[]>(v1("business-config/migration-plans")),
    approveMigrationPlan: (id: string) =>
      client.post<MigrationPlan>(
        v1(`business-config/migration-plans/${id}/approve`),
        {},
      ),
    applyMigrationPlan: (id: string, activate = true) =>
      client.post<TenantBusinessConfiguration>(
        v1(`business-config/migration-plans/${id}/apply`),
        { activate },
      ),
  };
}
