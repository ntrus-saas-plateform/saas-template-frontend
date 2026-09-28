"use client";

import { useQuery } from "@tanstack/react-query";
import { identityApi } from "@/lib/api/identity";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { qk } from "@/lib/query/keys";

export type SearchHit = {
  id: string;
  label: string;
  href: string;
  group: string;
};

/** Domain search providers for CmdK. */
export function useSearchProviders(query: string) {
  const client = useApiClient();
  const { context } = usePlatform();
  const idk = qk.identity(context?.organizationId);
  const q = query.trim();
  const enabled = q.length >= 2;

  const users = useQuery({
    queryKey: [...idk.users(), "search", q],
    enabled,
    queryFn: async () => {
      const res = await identityApi(client).users.list(1, 20);
      const filtered = (res.data ?? []).filter((u) => {
        const email = String(u.email ?? "");
        const name = String(
          (u.profile as { displayName?: string } | null)?.displayName ?? "",
        );
        const hay = `${email} ${name} ${u.id}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      });
      return filtered.slice(0, 8).map(
        (u): SearchHit => ({
          id: u.id,
          label: String(
            u.email ??
              (u.profile as { displayName?: string } | null)?.displayName ??
              u.id,
          ),
          href: `/identity/users/${u.identityId ?? u.id}`,
          group: "Users",
        }),
      );
    },
  });

  const hits = [...(users.data ?? [])];

  return {
    hits,
    isLoading: enabled && users.isLoading,
  };
}
