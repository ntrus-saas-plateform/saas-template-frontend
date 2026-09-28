import type { ApplicationManifest } from "@/shell/applications/types";

/**
 * Core is pinned in the sidebar footer only.
 * Identity tools live on the Core workspace page — not in shell primary nav.
 */
export const coreManifest: ApplicationManifest = {
  id: "core",
  name: "Core",
  description: "Workspace, identity context and platform overview",
  icon: "LayoutDashboard",
  href: "/",
  defaultStatus: "ACTIVE",
  navigation: [],
};

/** Identity destinations shown inside the Core app page (not shell nav). */
export const coreIdentityLinks = [
  {
    id: "organizations",
    label: "Organizations",
    href: "/identity/organizations",
    permission: "organizations:read",
    description: "Hierarchy hub: address, members, settings, warehouses, POS",
  },
  {
    id: "users",
    label: "Users",
    href: "/identity/users",
    permission: "users:read",
    description: "Directory and account status",
  },
  {
    id: "memberships",
    label: "Memberships",
    href: "/identity/memberships",
    permission: "memberships:read",
    description: "Who belongs to which organization",
  },
  {
    id: "invitations",
    label: "Invitations",
    href: "/identity/invitations",
    permission: "users:invite",
    description: "Pending and sent invites",
  },
  {
    id: "roles",
    label: "Roles",
    href: "/identity/roles",
    permission: "roles:read",
    description: "Role definitions and assignments",
  },
  {
    id: "delegations",
    label: "Delegations",
    href: "/identity/delegations",
    permission: "delegation:read",
    description: "Temporary access grants",
  },
  {
    id: "emergency",
    label: "Emergency access",
    href: "/identity/emergency",
    permission: "emergency_access:read",
    description: "Break-glass access requests",
  },
] as const;
