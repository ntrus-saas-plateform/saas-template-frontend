/**
 * P10 — SaaS Customer Experience & Subscription Acquisition.
 * Mirrors backend domain (camelCase). Dates are ISO strings from the BFF.
 */

export type PresentationStatus =
  | "DRAFT"
  | "REVIEW"
  | "PUBLISHED"
  | "DEPRECATED"
  | "ARCHIVED";

export type ContentVersionStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "SUPERSEDED"
  | "ARCHIVED";

export type SegmentPresentationStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "DEPRECATED"
  | "ARCHIVED";

export type PriceDisplayMode =
  | "AUTHORITATIVE"
  | "INDICATIVE"
  | "QUOTE_REQUIRED"
  | "ENTERPRISE_CUSTOM";

export type ProspectStatus =
  | "NEW"
  | "CONTACTED"
  | "ENGAGED"
  | "QUALIFYING"
  | "QUALIFIED"
  | "APPLICATION_IN_PROGRESS"
  | "CHECKOUT_PENDING"
  | "HANDED_OFF"
  | "CONVERTED"
  | "DISQUALIFIED"
  | "ARCHIVED";

export type LeadStatus =
  | "CAPTURED"
  | "VERIFIED"
  | "SCORED"
  | "PROMOTED"
  | "MERGED"
  | "REJECTED"
  | "EXPIRED";

export type LeadSourceType =
  | "FORM"
  | "PUBLIC_LANDING"
  | "MARKETING_SIGNAL"
  | "MANUAL"
  | "API"
  | "PARTNER"
  | "OTHER";

export type FormSchemaStatus = "DRAFT" | "ACTIVE" | "DEPRECATED" | "ARCHIVED";

export type FormVersionStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "SUPERSEDED"
  | "ARCHIVED";

export type FormPublicationChannel =
  | "PUBLIC_WEB"
  | "PARTNER"
  | "INTERNAL"
  | "EMBED"
  | "API";

export type FormPublicationStatus = "ACTIVE" | "SUSPENDED" | "RETIRED";

export type DocumentRequirementStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type ApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "IN_REVIEW"
  | "DOCUMENTS_PENDING"
  | "QUALIFICATION_PENDING"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN"
  | "EXPIRED"
  | "CHECKOUT_READY"
  | "COMPLETED";

export type DocumentReferenceStatus =
  | "UPLOADED"
  | "PENDING_REVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "WITHDRAWN";

export type DocumentReviewDecision =
  | "ACCEPTED"
  | "REJECTED"
  | "NEEDS_RESUBMIT";

export type QualificationStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "APPROVED"
  | "REJECTED"
  | "CONDITIONAL"
  | "WITHDRAWN";

export type QuoteRequestStatus =
  | "REQUESTED"
  | "IN_PROGRESS"
  | "QUOTED"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export type QuoteReferenceStatus =
  | "ACTIVE"
  | "SUPERSEDED"
  | "EXPIRED"
  | "VOID";

export type CheckoutSessionStatus =
  | "CREATED"
  | "AWAITING_PAYMENT"
  | "AUTHORIZED"
  | "CAPTURED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "HANDOFF_READY"
  | "COMPLETED";

export type SubscriptionHandoffStatus =
  | "REQUESTED"
  | "SUBMITTED"
  | "ACKNOWLEDGED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type JourneyDefinitionStatus =
  | "DRAFT"
  | "ACTIVE"
  | "DEPRECATED"
  | "ARCHIVED";

export type JourneyInstanceStatus =
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type CommunicationChannel =
  | "EMAIL"
  | "SMS"
  | "WHATSAPP"
  | "IN_APP"
  | "WEBHOOK"
  | "OTHER";

export type CommunicationStatus =
  | "QUEUED"
  | "SENT"
  | "ACCEPTED"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED";

export type AcquisitionListFilter = {
  status?: string;
  prospectId?: string;
  applicationId?: string;
  productId?: string;
  productPresentationId?: string;
  q?: string;
  limit?: number;
  offset?: number;
};

export type AcquisitionListPage<T> = {
  items: T[];
  total: number;
};

