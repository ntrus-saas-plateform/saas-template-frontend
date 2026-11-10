/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const getRegistryProduct = vi.fn();
const updateRegistryProduct = vi.fn();
const transitionRegistryProduct = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ section: "products", id: "pr-1" }),
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
    getRegistryProduct: (...args: unknown[]) => getRegistryProduct(...args),
    updateRegistryProduct: (...args: unknown[]) =>
      updateRegistryProduct(...args),
    transitionRegistryProduct: (...args: unknown[]) =>
      transitionRegistryProduct(...args),
  },
}));

const platformState = vi.hoisted(() => ({
  permissions: [
    "platform:product_registry:read",
    "platform:product_registry:manage",
    "platform:product_registry:certify",
  ] as string[],
}));

vi.mock("@/providers/edge-platform-provider", () => ({
  useEdgePlatform: () => ({
    permissions: platformState.permissions,
    isLoading: false,
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

import RegistryDetailPage from "./page";

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <RegistryDetailPage />
    </QueryClientProvider>,
  );
}

describe("RegistryDetailPage product flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformState.permissions = [
      "platform:product_registry:read",
      "platform:product_registry:manage",
      "platform:product_registry:certify",
    ];
    getRegistryProduct.mockResolvedValue({
      data: {
        id: "pr-1",
        productId: "11111111-1111-4111-8111-111111111111",
        code: "CRM",
        name: "CRM",
        description: "desc",
        registryStatus: "VALIDATING",
        certificationStatus: "PENDING",
        provisionable: false,
        version: 3,
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    });
    updateRegistryProduct.mockResolvedValue({ data: { id: "pr-1" } });
    transitionRegistryProduct.mockResolvedValue({ data: { id: "pr-1" } });
  });

  it("loads detail and allows update patch", async () => {
    renderPage();
    expect(await screen.findByRole("heading", { name: "CRM" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Load current values" }));
    const nameInput = screen.getByPlaceholderText("Name");
    fireEvent.change(nameInput, { target: { value: "CRM Updated" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => {
      expect(updateRegistryProduct).toHaveBeenCalledWith(
        "pr-1",
        expect.objectContaining({
          name: "CRM Updated",
          expectedVersion: 3,
        }),
      );
    });
  });

  it("applies certification transition", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "CRM" });
    fireEvent.change(screen.getByLabelText("Target status"), {
      target: { value: "CERTIFIED" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply transition" }));
    await waitFor(() => {
      expect(transitionRegistryProduct).toHaveBeenCalledWith(
        "pr-1",
        expect.objectContaining({ toStatus: "CERTIFIED" }),
      );
    });
  });

  it("gates deprecation behind required reason", async () => {
    getRegistryProduct.mockResolvedValue({
      data: {
        id: "pr-1",
        productId: "11111111-1111-4111-8111-111111111111",
        code: "CRM",
        name: "CRM",
        registryStatus: "CERTIFIED",
        certificationStatus: "CERTIFIED",
        provisionable: true,
        version: 3,
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    });
    renderPage();
    await screen.findByRole("heading", { level: 1, name: "CRM" });
    fireEvent.change(screen.getByLabelText("Target status"), {
      target: { value: "DEPRECATED" },
    });
    expect(
      screen.getByRole("button", { name: "Apply transition" }),
    ).toBeDisabled();
    expect(screen.getByPlaceholderText("Reason (required)")).toBeTruthy();
  });

  it("hides update/transition without manage permission", async () => {
    platformState.permissions = ["platform:product_registry:read"];
    renderPage();
    await screen.findByRole("heading", { level: 1, name: "CRM" });
    expect(screen.queryByLabelText("Target status")).toBeNull();
    expect(screen.queryByText("Save changes")).toBeNull();
  });

  it("surfaces API errors on load", async () => {
    getRegistryProduct.mockRejectedValueOnce(new Error("not found"));
    renderPage();
    expect(await screen.findByText("not found")).toBeTruthy();
  });
});
