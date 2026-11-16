"use client";

/**
 * P10 — Edge Admin Console: Acquisition CX.
 * Tabbed control plane — API state only; never invent conversion metrics.
 */
import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/field-control";
import { Tabs } from "@/components/ui/tabs";
import { EdgePermissionGate } from "@/components/edge/permission-gate";
import {
  EdgeEmptyState,
  EdgeErrorState,
  EdgeForbiddenState,
  EdgeLoadingState,
} from "@/components/edge/states";
import { edgeApi } from "@/lib/api/edge";
import { hasAnyEdgePermission, hasEdgePermission } from "@/lib/edge/permissions";
import { useEdgePlatform } from "@/providers/edge-platform-provider";
import type {
  Application,
  CheckoutSession,
  DocumentReference,
  FormSchema,
  FormSchemaDefinition,
  PlanPresentation,
  ProductPresentation,
  Prospect,
  QuoteRequest,
  SubscriptionHandoff,
} from "@/types/edge-acquisition";

type TabId =
  | "overview"
  | "products"
  | "plans"
  | "forms"
  | "prospects"
  | "applications"
  | "documents"
  | "quotes"
  | "checkout"
  | "journeys"
  | "analytics";

const TABS: { id: TabId; label: string; permission: string }[] = [
  { id: "overview", label: "Overview", permission: "platform:acquisition:read" },
  { id: "products", label: "Products", permission: "platform:acquisition:read" },
  { id: "plans", label: "Plans", permission: "platform:acquisition:read" },
  { id: "forms", label: "Forms", permission: "platform:acquisition:read" },
  { id: "prospects", label: "Prospects", permission: "platform:acquisition:read" },
  { id: "applications", label: "Applications", permission: "platform:acquisition:read" },
  { id: "documents", label: "Documents", permission: "platform:acquisition:read" },
  { id: "quotes", label: "Quotes", permission: "platform:acquisition:read" },
  { id: "checkout", label: "Checkout", permission: "platform:acquisition:read" },
  { id: "journeys", label: "Journeys", permission: "platform:acquisition:read" },
  {
    id: "analytics",
    label: "Analytics",
    permission: "platform:acquisition:analytics:read",
  },
];

const READ_ANY = [
  "platform:acquisition:read",
  "platform:acquisition:manage",
  "platform:acquisition:analytics:read",
];

const DEFAULT_SCHEMA_JSON = `{
  "sections": [
    { "key": "contact", "title": "Contact", "fields": [
      { "key": "email", "type": "email", "label": "Email", "required": true },
      { "key": "company", "type": "text", "label": "Company", "required": false }
    ]}
  ],
  "fields": [
    { "key": "email", "type": "email", "label": "Email", "required": true },
    { "key": "company", "type": "text", "label": "Company", "required": false }
  ]
}`;

function unwrapPage<T>(data: unknown): { items: T[]; total: number } {
  if (Array.isArray(data)) {
    return { items: data as T[], total: data.length };
  }
  const raw = data as
    | { data?: { items?: T[]; total?: number } | T[] }
    | { items?: T[]; total?: number }
    | undefined;
  if (raw && typeof raw === "object" && "items" in raw && Array.isArray(raw.items)) {
    return { items: raw.items, total: raw.total ?? raw.items.length };
  }
  if (raw && typeof raw === "object" && "data" in raw && raw.data) {
    const inner = raw.data;
    if (Array.isArray(inner)) return { items: inner as T[], total: inner.length };
    if (inner && typeof inner === "object" && "items" in inner && Array.isArray(inner.items)) {
      return { items: inner.items, total: inner.total ?? inner.items.length };
    }
  }
  return { items: [] as T[], total: 0 };
}

function unwrapData<T>(data: unknown): T | null {
  if (!data) return null;
  if (typeof data === "object" && data !== null && "data" in data) {
    return ((data as { data: T }).data ?? null) as T | null;
  }
  return data as T;
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function statusTone(
  status: string | undefined,
): "default" | "success" | "warning" | "danger" | "info" {
  if (!status) return "default";
  const s = status.toUpperCase();
  if (["PUBLISHED", "APPROVED", "COMPLETED", "ACTIVE", "CAPTURED", "CONVERTED"].includes(s)) {
    return "success";
  }
  if (["REJECTED", "FAILED", "EXPIRED", "DISQUALIFIED", "CANCELLED"].includes(s)) {
    return "danger";
  }
  if (["DRAFT", "PENDING", "SUBMITTED", "IN_REVIEW", "DOCUMENTS_PENDING", "REQUESTED"].includes(s)) {
    return "warning";
  }
  return "info";
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR");
  } catch {
    return iso;
  }
}

function DenseTable({
  headers,
  children,
  testId,
}: {
  headers: string[];
  children: ReactNode;
  testId?: string;
}) {
  return (
    <div className="overflow-x-auto border border-[var(--border)]" data-testid={testId}>
      <table className="w-full type-sm text-left">
        <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">{children}</tbody>
      </table>
    </div>
  );
}

