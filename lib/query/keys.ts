/** Org-scoped TanStack Query keys — invalidate on org switch. */

export const qk = {
  platform: {
    boot: (mode: string) => ["platform", "boot", mode] as const,
  },
  org: (orgId: string | null | undefined) => ({
    customers: {
      list: (search?: string) =>
        ["org", orgId, "customers", "list", search ?? ""] as const,
      detail: (id: string) => ["org", orgId, "customers", id] as const,
      view360: (id: string) => ["org", orgId, "customers", id, "360"] as const,
      consents: (id: string) =>
        ["org", orgId, "customers", id, "consents"] as const,
      addresses: (id: string) =>
        ["org", orgId, "customers", id, "addresses"] as const,
      interactions: (id: string) =>
        ["org", orgId, "customers", id, "interactions"] as const,
    },
    pharmacy: {
      commandCenter: () =>
        ["org", orgId, "pharmacy", "command-center"] as const,
      kpis: () => ["org", orgId, "pharmacy", "kpis"] as const,
      prescriptions: (status?: string) =>
        ["org", orgId, "pharmacy", "prescriptions", status ?? ""] as const,
      prescription: (id: string) =>
        ["org", orgId, "pharmacy", "prescriptions", id] as const,
      dispensings: (prescriptionId?: string) =>
        [
          "org",
          orgId,
          "pharmacy",
          "dispensings",
          prescriptionId ?? "",
        ] as const,
      locations: (status?: string) =>
        ["org", orgId, "pharmacy", "locations", status ?? ""] as const,
      location: (id: string) =>
        ["org", orgId, "pharmacy", "locations", id] as const,
      prescribers: (status?: string) =>
        ["org", orgId, "pharmacy", "prescribers", status ?? ""] as const,
      prescriber: (id: string) =>
        ["org", orgId, "pharmacy", "prescribers", id] as const,
      contraindicationRules: (activeOnly?: boolean) =>
        [
          "org",
          orgId,
          "pharmacy",
          "contraindication-rules",
          activeOnly ?? false,
        ] as const,
    },
  }),
  /** Identity keys are org-scoped so cache does not leak across org switches. */
  identity: (orgId: string | null | undefined) => ({
    organizations: () => ["identity", orgId, "organizations"] as const,
    organization: (id: string) =>
      ["identity", orgId, "organizations", id] as const,
    users: () => ["identity", orgId, "users"] as const,
    user: (id: string) => ["identity", orgId, "users", id] as const,
    me: () => ["identity", orgId, "users", "me"] as const,
    preferences: () => ["identity", orgId, "users", "me", "preferences"] as const,
    personalization: () =>
      ["identity", orgId, "users", "me", "personalization"] as const,
    notifications: (q?: string) =>
      ["identity", orgId, "users", "me", "notifications", q ?? ""] as const,
    devices: () => ["identity", orgId, "users", "me", "devices"] as const,
    mySecurity: () => ["identity", orgId, "users", "me", "security"] as const,
    myIdentity: () => ["identity", orgId, "users", "me", "identity"] as const,
    identityProviders: () =>
      ["identity", orgId, "security", "identity-providers"] as const,
    loginHistory: () =>
      ["identity", orgId, "users", "me", "login-history"] as const,
    apiTokens: () => ["identity", orgId, "users", "me", "api-tokens"] as const,
    activity: () => ["identity", orgId, "users", "me", "activity"] as const,
    myMemberships: () =>
      ["identity", orgId, "users", "me", "memberships"] as const,
    memberships: (q?: string) =>
      ["identity", orgId, "memberships", q ?? ""] as const,
    invitations: () => ["identity", orgId, "invitations"] as const,
    roles: () => ["identity", orgId, "roles"] as const,
    permissions: () => ["identity", orgId, "permissions"] as const,
    tenant: (id: string) => ["identity", orgId, "tenant", id] as const,
    settings: (ns: string) => ["identity", orgId, "settings", ns] as const,
    security: () => ["identity", orgId, "security"] as const,
    sessions: () => ["identity", orgId, "sessions"] as const,
    flags: () => ["identity", orgId, "feature-flags"] as const,
    modules: () => ["identity", orgId, "modules"] as const,
    billing: () => ["identity", orgId, "billing"] as const,
    auditLogs: () => ["identity", orgId, "audit-logs"] as const,
    delegations: () => ["identity", orgId, "delegations"] as const,
    emergency: () => ["identity", orgId, "emergency"] as const,
    commercialConfig: () =>
      ["identity", orgId, "commercial-config"] as const,
    inventoryPolicies: () =>
      ["identity", orgId, "inventory-policies"] as const,
    orchestrationTimeouts: () =>
      ["identity", orgId, "orchestration-timeouts"] as const,
    businessProfiles: () =>
      ["identity", orgId, "business-profiles"] as const,
    businessCapabilities: () =>
      ["identity", orgId, "business-capabilities"] as const,
    businessContext: () =>
      ["identity", orgId, "business-context"] as const,
    businessConfigVersions: () =>
      ["identity", orgId, "business-config-versions"] as const,
    businessMigrationPlans: () =>
      ["identity", orgId, "business-migration-plans"] as const,
    licensingPacks: () => ["identity", orgId, "licensing-packs"] as const,
    packSubscriptions: () =>
      ["identity", orgId, "pack-subscriptions"] as const,
  }),
  admin: {
    tenants: () => ["admin", "tenants"] as const,
    tenantHealth: (id: string) => ["admin", "tenants", id, "health"] as const,
    domains: (tenantId: string) =>
      ["admin", "tenants", tenantId, "domains"] as const,
    reconciliation: () => ["admin", "reconciliation"] as const,
  },
};

export const orgScopedPrefixes = ["org", "identity"] as const;
