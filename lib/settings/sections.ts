export type SettingsSectionId =
  | "general"
  | "company"
  | "tenant"
  | "organization"
  | "authentication"
  | "mfa"
  | "sso"
  | "identity-providers"
  | "users"
  | "roles"
  | "audit";

export type SettingsSection = {
  id: SettingsSectionId;
  href: string;
  labelEn: string;
  labelFr: string;
  permission: string;
  namespace?: string;
  resource?: string;
  kind:
    | "tenant-profile"
    | "namespace"
    | "resource"
    | "modules"
    | "billing"
    | "audit"
    | "security"
    | "features"
    | "identity-providers"
    | "external";
};

/** Tenant, user, and organization administration. */
export const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: "general", href: "/settings/general", labelEn: "General", labelFr: "Général", permission: "tenant:read", kind: "tenant-profile" },
  { id: "company", href: "/settings/company", labelEn: "Company", labelFr: "Société", permission: "tenant:read", kind: "tenant-profile" },
  { id: "tenant", href: "/settings/tenant", labelEn: "Tenant", labelFr: "Tenant", permission: "tenant:read", kind: "tenant-profile" },
  { id: "organization", href: "/settings/organization", labelEn: "Organization", labelFr: "Organisation", permission: "organizations:read", kind: "external" },
  { id: "users", href: "/identity/users", labelEn: "Users", labelFr: "Utilisateurs", permission: "users:read", kind: "external" },
  { id: "roles", href: "/identity/roles", labelEn: "Roles", labelFr: "Rôles", permission: "roles:read", kind: "external" },
  {
    id: "authentication",
    href: "/settings/authentication",
    labelEn: "Authentication",
    labelFr: "Authentification",
    permission: "security:read",
    kind: "security",
  },
  {
    id: "mfa",
    href: "/settings/mfa",
    labelEn: "MFA",
    labelFr: "MFA",
    permission: "security:read",
    kind: "security",
  },
  {
    id: "sso",
    href: "/settings/sso",
    labelEn: "SSO",
    labelFr: "SSO",
    permission: "security:read",
    kind: "security",
  },
  {
    id: "identity-providers",
    href: "/settings/identity-providers",
    labelEn: "Identity providers",
    labelFr: "Fournisseurs d'identité",
    permission: "security:read",
    kind: "identity-providers",
  },
  { id: "audit", href: "/settings/audit", labelEn: "Audit", labelFr: "Audit", permission: "audit:read", kind: "audit" },
];

export type MySettingsLink = {
  id: string;
  href: string;
  labelEn: string;
  labelFr: string;
};

/** Personal User + Identity self-service (§53). */
export const MY_SETTINGS_LINKS: MySettingsLink[] = [
  { id: "profile", href: "/settings/profile", labelEn: "Profile", labelFr: "Profil" },
  { id: "preferences", href: "/settings/preferences", labelEn: "Preferences", labelFr: "Préférences" },
  { id: "personalization", href: "/settings/personalization", labelEn: "Personalization", labelFr: "Personnalisation" },
  { id: "memberships", href: "/settings/memberships", labelEn: "Memberships", labelFr: "Appartenances" },
  { id: "identity", href: "/settings/security", labelEn: "Identity & security", labelFr: "Identité & sécurité" },
  { id: "connected-apps", href: "/settings/security?tab=tokens", labelEn: "Connected apps", labelFr: "Apps connectées" },
  { id: "activity", href: "/settings/activity", labelEn: "Activity", labelFr: "Activité" },
];

export type SettingsNavGroup = {
  id: string;
  labelEn: string;
  labelFr: string;
  sectionIds: SettingsSectionId[];
};

/** Tenant administration, grouped for the settings rail. */
export const TENANT_NAV_GROUPS: SettingsNavGroup[] = [
  {
    id: "workspace",
    labelEn: "Tenant",
    labelFr: "Tenant",
    sectionIds: ["general", "company", "tenant", "organization"],
  },
  {
    id: "people",
    labelEn: "People",
    labelFr: "Personnes",
    sectionIds: ["users", "roles"],
  },
  {
    id: "security",
    labelEn: "Security",
    labelFr: "Sécurité",
    sectionIds: ["authentication", "mfa", "sso", "identity-providers", "audit"],
  },
];
