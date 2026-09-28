"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shell/page-header";
import { SettingsStages } from "@/components/settings/settings-stages";
import { SettingsFact } from "@/components/settings/settings-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { identityApi } from "@/lib/api/identity";
import { qk } from "@/lib/query/keys";
import { useApiClient, usePlatform } from "@/providers/platform-provider";
import { usePreferences } from "@/providers/preferences-provider";

const ORG_LINKS = [
  { tab: "general", labelEn: "General", labelFr: "Général" },
  { tab: "address", labelEn: "Address & contact", labelFr: "Adresse & contact" },
  { tab: "operational", labelEn: "Business hours", labelFr: "Horaires" },
  { tab: "members", labelEn: "Members", labelFr: "Membres" },
  { tab: "settings", labelEn: "Organization overrides", labelFr: "Overrides organisation" },
] as const;

export default function OrganizationSettingsHubPage() {
  const client = useApiClient();
  const { context, organizations } = usePlatform();
  const { locale } = usePreferences();
  const fr = locale === "fr";
  const orgId = context?.organizationId;
  const bootOrg = organizations?.find((o) => o.id === orgId);
  const idk = qk.identity(orgId);
  const api = identityApi(client);

  const detailQuery = useQuery({
    queryKey: idk.organization(orgId ?? "none"),
    queryFn: async () => api.organizations.get(orgId!),
    enabled: Boolean(orgId),
  });

  const org = detailQuery.data?.data ?? bootOrg;
  const kcOrgId =
    (org as { keycloakOrganizationId?: string | null } | undefined)
      ?.keycloakOrganizationId ?? null;

  return (
    <>
      <PageHeader
        title={fr ? "Paramètres organisation" : "Organization settings"}
        description={
          fr
            ? "Hub vers la fiche organisation active (identité Keycloak + overrides métier)."
            : "Hub for the active organization (Keycloak identity)."
        }
      />

      {!orgId ? (
        <p className="type-sm text-[var(--text-muted)]">
          {fr
            ? "Aucune organisation active. Basculez via le sélecteur d'organisation."
            : "No active organization. Switch via the organization switcher."}
        </p>
      ) : detailQuery.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <SettingsStages
          stages={[
            {
              id: "identity",
              label: fr ? "Identité" : "Identity",
              description: fr
                ? "Organisation active et synchronisation Keycloak."
                : "Active organization and Keycloak sync.",
              content: (
                <>
                  <SettingsFact label={fr ? "Nom" : "Name"}>
                    {org?.name ?? orgId}
                  </SettingsFact>
                  <SettingsFact label="App ID">
                    <span className="font-mono type-xs">{orgId}</span>
                  </SettingsFact>
                  <SettingsFact label="Keycloak">
                    {kcOrgId ? (
                      <Badge tone="info" className="font-mono type-xs">
                        {kcOrgId}
                      </Badge>
                    ) : (
                      <Badge tone="warning">
                        {fr ? "Non synchronisé" : "Not synced"}
                      </Badge>
                    )}
                  </SettingsFact>
                  <div className="sm:col-span-2">
                    <Button asChild>
                      <Link href={`/identity/organizations/${orgId}?tab=settings`}>
                        {fr ? "Ouvrir la fiche complète" : "Open full organization page"}
                      </Link>
                    </Button>
                  </div>
                </>
              ),
              footer: null,
            },
            {
              id: "sections",
              label: fr ? "Sections" : "Sections",
              description: fr
                ? "Raccourcis vers les onglets de la fiche organisation."
                : "Shortcuts to organization record tabs.",
              columns: 1,
              content: (
                <ul className="space-y-[var(--space-2)]">
                  {ORG_LINKS.map((item) => (
                    <li key={item.tab}>
                      <Link
                        className="type-sm text-[var(--primary)] underline-offset-2 hover:underline"
                        href={`/identity/organizations/${orgId}?tab=${item.tab}`}
                      >
                        {fr ? item.labelFr : item.labelEn}
                      </Link>
                    </li>
                  ))}
                </ul>
              ),
              footer: null,
            },
          ]}
        />
      )}
    </>
  );
}
