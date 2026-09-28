import type { ApiClient } from "@/lib/api/client";
import { v1, withQuery } from "@/lib/api/paths";

export type ProvisionTenantInput = {
  slug: string;
  region?: string;
  environment?: string;
  databaseName?: string;
  databaseHost?: string;
  databasePort?: number;
  credentialsReference?: string;
  ownerIdentityId?: string;
  bootstrapOrganization?: boolean;
  defaultOrganizationName?: string;
  defaultOrganizationSlug?: string;
};

export type TenantProvisioningResult = {
  tenantId: string;
  slug?: string;
  status?: string;
  [key: string]: unknown;
};

export type TenantHealth = {
  tenantId?: string;
  database?: { reachable?: boolean; [key: string]: unknown };
  schemas?: unknown;
  keycloak?: unknown;
  domains?: unknown;
  [key: string]: unknown;
};

export type TenantDomain = {
  id: string;
  tenantId: string;
  hostname: string;
  type: string;
  isPrimary: boolean;
  status: string;
  verificationToken?: string | null;
  verificationMethod?: string;
  verifiedAt?: string | null;
  [key: string]: unknown;
};

export type DomainVerifyStart = {
  txtName: string;
  token: string;
  instructions: string;
};

export type ReconciliationReport = {
  tenantId?: string;
  drifts?: { type: string; [key: string]: unknown }[];
  repaired?: unknown[];
  ranAt?: string;
  [key: string]: unknown;
};

export type ReconciliationReportRecord = {
  id: string;
  createdAt?: string;
  driftCount?: number;
  repaired?: boolean;
  [key: string]: unknown;
};

export function adminApi(client: ApiClient) {
  return {
    tenants: {
      provision: (body: ProvisionTenantInput, idempotencyKey: string) =>
        client.post<TenantProvisioningResult>(v1("admin/tenants"), body, {
          headers: { "Idempotency-Key": idempotencyKey },
        }),
      delete: (tenantId: string, hard = false) =>
        client.delete<{ tenantId: string; hard?: boolean }>(
          withQuery(v1(`admin/tenants/${tenantId}`), {
            hard: hard ? "true" : undefined,
          }),
        ),
      retryProvisioning: (tenantId: string) =>
        client.post<TenantProvisioningResult>(
          v1(`admin/tenants/${tenantId}/provisioning/retry`),
        ),
      status: (tenantId: string, status: string) =>
        client.post<Record<string, unknown>>(
          v1(`admin/tenants/${tenantId}/status`),
          { status },
        ),
      health: (tenantId: string) =>
        client.get<TenantHealth>(v1(`admin/tenants/${tenantId}/health`)),
    },

    domains: {
      list: (tenantId: string) =>
        client.get<TenantDomain[]>(v1(`admin/tenants/${tenantId}/domains`)),
      register: (
        tenantId: string,
        body: { hostname: string; type?: string },
      ) =>
        client.post<TenantDomain>(
          v1(`admin/tenants/${tenantId}/domains`),
          body,
        ),
      verifyStart: (tenantId: string, domainId: string) =>
        client.post<DomainVerifyStart>(
          v1(`admin/tenants/${tenantId}/domains/${domainId}/verify/start`),
        ),
      verifyCheck: (tenantId: string, domainId: string, token: string) =>
        client.post<TenantDomain>(
          v1(`admin/tenants/${tenantId}/domains/${domainId}/verify/check`),
          { token },
        ),
    },

    reconciliation: {
      run: (repair = false) =>
        client.post<ReconciliationReport>(v1("admin/reconciliation/run"), {
          repair,
        }),
      report: () =>
        client.get<ReconciliationReport | null>(
          v1("admin/reconciliation/report"),
        ),
      reports: (page = 1, limit = 20) =>
        client.get<ReconciliationReportRecord[]>(
          withQuery(v1("admin/reconciliation/reports"), { page, limit }),
        ),
    },
  };
}
