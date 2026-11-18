/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EdgeAcquisitionModule } from "./edge-acquisition-module";

const edgeApiMocks = vi.hoisted(() => ({
  getAcquisitionOverview: vi.fn(),
  listAcquisitionProducts: vi.fn(),
  createAcquisitionProduct: vi.fn(),
  listAcquisitionPlans: vi.fn(),
  createAcquisitionPlan: vi.fn(),
  listAcquisitionForms: vi.fn(),
  createAcquisitionForm: vi.fn(),
  createAcquisitionFormVersion: vi.fn(),
  publishAcquisitionFormVersion: vi.fn(),
  listAcquisitionProspects: vi.fn(),
  createAcquisitionProspect: vi.fn(),
  transitionAcquisitionProspect: vi.fn(),
  listAcquisitionLeads: vi.fn(),
  captureAcquisitionLead: vi.fn(),
  promoteAcquisitionLead: vi.fn(),
  createAcquisitionFormFromContract: vi.fn(),
  listAcquisitionApplications: vi.fn(),
  submitAcquisitionApplication: vi.fn(),
  saveAcquisitionApplicationAnswers: vi.fn(),
  transitionAcquisitionApplication: vi.fn(),
  requestAcquisitionApplicationInformation: vi.fn(),
  listAcquisitionDocuments: vi.fn(),
  registerAcquisitionDocument: vi.fn(),
  reviewAcquisitionDocument: vi.fn(),
  listAcquisitionQuotations: vi.fn(),
  createAcquisitionQuotation: vi.fn(),
  listAcquisitionCheckouts: vi.fn(),
  getAcquisitionCheckout: vi.fn(),
  listAcquisitionHandoffs: vi.fn(),
  createAcquisitionCheckout: vi.fn(),
  initiateAcquisitionPayment: vi.fn(),
  attachAcquisitionPaymentReference: vi.fn(),
  recordAcquisitionPaymentResult: vi.fn(),
  getAcquisitionJourneyByApplication: vi.fn(),
  advanceAcquisitionJourney: vi.fn(),
  getAcquisitionConversionFunnel: vi.fn(),
}));

