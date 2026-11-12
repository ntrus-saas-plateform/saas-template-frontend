import type { Metadata } from 'next';
import { EdgeKeycloakModule } from '@/components/edge/keycloak/edge-keycloak-module';

export const metadata: Metadata = {
  title: 'Keycloak Topology Provisioning | Edge Console',
  description:
    "Provisioning et gestion du cycle de vie des topologies Keycloak (P7.7)",
};

/**
 * Edge Admin Console — Keycloak topology provisioning page (P7.7).
 *
 * INFRASTRUCTURE console only: servers, topologies, realms/OIDC artifacts,
 * lifecycle state. No tenant end-users, tenant organizations, business
 * roles/permissions, or customer invitations (P7.7 boundary).
 */
export default function EdgeKeycloakPage() {
  return (
    <div className="space-y-6 p-6" data-testid="edge-keycloak-page">
      <div>
        <h1 className="text-2xl font-semibold">Keycloak Topology Provisioning</h1>
        <p className="text-sm text-muted-foreground">
          Provisioning et gestion du cycle de vie des topologies Keycloak — realm
          dédié (Model A), realm partagé avec Organisations (Model B) ou topology
          externe (Model C). Les secrets restent chiffrés côté serveur.
        </p>
      </div>
      <EdgeKeycloakModule />
    </div>
  );
}
