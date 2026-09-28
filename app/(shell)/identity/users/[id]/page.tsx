"use client";

import { useParams } from "next/navigation";
import { EmptyState } from "@/components/shell/page-header";
import { PermissionGate } from "@/components/shell/permission-gate";
import { UserAdminHub } from "@/components/identity/user-admin-hub";

export default function UserDetailPage() {
  const params = useParams();
  const id = decodeURIComponent(String(params.id ?? ""));

  return (
    <PermissionGate
      permission="users:read"
      fallback={
        <EmptyState
          title="Accès restreint"
          description="Permission users:read requise."
        />
      }
    >
      {id ? <UserAdminHub identityOrUserId={id} /> : null}
    </PermissionGate>
  );
}
