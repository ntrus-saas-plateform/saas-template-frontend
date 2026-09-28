import type { ApplicationManifest } from "@/shell/applications/types";

/**
 * Identity is folded into Core (footer). Kept for href/docs compatibility;
 * not registered as a standalone shell application.
 */
export const identityManifest: ApplicationManifest = {
  id: "identity",
  name: "Identity",
  description: "Organizations, users, roles, and access",
  icon: "Shield",
  href: "/identity/organizations",
  defaultStatus: "ACTIVE",
  navigation: [],
};
