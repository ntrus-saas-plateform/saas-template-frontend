"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shell/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppearanceSettingsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/settings/preferences#appearance");
  }, [router]);

  return (
    <>
      <PageHeader
        title="Appearance"
        description="Theme and density live in Preferences…"
      />
      <Skeleton className="h-24 w-full" />
    </>
  );
}
