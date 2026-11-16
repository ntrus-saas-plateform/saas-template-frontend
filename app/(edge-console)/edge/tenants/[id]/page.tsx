"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { EdgeTenantDetailModule } from "@/components/edge/tenant-management/edge-tenant-detail-module";

export default function EdgeTenantDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  return (
    <div className="space-y-6 p-6" data-testid="edge-tenant-detail-page">
      <div className="flex flex-col gap-2">
        <Link
          href="/edge/tenants"
          className="type-sm text-[var(--primary)] hover:underline"
        >
          ← Tenant Management
        </Link>
        <h1 className="text-2xl font-semibold">Tenant workspace</h1>
        <p className="text-sm text-muted-foreground">
          Vue 360° du tenant — fraîcheur UNKNOWN/STALE affichée telle quelle.
        </p>
      </div>
      {id ? (
        <EdgeTenantDetailModule tenantId={id} />
      ) : (
        <p className="type-sm text-[var(--text-muted)]">Missing tenant id.</p>
      )}
    </div>
  );
}