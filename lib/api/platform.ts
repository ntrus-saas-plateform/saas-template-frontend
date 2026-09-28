import type { ApiClient } from "@/lib/api/client";
import { v1 } from "@/lib/api/paths";
import type {
  CapabilitiesSnapshot,
  PlatformContext,
  PlatformOrganization,
  SwitchOrganizationResult,
} from "@/types/platform";

export function platformApi(client: ApiClient) {
  return {
    getContext: () => client.get<PlatformContext>(v1("platform/context")),
    getCapabilities: () =>
      client.get<CapabilitiesSnapshot>(v1("platform/me/capabilities")),
    listOrganizations: (page = 1, limit = 50) =>
      client.get<PlatformOrganization[]>(
        `${v1("platform/organizations")}?page=${page}&limit=${limit}`,
      ),
    switchOrganization: (organizationId: string) =>
      client.post<SwitchOrganizationResult>(v1("platform/organizations/switch"), {
        organizationId,
      }),
  };
}
