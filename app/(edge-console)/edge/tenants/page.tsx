import type { Metadata } from "next";
import { EdgeTenantManagementModule } from "@/components/edge/tenant-management/edge-tenant-management-module";

export const metadata: Metadata = {
  title: "Tenant Management | Edge Console",
  description:
    "Advanced tenant registry, governance queues, and portfolio analytics (P8)",
};

/**
 * Edge Admin Console — Tenant Management Center (P8).
 */
export default function EdgeTenantManagementPage() {
  return (
    <div className="space-y-6 p-6" data-testid="edge-tenant-management-page">
      <div>
        <h1 className="text-2xl font-semibold">Tenant Management</h1>
        <p className="text-sm text-muted-foreground">
          Registry P8, lifecycle governance, exceptions, and reconciliation —
          metrics and statuses from the Edge API only.
        </p>
      </div>
      <EdgeTenantManagementModule />
    </div>
  );
}