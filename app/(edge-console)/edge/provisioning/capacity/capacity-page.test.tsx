/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const listPlacementRequests = vi.fn();
const createPlacementRequest = vi.fn();
const evaluatePlacementRequest = vi.fn();
const confirmPlacementRequest = vi.fn();
const cancelPlacementRequest = vi.fn();
const listCapacityInventory = vi.fn();
const upsertCapacityInventory = vi.fn();
const patchCapacityInventory = vi.fn();
const listCapacityReservations = vi.fn();
const releaseCapacityReservation = vi.fn();
const listPlacementPolicies = vi.fn();
const createPlacementPolicy = vi.fn();
const patchPlacementPolicy = vi.fn();
const listPlacementHistory = vi.fn();
const listRegistryProducts = vi.fn();
const listRegistryProductVersions = vi.fn();
const listRegistryControlContracts = vi.fn();
const listRegistryDeploymentProfiles = vi.fn();
const listRegistryPlatforms = vi.fn();
const listRegistryEnvironments = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
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
    listPlacementRequests: (...args: unknown[]) =>
      listPlacementRequests(...args),
    getPlacementRequest: vi.fn(),
    createPlacementRequest: (...args: unknown[]) =>
      createPlacementRequest(...args),
    evaluatePlacementRequest: (...args: unknown[]) =>
      evaluatePlacementRequest(...args),
    confirmPlacementRequest: (...args: unknown[]) =>
      confirmPlacementRequest(...args),
    cancelPlacementRequest: (...args: unknown[]) =>
      cancelPlacementRequest(...args),
    reEvaluatePlacementRequest: vi.fn(),
    getPlacementDecision: vi.fn(),
    listPlacementDecisionCandidates: vi.fn(),
    listPlacementHistory: (...args: unknown[]) =>
      listPlacementHistory(...args),
    listCapacityInventory: (...args: unknown[]) =>
      listCapacityInventory(...args),
    upsertCapacityInventory: (...args: unknown[]) =>
      upsertCapacityInventory(...args),
    patchCapacityInventory: (...args: unknown[]) =>
      patchCapacityInventory(...args),
    listCapacityReservations: (...args: unknown[]) =>
      listCapacityReservations(...args),
    getCapacityReservation: vi.fn(),
    releaseCapacityReservation: (...args: unknown[]) =>
      releaseCapacityReservation(...args),
    expireCapacityReservation: vi.fn(),
    listPlacementPolicies: (...args: unknown[]) =>
      listPlacementPolicies(...args),
    createPlacementPolicy: (...args: unknown[]) =>
      createPlacementPolicy(...args),
    patchPlacementPolicy: (...args: unknown[]) =>
      patchPlacementPolicy(...args),
    listRegistryProducts: (...args: unknown[]) =>
      listRegistryProducts(...args),
    listRegistryProductVersions: (...args: unknown[]) =>
      listRegistryProductVersions(...args),
    listRegistryControlContracts: (...args: unknown[]) =>
      listRegistryControlContracts(...args),
    listRegistryDeploymentProfiles: (...args: unknown[]) =>
      listRegistryDeploymentProfiles(...args),
    listRegistryPlatforms: (...args: unknown[]) =>
      listRegistryPlatforms(...args),
    listRegistryEnvironments: (...args: unknown[]) =>
      listRegistryEnvironments(...args),
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

import PlacementCapacityPage from "./page";

const ALL_PERMS = [
  "platform:placement:read",
  "platform:placement:request",
  "platform:placement:evaluate",
  "platform:placement:confirm",
  "platform:placement:cancel",
  "platform:capacity:read",
  "platform:capacity:manage",
  "platform:capacity:release",
  "platform:placement_policy:read",
  "platform:placement_policy:manage",
];

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <PlacementCapacityPage />
    </QueryClientProvider>,
  );
}