vi.mock("@/providers/edge-platform-provider", () => ({
  useEdgePlatform: () => ({
    permissions: [
      "platform:acquisition:read",
      "platform:acquisition:manage",
      "platform:acquisition:forms:manage",
      "platform:acquisition:forms:publish",
      "platform:acquisition:review",
      "platform:acquisition:quotes:manage",
      "platform:acquisition:checkout:operate",
      "platform:acquisition:analytics:read",
      "platform:acquisition:governance:manage",
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
      <EdgeAcquisitionModule />
    </QueryClientProvider>,
  );
}

function setInputValue(el: HTMLElement, value: string) {
  fireEvent.change(el, { target: { value } });
}

describe("EdgeAcquisitionModule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    edgeApiMocks.getAcquisitionOverview.mockResolvedValue({
      data: {
        presentationsPublished: 0,
        prospectsActive: 0,
        leadsCaptured: 0,
        applicationsOpen: 0,
        checkoutsPending: 0,
        handoffsRequested: 0,
      },
    });
    edgeApiMocks.listAcquisitionProducts.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    edgeApiMocks.listAcquisitionPlans.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    edgeApiMocks.listAcquisitionForms.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    edgeApiMocks.listAcquisitionProspects.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    edgeApiMocks.listAcquisitionLeads.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    edgeApiMocks.listAcquisitionApplications.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    edgeApiMocks.listAcquisitionDocuments.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    edgeApiMocks.listAcquisitionQuotations.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    edgeApiMocks.listAcquisitionCheckouts.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    edgeApiMocks.listAcquisitionHandoffs.mockResolvedValue({
      data: { items: [], total: 0 },
    });
    edgeApiMocks.getAcquisitionConversionFunnel.mockResolvedValue({
      data: {
        totalEvents: 0,
        countsByEventName: {},
        note: "Honest aggregates from recorded analytics_events only — no estimated conversion.",
      },
    });
    edgeApiMocks.getAcquisitionJourneyByApplication.mockResolvedValue({
      data: null,
    });
  });

  it("renders acquisition overview with honest zero counts", async () => {
    renderModule();
    expect(await screen.findByTestId("edge-acquisition-module")).toBeInTheDocument();
    const overview = await screen.findByTestId("acq-overview");
    expect(within(overview).getByText(/Acquisition overview/i)).toBeInTheDocument();
    expect(within(overview).getByText(/Presentations published: 0/i)).toBeInTheDocument();
    expect(within(overview).getByText(/Applications open: 0/i)).toBeInTheDocument();
  });

  it("renders acquisition tabs", async () => {
    renderModule();
    const module = await screen.findByTestId("edge-acquisition-module");
    const tablist = within(module).getByRole("tablist");
    expect(within(tablist).getByRole("tab", { name: "Overview" })).toBeInTheDocument();
    expect(within(tablist).getByRole("tab", { name: "Products" })).toBeInTheDocument();
    expect(within(tablist).getByRole("tab", { name: "Forms" })).toBeInTheDocument();
    expect(within(tablist).getByRole("tab", { name: "Applications" })).toBeInTheDocument();
    expect(within(tablist).getByRole("tab", { name: "Analytics" })).toBeInTheDocument();
  });

  it("switches to Products tab and shows empty state", async () => {
    renderModule();
    await screen.findByTestId("edge-acquisition-module");
    fireEvent.click(screen.getByRole("tab", { name: "Products" }));
    expect(
      await screen.findByText(/No product presentations/i),
    ).toBeInTheDocument();
    expect(edgeApiMocks.listAcquisitionProducts).toHaveBeenCalled();
  });

  it("switches to Forms tab and shows form builder", async () => {
    renderModule();
    await screen.findByTestId("edge-acquisition-module");
    fireEvent.click(screen.getByRole("tab", { name: "Forms" }));
    expect(await screen.findByText(/Form builder/i)).toBeInTheDocument();
    expect(edgeApiMocks.listAcquisitionForms).toHaveBeenCalled();
  });

  it("switches to Applications inbox empty state", async () => {
    renderModule();
    await screen.findByTestId("edge-acquisition-module");
    fireEvent.click(screen.getByRole("tab", { name: "Applications" }));
    expect(await screen.findByText(/No applications/i)).toBeInTheDocument();
    expect(edgeApiMocks.listAcquisitionApplications).toHaveBeenCalled();
  });

  it("resumes DRAFT application and saves answers with expectedVersion", async () => {
    edgeApiMocks.listAcquisitionApplications.mockResolvedValue({
      data: {
        items: [
          {
            id: "11111111-1111-1111-1111-111111111111",
            applicationNumber: "APP-1",
            prospectId: "22222222-2222-2222-2222-222222222222",
            leadId: null,
            formSchemaId: "33333333-3333-3333-3333-333333333333",
            formVersionId: "44444444-4444-4444-4444-444444444444",
            formPublicationId: null,
            productId: null,
            commercialPlanId: null,
            planPresentationId: null,
            status: "DRAFT",
            submittedAt: null,
            decidedAt: null,
            decidedBy: null,
            decisionReason: null,
            metadata: { answers: { email: "a@b.com" } },
            createdBy: null,
            updatedBy: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            version: 3,
          },
        ],
        total: 1,
      },
    });
    edgeApiMocks.saveAcquisitionApplicationAnswers.mockResolvedValue({
      data: { id: "11111111-1111-1111-1111-111111111111", version: 4 },
    });

    renderModule();
    await screen.findByTestId("edge-acquisition-module");
    fireEvent.click(screen.getByRole("tab", { name: "Applications" }));
    expect(await screen.findByText("APP-1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    const panel = await screen.findByTestId("acq-draft-resume");
    const textarea = within(panel).getByLabelText(
      "draft answers JSON",
    ) as HTMLTextAreaElement;
    expect(textarea.value).toContain("a@b.com");
    fireEvent.click(within(panel).getByRole("button", { name: "Save answers" }));
    await waitFor(() => {
      expect(edgeApiMocks.saveAcquisitionApplicationAnswers).toHaveBeenCalledWith(
        "11111111-1111-1111-1111-111111111111",
        expect.objectContaining({
          answers: { email: "a@b.com" },
          expectedVersion: 3,
        }),
      );
    });
  });

  it("loads analytics funnel without inventing conversion", async () => {
    renderModule();
    await screen.findByTestId("edge-acquisition-module");
    fireEvent.click(screen.getByRole("tab", { name: "Analytics" }));
    expect(await screen.findByText(/Conversion funnel/i)).toBeInTheDocument();
    expect(await screen.findByText(/No analytics events/i)).toBeInTheDocument();
    expect(edgeApiMocks.getAcquisitionConversionFunnel).toHaveBeenCalled();
  });

  it("lists documents via listAcquisitionDocuments", async () => {
    renderModule();
    await screen.findByTestId("edge-acquisition-module");
    fireEvent.click(screen.getByRole("tab", { name: "Documents" }));
    expect(await screen.findByText(/No document references/i)).toBeInTheDocument();
    expect(edgeApiMocks.listAcquisitionDocuments).toHaveBeenCalled();
  });

  it("registers document from file metadata with private locator", async () => {
    edgeApiMocks.registerAcquisitionDocument.mockResolvedValue({ data: { id: "doc-1" } });

    renderModule();
    await screen.findByTestId("edge-acquisition-module");
    fireEvent.click(screen.getByRole("tab", { name: "Documents" }));
    await screen.findByRole("button", { name: "Register document reference" });

    setInputValue(
      screen.getByLabelText("document applicationId"),
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    );
    setInputValue(screen.getByLabelText("documentType"), "KBIS");

    const file = new File(["content"], "kbis.pdf", { type: "application/pdf" });
    const fileInput = screen.getByLabelText("document file metadata") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: [file],
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect((screen.getByLabelText("storageKey") as HTMLInputElement).value).toMatch(
        /^private\/acq\/\d+-kbis\.pdf$/,
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Register document reference" }));

    await waitFor(() => {
      expect(edgeApiMocks.registerAcquisitionDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          documentType: "KBIS",
          fileName: "kbis.pdf",
          contentType: "application/pdf",
          byteSize: 7,
          storageKey: expect.stringMatching(/^private\/acq\/\d+-kbis\.pdf$/),
          privateLocator: expect.stringMatching(
            /^edge-private:\/\/private\/acq\/\d+-kbis\.pdf$/,
          ),
        }),
      );
    });
  });

  it("reviews document Accept/Reject", async () => {
    edgeApiMocks.listAcquisitionDocuments.mockResolvedValue({
      data: {
        items: [
          {
            id: "doc-1",
            applicationId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            requirementId: null,
            documentType: "KBIS",
            storageRef: "private/acq/1-kbis.pdf",
            fileName: "kbis.pdf",
            contentType: "application/pdf",
            checksumSha256: null,
            status: "PENDING_REVIEW",
            metadata: {},
            uploadedBy: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            version: 1,
          },
        ],
        total: 1,
      },
    });
    edgeApiMocks.reviewAcquisitionDocument.mockResolvedValue({ data: { id: "doc-1" } });

    renderModule();
    await screen.findByTestId("edge-acquisition-module");
    fireEvent.click(screen.getByRole("tab", { name: "Documents" }));
    expect(await screen.findByText("KBIS")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    await waitFor(() => {
      expect(edgeApiMocks.reviewAcquisitionDocument).toHaveBeenCalledWith("doc-1", {
        decision: "ACCEPTED",
      });
    });
  });

  it("lists quotations via listAcquisitionQuotations", async () => {
    renderModule();
    await screen.findByTestId("edge-acquisition-module");
    fireEvent.click(screen.getByRole("tab", { name: "Quotes" }));
    expect(await screen.findByText(/No quote requests/i)).toBeInTheDocument();
    expect(edgeApiMocks.listAcquisitionQuotations).toHaveBeenCalled();
  });

  it("lists checkouts and handoffs", async () => {
    renderModule();
    await screen.findByTestId("edge-acquisition-module");
    fireEvent.click(screen.getByRole("tab", { name: "Checkout" }));
    expect(await screen.findByText(/No checkout sessions/i)).toBeInTheDocument();
    expect(await screen.findByText(/No handoffs/i)).toBeInTheDocument();
    expect(edgeApiMocks.listAcquisitionCheckouts).toHaveBeenCalled();
    expect(edgeApiMocks.listAcquisitionHandoffs).toHaveBeenCalled();
  });

  it("initiates payment for selected checkout without card fields", async () => {
    edgeApiMocks.listAcquisitionCheckouts.mockResolvedValue({
      data: {
        items: [
          {
            id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
            applicationId: null,
            prospectId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            planPresentationId: null,
            commercialPlanId: null,
            quoteReferenceId: null,
            status: "PENDING_PAYMENT",
            billingSessionRef: null,
            idempotencyKey: "idem-1",
            metadata: {},
            createdBy: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            version: 1,
          },
        ],
        total: 1,
      },
    });
    edgeApiMocks.initiateAcquisitionPayment.mockResolvedValue({
      data: {
        checkout: {
          id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
          status: "PENDING_PAYMENT",
          billingSessionRef: "pi_test_1",
        },
        paymentIntentRef: "pi_test_1",
        providerResult: { status: "REQUIRES_ACTION" },
      },
    });
    edgeApiMocks.recordAcquisitionPaymentResult.mockResolvedValue({
      data: { id: "cccccccc-cccc-cccc-cccc-cccccccccccc", status: "CAPTURED" },
    });

    renderModule();
    await screen.findByTestId("edge-acquisition-module");
    fireEvent.click(screen.getByRole("tab", { name: "Checkout" }));
    expect(await screen.findByText("PENDING_PAYMENT")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Select" }));

    const paymentPanel = await screen.findByTestId("acq-checkout-payment");
    expect(within(paymentPanel).queryByLabelText(/card/i)).not.toBeInTheDocument();
    expect(within(paymentPanel).queryByLabelText(/cvv/i)).not.toBeInTheDocument();

    setInputValue(
      screen.getByLabelText("billingAccountId"),
      "dddddddd-dddd-dddd-dddd-dddddddddddd",
    );
    setInputValue(screen.getByLabelText("payment amount"), "49.00");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Initiate payment" }),
      ).not.toBeDisabled();
    });
    fireEvent.click(screen.getByRole("button", { name: "Initiate payment" }));

    await waitFor(() => {
      expect(edgeApiMocks.initiateAcquisitionPayment).toHaveBeenCalledWith(
        "cccccccc-cccc-cccc-cccc-cccccccccccc",
        {
          billingAccountId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
          amount: "49.00",
          currency: "EUR",
        },
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Record captured" }));
    await waitFor(() => {
      expect(edgeApiMocks.recordAcquisitionPaymentResult).toHaveBeenCalledWith(
        "cccccccc-cccc-cccc-cccc-cccccccccccc",
        expect.objectContaining({ p6Status: "CAPTURED" }),
      );
    });
  });

  it("shows honest error state when documents list fails", async () => {
    edgeApiMocks.listAcquisitionDocuments.mockRejectedValueOnce(
      new Error("documents API down"),
    );
    renderModule();
    await screen.findByTestId("edge-acquisition-module");
    fireEvent.click(screen.getByRole("tab", { name: "Documents" }));
    expect(await screen.findByText(/Unavailable/i)).toBeInTheDocument();
    expect(await screen.findByText(/documents API down/i)).toBeInTheDocument();
  });
});
