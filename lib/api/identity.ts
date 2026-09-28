import type { ApiClient } from "@/lib/api/client";
import { v1, withQuery } from "@/lib/api/paths";

export type IdentityOrganization = {
  id: string;
  name: string;
  slug: string;
  status: string;
  type?: string;
  code?: string | null;
  parentId?: string | null;
  isPrimary?: boolean;
  description?: string | null;
  timezone?: string | null;
  locale?: string | null;
  country?: string | null;
  city?: string | null;
  province?: string | null;
  phone?: string | null;
  email?: string | null;
  defaultCurrency?: string | null;
  childCount?: number;
  address?: Record<string, unknown>;
  contact?: Record<string, unknown>;
  openingHours?: Record<string, unknown>;
  operationalSettings?: Record<string, unknown>;
  keycloakOrganizationId?: string | null;
  [key: string]: unknown;
};

export type OrgWarehouse = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  status: string;
  isDefault?: boolean;
  [key: string]: unknown;
};

export type OrgPosTerminal = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  status: string;
  isDefault?: boolean;
  warehouseId?: string | null;
  [key: string]: unknown;
};

export type OrgCashRegister = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  status: string;
  isDefault?: boolean;
  posTerminalId?: string | null;
  [key: string]: unknown;
};

export type OrgWorkflow = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  kind: string;
  status: string;
  steps?: unknown[];
  [key: string]: unknown;
};

export type UserOrganizationSummary = {
  organizationId: string;
  organizationName?: string | null;
  roles?: string[];
  department?: string | null;
  position?: string | null;
  status?: string | null;
};

export type ApplicationUser = {
  id: string;
  identityId?: string;
  status: string;
  email?: string | null;
  profile?: Record<string, unknown> | null;
  lastSeenAt?: string | Date | null;
  createdAt?: string | Date;
  employment?: {
    organizationId: string;
    organizationName?: string | null;
    department?: string | null;
    position?: string | null;
    managerUserId?: string | null;
    joinedAt?: string | null;
    status?: string | null;
    roles?: string[];
  } | null;
  organizations?: UserOrganizationSummary[];
  [key: string]: unknown;
};

export type MembershipResourceScope = {
  permission: string;
  organizationId?: string;
  resourceType?: string;
  resourceId?: string;
};