describe("PlacementCapacityPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformState.isLoading = false;
    platformState.permissions = [...ALL_PERMS];

    listPlacementRequests.mockResolvedValue({
      data: {
        items: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            provisioningRequestId: "22222222-2222-4222-8222-222222222222",
            productRegistryId: "33333333-3333-4333-8333-333333333333",
            requestStatus: "PENDING",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
          {
            id: "44444444-4444-4444-8444-444444444444",
            provisioningRequestId: "22222222-2222-4222-8222-222222222222",
            productRegistryId: "33333333-3333-4333-8333-333333333333",
            requestStatus: "REQUIRES_REVIEW",
            updatedAt: "2026-01-02T00:00:00.000Z",
          },
          {
            id: "55555555-5555-4555-8555-555555555555",
            provisioningRequestId: "22222222-2222-4222-8222-222222222222",
            productRegistryId: "33333333-3333-4333-8333-333333333333",
            requestStatus: "NO_CAPACITY",
            updatedAt: "2026-01-03T00:00:00.000Z",
          },
        ],
        total: 3,
      },
    });
    listCapacityInventory.mockResolvedValue({
      data: {
        items: [
          {
            id: "inv-1",
            platformId: "plat-1",
            environmentId: "env-1",
            resourceType: "CPU",
            unit: "cores",
            totalCapacity: 100,
            reservedCapacity: 10,
            allocatedCapacity: 20,
            availableCapacity: 70,
            unavailableCapacity: 0,
            validUntil: "2099-01-01T00:00:00.000Z",
            capacityStatus: "ACTIVE",
            version: 1,
            metadata: { dbPassword: "should-not-render" },
          },
        ],
        total: 1,
      },
    });
    listCapacityReservations.mockResolvedValue({
      data: {
        items: [
          {
            id: "res-1",
            placementRequestId: "11111111-1111-4111-8111-111111111111",
            placementDecisionId: "dec-1",
            reservationStatus: "HELD",
            expiresAt: "2099-01-01T00:00:00.000Z",
            resourceQuantities: { CPU: 2 },
            version: 3,
          },
        ],
        total: 1,
      },
    });
    listPlacementPolicies.mockResolvedValue({
      data: {
        items: [
          {
            id: "pol-1",
            code: "DEFAULT",
            name: "Default policy",
            policyVersion: 1,
            policyStatus: "DRAFT",
            algorithmVersion: "1.0.0",
            version: 1,
          },
        ],
        total: 1,
      },
    });
    listPlacementHistory.mockResolvedValue({
      data: {
        items: [
          {
            id: "h1",
            resourceType: "PLACEMENT_DECISION",
            resourceId: "dec-1",
            action: "EVALUATED",
            fromStatus: "EVALUATING",
            toStatus: "PLACED",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        total: 1,
      },
    });
    listRegistryProducts.mockResolvedValue({
      data: {
        items: [{ id: "pr-1", code: "CRM", name: "CRM" }],
        total: 1,
      },
    });
    listRegistryProductVersions.mockResolvedValue({
      data: {
        items: [{ id: "ver-1", technicalVersion: "1.0.0" }],
        total: 1,
      },
    });
    listRegistryControlContracts.mockResolvedValue({
      data: {
        items: [
          { id: "ct-1", contractCode: "CTRL", contractVersion: "1.0.0" },
        ],
        total: 1,
      },
    });
    listRegistryDeploymentProfiles.mockResolvedValue({
      data: { items: [{ id: "pf-1", code: "SHARED_SAAS" }], total: 1 },
    });
    listRegistryPlatforms.mockResolvedValue({
      data: {
        items: [{ id: "plat-1", code: "SHARED", name: "Shared" }],
        total: 1,
      },
    });
    listRegistryEnvironments.mockResolvedValue({
      data: {
        items: [
          {
            id: "env-1",
            code: "PROD",
            name: "Prod",
            platformId: "plat-1",
          },
        ],
        total: 1,
      },
    });
    createPlacementRequest.mockResolvedValue({ data: { id: "new-req" } });
    evaluatePlacementRequest.mockResolvedValue({
      data: {
        decision: {
          id: "dec-new",
          decisionStatus: "PLACED",
          policyVersion: 1,
          algorithmName: "default",
          algorithmVersion: "1.0.0",
        },
        candidates: [
          {
            id: "cand-1",
            platformId: "plat-1",
            environmentId: "env-1",
            rank: 1,
            score: 0.9,
            passedHardConstraints: true,
            excluded: false,
            hardConstraintFailures: [],
            compatibilityResult: "COMPATIBLE",
          },
        ],
      },
    });
    confirmPlacementRequest.mockResolvedValue({ data: { id: "dec-1" } });
    cancelPlacementRequest.mockResolvedValue({
      data: { id: "11111111-1111-4111-8111-111111111111", requestStatus: "CANCELLED" },
    });
    upsertCapacityInventory.mockResolvedValue({ data: { id: "inv-new" } });
    releaseCapacityReservation.mockResolvedValue({
      data: { id: "res-1", reservationStatus: "RELEASED" },
    });
    createPlacementPolicy.mockResolvedValue({ data: { id: "pol-new" } });
    patchPlacementPolicy.mockResolvedValue({
      data: { id: "pol-1", policyStatus: "ACTIVE" },
    });
    patchCapacityInventory.mockResolvedValue({ data: { id: "inv-1" } });
  });

  it("shows loading while platform permissions load", () => {
    platformState.isLoading = true;
    renderPage();
    expect(screen.getByLabelText(/Loading/i)).toBeTruthy();
  });

  it("shows forbidden without placement/capacity/policy read", () => {
    platformState.permissions = [];
    renderPage();
    expect(
      screen.getByText(/requires platform:placement:read/i),
    ).toBeTruthy();
  });

  it("renders overview with status counts and recent decisions", async () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Placement & Capacity" }),
    ).toBeTruthy();
    await waitFor(() => expect(listPlacementRequests).toHaveBeenCalled());
    expect(await screen.findByText("Requires review")).toBeTruthy();
    expect(screen.getByText("No capacity")).toBeTruthy();
    await waitFor(() => expect(listPlacementHistory).toHaveBeenCalled());
    expect(await screen.findByText("EVALUATED")).toBeTruthy();
  });

  it("shows empty overview when no requests", async () => {
    listPlacementRequests.mockResolvedValue({ data: { items: [], total: 0 } });
    listCapacityInventory.mockResolvedValue({ data: { items: [], total: 0 } });
    listPlacementHistory.mockResolvedValue({ data: { items: [], total: 0 } });
    renderPage();
    expect(await screen.findByText("No placement requests")).toBeTruthy();
    expect(screen.getByText("No capacity inventory")).toBeTruthy();
    expect(screen.getByText("No decisions yet")).toBeTruthy();
  });

  it("handles API errors on overview", async () => {
    listPlacementRequests.mockRejectedValueOnce(new Error("placement boom"));
    renderPage();
    expect(await screen.findByText("placement boom")).toBeTruthy();
  });

  it("hides create request without request permission", async () => {
    platformState.permissions = ["platform:placement:read"];
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Requests" }));
    await waitFor(() => expect(listPlacementRequests).toHaveBeenCalled());
    expect(screen.queryByText("Create placement request")).toBeNull();
    expect(screen.queryByRole("button", { name: "Evaluate" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Confirm" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
  });

  it("creates a placement request via mocked API (no free-form tenant-id)", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Requests" }));
    await waitFor(() => expect(listRegistryProducts).toHaveBeenCalled());

    expect(screen.queryByLabelText(/tenant/i)).toBeNull();
    expect(screen.getByText(/Do not supply a free-form tenant-id/i)).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Provisioning request ID"), {
      target: { value: "22222222-2222-4222-8222-222222222222" },
    });
    fireEvent.change(screen.getByLabelText("Idempotency key"), {
      target: { value: "idem-test-1" },
    });
    fireEvent.change(screen.getByLabelText("Product registry"), {
      target: { value: "pr-1" },
    });
    await waitFor(() => expect(listRegistryProductVersions).toHaveBeenCalled());
    await waitFor(() => {
      const versionSelect = screen.getByLabelText("Technical version");
      expect(
        Array.from(versionSelect.querySelectorAll("option")).some(
          (o) => (o as HTMLOptionElement).value === "ver-1",
        ),
      ).toBe(true);
    });
    fireEvent.change(screen.getByLabelText("Technical version"), {
      target: { value: "ver-1" },
    });
    fireEvent.change(screen.getByLabelText("Control contract"), {
      target: { value: "ct-1" },
    });
    fireEvent.change(screen.getByLabelText("Deployment profile"), {
      target: { value: "pf-1" },
    });
    fireEvent.change(screen.getByLabelText("CPU requirement"), {
      target: { value: "2" },
    });
    await waitFor(() => {
      expect(
        (screen.getByLabelText("Technical version") as HTMLSelectElement).value,
      ).toBe("ver-1");
    });
    fireEvent.click(screen.getByRole("button", { name: "Create request" }));

    await waitFor(() => {
      expect(createPlacementRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          provisioningRequestId: "22222222-2222-4222-8222-222222222222",
          productRegistryId: "pr-1",
          technicalVersionId: "ver-1",
          contractId: "ct-1",
          deploymentProfileId: "pf-1",
          idempotencyKey: "idem-test-1",
          capacityRequirements: { CPU: 2 },
        }),
      );
    });
    const body = createPlacementRequest.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(body).not.toHaveProperty("tenantId");
    expect(body).not.toHaveProperty("productTenantId");
  });

  it("evaluates, confirms and cancels requests when permitted", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Requests" }));
    await waitFor(() => expect(listPlacementRequests).toHaveBeenCalled());

    const evaluateButtons = await screen.findAllByRole("button", {
      name: "Evaluate",
    });
    fireEvent.click(evaluateButtons[0]!);
    await waitFor(() => {
      expect(evaluatePlacementRequest).toHaveBeenCalled();
    });

    const confirmButtons = screen.getAllByRole("button", { name: "Confirm" });
    fireEvent.click(confirmButtons[0]!);
    await waitFor(() => {
      expect(confirmPlacementRequest).toHaveBeenCalled();
    });

    const cancelButtons = screen.getAllByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButtons[0]!);
    await waitFor(() => {
      expect(cancelPlacementRequest).toHaveBeenCalled();
    });
  });

  it("shows capacity inventory, meters, and releases reservations", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Capacity" }));
    await waitFor(() => expect(listCapacityInventory).toHaveBeenCalled());
    expect(await screen.findByText("CPU")).toBeTruthy();
    expect(screen.getByText(/70\/100/)).toBeTruthy();
    expect(screen.queryByText("should-not-render")).toBeNull();

    await waitFor(() => expect(listCapacityReservations).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Release" }));
    await waitFor(() => {
      expect(releaseCapacityReservation).toHaveBeenCalledWith(
        "res-1",
        expect.objectContaining({ expectedVersion: 3 }),
      );
    });
  });

  it("creates capacity inventory when manage permitted", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Capacity" }));
    await waitFor(() => expect(listRegistryPlatforms).toHaveBeenCalled());
    await waitFor(() => expect(listRegistryEnvironments).toHaveBeenCalled());
    await waitFor(() => {
      const platformSelect = screen.getByLabelText("Capacity platform");
      expect(
        Array.from(platformSelect.querySelectorAll("option")).some(
          (o) => (o as HTMLOptionElement).value === "plat-1",
        ),
      ).toBe(true);
    });

    fireEvent.change(screen.getByLabelText("Capacity platform"), {
      target: { value: "plat-1" },
    });
    await waitFor(() => {
      expect(
        (screen.getByLabelText("Capacity platform") as HTMLSelectElement)
          .value,
      ).toBe("plat-1");
    });
    await waitFor(() => {
      const envSelect = screen.getByLabelText("Capacity environment");
      expect(
        Array.from(envSelect.querySelectorAll("option")).some(
          (o) => (o as HTMLOptionElement).value === "env-1",
        ),
      ).toBe(true);
    });
    fireEvent.change(screen.getByLabelText("Capacity environment"), {
      target: { value: "env-1" },
    });
    fireEvent.change(screen.getByLabelText("Total capacity"), {
      target: { value: "50" },
    });
    fireEvent.change(screen.getByLabelText("Valid until"), {
      target: { value: "2099-12-31T00:00" },
    });
    await waitFor(() => {
      expect(
        (screen.getByLabelText("Capacity platform") as HTMLSelectElement)
          .value,
      ).toBe("plat-1");
      expect(
        (screen.getByLabelText("Capacity environment") as HTMLSelectElement)
          .value,
      ).toBe("env-1");
    });
    fireEvent.click(screen.getByRole("button", { name: "Save inventory" }));
    await waitFor(() => {
      expect(upsertCapacityInventory).toHaveBeenCalledWith(
        expect.objectContaining({
          platformId: "plat-1",
          environmentId: "env-1",
          totalCapacity: 50,
        }),
      );
    });
  });

  it("lists and creates policies", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Policies" }));
    await waitFor(() => expect(listPlacementPolicies).toHaveBeenCalled());
    expect(await screen.findByText("DEFAULT")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Policy code"), {
      target: { value: "STRICT" },
    });
    fireEvent.change(screen.getByLabelText("Policy name"), {
      target: { value: "Strict" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create policy" }));
    await waitFor(() => {
      expect(createPlacementPolicy).toHaveBeenCalledWith(
        expect.objectContaining({ code: "STRICT", name: "Strict" }),
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Activate" }));
    await waitFor(() => {
      expect(patchPlacementPolicy).toHaveBeenCalledWith(
        "pol-1",
        expect.objectContaining({
          expectedVersion: 1,
          policyStatus: "ACTIVE",
        }),
      );
    });
  });

  it("surfaces capacity API errors", async () => {
    listCapacityInventory.mockReset();
    listCapacityInventory.mockRejectedValue(new Error("capacity down"));
    listCapacityReservations.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Capacity" }));
    expect(await screen.findByText("capacity down")).toBeTruthy();
  });
});