export type ProductPresentation = {
  id: string;
  productId: string;
  code: string;
  slug: string;
  title: string;
  summary: string | null;
  status: PresentationStatus | string;
  locale: string;
  currentPublishedVersionId: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type ProductContentVersion = {
  id: string;
  presentationId: string;
  versionNumber: number;
  content: Record<string, unknown>;
  status: ContentVersionStatus | string;
  publishedAt: string | null;
  publishedBy: string | null;
  immutableAfterPublish: boolean;
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
};

export type SegmentPresentation = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  productPresentationId: string | null;
  status: SegmentPresentationStatus | string;
  targetingRules: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type PlanPresentation = {
  id: string;
  commercialPlanId: string;
  productPresentationId: string | null;
  code: string;
  title: string;
  summary: string | null;
  status: PresentationStatus | string;
  priceDisplayMode: PriceDisplayMode | string;
  priceDisplayRef: string | null;
  currencyHint: string | null;
  featuresDisplay: unknown[];
  ctaLabel: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type Prospect = {
  id: string;
  emailNormalized: string;
  displayName: string | null;
  companyName: string | null;
  status: ProspectStatus | string;
  commercialAccountId: string | null;
  productId: string | null;
  commercialPlanId: string | null;
  planPresentationId: string | null;
  locale: string | null;
  country: string | null;
  sourceChannel: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type AcquisitionLead = {
  id: string;
  prospectId: string | null;
  emailNormalized: string;
  status: LeadStatus | string;
  sourceType: LeadSourceType | string;
  sourceRef: string | null;
  formPublicationId: string | null;
  marketingLeadSoftRef: string | null;
  score: number | null;
  scoreBand: string | null;
  attribution: Record<string, unknown>;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type FormFieldDefinition = {
  key: string;
  type: string;
  label?: string;
  required?: boolean;
  options?: unknown[];
  min?: number;
  max?: number;
  pattern?: string;
  condition?: unknown;
};

export type FormSchemaDefinition = {
  fields?: FormFieldDefinition[];
  sections?: Array<{
    key?: string;
    title?: string;
    fields?: FormFieldDefinition[];
  }>;
  [key: string]: unknown;
};

export type FormSchema = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: FormSchemaStatus | string;
  productId: string | null;
  commercialPlanId: string | null;
  currentPublishedVersionId: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type FormVersion = {
  id: string;
  formSchemaId: string;
  versionNumber: number;
  schemaDefinition: FormSchemaDefinition;
  conditionRules: unknown[];
  status: FormVersionStatus | string;
  publishedAt: string | null;
  publishedBy: string | null;
  immutableAfterPublish: boolean;
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
};

export type FormPublication = {
  id: string;
  formSchemaId: string;
  formVersionId: string;
  channel: FormPublicationChannel | string;
  publicSlug: string | null;
  status: FormPublicationStatus | string;
  publishedAt: string;
  publishedBy: string;
  expiresAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type PublicFormPayload = {
  publication: FormPublication;
  formVersion: FormVersion;
  schema: FormSchema;
};

export type DocumentRequirement = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  formSchemaId: string | null;
  documentType: string;
  required: boolean;
  conditionRules: unknown[];
  status: DocumentRequirementStatus | string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type Application = {
  id: string;
  applicationNumber: string;
  prospectId: string;
  leadId: string | null;
  formSchemaId: string;
  formVersionId: string;
  formPublicationId: string | null;
  productId: string | null;
  commercialPlanId: string | null;
  planPresentationId: string | null;
  status: ApplicationStatus | string;
  submittedAt: string | null;
  decidedAt: string | null;
  decidedBy: string | null;
  decisionReason: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type DocumentReference = {
  id: string;
  applicationId: string;
  requirementId: string | null;
  documentType: string;
  storageRef: string;
  fileName: string | null;
  contentType: string | null;
  checksumSha256: string | null;
  status: DocumentReferenceStatus | string;
  metadata: Record<string, unknown>;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type QualificationRecord = {
  id: string;
  applicationId: string;
  status: QualificationStatus | string;
  outcomeSummary: string | null;
  reviewerId: string | null;
  approvedBy: string | null;
  decidedAt: string | null;
  criteria: Record<string, unknown>;
  evidence: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type QuoteRequest = {
  id: string;
  applicationId: string | null;
  prospectId: string;
  commercialPlanId: string | null;
  planPresentationId: string | null;
  status: QuoteRequestStatus | string;
  requestedBy: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type QuoteReference = {
  id: string;
  quoteRequestId: string;
  externalQuoteRef: string;
  commercialSource: string;
  status: QuoteReferenceStatus | string;
  validUntil: string | null;
  displaySummary: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type CheckoutSession = {
  id: string;
  applicationId: string | null;
  prospectId: string;
  planPresentationId: string | null;
  commercialPlanId: string | null;
  quoteReferenceId: string | null;
  status: CheckoutSessionStatus | string;
  billingSessionRef: string | null;
  idempotencyKey: string;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type SubscriptionHandoff = {
  id: string;
  checkoutSessionId: string | null;
  applicationId: string | null;
  prospectId: string;
  commercialAccountId: string | null;
  commercialPlanId: string | null;
  status: SubscriptionHandoffStatus | string;
  subscriptionRef: string | null;
  externalEvidenceRef: string | null;
  failureReason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type JourneyInstance = {
  id: string;
  journeyDefinitionId: string;
  prospectId: string | null;
  applicationId: string | null;
  status: JourneyInstanceStatus | string;
  currentStepKey: string | null;
  context: Record<string, unknown>;
  metadata: Record<string, unknown>;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
  version: number;
};

export type AcquisitionCommunication = {
  id: string;
  prospectId: string | null;
  applicationId: string | null;
  journeyInstanceId: string | null;
  channel: CommunicationChannel | string;
  templateRef: string | null;
  status: CommunicationStatus | string;
  providerRef: string | null;
  subject: string | null;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AcquisitionOverview = {
  presentationsPublished: number;
  prospectsActive: number;
  leadsCaptured: number;
  applicationsOpen: number;
  checkoutsPending: number;
  handoffsRequested: number;
};

export type ConversionFunnel = {
  totalEvents: number;
  countsByEventName: Record<string, number>;
  note?: string;
};

export type PublicProductDiscoveryItem = ProductPresentation;

export type PublicProductPage = {
  presentation: ProductPresentation;
  product: {
    id: string;
    code?: string;
    name?: string;
    commercialAvailability?: string;
    [key: string]: unknown;
  };
};

export type CustomerPortalSnapshot = {
  prospect: Prospect;
  applications: Application[];
  checkoutSessions: CheckoutSession[];
  subscriptionHandoffs: SubscriptionHandoff[];
  provisioningComplete: boolean;
  subscriptionHandoffCompleted: boolean;
  note?: string;
};

export type CreateProductPresentationBody = {
  productId: string;
  code: string;
  slug: string;
  title: string;
  summary?: string | null;
  locale?: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
};

export type PublishContentBody = {
  content?: Record<string, unknown>;
  versionNumber?: number;
  metadata?: Record<string, unknown>;
  correlationId?: string;
};

export type CreatePlanPresentationBody = {
  commercialPlanId: string;
  code: string;
  title: string;
  priceDisplayMode: string;
  productPresentationId?: string | null;
  summary?: string | null;
  priceDisplayRef?: string | null;
  currencyHint?: string | null;
  featuresDisplay?: unknown[];
  ctaLabel?: string | null;
  metadata?: Record<string, unknown>;
  correlationId?: string;
};

export type CreateSegmentPresentationBody = {
  code: string;
  name: string;
  description?: string | null;
  productPresentationId?: string | null;
  targetingRules?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  correlationId?: string;
};

export type CreateProspectBody = {
  email: string;
  displayName?: string | null;
  companyName?: string | null;
  productId?: string | null;
  commercialPlanId?: string | null;
  planPresentationId?: string | null;
  locale?: string | null;
  country?: string | null;
  sourceChannel?: string | null;
  metadata?: Record<string, unknown>;
  correlationId?: string;
};

export type TransitionProspectBody = {
  toStatus: string;
  patch?: Record<string, unknown>;
  expectedVersion?: number;
  correlationId?: string;
};

export type CaptureLeadBody = {
  email: string;
  sourceType: string;
  sourceRef?: string | null;
  formPublicationId?: string | null;
  marketingLeadSoftRef?: string | null;
  prospectId?: string | null;
  score?: number | null;
  scoreBand?: string | null;
  attribution?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  /** Honeypot — must stay empty for humans */
  website?: string | null;
  honeypot?: string | null;
  /** Client form-open timestamp (ms) for anti-automation */
  submittedAtMs?: number;
  correlationId?: string;
};

export type PromoteLeadBody = {
  prospectId?: string;
  createProspectIfMissing?: boolean;
  correlationId?: string;
};

export type CreateFormSchemaBody = {
  code: string;
  name: string;
  description?: string | null;
  productId?: string | null;
  commercialPlanId?: string | null;
  metadata?: Record<string, unknown>;
  correlationId?: string;
};

export type CreateFormVersionBody = {
  schemaDefinition: FormSchemaDefinition;
  versionNumber?: number;
  conditionRules?: unknown;
  metadata?: Record<string, unknown>;
  correlationId?: string;
};

export type CreateApplicationDraftBody = {
  prospectId: string;
  formVersionId: string;
  formSchemaId?: string;
  formPublicationId?: string | null;
  leadId?: string | null;
  productId?: string | null;
  commercialPlanId?: string | null;
  planPresentationId?: string | null;
  metadata?: Record<string, unknown>;
  correlationId?: string;
};

export type TransitionApplicationBody = {
  toStatus: string;
  decisionReason?: string | null;
  expectedVersion?: number;
  correlationId?: string;
};

export type RequestInformationBody = {
  reason?: string | null;
  missingFields?: string[];
  correlationId?: string;
};

export type RegisterDocumentBody = {
  applicationId: string;
  documentType: string;
  storageKey: string;
  requirementId?: string | null;
  fileName?: string | null;
  contentType?: string | null;
  /** Private locator — never a public http(s) URL */
  privateLocator?: string | null;
  byteSize?: number | null;
  checksumSha256?: string | null;
  metadata?: Record<string, unknown>;
  correlationId?: string;
};

export type ReviewDocumentBody = {
  decision: DocumentReviewDecision;
  comments?: string | null;
  metadata?: Record<string, unknown>;
  correlationId?: string;
};

export type CreateQuoteRequestBody = {
  prospectId: string;
  applicationId?: string | null;
  commercialPlanId?: string | null;
  planPresentationId?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
  correlationId?: string;
};

export type AttachQuoteReferenceBody = {
  externalQuoteRef: string;
  commercialSource: string;
  validUntil?: string | null;
  displaySummary?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  correlationId?: string;
};

export type CreateCheckoutBody = {
  prospectId: string;
  applicationId?: string | null;
  planPresentationId?: string | null;
  commercialPlanId?: string | null;
  quoteReferenceId?: string | null;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
};

export type AttachPaymentBody = {
  paymentIntentRef: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
};

export type InitiateAcquisitionPaymentBody = {
  billingAccountId: string;
  amount: string;
  currency: string;
  termsConfirmed?: boolean;
  correlationId?: string;
};

export type RecordPaymentResultBody = {
  p6Status: string;
  externalRef?: string | null;
  metadata?: Record<string, unknown>;
  correlationId?: string;
};

export type RequestHandoffBody = {
  prospectId: string;
  checkoutSessionId?: string | null;
  applicationId?: string | null;
  commercialAccountId?: string | null;
  commercialPlanId?: string | null;
  metadata?: Record<string, unknown>;
  correlationId?: string;
};

export type CompleteHandoffBody = {
  subscriptionId: string;
  externalEvidenceRef?: string | null;
  correlationId?: string;
};

export type AdvanceJourneyBody = {
  toStepKey?: string | null;
  contextPatch?: Record<string, unknown>;
  complete?: boolean;
  correlationId?: string;
};

export type QueueCommunicationBody = {
  channel: string;
  prospectId?: string | null;
  applicationId?: string | null;
  journeyInstanceId?: string | null;
  templateRef?: string | null;
  subject?: string | null;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  correlationId?: string;
};

export type RecordAnalyticsBody = {
  eventName: string;
  prospectId?: string | null;
  leadId?: string | null;
  applicationId?: string | null;
  sessionKey?: string | null;
  properties?: Record<string, unknown>;
  occurredAt?: string;
  correlationId?: string;
};

export type StartQualificationBody = {
  applicationId: string;
  criteria?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  correlationId?: string;
};

export type DecideQualificationBody = {
  decision: string;
  outcomeSummary?: string | null;
  evidence?: Record<string, unknown>;
  correlationId?: string;
};
