import { adminManifest } from "@/applications/admin/manifest";
import { coreManifest } from "@/applications/core/manifest";
import type {
  AppLifecycleStatus,
  ApplicationManifest,
} from "@/shell/applications/types";
import {
  hasPermission,
  hasPlatformAdminAccess,
} from "@/lib/access/permissions";
import type {
  CapabilitiesSnapshot,
  PlatformContext,
} from "@/types/platform";

/** Identity is part of Core — not a separate shell app. */
export const applicationRegistry: ApplicationManifest[] = [
  coreManifest,
  adminManifest,
];

export function resolveAppStatus(
  manifest: ApplicationManifest,
  capabilities: CapabilitiesSnapshot | null,
  context?: PlatformContext | null,
): AppLifecycleStatus {
  if (manifest.defaultStatus === "NOT_SUBSCRIBED") {
    return "NOT_SUBSCRIBED";
  }
  if (!capabilities && !context) return "UNAVAILABLE";

  if (manifest.id === "admin") {
    return hasPlatformAdminAccess(capabilities, context)
      ? "ACTIVE"
      : "UNAVAILABLE";
  }

  if (!capabilities) return "UNAVAILABLE";

  if (manifest.requiredModule) {
    const moduleOn =
      capabilities.modules[manifest.requiredModule] === true ||
      capabilities.navigationHints.includes(manifest.requiredModule);
    if (!moduleOn) {
      return "NOT_SUBSCRIBED";
    }
  }

  if (
    manifest.requiredPermission &&
    !hasPermission(capabilities.permissions, manifest.requiredPermission)
  ) {
    return "UNAVAILABLE";
  }

  return "ACTIVE";
}

export function getManifest(id: string): ApplicationManifest | undefined {
  return applicationRegistry.find((m) => m.id === id);
}
