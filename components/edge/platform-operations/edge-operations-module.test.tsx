/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EdgeOperationsModule } from "./edge-operations-module";

const edgeApiMocks = vi.hoisted(() => ({
  getOperationsOverview: vi.fn(),
  getOperationsAnalytics: vi.fn(),
  listPlatformServices: vi.fn(),
  registerPlatformService: vi.fn(),
  listOperationalAlerts: vi.fn(),
  ingestOperationalAlert: vi.fn(),
  acknowledgeOperationalAlert: vi.fn(),
  resolveOperationalAlert: vi.fn(),
  listIncidents: vi.fn(),
  createIncident: vi.fn(),
  transitionIncident: vi.fn(),
  declareMajorIncident: vi.fn(),
  listProblems: vi.fn(),
  createProblem: vi.fn(),
  listChanges: vi.fn(),
  createChange: vi.fn(),
  submitChange: vi.fn(),
  approveChange: vi.fn(),
  rejectChange: vi.fn(),
  listMaintenanceWindows: vi.fn(),
  createMaintenanceWindow: vi.fn(),
  listServiceRequests: vi.fn(),
  createServiceRequest: vi.fn(),
  listOperationalTasks: vi.fn(),
  createOperationalTask: vi.fn(),
  listOnCallRotations: vi.fn(),
  listSloDefinitions: vi.fn(),
  listCapacityMeasurements: vi.fn(),
  listRecoveryOperations: vi.fn(),
  verifyRecoveryOperation: vi.fn(),
  listRunbooks: vi.fn(),
  createRunbook: vi.fn(),
  listStatusComponents: vi.fn(),
  publishStatusUpdate: vi.fn(),
  listOperationalRisks: vi.fn(),
  createOperationalRisk: vi.fn(),
  listOperationalExceptions: vi.fn(),
  createOperationalException: vi.fn(),
  listAutomations: vi.fn(),
  createAutomation: vi.fn(),
}));

vi.mock("@/providers/edge-platform-provider", () => ({
  useEdgePlatform: () => ({
    permissions: [
      "platform:service_catalog:read",
      "platform:service_catalog:manage",
      "platform:operations:overview:read",
      "platform:operations:alerts:read",
      "platform:operations:alerts:manage",
      "platform:operations:incidents:read",
      "platform:operations:incidents:manage",
      "platform:operations:problems:read",
      "platform:operations:changes:read",
      "platform:operations:changes:manage",
      "platform:operations:maintenance:read",
      "platform:operations:maintenance:manage",
      "platform:operations:requests:read",
      "platform:operations:tasks:read",
      "platform:operations:tasks:manage",
      "platform:operations:oncall:read",
      "platform:operations:slo:read",
      "platform:operations:capacity:read",
      "platform:operations:recovery:read",
      "platform:operations:runbooks:read",
      "platform:operations:status:read",
      "platform:operations:risks:read",
      "platform:operations:automation:read",
      "platform:operations:analytics:read",
    ],
  }),
}));

vi.mock("@/lib/api/edge", () => ({
  edgeApi: edgeApiMocks,
}));

function renderModule() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <EdgeOperationsModule />
    </QueryClientProvider>,
  );
}

