import type { ApplicationManifest } from "@/shell/applications/types";

export const adminManifest: ApplicationManifest = {
  id: "admin",
  name: "Platform Admin",
  description: "Tenant provisioning, domains, and reconciliation",
  icon: "KeyRound",
  href: "/admin/tenants",
  defaultStatus: "ACTIVE",
  navigation: [
    {
      id: "tenants",
      label: "Tenants",
      href: "/admin/tenants",
      section: "administration",
    },
    {
      id: "domains",
      label: "Domains",
      href: "/admin/domains",
      section: "administration",
    },
    {
      id: "reconciliation",
      label: "Reconciliation",
      href: "/admin/reconciliation",
      permission: "tenant:read",
      section: "administration",
    },
  ],
};
