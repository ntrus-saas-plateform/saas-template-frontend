"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Deep-link alias → Identity user detail (P7). */
export default function UserDeepLinkPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/identity/users/${params.id}`);
  }, [params.id, router]);
  return null;
}
