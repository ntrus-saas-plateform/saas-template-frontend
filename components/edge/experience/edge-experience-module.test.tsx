/** @vitest-environment jsdom */
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const listExperienceProfiles = vi.fn();
const listExperienceApplications = vi.fn();
const listTenantExperienceAssignments = vi.fn();
const getTenantExperienceAssignment = vi.fn();
const listExperienceDeploymentRuns = vi.fn();
const listExperienceEvidence = vi.fn();
const listExperienceDomains = vi.fn();
const createExperienceProfile = vi.fn();
const publishExperienceProfile = vi.fn();
const createExperienceApplication = vi.fn();
const publishExperienceApplication = vi.fn();
const assignTenantExperience = vi.fn();
const provisionTenantExperience = vi.fn();
const deactivateTenantExperience = vi.fn();
const createExperienceDomain = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/edge",
}));
vi.mock("@/lib/api/edge", () => ({
  EdgeApiError: class EdgeApiError extends Error {
    status: number;
    constructor(message: string, status = 500) {
      super(message);
      this.status = status;
    }
  },
  edgeApi: {
    listExperienceProfiles: (...args: unknown[]) =>
      listExperienceProfiles(...args),
    listExperienceApplications: (...args: unknown[]) =>
      listExperienceApplications(...args),
    listTenantExperienceAssignments: (...args: unknown[]) =>
      listTenantExperienceAssignments(...args),
    getTenantExperienceAssignment: (...args: unknown[]) =>
      getTenantExperienceAssignment(...args),
    listExperienceDeploymentRuns: (...args: unknown[]) =>
      listExperienceDeploymentRuns(...args),
    listExperienceEvidence: (...args: unknown[]) =>
      listExperienceEvidence(...args),
    listExperienceDomains: (...args: unknown[]) =>
      listExperienceDomains(...args),
    createExperienceProfile: (...args: unknown[]) =>
      createExperienceProfile(...args),
    publishExperienceProfile: (...args: unknown[]) =>
      publishExperienceProfile(...args),
    createExperienceApplication: (...args: unknown[]) =>
      createExperienceApplication(...args),
    publishExperienceApplication: (...args: unknown[]) =>
      publishExperienceApplication(...args),
    assignTenantExperience: (...args: unknown[]) =>
      assignTenantExperience(...args),
    provisionTenantExperience: (...args: unknown[]) =>
      provisionTenantExperience(...args),
    deactivateTenantExperience: (...args: unknown[]) =>
      deactivateTenantExperience(...args),
    createExperienceDomain: (...args: unknown[]) =>
      createExperienceDomain(...args),
  },
}));

const platformState = vi.hoisted(() => ({
  permissions: [] as string[],
  isLoading: false,
}));

vi.mock("@/providers/edge-platform-provider", () => ({
  useEdgePlatform: () => ({
    permissions: platformState.permissions,
    isLoading: platformState.isLoading,
    me: null,
    workspaces: [],
    activeWorkspace: null,
    activeVerticalId: null,
    isError: false,
    error: null,
    refetch: async () => undefined,
    switchWorkspace: async () => undefined,
  }),
}));

import {
  EdgeExperienceModule,
  redactExperienceForDisplay,
} from "./edge-experience-module";

beforeAll(() => {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => undefined;
  }
});

const ALL_PERMS = [
  "platform:experience:read",
  "platform:experience:manage",
  "platform:experience:deploy",
  "platform:experience:domains",
  "platform:experience:history:read",
];

const PROFILE = {
  id: "prof-1",
  code: "retail-pos",
  name: "Retail POS",
  description: null,
  productId: null,
  profileStatus: "PUBLISHED",
  compatibleRuntimeCodes: [],
  compatibleDeploymentProfileCodes: [],
  metadata: {},
  createdBy: "tester",
  updatedBy: null,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
  version: 1,
};

function renderModule() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <EdgeExperienceModule />
    </QueryClientProvider>,
  );
}

describe("EdgeExperienceModule (P7.9 console)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformState.isLoading = false;
    platformState.permissions = [...ALL_PERMS];
    listExperienceProfiles.mockResolvedValue({
      data: { items: [PROFILE], total: 1 },
    });
    listExperienceApplications.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    listTenantExperienceAssignments.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    getTenantExperienceAssignment.mockResolvedValue({ data: null });
    listExperienceDeploymentRuns.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    listExperienceEvidence.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    listExperienceDomains.mockResolvedValue({
      data: { items: [], total: 0 },
    });
  });

  it("redacts secret-looking keys for display", () => {
    const redacted = redactExperienceForDisplay({
      clientSecret: "super-secret-value",
      featureFlags: { x: true },
      nested: { apiKey: "should-never-show", ok: "visible" },
    }) as Record<string, unknown>;
    expect(redacted.clientSecret).toBe("••••••••");
    expect((redacted.nested as Record<string, unknown>).apiKey).toBe(
      "••••••••",
    );
    expect((redacted.nested as Record<string, unknown>).ok).toBe("visible");
    expect(JSON.stringify(redacted)).not.toContain("super-secret-value");
    expect(JSON.stringify(redacted)).not.toContain("should-never-show");
  });

  it("shows the forbidden state without platform:experience:read", async () => {
    platformState.permissions = [];
    renderModule();
    expect(await screen.findByText("Access restricted")).toBeTruthy();
  });

  it("renders profiles list when permitted", async () => {
    renderModule();
    expect(await screen.findByTestId("exp-profiles-table")).toBeTruthy();
    expect(screen.getByText("retail-pos")).toBeTruthy();
    expect(screen.getByText("Retail POS")).toBeTruthy();
    expect(listExperienceProfiles).toHaveBeenCalled();
  });
});
