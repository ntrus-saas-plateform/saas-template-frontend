import type { ApiClient } from "@/lib/api/client";
import { v1 } from "@/lib/api/paths";

export type CommercialOrgConfig = {
  organizationId: string;
  reservationTimeoutMinutes: number;
  allocationStrategy: string;
  defaultFulfillmentPolicy: string;
  returnPolicyCode: string | null;
  creditPolicyCode: string | null;
  approvalPolicyCode: string | null;
  availabilityPolicyCode: string | null;
  baseCurrency: string;
  enableCtp: boolean;
  enableLoyalty: boolean;
  enableMobilePos: boolean;
  enableConsignment: boolean;
  enableAiReplenishment: boolean;
  auditRetentionDays: number;
  transactionRetentionDays: number;
  eventRetentionDays: number;
  metadata: Record<string, unknown>;
  updatedAt: string;
};

export type InventoryPolicy = {
  organizationId: string;
  allowNegativeStock: boolean;
  enableFefo: boolean;
  expirationWarningDays: number;
  requireLotForMedication: boolean;
  requireExpirationForMedication: boolean;
  requireApprovalForAdjustment: boolean;
  requireApprovalForDisposal: boolean;
  adjustmentApprovalThreshold: number | null;
  allowPartialReceiving: boolean;
  allowPartialTransfer: boolean;
  quarantineReturns: boolean;
  featureFlags: Record<string, boolean>;
  retention: Record<string, number>;
  jobSchedules: Record<string, string>;
  metadata: Record<string, unknown>;
  version: number;
  updatedAt: string;
};

export type TimeoutConfigBundle = {
  defaults: Record<string, number>;
  overrides: Record<string, number>;
  effective: Record<string, number>;
};

export function commercialConfigApi(client: ApiClient) {
  return {
    get: () => client.get<CommercialOrgConfig | null>(v1("commercial-config")),
    upsert: (body: Partial<CommercialOrgConfig>) =>
      client.put<CommercialOrgConfig>(v1("commercial-config"), body),
  };
}

export function inventoryPolicyApi(client: ApiClient) {
  return {
    get: () => client.get<InventoryPolicy>(v1("inventory/policies")),
    upsert: (body: Partial<InventoryPolicy>) =>
      client.put<InventoryPolicy>(v1("inventory/policies"), body),
  };
}

export function orchestrationTimeoutsApi(client: ApiClient) {
  return {
    get: () => client.get<TimeoutConfigBundle>(v1("orchestration/timeouts")),
    upsert: (body: { timeoutKey: string; timeoutMinutes: number }) =>
      client.post<{ timeoutKey: string; timeoutMinutes: number }>(
        v1("orchestration/timeouts"),
        body,
      ),
  };
}
