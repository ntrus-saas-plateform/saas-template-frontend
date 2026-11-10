/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const listRegistryProducts = vi.fn();
const createRegistryProduct = vi.fn();
const listRegistryPlatforms = vi.fn();
const createRegistryPlatform = vi.fn();
const listRegistryDeploymentProfiles = vi.fn();
const listRegistryCompatibilityEvaluations = vi.fn();
const listRegistryEnvironments = vi.fn();
const listRegistryControlContracts = vi.fn();
const listRegistryHistory = vi.fn();
const listProducts = vi.fn();

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
    listRegistryProducts: (...args: unknown[]) => listRegistryProducts(...args),
    createRegistryProduct: (...args: unknown[]) => createRegistryProduct(...args),
    listRegistryPlatforms: (...args: unknown[]) => listRegistryPlatforms(...args),
    createRegistryPlatform: (...args: unknown[]) => createRegistryPlatform(...args),
    listRegistryEnvironments: (...args: unknown[]) =>
      listRegistryEnvironments(...args),
    listRegistryDeploymentProfiles: (...args: unknown[]) =>
      listRegistryDeploymentProfiles(...args),
    listRegistryControlContracts: (...args: unknown[]) =>
      listRegistryControlContracts(...args),
    listRegistryCompatibilityEvaluations: (...args: unknown[]) =>
      listRegistryCompatibilityEvaluations(...args),
    evaluateRegistryCompatibility: vi.fn(),
    listRegistryHistory: (...args: unknown[]) => listRegistryHistory(...args),
    listProducts: (...args: unknown[]) => listProducts(...args),
    listRegistryProductVersions: vi.fn(async () => ({
      data: { items: [], total: 0 },
    })),
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

import RegistryManagementPage from "./page";

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <RegistryManagementPage />
    </QueryClientProvider>,
  );
}