describe("EdgeOperationsModule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    edgeApiMocks.getOperationsOverview.mockResolvedValue({
      data: {
        availability: "PARTIAL",
        note: "catalog only",
        catalog: { totalServices: 0 },
        alerts: { activeCount: 0, totalCount: 0 },
        incidents: { openCount: 0, majorCount: 0, totalCount: 0 },
        changes: { openCount: 0, totalCount: 0 },
        maintenance: { scheduledCount: 0, totalCount: 0 },
        monitoringIntegrations: [
          {
            code: "P9_ALERT",
            providerType: "INTERNAL",
            status: "UNKNOWN",
            availability: "UNAVAILABLE",
          },
          {
            code: "P9_INCIDENT",
            providerType: "INTERNAL",
            status: "UNKNOWN",
            availability: "UNAVAILABLE",
          },
        ],
        computedAt: new Date().toISOString(),
      },
    });
    edgeApiMocks.getOperationsAnalytics.mockResolvedValue({
      data: {
        availability: "PARTIAL",
        catalog: { totalServices: 0 },
        alerts: { activeCount: 0, totalCount: 0 },
        incidents: { openCount: 0, majorCount: 0, totalCount: 0 },
        changes: { openCount: 0, totalCount: 0 },
        maintenance: { scheduledCount: 0, totalCount: 0 },
        monitoringIntegrations: [],
        computedAt: new Date().toISOString(),
        note: "analytics from API only",
      },
    });
    edgeApiMocks.listPlatformServices.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    edgeApiMocks.listOperationalAlerts.mockResolvedValue({ data: { items: [], total: 0 } });
    edgeApiMocks.listIncidents.mockResolvedValue({ data: { items: [], total: 0 } });
    edgeApiMocks.listProblems.mockResolvedValue({ data: { items: [], total: 0 } });
    edgeApiMocks.listChanges.mockResolvedValue({ data: { items: [], total: 0 } });
    edgeApiMocks.listMaintenanceWindows.mockResolvedValue({ data: { items: [], total: 0 } });
    edgeApiMocks.listServiceRequests.mockResolvedValue({ data: { items: [], total: 0 } });
    edgeApiMocks.listOperationalTasks.mockResolvedValue({ data: { items: [], total: 0 } });
    edgeApiMocks.listOnCallRotations.mockResolvedValue({ data: { items: [], total: 0 } });
    edgeApiMocks.listSloDefinitions.mockResolvedValue({ data: { items: [], total: 0 } });
    edgeApiMocks.listCapacityMeasurements.mockResolvedValue({ data: { items: [], total: 0 } });
    edgeApiMocks.listRecoveryOperations.mockResolvedValue({ data: { items: [], total: 0 } });
    edgeApiMocks.listRunbooks.mockResolvedValue({ data: { items: [], total: 0 } });
    edgeApiMocks.listStatusComponents.mockResolvedValue({ data: { items: [], total: 0 } });
    edgeApiMocks.listOperationalRisks.mockResolvedValue({ data: { items: [], total: 0 } });
    edgeApiMocks.listOperationalExceptions.mockResolvedValue({ data: { items: [], total: 0 } });
    edgeApiMocks.listAutomations.mockResolvedValue({ data: { items: [], total: 0 } });
  });

  it("renders operations overview with honest UNAVAILABLE badges", async () => {
    renderModule();
    expect(await screen.findByTestId("edge-operations-module")).toBeInTheDocument();
    const overview = await screen.findByTestId("ops-overview");
    expect(within(overview).getByText(/Operations overview/i)).toBeInTheDocument();
    expect(within(overview).getByText(/catalog only/i)).toBeInTheDocument();
    expect(within(overview).getByText(/Alerts active: 0/i)).toBeInTheDocument();
    expect(within(overview).getAllByText(/Incidents open: 0/i).length).toBeGreaterThan(0);
    expect(within(overview).getByText(/P9_ALERT: UNAVAILABLE/i)).toBeInTheDocument();
    expect(within(overview).getByText(/P9_INCIDENT: UNAVAILABLE/i)).toBeInTheDocument();
  });

  it("renders operation center tabs", async () => {
    renderModule();
    const module = await screen.findByTestId("edge-operations-module");
    const tablist = within(module).getByRole("tablist");
    expect(within(tablist).getByRole("tab", { name: "Overview" })).toBeInTheDocument();
    expect(within(tablist).getByRole("tab", { name: "Services" })).toBeInTheDocument();
    expect(within(tablist).getByRole("tab", { name: "Alerts" })).toBeInTheDocument();
    expect(within(tablist).getByRole("tab", { name: "Incidents" })).toBeInTheDocument();
    expect(within(tablist).getByRole("tab", { name: "Automation" })).toBeInTheDocument();
  });

  it("switches to Services tab and shows empty catalog", async () => {
    renderModule();
    await screen.findByTestId("edge-operations-module");
    fireEvent.click(screen.getByRole("tab", { name: "Services" }));
    expect(
      await screen.findByText(/No platform services registered/i),
    ).toBeInTheDocument();
    expect(edgeApiMocks.listPlatformServices).toHaveBeenCalled();
  });

  it("switches to Alerts tab and shows empty state", async () => {
    renderModule();
    await screen.findByTestId("edge-operations-module");
    fireEvent.click(screen.getByRole("tab", { name: "Alerts" }));
    expect(await screen.findByText(/No alerts/i)).toBeInTheDocument();
    expect(edgeApiMocks.listOperationalAlerts).toHaveBeenCalled();
  });

  it("switches to Automation tab and loads automations", async () => {
    renderModule();
    await screen.findByTestId("edge-operations-module");
    fireEvent.click(screen.getByRole("tab", { name: "Automation" }));
    expect(await screen.findByText(/No automations/i)).toBeInTheDocument();
    expect(edgeApiMocks.listAutomations).toHaveBeenCalled();
  });
});
