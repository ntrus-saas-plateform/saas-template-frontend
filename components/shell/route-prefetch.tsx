"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const PREFETCH = [
  "/identity/organizations",
  "/identity/users",
  "/admin/tenants",
  "/settings/profile",
];

export function RoutePrefetch() {
  const router = useRouter();
  useEffect(() => {
    for (const href of PREFETCH) {
      try {
        router.prefetch(href);
      } catch {
        /* ignore */
      }
    }
  }, [router]);
  return null;
}
