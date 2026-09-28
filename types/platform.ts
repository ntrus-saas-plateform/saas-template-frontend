/** Manual Wave 0 types — full openapi-typescript blocked by broken $refs in snapshot. */

export type ApiErrorBody = {
  code: string;
  message: string;
  details: unknown[];
  requestId: string;
  correlationId: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  nextCursor: string | null;
};

export type PlatformContext = {
  tenantId?: string | null;
  organizationId?: string | null;
  userId?: string | null;
  username?: string | null;
  roles: string[];
  permissions: string[];
  locale?: string | null;
  timezone?: string | null;
};

export type PlatformOrganization = {
  id: string;
  name: string;
  slug: string;
  status: string;
  keycloakOrganizationId?: string | null;
};

export type CapabilitiesPlan = {
  code: string;
  name: string;
  maxOrganizations: number;
  maxUsers: number;
};

export type CapabilitiesOrganization = {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
};

export type CapabilitiesSnapshot = {
  plan: CapabilitiesPlan | null;
  modules: Record<string, boolean>;
  permissions: string[];
  capabilityMap?: Record<string, boolean>;
  /** Present when bootstrap/capabilities include role claims */
  roles?: string[];
  features: Record<string, boolean>;
  organizations: CapabilitiesOrganization[];
  defaultOrganizationId: string | null;
  navigationHints: string[];
  /** From business-config when a profile is assigned */
  businessProfile?: string | null;
  enabledCapabilities?: string[];
  businessConfigVersion?: number;
};

export type SwitchOrganizationResult = {
  organizationId: string;
  refreshRequired: boolean;
};

export type TenantCustomer = {
  id: string;
  tenantId: string;
  globalCustomerId: string;
  customerNumber: string;
  status: string;
  type: string;
  category?: string | null;
  segment?: string | null;
  metadata?: Record<string, unknown>;
  firstPurchaseAt?: string | null;
  lastPurchaseAt?: string | null;
  totalOrders: number;
  totalSpent: number;
  isPatient?: boolean;
  patientStatus?: string | null;
  patientNumber?: string | null;
  patientProfile?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    allergies?: string[];
  };
  version?: number;
  createdAt: string;
  updatedAt: string;
};

export type GlobalCustomerProfile = {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  dateOfBirth?: string;
  gender?: string;
  preferredLanguage?: string;
};

export type GlobalCustomer = {
  id: string;
  status: string;
  type: string;
  locale: string;
  timezone: string;
  country?: string | null;
  profile: GlobalCustomerProfile;
  isPatient?: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type GlobalCustomerIdentity = {
  id: string;
  globalCustomerId: string;
  keycloakSubjectId?: string | null;
  externalIdentityId?: string | null;
  emailNormalized?: string | null;
  phoneNormalized?: string | null;
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationCustomer = {
  id: string;
  tenantId: string;
  organizationId: string;
  tenantCustomerId: string;
  status: string;
  localCustomerNumber?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CustomerAggregate = {
  tenant: TenantCustomer;
  global: GlobalCustomer;
  identity?: GlobalCustomerIdentity | null;
  organizations?: OrganizationCustomer[];
};

export type DuplicateCustomerMatch = {
  matchedOn: string;
  customer: TenantCustomer;
};

export type CustomerConsent = {
  id: string;
  globalCustomerId: string;
  purpose: string;
  policyVersion: string;
  status: string;
  grantedAt?: string | null;
  withdrawnAt?: string | null;
  source?: string | null;
  channel?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type CustomerAddress = {
  id: string;
  globalCustomerId: string;
  type: string;
  country?: string | null;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  commune?: string | null;
  street?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  deliveryInstructions?: string | null;
  isDefault: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CustomerInteraction = {
  id: string;
  tenantId: string;
  organizationId?: string | null;
  tenantCustomerId: string;
  type: string;
  subject?: string | null;
  description?: string | null;
  channel?: string | null;
  occurredAt: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type Customer360 = {
  aggregate: CustomerAggregate;
  consents: CustomerConsent[];
  addresses: CustomerAddress[];
  interactions: CustomerInteraction[];
  timeline: Record<string, unknown>;
};

export type CustomerExport = {
  tenantCustomerId: string;
  aggregate: CustomerAggregate;
  consents: CustomerConsent[];
  addresses: CustomerAddress[];
  interactions: CustomerInteraction[];
  exportedAt: string;
};

export type AnonymizeCustomerResult = {
  anonymized: boolean;
};

export type CreateCustomerInput = {
  email?: string;
  phone?: string;
  profile?: Record<string, unknown>;
  organizationId?: string;
  type?: string;
};

export type CreateGuestCustomerInput = {
  organizationId?: string;
};

export type CheckDuplicatesCustomerInput = {
  email?: string;
  phone?: string;
  customerNumber?: string;
};

export type IdentifyCustomerInput = {
  email?: string;
  phone?: string;
  customerNumber?: string;
};

export type PromoteGuestCustomerInput = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
};

export type MergeCustomersInput = {
  sourceTenantCustomerId: string;
};

export type GrantConsentInput = {
  purpose: string;
  policyVersion: string;
  channel?: string;
};

export type WithdrawConsentInput = {
  purpose: string;
  policyVersion: string;
};

export type CreateCustomerInteractionInput = {
  type: string;
  organizationId?: string;
  subject?: string;
  description?: string;
  channel?: string;
  occurredAt?: string;
};

export type LinkOrganizationCustomerInput = {
  organizationId: string;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  unitPrice: number;
  currency: string;
  status: string;
};

export type CreateProductInput = {
  sku: string;
  name: string;
  description?: string;
  unitPrice: number;
  currency?: string;
};

export type CartLine = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Cart = {
  id: string;
  tenantCustomerId?: string | null;
  status: string;
  lines?: CartLine[];
};

export type CreateCartInput = {
  tenantCustomerId?: string;
  organizationId?: string;
  channel?: string;
};

export type AddCartLineInput = {
  productId: string;
  quantity: number;
};

export type PosCheckoutInput = {
  tenantCustomerId?: string;
  createGuest?: boolean;
  organizationId?: string;
};

export type OrderLine = {
  sku: string;
  productName: string;
  quantity: number;
  lineTotal: number;
};

export type Order = {
  id: string;
  tenantCustomerId: string;
  status: string;
  totalAmount: number;
  currency?: string;
  createdAt?: string;
  lines?: OrderLine[];
};

export type OrderTransitionInput = {
  reason?: string;
};

export type LoyaltyAccount = {
  tenantCustomerId: string;
  pointsBalance: number;
};

export type SetCustomerPatientInput = {
  isPatient: boolean;
  patientStatus?: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  patientNumber?: string | null;
  patientProfile?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    allergies?: string[];
  };
};

/** B2C: one GlobalCustomer linked across tenants (app patient unique). */
export type CustomerMembership = {
  tenantId: string;
  tenantSlug?: string | null;
  tenantDisplayName?: string | null;
  tenantCustomerId: string;
  customerNumber: string;
  status: string;
  isPatient: boolean;
  patientStatus?: string | null;
  patientNumber?: string | null;
  patientProfile?: Record<string, unknown>;
  isCurrent: boolean;
  organizations: OrganizationCustomer[];
};
