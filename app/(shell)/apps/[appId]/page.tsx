"use client";

import { useParams } from "next/navigation";
import { EmptyState, PageHeader } from "@/components/shell/page-header";
import { getManifest } from "@/shell/applications/registry";

export default function UnknownAppPage() {
  const params = useParams<{ appId: string }>();
  const appId = params.appId;
  const manifest = getManifest(appId);

  return (
    <div>
      <PageHeader
        title={manifest?.name ?? "Application"}
        description={manifest?.description}
        back={{ href: "/", label: "Retour à Core" }}
      />
      <EmptyState
        title="Application unavailable"
        description={
          manifest
            ? `${manifest.name} is not available for this tenant.`
            : "This application is not registered or not available."
        }
      />
    </div>
  );
}
