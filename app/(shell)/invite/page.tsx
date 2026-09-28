"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { identityApi } from "@/lib/api/identity";
import { useApiClient } from "@/providers/platform-provider";

function InviteAcceptPanel() {
  const client = useApiClient();
  const api = identityApi(client);
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");

  useEffect(() => {
    const fromUrl = searchParams.get("token");
    if (fromUrl) setToken(fromUrl);
  }, [searchParams]);

  const accept = useMutation({
    mutationFn: () => api.invitations.accept(token.trim()),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["identity", "memberships"] });
    },
  });

  return (
    <section className="max-w-lg space-y-3 rounded-md border border-[var(--border)] p-4">
      <p className="type-sm text-[var(--text-muted)]">
        Sign in with the invited email, then accept. You can use the link from
        the invitation email or paste the one-time token.
      </p>
      <Field label="Token" htmlFor="invite-token">
        <Input
          id="invite-token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste invitation token"
          autoComplete="off"
          spellCheck={false}
        />
      </Field>
      <Button
        type="button"
        disabled={!token.trim() || accept.isPending}
        onClick={() => accept.mutate()}
      >
        {accept.isPending ? "Accepting…" : "Accept invitation"}
      </Button>
      {accept.isError ? (
        <p className="text-sm text-[var(--danger)]">
          {accept.error instanceof Error
            ? accept.error.message
            : "Accept failed"}
        </p>
      ) : null}
      {accept.isSuccess ? (
        <p className="text-sm text-emerald-700">Invitation accepted.</p>
      ) : null}
    </section>
  );
}

export default function InvitePage() {
  return (
    <div>
      <PageHeader
        title="Accept invitation"
        description="Join the organization you were invited to."
        back={{ href: "/identity/invitations", label: "Retour aux invitations" }}
      />
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <InviteAcceptPanel />
      </Suspense>
    </div>
  );
}
