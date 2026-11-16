/** @vitest-environment jsdom */
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const listOnboardingJourneys = vi.fn();
const getOnboardingJourney = vi.fn();
const createOnboardingJourney = vi.fn();
const startOnboardingJourney = vi.fn();
const advanceOnboardingJourney = vi.fn();
const closeOnboardingJourney = vi.fn();
const decideOnboardingTask = vi.fn();
const listOnboardingTemplates = vi.fn();
const createOnboardingTemplate = vi.fn();
const publishOnboardingTemplate = vi.fn();
const listOnboardingRuns = vi.fn();
const listOnboardingEvidence = vi.fn();

vi.mock("@/lib/api/edge", () => ({
  EdgeApiError: class EdgeApiError extends Error {
    status: number;
    constructor(message: string, status = 500) {
      super(message);
      this.status = status;
    }
  },
  edgeApi: {
    listOnboardingJourneys: (...args: unknown[]) =>
      listOnboardingJourneys(...args),
    getOnboardingJourney: (...args: unknown[]) => getOnboardingJourney(...args),
    createOnboardingJourney: (...args: unknown[]) =>
      createOnboardingJourney(...args),
    startOnboardingJourney: (...args: unknown[]) =>
      startOnboardingJourney(...args),
    advanceOnboardingJourney: (...args: unknown[]) =>
      advanceOnboardingJourney(...args),
    closeOnboardingJourney: (...args: unknown[]) =>
      closeOnboardingJourney(...args),
    decideOnboardingTask: (...args: unknown[]) => decideOnboardingTask(...args),
    listOnboardingTemplates: (...args: unknown[]) =>
      listOnboardingTemplates(...args),
    createOnboardingTemplate: (...args: unknown[]) =>
      createOnboardingTemplate(...args),
    publishOnboardingTemplate: (...args: unknown[]) =>
      publishOnboardingTemplate(...args),
    listOnboardingRuns: (...args: unknown[]) => listOnboardingRuns(...args),
    listOnboardingEvidence: (...args: unknown[]) =>
      listOnboardingEvidence(...args),
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

import { EdgeOnboardingModule } from "./edge-onboarding-module";

beforeAll(() => {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => undefined;
  }
});

const ALL_PERMS = [
  "platform:onboarding:read",
  "platform:onboarding:start",
  "platform:onboarding:advance",
  "platform:onboarding:approve",
  "platform:onboarding:reject",
  "platform:onboarding:close",
  "platform:onboarding:history:read",
];

const JOURNEY = {
  id: "ob-1",
  tenantId: "tenant-1",
  productId: "product-1",
  subscriptionId: null,
  accountId: null,
  templateId: null,
  activationRecordId: "act-1",
  provisioningRequestId: "prov-1",
  authorizationRowId: "auth-1",
  authorizationVersion: 1,
  journeyStatus: "IN_PROGRESS",
  currentStepKey: "verify_activation",
  workflowId: null,
  startedAt: "2026-11-01T00:00:00.000Z",
  closedAt: null,
  handoverEvidenceRef: null,
  failureCode: null,
  failureMessage: null,
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
      <EdgeOnboardingModule />
    </QueryClientProvider>,
  );
}

describe("EdgeOnboardingModule (P7.12 console)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformState.isLoading = false;
    platformState.permissions = [...ALL_PERMS];
    listOnboardingJourneys.mockResolvedValue({
      data: { items: [JOURNEY], total: 1 },
    });
    getOnboardingJourney.mockResolvedValue({
      data: {
        journey: JOURNEY,
        steps: [
          {
            id: "s1",
            journeyId: "ob-1",
            tenantId: "tenant-1",
            stepKey: "verify_activation",
            stepOrder: 1,
            stepKind: "VERIFY",
            stepStatus: "PASSED",
            required: true,
            dependsOn: [],
            message: null,
            evidenceRef: null,
            details: {},
            startedAt: null,
            finishedAt: null,
            createdAt: "2026-11-01T00:00:00.000Z",
            updatedAt: "2026-11-01T00:00:00.000Z",
          },
        ],
        tasks: [],
        runs: [],
        evidence: [],
      },
    });
    listOnboardingTemplates.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    listOnboardingRuns.mockResolvedValue({ data: { items: [], total: 0 } });
    listOnboardingEvidence.mockResolvedValue({
      data: { items: [], total: 0 },
    });
  });

  it("shows the forbidden state without platform:onboarding:read", async () => {
    platformState.permissions = [];
    renderModule();
    expect(await screen.findByText("Access restricted")).toBeTruthy();
  });

  it("renders onboarding module when permitted without inventing CLOSED", async () => {
    renderModule();
    expect(await screen.findByTestId("ob-module")).toBeTruthy();
    expect(
      await screen.findByLabelText("Choisir un parcours onboarding"),
    ).toBeTruthy();
    expect(listOnboardingJourneys).toHaveBeenCalled();
    expect(screen.queryByTestId("ob-journey-status")).toBeNull();
    expect(screen.queryByText("CLOSED")).toBeNull();
  });

  it("shows journey detail with API status only and start/advance controls", async () => {
    renderModule();
    fireEvent.click(
      await screen.findByLabelText("Choisir un parcours onboarding"),
    );
    const option = await screen.findByRole("option", {
      name: /tenant-1 — IN_PROGRESS/,
    });
    fireEvent.click(option);

    expect(await screen.findByTestId("ob-journey-detail")).toBeTruthy();
    const status = screen.getByTestId("ob-journey-status").textContent?.trim();
    expect(status).toBe("IN_PROGRESS");
    expect(status).not.toBe("CLOSED");
    expect(screen.getByTestId("ob-start")).toBeTruthy();
    expect(screen.getByTestId("ob-advance")).toBeTruthy();
    expect(getOnboardingJourney).toHaveBeenCalledWith("ob-1");
  });
});
