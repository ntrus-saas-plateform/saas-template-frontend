/**
 * P7.12 — Onboarding Operations types (Edge Admin Console).
 * Mirrors backend domain records (migration 107). Dates are ISO strings.
 * Does NOT invent CLOSED/PASSED client-side — status from API only.
 * Operational onboarding ≠ CRM / business invites / Subscription.ACTIVE.
 */

export type OnboardingTemplateStatus =
  | "DRAFT"
  | "VALIDATED"
  | "PUBLISHED"
  | "DEPRECATED"
  | "RETIRED";

export type OnboardingJourneyStatus =
  | "PENDING"
  | "STARTING"
  | "IN_PROGRESS"
  | "WAITING_APPROVAL"
  | "BLOCKED"
  | "FAILED"
  | "CLOSING"
  | "CLOSED"
  | "CANCELLED"
  | "SUPERSEDED";

export type OnboardingStepKind =
  | "SYSTEM"
  | "HUMAN"
  | "COORDINATION"
  | "VERIFY"
  | "HANDOVER";

export type OnboardingStepStatus =
  | "PENDING"
  | "READY"
  | "RUNNING"
  | "WAITING_APPROVAL"
  | "PASSED"
  | "FAILED"
  | "SKIPPED"
  | "BLOCKED";

export type OnboardingTaskStatus =
  | "OPEN"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED";

export type OnboardingTemplate = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  productId: string | null;
  deploymentProfileCode: string | null;
  templateStatus: OnboardingTemplateStatus | string;
  stepPlan: Array<Record<string, unknown>>;
  slaPolicy: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type OnboardingJourney = {
  id: string;
  tenantId: string;
  productId: string;
  subscriptionId: string | null;
  accountId: string | null;
  templateId: string | null;
  activationRecordId: string;
  provisioningRequestId: string;
  authorizationRowId: string;
  authorizationVersion: number;
  journeyStatus: OnboardingJourneyStatus | string;
  currentStepKey: string | null;
  workflowId: string | null;
  startedAt: string | null;
  closedAt: string | null;
  handoverEvidenceRef: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type OnboardingStep = {
  id: string;
  journeyId: string;
  tenantId: string;
  stepKey: string;
  stepOrder: number;
  stepKind: OnboardingStepKind | string;
  stepStatus: OnboardingStepStatus | string;
  required: boolean;
  dependsOn: string[];
  message: string | null;
  evidenceRef: string | null;
  details: Record<string, unknown>;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OnboardingTask = {
  id: string;
  journeyId: string;
  stepId: string | null;
  tenantId: string;
  taskCode: string;
  taskStatus: OnboardingTaskStatus | string;
  title: string;
  description: string | null;
  assigneeRef: string | null;
  decisionReason: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type OnboardingRun = {
  id: string;
  journeyId: string;
  tenantId: string;
  productId: string;
  operation: string;
  workflowId: string | null;
  outcome: string;
  errorCode: string | null;
  errorMessage: string | null;
  observedState: Record<string, unknown>;
  evidence: Record<string, unknown>;
  startedAt: string;
  finishedAt: string | null;
  performedBy: string | null;
  correlationId: string | null;
  createdAt: string;
};

export type OnboardingEvidence = {
  id: string;
  journeyId: string | null;
  tenantId: string | null;
  workflowId: string | null;
  stepKey: string | null;
  operation: string;
  outcome: string;
  evidence: Record<string, unknown>;
  errorCode: string | null;
  errorMessage: string | null;
  durationMs: number | null;
  performedBy: string | null;
  createdAt: string;
};

export type OnboardingJourneyDetail = {
  journey: OnboardingJourney;
  steps: OnboardingStep[];
  tasks: OnboardingTask[];
  runs: OnboardingRun[];
  evidence: OnboardingEvidence[];
};

export type OnboardingListPage<T> = {
  items: T[];
  total: number;
};
