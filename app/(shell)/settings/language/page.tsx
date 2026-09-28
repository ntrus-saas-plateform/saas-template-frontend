"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shell/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function LanguageSettingsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/settings/preferences#language");
  }, [router]);

  return (
    <>
      <PageHeader
        title="Language & region"
        description="Locale and timezone live in Preferences…"
      />
      <Skeleton className="h-24 w-full" />
    </>
  );
}