function QueryShell({
  loading,
  error,
  empty,
  emptyTitle,
  emptyDescription,
  children,
}: {
  loading: boolean;
  error: unknown;
  empty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  children: ReactNode;
}) {
  if (loading) return <EdgeLoadingState />;
  if (error) {
    return <EdgeErrorState title="Unavailable" description={errMsg(error)} />;
  }
  if (empty) {
    return <EdgeEmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return <>{children}</>;
}

export function EdgeAcquisitionModule() {
  const { permissions } = useEdgePlatform();
  const qc = useQueryClient();
  const canAny = hasAnyEdgePermission(permissions, READ_ANY);

  const visibleTabs = useMemo(
    () =>
      TABS.filter((t) =>
        hasAnyEdgePermission(permissions, [
          t.permission,
          "platform:acquisition:manage",
          "platform:acquisition:read",
        ]),
      ),
    [permissions],
  );

  const [tab, setTab] = useState<TabId>("overview");
  const activeTab = visibleTabs.some((t) => t.id === tab)
    ? tab
    : (visibleTabs[0]?.id ?? "overview");

  const canRead = hasEdgePermission(permissions, "platform:acquisition:read");
  const canManage = hasEdgePermission(permissions, "platform:acquisition:manage");
  const canFormsManage = hasEdgePermission(
    permissions,
    "platform:acquisition:forms:manage",
  );
  const canFormsPublish = hasEdgePermission(
    permissions,
    "platform:acquisition:forms:publish",
  );
  const canReview = hasEdgePermission(permissions, "platform:acquisition:review");
  const canQuotes = hasEdgePermission(
    permissions,
    "platform:acquisition:quotes:manage",
  );
  const canCheckout = hasEdgePermission(
    permissions,
    "platform:acquisition:checkout:operate",
  );
  const canAnalytics = hasEdgePermission(
    permissions,
    "platform:acquisition:analytics:read",
  );
  const canGovernance = hasEdgePermission(
    permissions,
    "platform:acquisition:governance:manage",
  );

  const overviewQ = useQuery({
    queryKey: ["edge", "acquisition", "overview"],
    queryFn: () => edgeApi.getAcquisitionOverview(),
    enabled: canRead && activeTab === "overview",
  });

  const productsQ = useQuery({
    queryKey: ["edge", "acquisition", "products"],
    queryFn: () => edgeApi.listAcquisitionProducts({ limit: 100 }),
    enabled: canRead && activeTab === "products",
  });

  const plansQ = useQuery({
    queryKey: ["edge", "acquisition", "plans"],
    queryFn: () => edgeApi.listAcquisitionPlans({ limit: 100 }),
    enabled: canRead && activeTab === "plans",
  });

  const formsQ = useQuery({
    queryKey: ["edge", "acquisition", "forms"],
    queryFn: () => edgeApi.listAcquisitionForms({ limit: 100 }),
    enabled: canRead && activeTab === "forms",
  });

  const prospectsQ = useQuery({
    queryKey: ["edge", "acquisition", "prospects"],
    queryFn: () => edgeApi.listAcquisitionProspects({ limit: 100 }),
    enabled: canRead && activeTab === "prospects",
  });

  const applicationsQ = useQuery({
    queryKey: ["edge", "acquisition", "applications"],
    queryFn: () => edgeApi.listAcquisitionApplications({ limit: 100 }),
    enabled: canRead && activeTab === "applications",
  });

  const documentsQ = useQuery({
    queryKey: ["edge", "acquisition", "documents"],
    queryFn: () => edgeApi.listAcquisitionDocuments({ limit: 100 }),
    enabled: canRead && activeTab === "documents",
  });

  const quotationsQ = useQuery({
    queryKey: ["edge", "acquisition", "quotations"],
    queryFn: () => edgeApi.listAcquisitionQuotations({ limit: 100 }),
    enabled: canRead && activeTab === "quotes",
  });

  const checkoutsQ = useQuery({
    queryKey: ["edge", "acquisition", "checkouts"],
    queryFn: () => edgeApi.listAcquisitionCheckouts({ limit: 100 }),
    enabled: canRead && activeTab === "checkout",
  });

  const handoffsQ = useQuery({
    queryKey: ["edge", "acquisition", "handoffs"],
    queryFn: () => edgeApi.listAcquisitionHandoffs({ limit: 100 }),
    enabled: canRead && activeTab === "checkout",
  });

  const funnelQ = useQuery({
    queryKey: ["edge", "acquisition", "funnel"],
    queryFn: () => edgeApi.getAcquisitionConversionFunnel({ limit: 5000 }),
    enabled: canAnalytics && activeTab === "analytics",
  });

  const [productForm, setProductForm] = useState({
    productId: "",
    code: "",
    slug: "",
    title: "",
    summary: "",
  });
  const [planForm, setPlanForm] = useState({
    commercialPlanId: "",
    code: "",
    title: "",
    priceDisplayMode: "INDICATIVE",
    productPresentationId: "",
    currencyHint: "EUR",
  });
  const [formSchemaForm, setFormSchemaForm] = useState({
    code: "",
    name: "",
    description: "",
  });
  const [selectedFormId, setSelectedFormId] = useState("");
  const [schemaJson, setSchemaJson] = useState(DEFAULT_SCHEMA_JSON);
  const [draftVersionId, setDraftVersionId] = useState<string | null>(null);
  const [publishForm, setPublishForm] = useState({
    publicSlug: "",
    channel: "PUBLIC_WEB",
  });
  const [prospectForm, setProspectForm] = useState({
    email: "",
    displayName: "",
    companyName: "",
  });
  const [docForm, setDocForm] = useState({
    applicationId: "",
    documentType: "",
    storageKey: "",
    fileName: "",
    contentType: "",
    byteSize: "" as string,
    privateLocator: "",
  });
  const [quoteForm, setQuoteForm] = useState({
    prospectId: "",
    notes: "",
  });
  const [checkoutForm, setCheckoutForm] = useState({
    prospectId: "",
    applicationId: "",
    idempotencyKey: "",
  });
  const [selectedCheckoutId, setSelectedCheckoutId] = useState("");
  const [paymentForm, setPaymentForm] = useState({
    billingAccountId: "",
    amount: "",
    currency: "EUR",
    paymentIntentRef: "",
  });
  const [paymentActionResult, setPaymentActionResult] = useState<string | null>(null);
  const [draftAppId, setDraftAppId] = useState<string | null>(null);
  const [draftAnswersJson, setDraftAnswersJson] = useState("{}");
  const [draftAnswersById, setDraftAnswersById] = useState<Record<string, string>>({});
  const [draftSaveError, setDraftSaveError] = useState<string | null>(null);
  const [journeyAppId, setJourneyAppId] = useState("");
  const [journeyLookupId, setJourneyLookupId] = useState("");

  const journeyQ = useQuery({
    queryKey: ["edge", "acquisition", "journey", journeyLookupId],
    queryFn: () => edgeApi.getAcquisitionJourneyByApplication(journeyLookupId),
    enabled: canRead && activeTab === "journeys" && journeyLookupId.length >= 8,
  });

  const createProduct = useMutation({
    mutationFn: () =>
      edgeApi.createAcquisitionProduct({
        productId: productForm.productId.trim(),
        code: productForm.code.trim(),
        slug: productForm.slug.trim(),
        title: productForm.title.trim(),
        summary: productForm.summary.trim() || null,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["edge", "acquisition", "products"] });
      void qc.invalidateQueries({ queryKey: ["edge", "acquisition", "overview"] });
      setProductForm({ productId: "", code: "", slug: "", title: "", summary: "" });
    },
  });

  const createPlan = useMutation({
    mutationFn: () =>
      edgeApi.createAcquisitionPlan({
        commercialPlanId: planForm.commercialPlanId.trim(),
        code: planForm.code.trim(),
        title: planForm.title.trim(),
        priceDisplayMode: planForm.priceDisplayMode,
        productPresentationId: planForm.productPresentationId.trim() || null,
        currencyHint: planForm.currencyHint.trim() || null,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["edge", "acquisition", "plans"] });
      setPlanForm({
        commercialPlanId: "",
        code: "",
        title: "",
        priceDisplayMode: "INDICATIVE",
        productPresentationId: "",
        currencyHint: "EUR",
      });
    },
  });

  const createFormSchema = useMutation({
    mutationFn: () =>
      edgeApi.createAcquisitionForm({
        code: formSchemaForm.code.trim(),
        name: formSchemaForm.name.trim(),
        description: formSchemaForm.description.trim() || null,
      }),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ["edge", "acquisition", "forms"] });
      if (res.data?.id) setSelectedFormId(res.data.id);
      setFormSchemaForm({ code: "", name: "", description: "" });
    },
  });

  const createFormVersion = useMutation({
    mutationFn: () => {
      let parsed: FormSchemaDefinition;
      try {
        parsed = JSON.parse(schemaJson) as FormSchemaDefinition;
      } catch {
        throw new Error("Schema JSON invalide — sections/fields uniquement.");
      }
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("schemaDefinition doit être un objet JSON.");
      }
      const formId = selectedFormId.trim();
      if (!formId) throw new Error("Sélectionnez un schéma de formulaire.");
      return edgeApi.createAcquisitionFormVersion(formId, {
        schemaDefinition: parsed,
        versionNumber: 1,
      });
    },
    onSuccess: (res) => {
      setDraftVersionId(res.data?.id ?? null);
      void qc.invalidateQueries({ queryKey: ["edge", "acquisition", "forms"] });
    },
  });

  const publishFormVersion = useMutation({
    mutationFn: (versionId: string) => {
      const slug =
        publishForm.publicSlug.trim() ||
        `form-${versionId.slice(0, 8)}`;
      return edgeApi.publishAcquisitionFormVersion(versionId, {
        channel: publishForm.channel.trim() || "PUBLIC_WEB",
        publicSlug: slug,
      });
    },
    onSuccess: () => {
      setDraftVersionId(null);
      setPublishForm({ publicSlug: "", channel: "PUBLIC_WEB" });
      void qc.invalidateQueries({ queryKey: ["edge", "acquisition", "forms"] });
    },
  });

  const createProspect = useMutation({
    mutationFn: () =>
      edgeApi.createAcquisitionProspect({
        email: prospectForm.email.trim(),
        displayName: prospectForm.displayName.trim() || null,
        companyName: prospectForm.companyName.trim() || null,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["edge", "acquisition", "prospects"] });
      void qc.invalidateQueries({ queryKey: ["edge", "acquisition", "overview"] });
      setProspectForm({ email: "", displayName: "", companyName: "" });
    },
  });

  const submitApp = useMutation({
    mutationFn: (id: string) => edgeApi.submitAcquisitionApplication(id),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["edge", "acquisition", "applications"] }),
  });

  const saveDraftAnswers = useMutation({
    mutationFn: ({
      id,
      answers,
      expectedVersion,
    }: {
      id: string;
      answers: Record<string, unknown>;
      expectedVersion?: number;
    }) =>
      edgeApi.saveAcquisitionApplicationAnswers(id, {
        answers,
        ...(expectedVersion != null ? { expectedVersion } : {}),
      }),
    onSuccess: (_res, vars) => {
      setDraftAnswersById((prev) => ({
        ...prev,
        [vars.id]: JSON.stringify(vars.answers, null, 2),
      }));
      void qc.invalidateQueries({ queryKey: ["edge", "acquisition", "applications"] });
    },
  });

  const transitionApp = useMutation({
    mutationFn: ({ id, toStatus }: { id: string; toStatus: string }) =>
      edgeApi.transitionAcquisitionApplication(id, { toStatus }),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["edge", "acquisition", "applications"] }),
  });

  const requestInfo = useMutation({
    mutationFn: (id: string) =>
      edgeApi.requestAcquisitionApplicationInformation(id, {
        reason: "Informations manquantes — revue acquisition",
      }),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["edge", "acquisition", "applications"] }),
  });

  const registerDoc = useMutation({
    mutationFn: () =>
      edgeApi.registerAcquisitionDocument({
        applicationId: docForm.applicationId.trim(),
        documentType: docForm.documentType.trim(),
        storageKey: docForm.storageKey.trim(),
        fileName: docForm.fileName.trim() || null,
        contentType: docForm.contentType.trim() || null,
        privateLocator: docForm.privateLocator.trim() || null,
        byteSize: docForm.byteSize.trim() ? Number(docForm.byteSize) : null,
      }),
    onSuccess: () => {
      setDocForm({
        applicationId: "",
        documentType: "",
        storageKey: "",
        fileName: "",
        contentType: "",
        byteSize: "",
        privateLocator: "",
      });
      void qc.invalidateQueries({ queryKey: ["edge", "acquisition", "documents"] });
    },
  });

  const reviewDoc = useMutation({
    mutationFn: ({
      id,
      decision,
    }: {
      id: string;
      decision: "ACCEPTED" | "REJECTED";
    }) => edgeApi.reviewAcquisitionDocument(id, { decision }),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["edge", "acquisition", "documents"] }),
  });

  const createQuote = useMutation({
    mutationFn: () =>
      edgeApi.createAcquisitionQuotation({
        prospectId: quoteForm.prospectId.trim(),
        notes: quoteForm.notes.trim() || null,
      }),
    onSuccess: () => {
      setQuoteForm({ prospectId: "", notes: "" });
      void qc.invalidateQueries({ queryKey: ["edge", "acquisition", "quotations"] });
    },
  });

  const createCheckout = useMutation({
    mutationFn: () =>
      edgeApi.createAcquisitionCheckout({
        prospectId: checkoutForm.prospectId.trim(),
        applicationId: checkoutForm.applicationId.trim() || null,
        idempotencyKey:
          checkoutForm.idempotencyKey.trim() ||
          (typeof crypto !== "undefined" ? crypto.randomUUID() : `acq-${Date.now()}`),
      }),
    onSuccess: () => {
      setCheckoutForm({ prospectId: "", applicationId: "", idempotencyKey: "" });
      void qc.invalidateQueries({ queryKey: ["edge", "acquisition", "checkouts"] });
    },
  });

  const initiatePayment = useMutation({
    mutationFn: async (checkoutSessionId: string) => {
      setPaymentActionResult(null);
      const body = {
        billingAccountId: paymentForm.billingAccountId.trim(),
        amount: paymentForm.amount.trim(),
        currency: paymentForm.currency.trim() || "EUR",
      };
      if (
        typeof edgeApi.initiateAcquisitionPayment === "function"
      ) {
        try {
          return await edgeApi.initiateAcquisitionPayment(checkoutSessionId, body);
        } catch (err) {
          const msg = errMsg(err);
          if (
            /404|not found|initiate-payment|Unknown|Cannot POST/i.test(msg) &&
            paymentForm.paymentIntentRef.trim()
          ) {
            return edgeApi.attachAcquisitionPaymentReference(checkoutSessionId, {
              paymentIntentRef: paymentForm.paymentIntentRef.trim(),
              metadata: {
                fallback: "attachAcquisitionPaymentReference",
                billingAccountId: body.billingAccountId,
                amount: body.amount,
                currency: body.currency,
              },
            });
          }
          throw err;
        }
      }
      if (!paymentForm.paymentIntentRef.trim()) {
        throw new Error(
          "initiateAcquisitionPayment indisponible — fournissez paymentIntentRef pour attachAcquisitionPaymentReference.",
        );
      }
      return edgeApi.attachAcquisitionPaymentReference(checkoutSessionId, {
        paymentIntentRef: paymentForm.paymentIntentRef.trim(),
        metadata: {
          fallback: "attachAcquisitionPaymentReference",
          billingAccountId: body.billingAccountId,
          amount: body.amount,
          currency: body.currency,
        },
      });
    },
    onSuccess: (res) => {
      const data = unwrapData<{
        checkout?: CheckoutSession;
        paymentIntent?: { id?: string; providerIntentRef?: string | null };
        paymentIntentRef?: string;
        providerResult?: { status?: string };
        billingSessionRef?: string | null;
        status?: string;
      }>(res);
      const ref =
        data?.paymentIntentRef ??
        data?.paymentIntent?.providerIntentRef ??
        data?.paymentIntent?.id ??
        data?.checkout?.billingSessionRef ??
        data?.billingSessionRef ??
        null;
      const status =
        data?.providerResult?.status ??
        data?.checkout?.status ??
        data?.status ??
        null;
      setPaymentActionResult(
        [
          ref ? `paymentIntentRef: ${ref}` : null,
          status ? `status: ${status}` : null,
        ]
          .filter(Boolean)
          .join(" · ") || "Paiement initié / référence attachée (voir session).",
      );
      if (ref) {
        setPaymentForm((f) => ({ ...f, paymentIntentRef: String(ref) }));
      }
      void qc.invalidateQueries({ queryKey: ["edge", "acquisition", "checkouts"] });
    },
  });

  const recordPayment = useMutation({
    mutationFn: ({
      checkoutSessionId,
      p6Status,
    }: {
      checkoutSessionId: string;
      p6Status: string;
    }) =>
      edgeApi.recordAcquisitionPaymentResult(checkoutSessionId, {
        p6Status,
        externalRef: paymentForm.paymentIntentRef.trim() || null,
      }),
    onSuccess: (_res, vars) => {
      setPaymentActionResult(`Résultat enregistré: ${vars.p6Status}`);
      void qc.invalidateQueries({ queryKey: ["edge", "acquisition", "checkouts"] });
    },
  });

  const advanceJourney = useMutation({
    mutationFn: ({ id, complete }: { id: string; complete?: boolean }) =>
      edgeApi.advanceAcquisitionJourney(id, { complete }),
    onSuccess: () =>
      void qc.invalidateQueries({
        queryKey: ["edge", "acquisition", "journey", journeyLookupId],
      }),
  });

  if (!canAny) {
    return (
      <EdgeForbiddenState
        title="Acquisition inaccessible"
        description="Permissions platform:acquisition:* requises."
      />
    );
  }

  const overview = unwrapData<import("@/types/edge-acquisition").AcquisitionOverview>(
    overviewQ.data,
  );
  const products = unwrapPage<ProductPresentation>(productsQ.data);
  const plans = unwrapPage<PlanPresentation>(plansQ.data);
  const forms = unwrapPage<FormSchema>(formsQ.data);
  const prospects = unwrapPage<Prospect>(prospectsQ.data);
  const applications = unwrapPage<Application>(applicationsQ.data);
  const documents = unwrapPage<DocumentReference>(documentsQ.data);
  const quotations = unwrapPage<QuoteRequest>(quotationsQ.data);
  const checkouts = unwrapPage<CheckoutSession>(checkoutsQ.data);
  const handoffs = unwrapPage<SubscriptionHandoff>(handoffsQ.data);
  const funnel = unwrapData<import("@/types/edge-acquisition").ConversionFunnel>(
    funnelQ.data,
  );
  const journey = unwrapData<import("@/types/edge-acquisition").JourneyInstance | null>(
    journeyQ.data,
  );

  const selectedCheckout =
    checkouts.items.find((c) => c.id === selectedCheckoutId) ?? null;

  const actionError =
    createProduct.error ??
    createPlan.error ??
    createFormSchema.error ??
    createFormVersion.error ??
    publishFormVersion.error ??
    createProspect.error ??
    submitApp.error ??
    saveDraftAnswers.error ??
    transitionApp.error ??
    requestInfo.error ??
    registerDoc.error ??
    reviewDoc.error ??
    createQuote.error ??
    createCheckout.error ??
    initiatePayment.error ??
    recordPayment.error ??
    advanceJourney.error;

  return (
    <div className="flex flex-col gap-[var(--space-6)]" data-testid="edge-acquisition-module">
      {actionError ? (
        <p className="type-sm text-[var(--danger)]" role="alert">
          {errMsg(actionError)}
        </p>
      ) : null}

      <Tabs
        tabs={visibleTabs.map((t) => ({ id: t.id, label: t.label }))}
        value={activeTab}
        onChange={(id) => setTab(id as TabId)}
      />

      {activeTab === "overview" && canRead ? (
        <section className="space-y-4" data-testid="acq-overview">
          <h2 className="type-md font-medium">Acquisition overview</h2>
          {overviewQ.isLoading ? <EdgeLoadingState /> : null}
          {overviewQ.isError ? (
            <EdgeErrorState title="Overview unavailable" description={errMsg(overviewQ.error)} />
          ) : null}
          {overview ? (
            <div className="flex flex-wrap gap-2 type-sm">
              <Badge>Presentations published: {overview.presentationsPublished}</Badge>
              <Badge>Prospects active: {overview.prospectsActive}</Badge>
              <Badge>Leads captured: {overview.leadsCaptured}</Badge>
              <Badge tone="warning">Applications open: {overview.applicationsOpen}</Badge>
              <Badge tone="warning">Checkouts pending: {overview.checkoutsPending}</Badge>
              <Badge>Handoffs requested: {overview.handoffsRequested}</Badge>
            </div>
          ) : null}
          {!overviewQ.isLoading && !overviewQ.isError && !overview ? (
            <EdgeEmptyState
              title="No overview payload"
              description="Counts come from the API only — nothing invented."
            />
          ) : null}
        </section>
      ) : null}

      {activeTab === "products" && canRead ? (
        <section className="space-y-4" data-testid="acq-products">
          <QueryShell
            loading={productsQ.isLoading}
            error={productsQ.isError ? productsQ.error : null}
            empty={!productsQ.isLoading && products.items.length === 0}
            emptyTitle="No product presentations"
            emptyDescription="Create a presentation linked to a commercial product before publishing discovery content."
          >
            <DenseTable
              headers={["Title", "Code", "Slug", "Status", "Locale", "Updated"]}
              testId="acq-products-table"
            >
              {products.items.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2 font-medium">{p.title}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{p.code}</td>
                  <td className="px-3 py-2">{p.slug}</td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{p.locale}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {formatWhen(p.updatedAt)}
                  </td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>
          <EdgePermissionGate permission="platform:acquisition:manage">
            <div className="space-y-3 border-t border-[var(--border)] pt-4">
              <h3 className="type-sm font-medium">Create product presentation</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {(
                  [
                    ["productId", "productId (UUID)"],
                    ["code", "code"],
                    ["slug", "slug"],
                    ["title", "title"],
                    ["summary", "summary"],
                  ] as const
                ).map(([key, label]) => (
                  <input
                    key={key}
                    className={fieldControlClass}
                    placeholder={label}
                    aria-label={label}
                    value={productForm[key]}
                    onChange={(e) =>
                      setProductForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                  />
                ))}
              </div>
              <Button
                type="button"
                disabled={
                  createProduct.isPending ||
                  productForm.productId.trim().length < 8 ||
                  productForm.code.trim().length < 1 ||
                  productForm.slug.trim().length < 1 ||
                  productForm.title.trim().length < 1
                }
                onClick={() => createProduct.mutate()}
              >
                Create presentation
              </Button>
            </div>
          </EdgePermissionGate>
        </section>
      ) : null}

      {activeTab === "plans" && canRead ? (
        <section className="space-y-4" data-testid="acq-plans">
          <QueryShell
            loading={plansQ.isLoading}
            error={plansQ.isError ? plansQ.error : null}
            empty={!plansQ.isLoading && plans.items.length === 0}
            emptyTitle="No plan presentations"
            emptyDescription="Plan presentations surface commercial plans for discovery and checkout."
          >
            <DenseTable
              headers={["Title", "Code", "Price mode", "Currency", "Status"]}
              testId="acq-plans-table"
            >
              {plans.items.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2 font-medium">{p.title}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{p.code}</td>
                  <td className="px-3 py-2">{p.priceDisplayMode}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {p.currencyHint ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                  </td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>
          <EdgePermissionGate permission="platform:acquisition:manage">
            <div className="space-y-3 border-t border-[var(--border)] pt-4">
              <h3 className="type-sm font-medium">Create plan presentation</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className={fieldControlClass}
                  placeholder="commercialPlanId"
                  aria-label="commercialPlanId"
                  value={planForm.commercialPlanId}
                  onChange={(e) =>
                    setPlanForm((f) => ({ ...f, commercialPlanId: e.target.value }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="code"
                  aria-label="plan code"
                  value={planForm.code}
                  onChange={(e) => setPlanForm((f) => ({ ...f, code: e.target.value }))}
                />
                <input
                  className={fieldControlClass}
                  placeholder="title"
                  aria-label="plan title"
                  value={planForm.title}
                  onChange={(e) => setPlanForm((f) => ({ ...f, title: e.target.value }))}
                />
                <input
                  className={fieldControlClass}
                  placeholder="priceDisplayMode"
                  aria-label="priceDisplayMode"
                  value={planForm.priceDisplayMode}
                  onChange={(e) =>
                    setPlanForm((f) => ({ ...f, priceDisplayMode: e.target.value }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="productPresentationId (optional)"
                  aria-label="productPresentationId"
                  value={planForm.productPresentationId}
                  onChange={(e) =>
                    setPlanForm((f) => ({
                      ...f,
                      productPresentationId: e.target.value,
                    }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="currencyHint"
                  aria-label="currencyHint"
                  value={planForm.currencyHint}
                  onChange={(e) =>
                    setPlanForm((f) => ({ ...f, currencyHint: e.target.value }))
                  }
                />
              </div>
              <Button
                type="button"
                disabled={
                  createPlan.isPending ||
                  planForm.commercialPlanId.trim().length < 8 ||
                  planForm.code.trim().length < 1 ||
                  planForm.title.trim().length < 1
                }
                onClick={() => createPlan.mutate()}
              >
                Create plan
              </Button>
            </div>
          </EdgePermissionGate>
        </section>
      ) : null}

      {activeTab === "forms" && canRead ? (
        <section className="space-y-4" data-testid="acq-forms">
          <QueryShell
            loading={formsQ.isLoading}
            error={formsQ.isError ? formsQ.error : null}
            empty={!formsQ.isLoading && forms.items.length === 0}
            emptyTitle="No form schemas"
            emptyDescription="Create a schema, draft a version (JSON sections/fields), then publish."
          >
            <DenseTable
              headers={["Name", "Code", "Status", "Published version", "Updated"]}
              testId="acq-forms-table"
            >
              {forms.items.map((f) => (
                <tr key={f.id}>
                  <td className="px-3 py-2 font-medium">
                    <button
                      type="button"
                      className="text-left underline-offset-2 hover:underline"
                      onClick={() => setSelectedFormId(f.id)}
                    >
                      {f.name}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{f.code}</td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(f.status)}>{f.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {f.currentPublishedVersionId ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {formatWhen(f.updatedAt)}
                  </td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>

          <div className="space-y-4 border-t border-[var(--border)] pt-4">
            <h3 className="type-sm font-medium">Form builder</h3>
            <p className="type-sm text-[var(--text-muted)]">
              Éditeur contraint : JSON sections/fields uniquement — pas de JavaScript arbitraire.
              {selectedFormId ? (
                <>
                  {" "}
                  Schéma sélectionné : <code>{selectedFormId}</code>
                </>
              ) : null}
            </p>

            <EdgePermissionGate permission="platform:acquisition:forms:manage">
              <div className="grid gap-3 md:grid-cols-3">
                <input
                  className={fieldControlClass}
                  placeholder="code"
                  aria-label="form schema code"
                  value={formSchemaForm.code}
                  onChange={(e) =>
                    setFormSchemaForm((f) => ({ ...f, code: e.target.value }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="name"
                  aria-label="form schema name"
                  value={formSchemaForm.name}
                  onChange={(e) =>
                    setFormSchemaForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="description"
                  aria-label="form schema description"
                  value={formSchemaForm.description}
                  onChange={(e) =>
                    setFormSchemaForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
              <Button
                type="button"
                disabled={
                  createFormSchema.isPending ||
                  formSchemaForm.code.trim().length < 1 ||
                  formSchemaForm.name.trim().length < 1
                }
                onClick={() => createFormSchema.mutate()}
              >
                Create schema
              </Button>

              <label className="block type-xs text-[var(--text-muted)]" htmlFor="acq-schema-json">
                Draft version schemaDefinition (JSON)
              </label>
              <textarea
                id="acq-schema-json"
                className={`${fieldControlClass} min-h-[180px] font-mono type-xs`}
                value={schemaJson}
                onChange={(e) => setSchemaJson(e.target.value)}
                spellCheck={false}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={createFormVersion.isPending || selectedFormId.trim().length < 8}
                  onClick={() => createFormVersion.mutate()}
                >
                  Create draft version
                </Button>
              </div>
              {draftVersionId ? (
                <div className="space-y-3">
                  <p className="type-sm text-[var(--text-muted)]">
                    Draft version id: <code>{draftVersionId}</code>
                  </p>
                  {canFormsPublish ? (
                    <div className="space-y-3">
                      <h4 className="type-sm font-medium">Publish (channel + publicSlug)</h4>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          className={fieldControlClass}
                          placeholder="channel (PUBLIC_WEB)"
                          aria-label="publish channel"
                          value={publishForm.channel}
                          onChange={(e) =>
                            setPublishForm((f) => ({ ...f, channel: e.target.value }))
                          }
                        />
                        <input
                          className={fieldControlClass}
                          placeholder="publicSlug (required for public apply)"
                          aria-label="publish publicSlug"
                          value={publishForm.publicSlug}
                          onChange={(e) =>
                            setPublishForm((f) => ({
                              ...f,
                              publicSlug: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={publishFormVersion.isPending}
                        onClick={() => {
                          const slug =
                            publishForm.publicSlug.trim() ||
                            `form-${draftVersionId.slice(0, 8)}`;
                          if (
                            typeof window !== "undefined" &&
                            window.confirm(
                              `Publier ${draftVersionId} sur ${publishForm.channel.trim() || "PUBLIC_WEB"} / ${slug} ? La version devient immuable.`,
                            )
                          ) {
                            publishFormVersion.mutate(draftVersionId);
                          }
                        }}
                      >
                        Publish version
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </EdgePermissionGate>
            {!canFormsManage ? (
              <p className="type-sm text-[var(--text-muted)]">
                forms:manage requis pour créer des schémas / versions.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {activeTab === "prospects" && canRead ? (
        <section className="space-y-4" data-testid="acq-prospects">
          <QueryShell
            loading={prospectsQ.isLoading}
            error={prospectsQ.isError ? prospectsQ.error : null}
            empty={!prospectsQ.isLoading && prospects.items.length === 0}
            emptyTitle="No prospects"
            emptyDescription="Prospects appear after lead capture or manual create."
          >
            <DenseTable
              headers={["Email", "Name", "Company", "Status", "Created"]}
              testId="acq-prospects-table"
            >
              {prospects.items.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2 font-medium">{p.emailNormalized}</td>
                  <td className="px-3 py-2">{p.displayName ?? "—"}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {p.companyName ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {formatWhen(p.createdAt)}
                  </td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>
          <EdgePermissionGate permission="platform:acquisition:manage">
            <div className="space-y-3 border-t border-[var(--border)] pt-4">
              <h3 className="type-sm font-medium">Create prospect</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <input
                  className={fieldControlClass}
                  placeholder="email"
                  aria-label="prospect email"
                  value={prospectForm.email}
                  onChange={(e) =>
                    setProspectForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="displayName"
                  aria-label="prospect displayName"
                  value={prospectForm.displayName}
                  onChange={(e) =>
                    setProspectForm((f) => ({ ...f, displayName: e.target.value }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="companyName"
                  aria-label="prospect companyName"
                  value={prospectForm.companyName}
                  onChange={(e) =>
                    setProspectForm((f) => ({ ...f, companyName: e.target.value }))
                  }
                />
              </div>
              <Button
                type="button"
                disabled={createProspect.isPending || prospectForm.email.trim().length < 3}
                onClick={() => createProspect.mutate()}
              >
                Create prospect
              </Button>
            </div>
          </EdgePermissionGate>
        </section>
      ) : null}

      {activeTab === "applications" && canRead ? (
        <section className="space-y-4" data-testid="acq-applications">
          <h2 className="type-md font-medium">Application inbox</h2>
          <QueryShell
            loading={applicationsQ.isLoading}
            error={applicationsQ.isError ? applicationsQ.error : null}
            empty={!applicationsQ.isLoading && applications.items.length === 0}
            emptyTitle="No applications"
            emptyDescription="Inbox vide — les dossiers apparaîtront après soumission."
          >
            <DenseTable
              headers={["Number", "Prospect", "Status", "Submitted", "Actions"]}
              testId="acq-applications-table"
            >
              {applications.items.map((a) => (
                <tr key={a.id}>
                  <td className="px-3 py-2 font-medium">{a.applicationNumber}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{a.prospectId}</td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {formatWhen(a.submittedAt)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <EdgePermissionGate permission="platform:acquisition:manage">
                        {a.status === "DRAFT" ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setDraftSaveError(null);
                                setDraftAppId(a.id);
                                setDraftAnswersJson(
                                  draftAnswersById[a.id] ??
                                    JSON.stringify(
                                      (a.metadata?.answers as Record<string, unknown>) ??
                                        {},
                                      null,
                                      2,
                                    ),
                                );
                              }}
                            >
                              Resume
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={submitApp.isPending}
                              onClick={() => submitApp.mutate(a.id)}
                            >
                              Submit
                            </Button>
                          </>
                        ) : null}
                      </EdgePermissionGate>
                      <EdgePermissionGate permission="platform:acquisition:review">
                        {a.status === "SUBMITTED" ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled={transitionApp.isPending}
                            onClick={() =>
                              transitionApp.mutate({ id: a.id, toStatus: "IN_REVIEW" })
                            }
                          >
                            Start review
                          </Button>
                        ) : null}
                        {["IN_REVIEW", "QUALIFICATION_PENDING"].includes(String(a.status)) ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              disabled={transitionApp.isPending}
                              onClick={() =>
                                transitionApp.mutate({ id: a.id, toStatus: "APPROVED" })
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={transitionApp.isPending}
                              onClick={() =>
                                transitionApp.mutate({ id: a.id, toStatus: "REJECTED" })
                              }
                            >
                              Reject
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={requestInfo.isPending}
                              onClick={() => requestInfo.mutate(a.id)}
                            >
                              Request info
                            </Button>
                          </>
                        ) : null}
                      </EdgePermissionGate>
                    </div>
                  </td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>

          {draftAppId ? (
            <EdgePermissionGate permission="platform:acquisition:manage">
              <div
                className="space-y-3 border border-[var(--border)] p-4"
                data-testid="acq-draft-resume"
              >
                <h3 className="type-sm font-medium">
                  Draft resume — answers JSON ({draftAppId})
                </h3>
                <p className="type-xs text-[var(--text-muted)]">
                  Pas de getApplication dédié : réponses chargées depuis l&apos;état local /
                  metadata.list. expectedVersion = version courante de la ligne liste si
                  disponible.
                </p>
                <textarea
                  className={`${fieldControlClass} min-h-[10rem] font-mono type-xs`}
                  aria-label="draft answers JSON"
                  value={draftAnswersJson}
                  onChange={(e) => setDraftAnswersJson(e.target.value)}
                />
                {draftSaveError ? (
                  <p className="type-xs text-[var(--danger)]" role="alert">
                    {draftSaveError}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={saveDraftAnswers.isPending || !draftAppId}
                    onClick={() => {
                      setDraftSaveError(null);
                      if (!draftAppId) return;
                      let parsed: Record<string, unknown>;
                      try {
                        parsed = JSON.parse(draftAnswersJson) as Record<string, unknown>;
                      } catch {
                        setDraftSaveError("Answers JSON invalide");
                        return;
                      }
                      if (
                        !parsed ||
                        typeof parsed !== "object" ||
                        Array.isArray(parsed)
                      ) {
                        setDraftSaveError("Answers doit être un objet JSON");
                        return;
                      }
                      const app = applications.items.find((x) => x.id === draftAppId);
                      saveDraftAnswers.mutate({
                        id: draftAppId,
                        answers: parsed,
                        expectedVersion: app?.version,
                      });
                    }}
                  >
                    Save answers
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setDraftAppId(null);
                      setDraftAnswersJson("{}");
                      setDraftSaveError(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </EdgePermissionGate>
          ) : null}
        </section>
      ) : null}

      {activeTab === "documents" && canRead ? (
        <section className="space-y-4" data-testid="acq-documents">
          <p className="type-sm text-[var(--text-muted)]">
            Références de stockage privées uniquement — pas d&apos;URL publique exposée.
          </p>
          <QueryShell
            loading={documentsQ.isLoading}
            error={documentsQ.isError ? documentsQ.error : null}
            empty={!documentsQ.isLoading && documents.items.length === 0}
            emptyTitle="No document references"
            emptyDescription="Aucune référence document renvoyée par l’API — rien n’est inventé."
          >
            <DenseTable
              headers={["Type", "Application", "Storage", "File", "Status", "Actions"]}
              testId="acq-documents-table"
            >
              {documents.items.map((d) => (
                <tr key={d.id}>
                  <td className="px-3 py-2 font-medium">{d.documentType}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{d.applicationId}</td>
                  <td className="px-3 py-2 font-mono type-xs break-all">
                    {d.storageRef}
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {d.fileName ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <EdgePermissionGate permission="platform:acquisition:review">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          type="button"
                          size="sm"
                          disabled={reviewDoc.isPending}
                          onClick={() =>
                            reviewDoc.mutate({ id: d.id, decision: "ACCEPTED" })
                          }
                        >
                          Accept
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={reviewDoc.isPending}
                          onClick={() =>
                            reviewDoc.mutate({ id: d.id, decision: "REJECTED" })
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </EdgePermissionGate>
                  </td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>
          <EdgePermissionGate permission="platform:acquisition:manage">
            <div className="space-y-3 border-t border-[var(--border)] pt-4">
              <h3 className="type-sm font-medium">Register document reference</h3>
              <p className="type-xs text-[var(--text-muted)]">
                Métadonnées fichier uniquement — jamais d&apos;upload binaire vers une URL
                publique. storageKey privé + privateLocator edge-private://.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className={fieldControlClass}
                  placeholder="applicationId"
                  aria-label="document applicationId"
                  value={docForm.applicationId}
                  onChange={(e) =>
                    setDocForm((f) => ({ ...f, applicationId: e.target.value }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="documentType"
                  aria-label="documentType"
                  value={docForm.documentType}
                  onChange={(e) =>
                    setDocForm((f) => ({ ...f, documentType: e.target.value }))
                  }
                />
                <input
                  className={fieldControlClass}
                  type="file"
                  aria-label="document file metadata"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const storageKey = `private/acq/${Date.now()}-${file.name}`;
                    setDocForm((f) => ({
                      ...f,
                      fileName: file.name,
                      contentType: file.type || "application/octet-stream",
                      byteSize: String(file.size),
                      storageKey,
                      privateLocator: `edge-private://${storageKey}`,
                    }));
                  }}
                />
                <input
                  className={fieldControlClass}
                  placeholder="storageKey (private)"
                  aria-label="storageKey"
                  value={docForm.storageKey}
                  onChange={(e) => {
                    const storageKey = e.target.value;
                    setDocForm((f) => ({
                      ...f,
                      storageKey,
                      privateLocator: storageKey
                        ? `edge-private://${storageKey}`
                        : "",
                    }));
                  }}
                />
                <input
                  className={fieldControlClass}
                  placeholder="fileName"
                  aria-label="fileName"
                  value={docForm.fileName}
                  onChange={(e) =>
                    setDocForm((f) => ({ ...f, fileName: e.target.value }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="contentType"
                  aria-label="contentType"
                  value={docForm.contentType}
                  readOnly
                />
                <input
                  className={fieldControlClass}
                  placeholder="byteSize"
                  aria-label="byteSize"
                  value={docForm.byteSize}
                  readOnly
                />
                <input
                  className={fieldControlClass}
                  placeholder="privateLocator"
                  aria-label="privateLocator"
                  value={docForm.privateLocator}
                  readOnly
                />
              </div>
              <Button
                type="button"
                disabled={
                  registerDoc.isPending ||
                  docForm.applicationId.trim().length < 8 ||
                  docForm.documentType.trim().length < 1 ||
                  docForm.storageKey.trim().length < 1
                }
                onClick={() => registerDoc.mutate()}
              >
                Register document reference
              </Button>
            </div>
          </EdgePermissionGate>
          {!canManage ? (
            <p className="type-sm text-[var(--text-muted)]">
              manage requis pour enregistrer une référence document.
            </p>
          ) : null}
        </section>
      ) : null}

      {activeTab === "quotes" && canRead ? (
        <section className="space-y-4" data-testid="acq-quotes">
          <QueryShell
            loading={quotationsQ.isLoading}
            error={quotationsQ.isError ? quotationsQ.error : null}
            empty={!quotationsQ.isLoading && quotations.items.length === 0}
            emptyTitle="No quote requests"
            emptyDescription="Aucune demande de devis renvoyée par l’API."
          >
            <DenseTable
              headers={["Id", "Prospect", "Application", "Status", "Notes", "Created"]}
              testId="acq-quotes-table"
            >
              {quotations.items.map((q) => (
                <tr key={q.id}>
                  <td className="px-3 py-2 font-mono type-xs">{q.id}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{q.prospectId}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {q.applicationId ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(q.status)}>{q.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {q.notes ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {formatWhen(q.createdAt)}
                  </td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>
          <EdgePermissionGate permission="platform:acquisition:quotes:manage">
            <div className="space-y-3 border-t border-[var(--border)] pt-4">
              <h3 className="type-sm font-medium">Create quote request</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className={fieldControlClass}
                  placeholder="prospectId"
                  aria-label="quote prospectId"
                  value={quoteForm.prospectId}
                  onChange={(e) =>
                    setQuoteForm((f) => ({ ...f, prospectId: e.target.value }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="notes"
                  aria-label="quote notes"
                  value={quoteForm.notes}
                  onChange={(e) =>
                    setQuoteForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </div>
              <Button
                type="button"
                disabled={
                  createQuote.isPending || quoteForm.prospectId.trim().length < 8
                }
                onClick={() => createQuote.mutate()}
              >
                Create quote request
              </Button>
            </div>
          </EdgePermissionGate>
          {!canQuotes ? (
            <p className="type-sm text-[var(--text-muted)]">
              quotes:manage requis pour créer une demande de devis.
            </p>
          ) : null}
        </section>
      ) : null}

      {activeTab === "checkout" && canRead ? (
        <section className="space-y-4" data-testid="acq-checkout">
          <p className="type-sm text-[var(--text-muted)]">
            Sessions checkout et handoffs — aucun champ carte. Paiement via références P6.
          </p>
          <QueryShell
            loading={checkoutsQ.isLoading}
            error={checkoutsQ.isError ? checkoutsQ.error : null}
            empty={!checkoutsQ.isLoading && checkouts.items.length === 0}
            emptyTitle="No checkout sessions"
            emptyDescription="Aucune session checkout renvoyée par l’API."
          >
            <DenseTable
              headers={["Id", "Prospect", "Application", "Status", "Billing ref", "Select"]}
              testId="acq-checkouts-table"
            >
              {checkouts.items.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2 font-mono type-xs">{c.id}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{c.prospectId}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {c.applicationId ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {c.billingSessionRef ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={selectedCheckoutId === c.id ? "default" : "secondary"}
                      onClick={() => {
                        setSelectedCheckoutId(c.id);
                        setPaymentActionResult(null);
                        setPaymentForm((f) => ({
                          ...f,
                          paymentIntentRef: c.billingSessionRef ?? f.paymentIntentRef,
                        }));
                      }}
                    >
                      {selectedCheckoutId === c.id ? "Selected" : "Select"}
                    </Button>
                  </td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>

          <EdgePermissionGate permission="platform:acquisition:checkout:operate">
            <div
              className="space-y-3 border border-[var(--border)] p-4"
              data-testid="acq-checkout-payment"
            >
              <h3 className="type-sm font-medium">Payment (P6 refs only)</h3>
              <p className="type-xs text-[var(--text-muted)]">
                Aucun champ carte / CVV. Initiate via P6 ou fallback attach payment
                reference.
              </p>
              {!selectedCheckoutId ? (
                <p className="type-sm text-[var(--text-muted)]">
                  Sélectionnez une session checkout ci-dessus.
                </p>
              ) : (
                <>
                  <dl className="grid gap-2 type-sm md:grid-cols-2">
                    <div>
                      <dt className="text-[var(--text-muted)]">Session</dt>
                      <dd className="font-mono type-xs break-all">{selectedCheckoutId}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--text-muted)]">Status</dt>
                      <dd>{selectedCheckout?.status ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--text-muted)]">paymentIntentRef / billing</dt>
                      <dd className="font-mono type-xs break-all">
                        {(selectedCheckout?.billingSessionRef ??
                          paymentForm.paymentIntentRef) ||
                          "— (aucune ref encore)"}
                      </dd>
                    </div>
                  </dl>
                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      className={fieldControlClass}
                      placeholder="billingAccountId"
                      aria-label="billingAccountId"
                      value={paymentForm.billingAccountId}
                      onChange={(e) =>
                        setPaymentForm((f) => ({
                          ...f,
                          billingAccountId: e.target.value,
                        }))
                      }
                    />
                    <input
                      className={fieldControlClass}
                      placeholder="amount"
                      aria-label="payment amount"
                      value={paymentForm.amount}
                      onChange={(e) =>
                        setPaymentForm((f) => ({ ...f, amount: e.target.value }))
                      }
                    />
                    <input
                      className={fieldControlClass}
                      placeholder="currency"
                      aria-label="payment currency"
                      value={paymentForm.currency}
                      onChange={(e) =>
                        setPaymentForm((f) => ({ ...f, currency: e.target.value }))
                      }
                    />
                    <input
                      className={fieldControlClass}
                      placeholder="paymentIntentRef (fallback attach)"
                      aria-label="paymentIntentRef fallback"
                      value={paymentForm.paymentIntentRef}
                      onChange={(e) =>
                        setPaymentForm((f) => ({
                          ...f,
                          paymentIntentRef: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={
                        initiatePayment.isPending ||
                        paymentForm.billingAccountId.trim().length < 8 ||
                        !paymentForm.amount.trim() ||
                        !paymentForm.currency.trim()
                      }
                      onClick={() => initiatePayment.mutate(selectedCheckoutId)}
                    >
                      Initiate payment
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={recordPayment.isPending}
                      onClick={() =>
                        recordPayment.mutate({
                          checkoutSessionId: selectedCheckoutId,
                          p6Status: "FAILED",
                        })
                      }
                    >
                      Record failure
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={recordPayment.isPending}
                      onClick={() =>
                        recordPayment.mutate({
                          checkoutSessionId: selectedCheckoutId,
                          p6Status: "CAPTURED",
                        })
                      }
                    >
                      Record captured
                    </Button>
                  </div>
                  {paymentActionResult ? (
                    <p className="type-sm text-[var(--text-secondary)]" role="status">
                      {paymentActionResult}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </EdgePermissionGate>

          <h3 className="type-sm font-medium">Subscription handoffs</h3>
          <QueryShell
            loading={handoffsQ.isLoading}
            error={handoffsQ.isError ? handoffsQ.error : null}
            empty={!handoffsQ.isLoading && handoffs.items.length === 0}
            emptyTitle="No handoffs"
            emptyDescription="Aucun handoff renvoyé — jamais marqué « provisionné » sans API."
          >
            <DenseTable
              headers={["Id", "Prospect", "Checkout", "Status", "Subscription", "Updated"]}
              testId="acq-handoffs-table"
            >
              {handoffs.items.map((h) => (
                <tr key={h.id}>
                  <td className="px-3 py-2 font-mono type-xs">{h.id}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{h.prospectId}</td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {h.checkoutSessionId ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(h.status)}>{h.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {h.subscriptionRef ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    {formatWhen(h.updatedAt)}
                  </td>
                </tr>
              ))}
            </DenseTable>
          </QueryShell>

          <EdgePermissionGate permission="platform:acquisition:checkout:operate">
            <div className="space-y-3 border-t border-[var(--border)] pt-4">
              <h3 className="type-sm font-medium">Create checkout session</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className={fieldControlClass}
                  placeholder="prospectId"
                  aria-label="checkout prospectId"
                  value={checkoutForm.prospectId}
                  onChange={(e) =>
                    setCheckoutForm((f) => ({ ...f, prospectId: e.target.value }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="applicationId (optional)"
                  aria-label="checkout applicationId"
                  value={checkoutForm.applicationId}
                  onChange={(e) =>
                    setCheckoutForm((f) => ({
                      ...f,
                      applicationId: e.target.value,
                    }))
                  }
                />
                <input
                  className={fieldControlClass}
                  placeholder="idempotencyKey (auto if empty)"
                  aria-label="checkout idempotencyKey"
                  value={checkoutForm.idempotencyKey}
                  onChange={(e) =>
                    setCheckoutForm((f) => ({
                      ...f,
                      idempotencyKey: e.target.value,
                    }))
                  }
                />
              </div>
              <Button
                type="button"
                disabled={
                  createCheckout.isPending || checkoutForm.prospectId.trim().length < 8
                }
                onClick={() => createCheckout.mutate()}
              >
                Create checkout session
              </Button>
            </div>
          </EdgePermissionGate>
          {!canCheckout ? (
            <p className="type-sm text-[var(--text-muted)]">
              checkout:operate requis pour créer une session.
            </p>
          ) : null}
        </section>
      ) : null}

      {activeTab === "journeys" && canRead ? (
        <section className="space-y-4" data-testid="acq-journeys">
          <div className="flex flex-wrap items-end gap-2">
            <div className="grow max-w-md">
              <label className="type-xs text-[var(--text-muted)]" htmlFor="acq-journey-app">
                Application id
              </label>
              <input
                id="acq-journey-app"
                className={fieldControlClass}
                value={journeyAppId}
                onChange={(e) => setJourneyAppId(e.target.value)}
                placeholder="UUID application"
              />
            </div>
            <Button
              type="button"
              onClick={() => setJourneyLookupId(journeyAppId.trim())}
              disabled={journeyAppId.trim().length < 8}
            >
              Load journey
            </Button>
          </div>
          {journeyLookupId ? (
            <QueryShell
              loading={journeyQ.isLoading}
              error={journeyQ.isError ? journeyQ.error : null}
              empty={!journeyQ.isLoading && !journey}
              emptyTitle="No journey for this application"
              emptyDescription="Aucune instance de parcours liée — l’API ne fabrique pas de journey."
            >
              {journey ? (
                <div className="space-y-3 type-sm">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={statusTone(journey.status)}>{journey.status}</Badge>
                    <Badge>Step: {journey.currentStepKey ?? "—"}</Badge>
                    <Badge>Id: {journey.id}</Badge>
                  </div>
                  <EdgePermissionGate permission="platform:acquisition:governance:manage">
                    <Button
                      type="button"
                      size="sm"
                      disabled={advanceJourney.isPending}
                      onClick={() =>
                        advanceJourney.mutate({ id: journey.id, complete: true })
                      }
                    >
                      Mark complete
                    </Button>
                  </EdgePermissionGate>
                  {!canGovernance ? (
                    <p className="text-[var(--text-muted)]">
                      governance:manage requis pour avancer le parcours.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </QueryShell>
          ) : (
            <EdgeEmptyState
              title="Lookup a journey"
              description="Saisissez un applicationId pour interroger l’API."
            />
          )}
        </section>
      ) : null}

      {activeTab === "analytics" ? (
        <section className="space-y-4" data-testid="acq-analytics">
          {!canAnalytics ? (
            <EdgeForbiddenState
              title="Analytics"
              description="platform:acquisition:analytics:read requis."
            />
          ) : (
            <>
              <h2 className="type-md font-medium">Conversion funnel</h2>
              {funnelQ.isLoading ? <EdgeLoadingState /> : null}
              {funnelQ.isError ? (
                <EdgeErrorState
                  title="Funnel unavailable"
                  description={errMsg(funnelQ.error)}
                />
              ) : null}
              {funnel ? (
                <div className="space-y-3 type-sm">
                  {funnel.note ? (
                    <p className="text-[var(--text-muted)]">{funnel.note}</p>
                  ) : null}
                  <Badge>Total events: {funnel.totalEvents}</Badge>
                  {Object.keys(funnel.countsByEventName ?? {}).length === 0 ? (
                    <EdgeEmptyState
                      title="No analytics events"
                      description="Agrégats honnêtes uniquement — zéro n’est pas une conversion inventée."
                    />
                  ) : (
                    <DenseTable headers={["Event", "Count"]} testId="acq-funnel-table">
                      {Object.entries(funnel.countsByEventName)
                        .sort((a, b) => b[1] - a[1])
                        .map(([name, count]) => (
                          <tr key={name}>
                            <td className="px-3 py-2 font-medium">{name}</td>
                            <td className="px-3 py-2">{count}</td>
                          </tr>
                        ))}
                    </DenseTable>
                  )}
                </div>
              ) : null}
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