describe("RegistryManagementPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformState.isLoading = false;
    platformState.permissions = [
      "platform:product_registry:read",
      "platform:product_registry:manage",
      "platform:product_platforms:read",
      "platform:product_platforms:manage",
      "platform:deployment_profiles:read",
      "platform:deployment_profiles:manage",
      "platform:registry_compatibility:evaluate",
    ];
    listProducts.mockResolvedValue({ data: { items: [], total: 0 } });
    listRegistryProducts.mockResolvedValue({
      data: {
        items: [
          {
            id: "pr-1",
            productId: "11111111-1111-4111-8111-111111111111",
            code: "CRM",
            name: "CRM",
            registryStatus: "DRAFT",
            certificationStatus: "UNCERTIFIED",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        total: 1,
      },
    });
    listRegistryPlatforms.mockResolvedValue({
      data: {
        items: [
          {
            id: "plat-1",
            code: "SHARED",
            name: "Shared",
            platformType: "SHARED_SAAS_PLATFORM",
            operationalStatus: "ACTIVE",
            certificationStatus: "UNCERTIFIED",
            secureConfigRef: "vault://secret/db-password-token",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        total: 1,
      },
    });
    listRegistryEnvironments.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    listRegistryDeploymentProfiles.mockResolvedValue({
      data: {
        items: [
          {
            id: "prof-1",
            code: "SHARED_SAAS",
            name: "Shared SaaS",
            profileStatus: "ACTIVE",
            certificationStatus: "UNCERTIFIED",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        total: 1,
      },
    });
    listRegistryControlContracts.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    listRegistryCompatibilityEvaluations.mockResolvedValue({
      data: {
        items: [
          {
            id: "eval-1",
            result: "COMPATIBLE",
            productRegistryId: "pr-1",
            platformId: "plat-1",
            reasons: [],
            evaluatedAt: "2026-01-01T00:00:00.000Z",
          },
          {
            id: "eval-2",
            result: "INCOMPATIBLE",
            productRegistryId: "pr-1",
            platformId: "plat-1",
            reasons: ["uncertified profile"],
            evaluatedAt: "2026-01-01T00:00:00.000Z",
          },
          {
            id: "eval-3",
            result: "REQUIRES_REVIEW",
            productRegistryId: "pr-1",
            platformId: "plat-1",
            reasons: [],
            evaluatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        total: 3,
      },
    });
    listRegistryHistory.mockResolvedValue({ data: { items: [], total: 0 } });
    createRegistryProduct.mockResolvedValue({ data: { id: "pr-new" } });
    createRegistryPlatform.mockResolvedValue({ data: { id: "plat-new" } });
  });

  it("shows forbidden when no registry read permissions", () => {
    platformState.permissions = [];
    renderPage();
    expect(
      screen.getByText(/requires at least one platform:product_registry/i),
    ).toBeTruthy();
  });

  it("loads registry tabs and product list", async () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Registry Management" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Products" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Platforms" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Profiles" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Compatibility" })).toBeTruthy();

    await waitFor(() => {
      expect(listRegistryProducts).toHaveBeenCalled();
    });
    expect(await screen.findAllByText("CRM")).not.toHaveLength(0);
  });

  it("hides create product form without manage permission", async () => {
    platformState.permissions = ["platform:product_registry:read"];
    renderPage();
    await waitFor(() => expect(listRegistryProducts).toHaveBeenCalled());
    expect(screen.queryByText("Create product registry entry")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Platforms" }),
    ).toBeNull();
  });

  it("creates a product via mocked API", async () => {
    listProducts.mockResolvedValue({
      data: {
        items: [{ id: "p1", code: "P1", name: "Product 1" }],
        total: 1,
      },
    });
    renderPage();
    await waitFor(() => expect(listRegistryProducts).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText("Registry code"), {
      target: { value: "NEW" },
    });
    fireEvent.change(screen.getByPlaceholderText("Name"), {
      target: { value: "New product" },
    });
    const selects = screen.getAllByRole("combobox");
    const productSelect = selects.find((el) =>
      Array.from(el.querySelectorAll("option")).some((o) =>
        (o.textContent ?? "").includes("Product 1"),
      ),
    );
    expect(productSelect).toBeTruthy();
    fireEvent.change(productSelect!, { target: { value: "p1" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => {
      expect(createRegistryProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: "p1",
          code: "NEW",
          name: "New product",
        }),
      );
    });
  });

  it("applies search filters and pagination offset reset", async () => {
    renderPage();
    await waitFor(() => expect(listRegistryProducts).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText("Search registry"), {
      target: { value: "crm" },
    });
    await waitFor(() => {
      expect(listRegistryProducts).toHaveBeenCalledWith(
        expect.objectContaining({ q: "crm", offset: 0 }),
      );
    });
    fireEvent.change(screen.getByLabelText("Filter by status"), {
      target: { value: "DRAFT" },
    });
    await waitFor(() => {
      expect(listRegistryProducts).toHaveBeenCalledWith(
        expect.objectContaining({ status: "DRAFT", offset: 0 }),
      );
    });
  });

  it("redacts secureConfigRef and has no password/token secret fields on platforms", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Platforms" }));
    await waitFor(() => expect(listRegistryPlatforms).toHaveBeenCalled());
    expect(await screen.findByText("•••••••• (ref present)")).toBeTruthy();
    expect(screen.queryByText("vault://secret/db-password-token")).toBeNull();
    expect(document.querySelector('input[type="password"]')).toBeNull();
    expect(
      screen.getByPlaceholderText(/Secure config ref \(opaque handle only\)/i),
    ).toBeTruthy();
  });

  it("handles API list errors", async () => {
    listRegistryProducts.mockRejectedValueOnce(new Error("boom"));
    renderPage();
    expect(await screen.findByText("boom")).toBeTruthy();
  });

  it("displays COMPATIBLE / INCOMPATIBLE / REQUIRES_REVIEW results", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Compatibility" }));
    await waitFor(() =>
      expect(listRegistryCompatibilityEvaluations).toHaveBeenCalled(),
    );
    await waitFor(() => {
      expect(
        screen.getAllByText("COMPATIBLE").some((el) => el.tagName === "SPAN"),
      ).toBe(true);
      expect(
        screen.getAllByText("INCOMPATIBLE").some((el) => el.tagName === "SPAN"),
      ).toBe(true);
      expect(
        screen
          .getAllByText("REQUIRES_REVIEW")
          .some((el) => el.tagName === "SPAN"),
      ).toBe(true);
    });
  });

  it("loads profiles tab for certification visibility (UNCERTIFIED seed)", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Profiles" }));
    await waitFor(() =>
      expect(listRegistryDeploymentProfiles).toHaveBeenCalled(),
    );
    expect(await screen.findByText("SHARED_SAAS")).toBeTruthy();
    expect(screen.getByText("UNCERTIFIED")).toBeTruthy();
  });
});
