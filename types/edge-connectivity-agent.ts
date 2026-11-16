/**
 * P7.14 — Connectivity Agent & Edge Agent Registry types (Edge Admin Console).
 * Mirrors backend domain records (migration 110). Dates are ISO strings.
 * outbound_only always true; public_key_ref vault-only; never invent ACTIVE/REVOKED.
 */

export type AgentStatus =
  | "PENDING"
  | "REGISTERING"
  | "ACTIVE"
  | "DEGRADED"
  | "REVOKING"
  | "REVOKED"
  | "FAILED";

export type AgentCommandStatus =
  | "PENDING"
  | "QUEUED"
  | "DISPATCHED"
  | "ACKED"
  | "SUCCEEDED"
  | "FAILED"
  | "EXPIRED"
  | "REVOKED";

export type ConnectivityAgent = {
  id: string;
  agentCode: string;
  displayName: string;
  tenantId: string | null;
  productId: string | null;
  deploymentProfileCode: string | null;
  agentStatus: AgentStatus | string;
  publicKeyRef: string;
  certificateRef: string | null;
  outboundOnly: boolean;
  lastSeenAt: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type AgentCommand = {
  id: string;
  agentId: string;
  commandType: string;
  commandStatus: AgentCommandStatus | string;
  nonce: string;
  payloadRef: string | null;
  signatureRef: string | null;
  provisioningRequestId: string | null;
  authorizationRowId: string | null;
  authorizationVersion: number | null;
  workflowId: string | null;
  expiresAt: string | null;
  ackedAt: string | null;
  finishedAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type AgentEvidence = {
  id: string;
  agentId: string | null;
  commandId: string | null;
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

export type AgentSpool = {
  id: string;
  agentId: string;
  commandId: string | null;
  spoolStatus: string;
  payloadRef: string;
  attempts: number;
  nextAttemptAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ConnectivityAgentDetail = {
  agent: ConnectivityAgent;
  commands: AgentCommand[];
  evidence: AgentEvidence[];
  spool: AgentSpool[];
};

export type ConnectivityAgentListPage<T> = {
  items: T[];
  total: number;
};
