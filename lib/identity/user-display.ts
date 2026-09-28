import type { ApplicationUser } from "@/lib/api/identity";

export function userProfile(user: ApplicationUser): Record<string, unknown> {
  return user.profile ?? {};
}

export function userDisplayName(user: ApplicationUser): string {
  const p = userProfile(user);
  return (
    str(p.displayName) ||
    [str(p.firstName), str(p.lastName)].filter(Boolean).join(" ") ||
    str(p.preferredName) ||
    str(p.email) ||
    user.email ||
    user.identityId ||
    user.id
  );
}

export function userEmail(user: ApplicationUser): string | null {
  const p = userProfile(user);
  return str(p.email) || user.email || null;
}

export function userJobTitle(user: ApplicationUser): string | null {
  const p = userProfile(user);
  const fromProfile = str(p.jobTitle);
  if (fromProfile) return fromProfile;
  const fromOrg = user.organizations?.find((o) => o.position)?.position;
  return fromOrg || null;
}

export function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function userStatusLabel(status?: string | null): string {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "SUSPENDED":
      return "Suspended";
    case "DISABLED":
      return "Disabled";
    case "INVITED":
      return "Invited";
    case "PENDING_ACTIVATION":
      return "Pending";
    case "LOCKED":
      return "Locked";
    case "DELETED":
      return "Deleted";
    default:
      return status
        ? status
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/^\w/, (c) => c.toUpperCase())
        : "Unknown";
  }
}

export function userStatusTone(
  status?: string | null,
): "success" | "warning" | "danger" | "info" | "default" {
  if (status === "ACTIVE") return "success";
  if (status === "SUSPENDED" || status === "LOCKED") return "warning";
  if (status === "DISABLED" || status === "DELETED") return "danger";
  if (status === "INVITED" || status === "PENDING_ACTIVATION") return "info";
  return "default";
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