export type Membership = {
  id: string;
  userId: string;
  organizationId: string;
  tenantId?: string;
  roles: string[];
  permissions: string[];
  status?: string;
  department?: string | null;
  position?: string | null;
  managerUserId?: string | null;
  resourceScopes?: MembershipResourceScope[];
  joinedAt?: string;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type Invitation = {
  id: string;
  email: string;
  organizationId: string;
  status: string;
  expiresAt?: string;
  token?: string;
  emailSent?: boolean;
  emailProvider?: string;
  emailError?: string | null;
  roles?: string[];
  permissions?: string[];
  [key: string]: unknown;
};

export type Role = {
  id: string;
  name: string;
  scope: "platform" | "tenant" | "organization" | string;
  description?: string | null;
  permissions?: string[];
  isSystem?: boolean;
  system?: boolean;
  tenantId?: string | null;
  createdAt?: string;
  [key: string]: unknown;
};

export type Permission = {
  id: string;
  resource: string;
  action: string;
  description?: string | null;
  /** @deprecated prefer formatPermissionKey */
  code?: string;
  name?: string;
  [key: string]: unknown;
};

export function formatPermissionKey(
  permission: Pick<Permission, "resource" | "action"> | string,
): string {
  if (typeof permission === "string") return permission;
  return `${permission.resource}:${permission.action}`;
}

export function isSystemRole(role: Role): boolean {
  const value: unknown = role.isSystem ?? role.system;
  return value === true || value === 1 || value === "true";
}

export type Tenant = {
  id: string;
  slug?: string;
  status: string;
  legalName?: string | null;
  displayName?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  country?: string | null;
  timezone?: string | null;
  locale?: string | null;
  defaultCurrency?: string | null;
  defaultLanguage?: string | null;
  dateFormat?: string | null;
  numberFormat?: string | null;
  planReference?: string | null;
  ownerIdentityId?: string | null;
  [key: string]: unknown;
};

export type SettingsNamespace = {
  namespace: string;
  values: Record<string, unknown>;
  [key: string]: unknown;
};

export type SecurityPolicies = {
  mfaPolicy?: string;
  mfaMethods?: string[];
  sessionLifetimeMinutes?: number;
  idleTimeoutMinutes?: number;
  maxSessionDurationMinutes?: number;
  rememberMe?: boolean;
  sessionConcurrency?: number;
  failedLoginThreshold?: number;
  accountLockoutMinutes?: number;
  passwordMinLength?: number;
  passwordRequireUpper?: boolean;
  passwordRequireNumber?: boolean;
  passwordRequireSymbol?: boolean;
  ipAllowlist?: string[];
  ipDenylist?: string[];
  countryRestrictions?: string[];
  suspiciousLoginDetection?: boolean;
  ssoProviders?: string[];
  keycloakAvailable?: boolean;
  [key: string]: unknown;
};

export type MfaStatus = {
  enabled?: boolean;
  enrolled?: boolean;
  required?: boolean;
  methods?: string[];
  keycloakAvailable?: boolean;
  [key: string]: unknown;
};

export type SessionInfo = {
  id: string;
  username?: string;
  ipAddress?: string | null;
  started?: string | null;
  lastAccess?: string | null;
  createdAt?: string | null;
  lastAccessedAt?: string | null;
  clients?: string[] | unknown;
  browser?: string | null;
  os?: string | null;
  device?: string | null;
  current?: boolean;
  [key: string]: unknown;
};

export type UserCredential = {
  id: string;
  type: string;
  userLabel?: string | null;
  createdDate?: string | null;
};

export type MySecurityOverview = {
  enabled: boolean;
  methods: string[];
  credentials: UserCredential[];
  urls: {
    accountConsoleUrl: string;
    passwordUrl: string;
    enrollTotpUrl: string;
    enrollWebauthnUrl: string;
    linkedAccountsUrl?: string;
    recoveryCodesUrl?: string;
  };
  keycloakAvailable: boolean;
  identity?: {
    keycloakId: string;
    emailVerified: boolean;
    linkedCount: number;
  };
};

export type LinkedIdentity = {
  provider: string;
  providerUserId: string;
  username: string;
  primary: boolean;
};

export type MyIdentityOverview = {
  keycloakId: string;
  enabled: boolean;
  email: string | null;
  username: string | null;
  verification: {
    emailVerified: boolean;
    mfaEnrolled: boolean;
    phoneVerified: boolean;
    phoneE164?: string | null;
  };
  mfa: { enabled: boolean; methods: string[] };
  credentials: UserCredential[];
  linkedIdentities: LinkedIdentity[];
  urls: MySecurityOverview["urls"];
  keycloakAvailable: boolean;
};

export type IdentityProviderInfo = {
  alias: string;
  providerId: string;
  enabled: boolean;
  displayName: string | null;
  linkOnly: boolean;
  config?: Record<string, string>;
};

export type UserNotification = {
  id: string;
  userId: string;
  organizationId?: string | null;
  channel: string;
  category: string;
  priority: string;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
  readAt?: string | null;
  createdAt: string;
};

export type UserDevice = {
  id: string;
  userId: string;
  externalSessionId?: string | null;
  deviceName?: string | null;
  platform?: string | null;
  browser?: string | null;
  os?: string | null;
  lastIp?: string | null;
  lastSeenAt: string;
  trusted: boolean;
  pushToken?: string | null;
  pushPlatform?: string | null;
  pushEnrolledAt?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type UserLoginHistoryEntry = {
  id: string;
  userId: string;
  eventType: string;
  success: boolean;
  ip?: string | null;
  userAgent?: string | null;
  browser?: string | null;
  os?: string | null;
  device?: string | null;
  sessionId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type UserApiToken = {
  id: string;
  userId: string;
  name: string;
  tokenPrefix: string;
  scopes: string[];
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type UserActivityEvent = {
  id: string;
  userId: string;
  organizationId?: string | null;
  category: string;
  title: string;
  detail: string;
  href?: string | null;
  payload?: Record<string, unknown>;
  createdAt: string;
};

export type UserPersonalization = {
  favorites?: Array<{ id: string; label: string; href: string; icon?: string }>;
  recentApplications?: Array<{
    id: string;
    label: string;
    href: string;
    at?: string;
  }>;
  recentPages?: Array<{ id: string; label: string; href: string; at?: string }>;
  pinnedPages?: Array<{ id: string; label: string; href: string; icon?: string }>;
  pinnedActions?: Array<{
    id: string;
    label: string;
    href: string;
    icon?: string;
  }>;
  dashboardLayout?: unknown[];
  widgets?: Array<{
    id: string;
    type: string;
    size?: string;
    hidden?: boolean;
    config?: Record<string, unknown>;
  }>;
  hiddenWidgets?: string[];
  savedSearches?: unknown[];
  savedReports?: unknown[];
  savedFilters?: unknown[];
  savedTableViews?: unknown[];
  [key: string]: unknown;
};

export type FeatureFlagEntry = {
  id?: string;
  key: string;
  enabled: boolean;
  [key: string]: unknown;
};

export type Delegation = {
  id: string;
  organizationId: string;
  grantorIdentityId?: string;
  granteeIdentityId: string;
  permissions: string[];
  expiresAt?: string;
  status?: string;
  [key: string]: unknown;
};

export type EmergencyAccessGrant = {
  id: string;
  operatorIdentityId: string;
  reason: string;
  organizationId?: string | null;
  scope?: Record<string, unknown> | null;
  expiresAt?: string;
  status?: string;
  [key: string]: unknown;
};

export function identityApi(client: ApiClient) {
  return {
    organizations: {
      list: (
        page = 1,
        limit = 50,
        opts?: {
          scope?: "membership" | "tenant";
          parentId?: string | null;
          tree?: boolean;
        },
      ) =>
        client.get<IdentityOrganization[]>(
          withQuery(v1("organizations"), {
            page,
            limit,
            scope: opts?.scope,
            parentId:
              opts?.parentId === null
                ? ""
                : opts?.parentId === undefined
                  ? undefined
                  : opts.parentId,
            tree: opts?.tree ? "true" : undefined,
          }),
        ),
      get: (organizationId: string) =>
        client.get<IdentityOrganization>(v1(`organizations/${organizationId}`)),
      create: (body: Record<string, unknown>) =>
        client.post<IdentityOrganization>(v1("organizations"), body),
      patch: (organizationId: string, body: Record<string, unknown>) =>
        client.patch<IdentityOrganization>(
          v1(`organizations/${organizationId}`),
          body,
        ),
      suspend: (organizationId: string) =>
        client.post<IdentityOrganization>(
          v1(`organizations/${organizationId}/suspend`),
        ),
      activate: (organizationId: string) =>
        client.post<IdentityOrganization>(
          v1(`organizations/${organizationId}/activate`),
        ),
      warehouses: {
        list: (organizationId: string) =>
          client.get<OrgWarehouse[]>(
            v1(`organizations/${organizationId}/warehouses`),
          ),
        create: (organizationId: string, body: Record<string, unknown>) =>
          client.post<OrgWarehouse>(
            v1(`organizations/${organizationId}/warehouses`),
            body,
          ),
        patch: (
          organizationId: string,
          warehouseId: string,
          body: Record<string, unknown>,
        ) =>
          client.patch<OrgWarehouse>(
            v1(`organizations/${organizationId}/warehouses/${warehouseId}`),
            body,
          ),
        remove: (organizationId: string, warehouseId: string) =>
          client.delete(
            v1(`organizations/${organizationId}/warehouses/${warehouseId}`),
          ),
      },
      posTerminals: {
        list: (organizationId: string) =>
          client.get<OrgPosTerminal[]>(
            v1(`organizations/${organizationId}/pos-terminals`),
          ),
        create: (organizationId: string, body: Record<string, unknown>) =>
          client.post<OrgPosTerminal>(
            v1(`organizations/${organizationId}/pos-terminals`),
            body,
          ),
        patch: (
          organizationId: string,
          terminalId: string,
          body: Record<string, unknown>,
        ) =>
          client.patch<OrgPosTerminal>(
            v1(`organizations/${organizationId}/pos-terminals/${terminalId}`),
            body,
          ),
        remove: (organizationId: string, terminalId: string) =>
          client.delete(
            v1(`organizations/${organizationId}/pos-terminals/${terminalId}`),
          ),
      },
      cashRegisters: {
        list: (organizationId: string) =>
          client.get<OrgCashRegister[]>(
            v1(`organizations/${organizationId}/cash-registers`),
          ),
        create: (organizationId: string, body: Record<string, unknown>) =>
          client.post<OrgCashRegister>(
            v1(`organizations/${organizationId}/cash-registers`),
            body,
          ),
        patch: (
          organizationId: string,
          registerId: string,
          body: Record<string, unknown>,
        ) =>
          client.patch<OrgCashRegister>(
            v1(`organizations/${organizationId}/cash-registers/${registerId}`),
            body,
          ),
        remove: (organizationId: string, registerId: string) =>
          client.delete(
            v1(`organizations/${organizationId}/cash-registers/${registerId}`),
          ),
      },
      workflows: {
        list: (organizationId: string) =>
          client.get<OrgWorkflow[]>(
            v1(`organizations/${organizationId}/workflows`),
          ),
        create: (organizationId: string, body: Record<string, unknown>) =>
          client.post<OrgWorkflow>(
            v1(`organizations/${organizationId}/workflows`),
            body,
          ),
        patch: (
          organizationId: string,
          workflowId: string,
          body: Record<string, unknown>,
        ) =>
          client.patch<OrgWorkflow>(
            v1(`organizations/${organizationId}/workflows/${workflowId}`),
            body,
          ),
        remove: (organizationId: string, workflowId: string) =>
          client.delete(
            v1(`organizations/${organizationId}/workflows/${workflowId}`),
          ),
      },
    },

    users: {
      list: (page = 1, limit = 50, status?: string, search?: string) =>
        client.get<ApplicationUser[]>(
          withQuery(v1("users"), { page, limit, status, search }),
        ),
      me: () => client.get<ApplicationUser>(v1("users/me")),
      patchMe: (profile: Record<string, unknown>) =>
        client.patch<ApplicationUser>(v1("users/me"), { profile }),
      uploadAvatar: (file: File) => {
        const body = new FormData();
        body.append("file", file);
        return client.postForm<ApplicationUser>(v1("users/me/avatar"), body);
      },
      preferences: {
        get: () =>
          client.get<{ settings: Record<string, unknown> }>(
            v1("users/me/preferences"),
          ),
        patch: (settings: Record<string, unknown>) =>
          client.patch<{ settings: Record<string, unknown> }>(
            v1("users/me/preferences"),
            { settings },
          ),
      },
      personalization: {
        get: () => client.get<UserPersonalization>(v1("users/me/personalization")),
        patch: (personalization: Record<string, unknown>) =>
          client.patch<UserPersonalization>(v1("users/me/personalization"), {
            personalization,
          }),
      },
      notifications: {
        list: (page = 1, limit = 20, unreadOnly?: boolean) =>
          client.get<UserNotification[]>(
            withQuery(v1("users/me/notifications"), {
              page,
              limit,
              unreadOnly: unreadOnly ? "true" : undefined,
            }),
          ),
        create: (body: {
          title: string;
          body?: string;
          category?: string;
          priority?: string;
          payload?: Record<string, unknown>;
        }) => client.post<UserNotification>(v1("users/me/notifications"), body),
        markRead: (notificationId: string) =>
          client.post<UserNotification>(
            v1(`users/me/notifications/${notificationId}/read`),
          ),
        markAllRead: () =>
          client.post<{ marked: number }>(v1("users/me/notifications/read-all")),
        remove: (notificationId: string) =>
          client.delete<{ deleted: boolean }>(
            v1(`users/me/notifications/${notificationId}`),
          ),
      },
      devices: {
        list: (syncSessions = true) =>
          client.get<{ devices: UserDevice[]; keycloakAvailable: boolean }>(
            withQuery(v1("users/me/devices"), {
              syncSessions: syncSessions ? "true" : "false",
            }),
          ),
        trust: (deviceId: string, trusted: boolean) =>
          client.patch<UserDevice>(v1(`users/me/devices/${deviceId}`), {
            trusted,
          }),
        remove: (deviceId: string) =>
          client.delete<{ deleted: boolean }>(
            v1(`users/me/devices/${deviceId}`),
          ),
        enrollPush: (body: {
          deviceName: string;
          pushToken: string;
          pushPlatform: string;
          platform?: string;
        }) => client.post<UserDevice>(v1("users/me/devices/enroll-push"), body),
        clearPush: (deviceId: string) =>
          client.delete<UserDevice>(
            v1(`users/me/devices/${deviceId}/push`),
          ),
      },
      loginHistory: {
        list: (page = 1, limit = 50) =>
          client.get<UserLoginHistoryEntry[]>(
            withQuery(v1("users/me/login-history"), { page, limit }),
          ),
        record: (body?: {
          eventType?: string;
          success?: boolean;
          metadata?: Record<string, unknown>;
        }) =>
          client.post<{
            entry: UserLoginHistoryEntry;
            created: boolean;
          }>(v1("users/me/login-history"), body ?? {}),
      },
      apiTokens: {
        list: () =>
          client.get<{ tokens: UserApiToken[] }>(v1("users/me/api-tokens")),
        create: (body: {
          name: string;
          scopes?: string[];
          expiresAt?: string | null;
        }) =>
          client.post<{ token: UserApiToken; plaintext: string }>(
            v1("users/me/api-tokens"),
            body,
          ),
        revoke: (tokenId: string) =>
          client.delete<UserApiToken>(v1(`users/me/api-tokens/${tokenId}`)),
      },
      activity: {
        list: (page = 1, limit = 30) =>
          client.get<UserActivityEvent[]>(
            withQuery(v1("users/me/activity"), { page, limit }),
          ),
        create: (body: {
          title: string;
          detail?: string;
          category?: string;
          href?: string | null;
          payload?: Record<string, unknown>;
        }) => client.post<UserActivityEvent>(v1("users/me/activity"), body),
        clear: () =>
          client.delete<{ deleted: number }>(v1("users/me/activity")),
      },
      security: {
        get: (redirectUri?: string) =>
          client.get<MySecurityOverview>(
            withQuery(v1("users/me/security"), { redirectUri }),
          ),
        deleteCredential: (credentialId: string) =>
          client.delete<{ deleted: boolean; credentialId: string }>(
            v1(`users/me/security/credentials/${credentialId}`),
          ),
      },
      identity: {
        get: (redirectUri?: string) =>
          client.get<MyIdentityOverview>(
            withQuery(v1("users/me/identity"), { redirectUri }),
          ),
        unlink: (provider: string) =>
          client.delete<{ unlinked: boolean; provider: string }>(
            v1(`users/me/identity/links/${encodeURIComponent(provider)}`),
          ),
        verifyEmail: () =>
          client.post<{ sent: boolean }>(v1("users/me/identity/verify-email")),
        resetPassword: () =>
          client.post<{ sent: boolean }>(
            v1("users/me/identity/reset-password"),
          ),
        sendPhoneOtp: (phoneE164: string) =>
          client.post<{
            sent: boolean;
            expiresInSeconds: number;
            dryRun?: boolean;
          }>(v1("users/me/identity/phone/send-otp"), { phoneE164 }),
        verifyPhoneOtp: (phoneE164: string, code: string) =>
          client.post<{ verified: boolean; phoneE164: string }>(
            v1("users/me/identity/phone/verify-otp"),
            { phoneE164, code },
          ),
      },
      myMemberships: (page = 1, limit = 20) =>
        client.get<Membership[]>(
          withQuery(v1("users/me/memberships"), { page, limit }),
        ),
      get: (identityId: string) =>
        client.get<ApplicationUser>(v1(`users/${identityId}`)),
      suspend: (identityId: string) =>
        client.post<ApplicationUser>(v1(`users/${identityId}/suspend`)),
      disable: (identityId: string) =>
        client.post<ApplicationUser>(v1(`users/${identityId}/disable`)),
      reactivate: (identityId: string) =>
        client.post<ApplicationUser>(v1(`users/${identityId}/reactivate`)),
    },

    memberships: {
      list: (
        page = 1,
        limit = 20,
        organizationId?: string,
        opts?: { status?: string; search?: string },
      ) =>
        client.get<Membership[]>(
          withQuery(v1("memberships"), {
            page,
            limit,
            organizationId,
            status: opts?.status,
            search: opts?.search,
          }),
        ),
      create: (body: {
        userId: string;
        organizationId: string;
        roles?: string[];
        permissions?: string[];
        resourceScopes?: MembershipResourceScope[];
        status?: string;
        department?: string;
        position?: string;
        managerUserId?: string;
        expiresAt?: string;
      }) => client.post<Membership>(v1("memberships"), body),
      patch: (
        membershipId: string,
        body: {
          roles?: string[];
          permissions?: string[];
          resourceScopes?: MembershipResourceScope[];
          status?: string;
          department?: string | null;
          position?: string | null;
          managerUserId?: string | null;
          expiresAt?: string | null;
          [key: string]: unknown;
        },
      ) => client.patch<Membership>(v1(`memberships/${membershipId}`), body),
      revoke: (membershipId: string) =>
        client.delete<Membership>(v1(`memberships/${membershipId}`)),
    },

    invitations: {
      list: (
        page = 1,
        limit = 20,
        organizationId?: string,
        opts?: { status?: string; search?: string },
      ) =>
        client.get<Invitation[]>(
          withQuery(v1("invitations"), {
            page,
            limit,
            organizationId,
            status: opts?.status,
            search: opts?.search,
          }),
        ),
      create: (body: {
        organizationId: string;
        email: string;
        roles?: string[];
        permissions?: string[];
        expiresInHours?: number;
      }) => client.post<Invitation>(v1("invitations"), body),
      accept: (token: string) =>
        client.post<{ membershipId?: string; [key: string]: unknown }>(
          v1("invitations/accept"),
          { token },
        ),
      revoke: (invitationId: string) =>
        client.post<Invitation>(v1(`invitations/${invitationId}/revoke`)),
    },

    roles: {
      list: (page = 1, limit = 100) =>
        client.get<Role[]>(withQuery(v1("roles"), { page, limit })),
      create: (body: {
        name: string;
        scope: "tenant" | "organization";
        description?: string;
        permissions?: string[];
      }) => client.post<Role>(v1("roles"), body),
      patch: (
        roleId: string,
        body: { description?: string; permissions?: string[] },
      ) => client.patch<Role>(v1(`roles/${roleId}`), body),
      delete: (roleId: string) =>
        client.delete<{ deleted: boolean; roleId: string }>(
          v1(`roles/${roleId}`),
        ),
    },

    permissions: {
      list: (page = 1, limit = 100) => {
        const safeLimit = Math.min(Math.max(1, limit), 100);
        return client.get<Permission[]>(
          withQuery(v1("permissions"), { page, limit: safeLimit }),
        );
      },
      /** Loads the full backend catalog (paginated under the hood, max 100/page). */
      listAll: async () => {
        const all: Permission[] = [];
        let page = 1;
        const limit = 100;
        for (;;) {
          const res = await client.get<Permission[]>(
            withQuery(v1("permissions"), { page, limit }),
          );
          all.push(...(res.data ?? []));
          if (!res.pagination?.hasNext) break;
          page += 1;
          if (page > 50) break;
        }
        return { data: all };
      },
    },

    tenants: {
      get: (tenantId: string) =>
        client.get<Tenant>(v1(`tenants/${tenantId}`)),
      patch: (tenantId: string, body: Record<string, unknown>) =>
        client.patch<Tenant>(v1(`tenants/${tenantId}`), body),
      status: (tenantId: string, status: string) =>
        client.post<Tenant>(v1(`tenants/${tenantId}/status`), { status }),
      transferOwnership: (tenantId: string, newOwnerIdentityId: string) =>
        client.post<{ tenantId: string; ownerIdentityId: string }>(
          v1(`tenants/${tenantId}/ownership/transfer`),
          { newOwnerIdentityId },
        ),
    },

    settings: {
      catalog: () =>
        client.get<
          Array<{
            namespace: string;
            keys: Array<{
              key: string;
              type: string;
              default: unknown;
              overrideable: boolean;
              sensitive: boolean;
            }>;
          }>
        >(v1("settings/catalog")),
      getTenantNs: (namespace: string) =>
        client.get<SettingsNamespace>(v1(`settings/tenant/${namespace}`)),
      patchTenantNs: (namespace: string, values: Record<string, unknown>) =>
        client.patch<SettingsNamespace>(v1(`settings/tenant/${namespace}`), {
          values,
        }),
      getOrgNs: (organizationId: string, namespace: string) =>
        client.get<SettingsNamespace>(
          v1(`settings/organizations/${organizationId}/${namespace}`),
        ),
      patchOrgNs: (
        organizationId: string,
        namespace: string,
        values: Record<string, unknown>,
      ) =>
        client.patch<SettingsNamespace>(
          v1(`settings/organizations/${organizationId}/${namespace}`),
          { values },
        ),
    },

    tenantSettings: {
      list: (resource: string) =>
        client.get<Record<string, unknown>[]>(v1(`tenant-settings/${resource}`)),
      create: (resource: string, body: Record<string, unknown>) =>
        client.post<Record<string, unknown>>(v1(`tenant-settings/${resource}`), body),
      update: (resource: string, id: string, body: Record<string, unknown>) =>
        client.patch<Record<string, unknown>>(
          v1(`tenant-settings/${resource}/${id}`),
          body,
        ),
      remove: (resource: string, id: string) =>
        client.delete<{ deleted: boolean }>(
          v1(`tenant-settings/${resource}/${id}`),
        ),
      modules: () =>
        client.get<{
          modules: Array<{
            key: string;
            planEnabled: boolean;
            overlayEnabled: boolean;
            effective: boolean;
          }>;
        }>(v1("tenant-settings/modules")),
      patchModules: (overlays: Record<string, boolean>) =>
        client.patch<{
          modules: Array<{
            key: string;
            planEnabled: boolean;
            overlayEnabled: boolean;
            effective: boolean;
          }>;
        }>(v1("tenant-settings/modules"), { overlays }),
      billing: () =>
        client.get<{
          plan: Record<string, unknown> | null;
          quotas: Record<string, unknown> | null;
          subscription: Record<string, unknown> | null;
          invoices: Record<string, unknown>[];
          billingSettings: Record<string, unknown>;
        }>(v1("tenant-settings/billing")),
      previewNumber: (id: string) =>
        client.post<{ preview: string; nextValue: number }>(
          v1(`tenant-settings/numbering/${id}/preview`),
        ),
      nextNumber: (id: string) =>
        client.post<{ preview: string; nextValue: number }>(
          v1(`tenant-settings/numbering/${id}/next`),
        ),
    },

    auditLogs: {
      list: (opts?: {
        page?: number;
        limit?: number;
        action?: string;
        resource?: string;
      }) =>
        client.get<Record<string, unknown>[]>(
          withQuery(v1("audit-logs"), opts ?? {}),
        ),
    },

    security: {
      getPolicies: () =>
        client.get<SecurityPolicies>(v1("security/policies")),
      patchPolicies: (body: Record<string, unknown>) =>
        client.patch<SecurityPolicies>(v1("security/policies"), body),
      mfaStatus: () => client.get<MfaStatus>(v1("security/mfa/status")),
      identityProviders: () =>
        client.get<{
          providers: IdentityProviderInfo[];
          keycloakAvailable: boolean;
        }>(v1("security/identity-providers")),
      getIdentityProvider: (alias: string) =>
        client.get<IdentityProviderInfo>(
          v1(`security/identity-providers/${encodeURIComponent(alias)}`),
        ),
      createIdentityProvider: (body: {
        alias: string;
        providerId: string;
        displayName?: string;
        enabled?: boolean;
        linkOnly?: boolean;
        config?: Record<string, string>;
      }) =>
        client.post<IdentityProviderInfo>(
          v1("security/identity-providers"),
          body,
        ),
      updateIdentityProvider: (
        alias: string,
        body: {
          displayName?: string | null;
          enabled?: boolean;
          linkOnly?: boolean;
          config?: Record<string, string>;
        },
      ) =>
        client.patch<IdentityProviderInfo>(
          v1(`security/identity-providers/${encodeURIComponent(alias)}`),
          body,
        ),
      deleteIdentityProvider: (alias: string) =>
        client.delete<{ deleted: true; alias: string }>(
          v1(`security/identity-providers/${encodeURIComponent(alias)}`),
        ),
    },

    sessions: {
      list: (page = 1, limit = 50) =>
        client.get<{
          sessions: SessionInfo[];
          keycloakAvailable?: boolean;
        }>(withQuery(v1("sessions"), { page, limit })),
      revoke: (sessionId: string, denylistCallerToken?: boolean) =>
        client.post<{ revoked: boolean }>(v1("sessions/revoke"), {
          sessionId,
          denylistCallerToken,
        }),
      logout: () =>
        client.post<{ loggedOut: boolean }>(v1("sessions/logout")),
      revokeAll: () =>
        client.post<{ revokedCount?: number }>(v1("sessions/revoke-all")),
    },

    featureFlags: {
      get: (page = 1, limit = 100) =>
        client.get<FeatureFlagEntry[]>(
          withQuery(v1("feature-flags"), { page, limit }),
        ),
    },

    delegations: {
      list: (page = 1, limit = 50) =>
        client.get<Delegation[]>(
          withQuery(v1("delegations"), { page, limit }),
        ),
      grant: (body: {
        organizationId: string;
        granteeIdentityId: string;
        permissions: string[];
        expiresInHours?: number;
      }) => client.post<Delegation>(v1("delegations"), body),
      revoke: (delegationId: string) =>
        client.post<Delegation>(v1(`delegations/${delegationId}/revoke`)),
    },

    emergencyAccess: {
      list: (page = 1, limit = 50) =>
        client.get<EmergencyAccessGrant[]>(
          withQuery(v1("emergency-access"), { page, limit }),
        ),
      grant: (body: {
        operatorIdentityId: string;
        reason: string;
        organizationId?: string;
        scope?: Record<string, unknown>;
        expiresInHours?: number;
      }) => client.post<EmergencyAccessGrant>(v1("emergency-access"), body),
      revoke: (grantId: string) =>
        client.post<EmergencyAccessGrant>(
          v1(`emergency-access/${grantId}/revoke`),
        ),
    },
  };
}
