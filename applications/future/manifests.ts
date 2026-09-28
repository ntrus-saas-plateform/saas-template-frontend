import type { ApplicationManifest } from "@/shell/applications/types";

/**
 * Reserved for catalog-driven apps once subscription entitlements are API-backed.
 * Do not register placeholder NOT_SUBSCRIBED apps in the live shell.
 */
export const futureManifests: ApplicationManifest[] = [];
