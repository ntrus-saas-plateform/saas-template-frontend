/**
 * P7.15 — Production Certification & Evidence Pack types (Edge Admin Console).
 * Mirrors backend domain records (migration 111). Dates are ISO strings.
 * Cannot CERTIFY if required evidence MISSING/FAILED. Revoke clears CERTIFIED.
 */

export type CertificationPackageStatus =
  | "DRAFT"
  | "ASSEMBLING"
  | "READY"
  | "CERTIFIED"
  | "REVOKED"
  | "FAILED";

export type CertificationEvidenceItemStatus =
  | "MISSING"
  | "ATTACHED"
  | "VERIFIED"
  | "FAILED"
  | "WAIVED";

export type CertificationPackage = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  productId: string | null;
  deploymentProfileCode: string | null;
  packageStatus: CertificationPackageStatus | string;
  scope: Record<string, unknown>;
  gateResults: Record<string, unknown>;
  evidenceManifest: Array<Record<string, unknown>>;
  certifiedAt: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
  workflowId: string | null;
  provisioningRequestId: string | null;
  authorizationRowId: string | null;
  authorizationVersion: number | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type CertificationEvidenceItem = {
  id: string;
  packageId: string;
  evidenceKey: string;
  phaseCode: string;
  required: boolean;
  itemStatus: CertificationEvidenceItemStatus | string;
  sourceRef: string | null;
  checksum: string | null;
  details: Record<string, unknown>;
  attachedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CertificationRun = {
  id: string;
  packageId: string;
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

export type CertificationEvidence = {
  id: string;
  packageId: string | null;
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

export type CertificationPackageDetail = {
  package: CertificationPackage;
  evidenceItems: CertificationEvidenceItem[];
  runs: CertificationRun[];
  evidence: CertificationEvidence[];
};

export type CertificationListPage<T> = {
  items: T[];
  total: number;
};
