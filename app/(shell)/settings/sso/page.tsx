"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shell/page-header";
import { Skeleton } from "@/components/ui/skeleton";

/** Thin alias → Identity providers (SSO brokers). */
export default function SsoSettingsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/settings/identity-providers");
  }, [router]);

  return (
    <>
      <PageHeader title="SSO" description="Redirecting to Identity providers…" />
      <Skeleton className="h-24 w-full" />
    </>
  );
}
