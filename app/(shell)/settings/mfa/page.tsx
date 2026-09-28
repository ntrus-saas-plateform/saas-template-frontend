"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shell/page-header";
import { Skeleton } from "@/components/ui/skeleton";

/** Thin alias → Authentication (MFA section). */
export default function MfaSettingsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/settings/authentication");
  }, [router]);

  return (
    <>
      <PageHeader title="MFA" description="Redirecting to Authentication policies…" />
      <Skeleton className="h-24 w-full" />
    </>
  );
}
