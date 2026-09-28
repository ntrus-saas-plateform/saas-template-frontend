# Référence OpenAPI — schémas générés depuis le code

> **Source :** décorateurs NestJS (`@ApiProperty`, `@ApiOkDataResponse`, contrôleurs).
> **Artefacts :** [`openapi.json`](./openapi.json) · UI live `http://localhost:3000/docs` · JSON live `/docs-json`
> **Régénération :** `pnpm exec tsx scripts/export-openapi-from-source.ts`

| Métrique | Valeur |
|----------|--------|
| OpenAPI | 3.0.3 |
| Paths | 318 |
| Operations | 382 |
| Schemas | 214 |
| Généré | 2026-09-11T14:45:04.876Z |

## 1. Référence interactive (Swagger UI)

```bash
pnpm start:dev
# Ouvrir http://localhost:3000/docs
# Authorize → coller JWT Keycloak
# Try it out sur chaque opération
```

| URL | Rôle |
|-----|------|
| `/docs` | Swagger UI interactive |
| `/docs-json` | OpenAPI 3 JSON (runtime Nest `SwaggerModule.createDocument`) |
| `/docs/`, `/api/docs`, `/swagger` | Redirect → `/docs` |
| `edge-frontend/docs/openapi.json` | Snapshot généré depuis le code (ce script) |

### Générer un client TypeScript frontend

```bash
npx openapi-typescript edge-frontend/docs/openapi.json -o edge-frontend/openapi-schema.d.ts
```

### Enveloppes

```ts
// Success
{ data: T } | { data: T[]; pagination: PaginationMetaDto }
// Error
{ error: { code, message, details, requestId, correlationId } }
```

---

## 2. Index des opérations

| Method | Path | operationId | Tag | Permission / Role | Request | Response |
|--------|------|-------------|-----|-------------------|---------|----------|
| GET | `/api/v1/admin/reconciliation/report` | `getReport` | Admin | tenant:read | — | ReconcileKeycloakResultResponseDto |
| GET | `/api/v1/admin/reconciliation/reports` | `listReports` | Admin | tenant:read | — | ReconciliationReportRecordResponseDto[] |
| POST | `/api/v1/admin/reconciliation/run` | `run` | Admin | tenant:update | RunReconciliationDto | ReconcileKeycloakResultResponseDto |
| POST | `/api/v1/admin/tenants` | `provision` | Admin | auth | ProvisionTenantDto | TenantProvisioningResultResponseDto |
| DELETE | `/api/v1/admin/tenants/{tenantId}` | `deprovision` | Admin | auth | — | TenantDeprovisionResultResponseDto |
| GET | `/api/v1/admin/tenants/{tenantId}/domains` | `list` | Admin | auth | — | TenantDomainResponseDto |
| POST | `/api/v1/admin/tenants/{tenantId}/domains` | `create` | Admin | auth | CreateTenantDomainDto | TenantDomainResponseDto |
| POST | `/api/v1/admin/tenants/{tenantId}/domains/{domainId}/verify/check` | `verifyCheck` | Admin | auth | VerifyDomainTokenDto | TenantDomainResponseDto |
| POST | `/api/v1/admin/tenants/{tenantId}/domains/{domainId}/verify/start` | `verifyStart` | Admin | auth | — | VerifyStartResponseDto |
| GET | `/api/v1/admin/tenants/{tenantId}/health` | `tenantHealth` | Admin | auth | — | TenantHealthResponseDto |
| POST | `/api/v1/admin/tenants/{tenantId}/provisioning/retry` | `retryProvisioning` | Admin | auth | — | TenantProvisioningResultResponseDto |
| POST | `/api/v1/admin/tenants/{tenantId}/status` | `transitionStatus` | Admin | auth | PlatformTransitionTenantStatusDto | TenantResponseDto |
| POST | `/api/v1/ai/forecasts/demand` | `demandForecast` | API | ai:forecast | DemandForecastDto | object |
| POST | `/api/v1/ai/forecasts/sales` | `salesForecast` | API | ai:forecast | SalesForecastDto | object |
| GET | `/api/v1/ai/insights/anomalies` | `anomalies` | API | ai:read | — | object |
| GET | `/api/v1/ai/insights/churn` | `churn` | API | ai:read | — | object |
| GET | `/api/v1/ai/recommendations/price` | `priceRec` | API | ai:read | — | object |
| GET | `/api/v1/ai/recommendations/replenishment` | `replenishmentRec` | API | ai:read | — | object |
| GET | `/api/v1/analytics/kpis` | `listKpis` | API | analytics:read | — | object |
| POST | `/api/v1/analytics/kpis/compute` | `compute` | API | analytics:read | ComputeKpiDto | object |
| GET | `/api/v1/analytics/kpis/snapshots` | `listSnapshots` | API | analytics:read | — | object |
| GET | `/api/v1/audit-logs` | `list` | Settings | audit:read | — | Object[] |
| GET | `/api/v1/catalog/kits` | `list` | API | catalog:read | — | object |
| POST | `/api/v1/catalog/kits` | `create` | API | catalog:kits | CreateKitDto | CreateKitDto |
| PATCH | `/api/v1/catalog/kits/{kitId}` | `update` | API | catalog:kits | Partial | object |
| GET | `/api/v1/catalog/kits/explode/{skuId}` | `explode` | API | catalog:read | — | object |
| GET | `/api/v1/catalog/products` | `list` | API | catalog:read | — | ProductResponseDto[] |
| POST | `/api/v1/catalog/products` | `create` | API | catalog:create | CreateProductDto | ProductResponseDto |
| GET | `/api/v1/catalog/products/{productId}` | `get` | API | catalog:read | — | ProductResponseDto |
| PATCH | `/api/v1/catalog/products/{productId}/pharma` | `updatePharma` | API | catalog:update | UpdateProductPharmaDto | ProductResponseDto |
| PATCH | `/api/v1/catalog/products/{productId}/status` | `updateStatus` | API | catalog:update | UpdateProductStatusDto | ProductResponseDto |
| GET | `/api/v1/catalog/substitutions` | `list` | API | catalog:read | — | object |
| POST | `/api/v1/catalog/substitutions` | `create` | API | catalog:substitute | CreateSubstitutionDto | CreateSubstitutionDto |
| POST | `/api/v1/catalog/substitutions/approvals/{id}/approve` | `approve` | API | catalog:substitute | — | object |
| POST | `/api/v1/catalog/substitutions/approvals/{id}/reject` | `reject` | API | catalog:substitute | — | object |
| POST | `/api/v1/catalog/substitutions/request` | `request` | API | catalog:substitute | RequestSubstitutionDto | object |
| GET | `/api/v1/commercial-config` | `getConfig` | API | config:commercial_read | — | object |
| PUT | `/api/v1/commercial-config` | `putConfig` | API | config:commercial_write | UpsertOrgConfigDto | object |
| GET | `/api/v1/commercial-config/availability-policies` | `listAvailabilityPolicies` | API | availability_policy:manage | — | object |
| POST | `/api/v1/commercial-config/availability-policies` | `upsertAvailabilityPolicy` | API | availability_policy:manage | UpsertAvailabilityPolicyDto | object |
| DELETE | `/api/v1/commercial-config/availability-policies/{id}` | `deleteAvailabilityPolicy` | API | availability_policy:manage | — | object |
| GET | `/api/v1/commercial-config/priority-rules` | `listPriorityRules` | API | priority:manage | — | object |
| POST | `/api/v1/commercial-config/priority-rules` | `upsertPriorityRule` | API | priority:manage | UpsertPriorityRuleDto | object |
| DELETE | `/api/v1/commercial-config/priority-rules/{id}` | `deletePriorityRule` | API | priority:manage | — | object |
| POST | `/api/v1/commercial-jobs/{jobName}/run` | `run` | API | jobs:run | — | object |
| POST | `/api/v1/commercial-jobs/notifications/enqueue` | `enqueue` | API | jobs:run | EnqueueNotificationDto | object |
| GET | `/api/v1/commercial-jobs/reconciliation/reports` | `reconciliationReports` | API | reconciliation:read | — | object |
| POST | `/api/v1/commercial-jobs/reconciliation/run` | `reconciliationRun` | API | reconciliation:run | — | object |
| POST | `/api/v1/commercial-ops/bulk-jobs` | `bulkJob` | API | ops:bulk | BulkJobDto | object |
| POST | `/api/v1/commercial-ops/imports` | `uploadImport` | API | ops:import | UploadImportDto | object |
| POST | `/api/v1/commercial-ops/imports/{batchId}/approve` | `approveImport` | API | ops:import_approve | — | object |
| POST | `/api/v1/commercial-ops/imports/{batchId}/import` | `runImport` | API | ops:import | — | object |
| POST | `/api/v1/commercial-ops/imports/{batchId}/preview` | `previewImport` | API | ops:import | — | object |
| POST | `/api/v1/commercial-ops/imports/{batchId}/validate` | `validateImport` | API | ops:import | — | object |
| GET | `/api/v1/commercial-webhooks` | `list` | API | webhooks:read | — | object |
| POST | `/api/v1/commercial-webhooks` | `create` | API | webhooks:manage | CreateWebhookDto | object |
| POST | `/api/v1/commercial-webhooks/deliver-pending` | `deliver` | API | webhooks:manage | — | object |
| POST | `/api/v1/commercial-webhooks/dispatch` | `dispatch` | API | webhooks:manage | DispatchWebhookDto | object |
| GET | `/api/v1/commercial/search` | `search` | API | search:commercial | — | object |
| POST | `/api/v1/commissions/accrue` | `accrueEndpoint` | API | commissions:write | AccrueDto | object |
| GET | `/api/v1/commissions/agents` | `agents` | API | commissions:read | — | object |
| POST | `/api/v1/commissions/agents` | `createAgentEndpoint` | API | commissions:write | CreateAgentDto | object |
| POST | `/api/v1/commissions/periods` | `openPeriodEndpoint` | API | commissions:write | OpenPeriodDto | object |
| POST | `/api/v1/commissions/periods/{id}/approve` | `approve` | API | commissions:approve | — | object |
| GET | `/api/v1/commissions/rules` | `rules` | API | commissions:read | — | object |
| POST | `/api/v1/commissions/rules` | `createRuleEndpoint` | API | commissions:write | CreateRuleDto | object |
| GET | `/api/v1/contracts` | `list` | API | contracts:read | — | object |
| POST | `/api/v1/contracts` | `create` | API | contracts:create | CreateContractDto | object |
| POST | `/api/v1/contracts/{id}/activate` | `activate` | API | contracts:approve | — | object |
| POST | `/api/v1/contracts/{id}/approve` | `approve` | API | contracts:approve | — | object |
| POST | `/api/v1/contracts/{id}/submit` | `submit` | API | contracts:create | — | object |
| POST | `/api/v1/copilot/calculate-atp` | `calculateAtpEndpoint` | API | copilot:query | CopilotCalculateAtpDto | object |
| POST | `/api/v1/copilot/calculate-price` | `calculatePriceEndpoint` | API | copilot:query | CopilotCalculatePriceDto | object |
| GET | `/api/v1/copilot/customer-summary` | `customerSummaryEndpoint` | API | copilot:query | — | object |
| GET | `/api/v1/copilot/explain-margin` | `explainMarginEndpoint` | API | copilot:query | — | object |
| GET | `/api/v1/copilot/explain-stockout` | `explainStockoutEndpoint` | API | copilot:query | — | object |
| GET | `/api/v1/copilot/find-abnormal-sales` | `findAbnormalEndpoint` | API | copilot:query | — | object |
| GET | `/api/v1/copilot/find-expiring-products` | `findExpiringEndpoint` | API | copilot:query | — | object |
| GET | `/api/v1/copilot/order-status` | `orderStatusEndpoint` | API | copilot:query | — | object |
| GET | `/api/v1/copilot/product-availability` | `productAvailabilityEndpoint` | API | copilot:query | — | object |
| POST | `/api/v1/copilot/suggest-replenishment` | `suggestReplenishmentEndpoint` | API | copilot:query | — | object |
| POST | `/api/v1/customer-auth/login` | `login` | Customers | public | CustomerLoginDto | CustomerLoginTokensResponseDto |
| POST | `/api/v1/customer-auth/password-reset` | `passwordReset` | Customers | public | CustomerPasswordResetDto | GenericMessageResponseDto |
| POST | `/api/v1/customer-auth/register` | `register` | Customers | public | RegisterCustomerDto | GenericMessageResponseDto |
| GET | `/api/v1/customer/addresses` | `listAddresses` | Customers | auth | — | CustomerAddressResponseDto[] |
| POST | `/api/v1/customer/addresses` | `addAddress` | Customers | auth | CreateAddressDto | CustomerAddressResponseDto |
| DELETE | `/api/v1/customer/addresses/{addressId}` | `removeAddress` | Customers | auth | — | RemoveAddressResponseDto |
| PATCH | `/api/v1/customer/addresses/{addressId}` | `updateAddress` | Customers | auth | CreateAddressDto | CustomerAddressResponseDto |
| GET | `/api/v1/customer/consents` | `listConsents` | Customers | auth | — | CustomerConsentResponseDto[] |
| POST | `/api/v1/customer/consents/grant` | `grantConsent` | Customers | auth | GrantConsentDto | CustomerConsentResponseDto |
| POST | `/api/v1/customer/consents/withdraw` | `withdrawConsent` | Customers | auth | WithdrawConsentDto | CustomerConsentResponseDto |
| GET | `/api/v1/customer/me` | `me` | Customers | auth | — | CustomerAggregateResponseDto |
| GET | `/api/v1/customer/memberships` | `memberships` | Customers | auth | — | CustomerMembershipResponseDto[] |
| GET | `/api/v1/customers` | `list` | Customers | customers:read | — | TenantCustomerResponseDto[] |
| POST | `/api/v1/customers` | `create` | Customers | customers:create | CreateCustomerDto | CustomerAggregateResponseDto |
| GET | `/api/v1/customers/{tenantCustomerId}` | `get` | Customers | customers:read | — | CustomerAggregateResponseDto |
| GET | `/api/v1/customers/{tenantCustomerId}/360` | `get360` | Customers | customers:read | — | Customer360ResponseDto |
| GET | `/api/v1/customers/{tenantCustomerId}/addresses` | `listAddresses` | Customers | customers:read | — | CustomerAddressResponseDto[] |
| POST | `/api/v1/customers/{tenantCustomerId}/anonymize` | `anonymize` | Customers | customers:delete | — | AnonymizeCustomerResponseDto |
| PATCH | `/api/v1/customers/{tenantCustomerId}/commercial` | `updateCommercial` | Customers | customers:update | UpdateCustomerCommercialProfileDto | TenantCustomerResponseDto |
| GET | `/api/v1/customers/{tenantCustomerId}/consents` | `listConsents` | Customers | customers:read | — | CustomerConsentResponseDto[] |
| POST | `/api/v1/customers/{tenantCustomerId}/consents/grant` | `grantConsent` | Customers | customers:manage_consent | GrantConsentDto | CustomerConsentResponseDto |
| POST | `/api/v1/customers/{tenantCustomerId}/consents/withdraw` | `withdrawConsent` | Customers | customers:manage_consent | WithdrawConsentDto | CustomerConsentResponseDto |
| GET | `/api/v1/customers/{tenantCustomerId}/contacts` | `listContacts` | Customers | customers:read | — | CustomerContactResponseDto |
| POST | `/api/v1/customers/{tenantCustomerId}/contacts` | `createContact` | Customers | customers:update | CreateCustomerContactDto | CustomerContactResponseDto |
| DELETE | `/api/v1/customers/{tenantCustomerId}/contacts/{contactId}` | `deleteContact` | Customers | customers:update | — | object |
| GET | `/api/v1/customers/{tenantCustomerId}/credit` | `getCredit` | Customers | credit:read | — | object |
| GET | `/api/v1/customers/{tenantCustomerId}/export` | `export` | Customers | customers:export | — | CustomerExportResponseDto |
| GET | `/api/v1/customers/{tenantCustomerId}/interactions` | `listInteractions` | Customers | customers:crm_read | — | CustomerInteractionResponseDto[] |
| POST | `/api/v1/customers/{tenantCustomerId}/interactions` | `createInteraction` | Customers | customers:crm_write | CreateCustomerInteractionDto | CustomerInteractionResponseDto |
| POST | `/api/v1/customers/{tenantCustomerId}/merge` | `merge` | Customers | customers:merge | MergeCustomersDto | CustomerAggregateResponseDto |
| POST | `/api/v1/customers/{tenantCustomerId}/organizations` | `linkOrganization` | Customers | customers:update | LinkOrganizationCustomerDto | OrganizationCustomerResponseDto |
| PATCH | `/api/v1/customers/{tenantCustomerId}/patient` | `setPatient` | Customers | customers:set_patient | SetCustomerPatientDto | TenantCustomerResponseDto |
| POST | `/api/v1/customers/{tenantCustomerId}/promote` | `promoteGuest` | Customers | customers:update | PromoteGuestCustomerDto | CustomerAggregateResponseDto |
| PATCH | `/api/v1/customers/{tenantCustomerId}/status` | `setStatus` | Customers | customers:update | SetCustomerStatusDto | TenantCustomerResponseDto |
| POST | `/api/v1/customers/check-duplicates` | `checkDuplicates` | Customers | customers:read | CheckDuplicatesCustomerDto | DuplicateCustomerMatchResponseDto[] |
| POST | `/api/v1/customers/guest` | `createGuest` | Customers | customers:create | CreateGuestCustomerDto | CustomerAggregateResponseDto |
| POST | `/api/v1/customers/identify` | `identify` | Customers | customers:read | IdentifyCustomerDto | CustomerAggregateResponseDto |
| GET | `/api/v1/dashboards/{dashboardKey}` | `get` | API | dashboards:read | — | object |
| POST | `/api/v1/dashboards/{dashboardKey}/refresh` | `refresh` | API | dashboards:read | — | object |
| GET | `/api/v1/delegations` | `list` | Security | delegation:read | — | DelegationResponseDto[] |
| POST | `/api/v1/delegations` | `grant` | Security | delegation:grant | GrantDelegationDto | DelegationResponseDto |
| POST | `/api/v1/delegations/{delegationId}/revoke` | `revoke` | Security | delegation:grant | — | DelegationResponseDto |
| GET | `/api/v1/emergency-access` | `list` | Security | emergency_access:read | — | EmergencyAccessGrantResponseDto[] |
| POST | `/api/v1/emergency-access` | `grant` | Security | emergency_access:grant | GrantEmergencyAccessDto | EmergencyAccessGrantResponseDto |
| POST | `/api/v1/emergency-access/{grantId}/revoke` | `revoke` | Security | emergency_access:grant | — | EmergencyAccessGrantResponseDto |
| GET | `/api/v1/feature-flags` | `list` | Platform | platform:read | — | FeatureFlagEntryResponseDto[] |
| GET | `/api/v1/files` | `getFile` | Users | users:read | — | object |
| GET | `/api/v1/finance/ar/open-items` | `openItems` | API | invoices:read | — | object |
| GET | `/api/v1/finance/explain/ar` | `explainAr` | API | explain:read | — | object |
| POST | `/api/v1/finance/invoices` | `createInvoice` | API | invoices:create | CreateInvoiceDto | CreateInvoiceDto |
| POST | `/api/v1/finance/invoices/credit-notes` | `createCreditNote` | API | invoices:credit_note | CreateCreditNoteDto | object |
| POST | `/api/v1/finance/invoices/debit-notes` | `createDebitNote` | API | invoices:debit_note | CreateDebitNoteDto | object |
| POST | `/api/v1/finance/invoices/proforma` | `createProforma` | API | invoices:create | CreateInvoiceDto | object |
| POST | `/api/v1/finance/payments` | `capturePayment` | API | payments:create | CapturePaymentDto | CapturePaymentDto |
| POST | `/api/v1/finance/payments/refund` | `refund` | API | payments:create | — | object |
| POST | `/api/v1/finance/receipts` | `createReceipt` | API | payments:create | — | object |
| POST | `/api/v1/fulfillment/packages` | `createPackage` | API | fulfillment:pack | CreatePackageDto | object |
| POST | `/api/v1/fulfillment/pick-tickets` | `createPick` | API | fulfillment:pick | CreatePickTicketDto | CreatePickTicketDto |
| POST | `/api/v1/fulfillment/pick-tickets/{pickTicketId}/complete` | `completePick` | API | fulfillment:pick | CompletePickDto | CreatePickTicketDto |
| POST | `/api/v1/fulfillment/plans` | `createPlan` | API | fulfillment:pick | CreateFulfillmentPlanDto | object |
| POST | `/api/v1/fulfillment/shipments` | `createShipment` | API | fulfillment:ship | CreateShipmentDto | CreateShipmentDto |
| PATCH | `/api/v1/fulfillment/shipments/{id}/delivery` | `updateDelivery` | API | shipping:update | UpdateShipmentDeliveryDto | object |
| POST | `/api/v1/fulfillment/shipments/{shipmentId}/deliver` | `deliver` | API | fulfillment:ship | ProofOfDeliveryDto | CreateShipmentDto |
| POST | `/api/v1/fulfillment/shipments/{shipmentId}/pod` | `attachPod` | API | shipping:update | ProofOfDeliveryDto | object |
| POST | `/api/v1/fulfillment/waves` | `createWave` | API | fulfillment:wave | CreatePickWaveDto | object |
| POST | `/api/v1/inventory/adjustments` | `adjust` | API | inventory:adjust | AdjustStockDto | object |
| POST | `/api/v1/inventory/allocate` | `allocate` | API | inventory:allocate | AllocateOrderDto | AvailabilityResponseDto |
| GET | `/api/v1/inventory/availability` | `availability` | API | inventory:read | — | AvailabilityResponseDto |
| POST | `/api/v1/inventory/availability/check` | `availabilityCheck` | API | inventory:read | CheckAvailabilityDto | AvailabilityResponseDto |
| GET | `/api/v1/inventory/consignment-accounts` | `listConsignmentAccounts` | API | inventory:read | — | object |
| POST | `/api/v1/inventory/consignment-accounts` | `createConsignmentAccount` | API | inventory:receive | CreateConsignmentAccountDto | object |
| POST | `/api/v1/inventory/ctp` | `ctp` | API | inventory:read | CheckCtpDto | CheckCtpDto |
| GET | `/api/v1/inventory/ledger/explain` | `explainLedger` | API | explain:read | — | object |
| GET | `/api/v1/inventory/ledger/reconstruct` | `reconstruct` | API | inventory:read | — | object |
| POST | `/api/v1/inventory/lots/{lotId}/quarantine` | `quarantineLot` | API | inventory:adjust | QuarantineLotDto | object |
| POST | `/api/v1/inventory/lots/{lotId}/recall` | `recallLot` | API | inventory:adjust | RecallLotDto | object |
| POST | `/api/v1/inventory/recalls` | `createRecall` | API | inventory:adjust | CreateRecallDto | object |
| POST | `/api/v1/inventory/receive` | `receive` | API | inventory:receive | ReceiveStockDto | AvailabilityResponseDto |
| POST | `/api/v1/inventory/reserve` | `reserve` | API | inventory:reserve | ReserveStockDto | AvailabilityResponseDto |
| POST | `/api/v1/inventory/transfers` | `transfer` | API | inventory:transfer | TransferStockDto | object |
| GET | `/api/v1/invitations` | `list` | Invitations | users:invite | — | InvitationResponseDto[] |
| POST | `/api/v1/invitations` | `create` | Invitations | users:invite | CreateInvitationDto | InvitationCreatedResponseDto |
| POST | `/api/v1/invitations/{invitationId}/revoke` | `revoke` | Invitations | users:invite | — | InvitationResponseDto |
| POST | `/api/v1/invitations/accept` | `accept` | Invitations | auth | AcceptInvitationDto | InvitationAcceptResponseDto |
| POST | `/api/v1/loyalty/accounts` | `account` | API | loyalty:write | OpenAccountDto | object |
| POST | `/api/v1/loyalty/earn` | `earn` | API | loyalty:write | EarnPointsDto | object |
| POST | `/api/v1/loyalty/expire` | `expire` | API | loyalty:write | ExpirePointsDto | object |
| POST | `/api/v1/loyalty/redeem` | `redeem` | API | loyalty:write | RedeemPointsDto | object |
| GET | `/api/v1/loyalty/rewards` | `rewards` | API | loyalty:read | — | object |
| POST | `/api/v1/loyalty/rewards` | `createRewardEndpoint` | API | loyalty:write | CreateRewardDto | object |
| POST | `/api/v1/loyalty/tiers` | `tier` | API | loyalty:write | UpsertTierDto | object |
| GET | `/api/v1/memberships` | `list` | Memberships | memberships:read | — | OrganizationMembershipResponseDto[] |
| POST | `/api/v1/memberships` | `grant` | Memberships | memberships:create | GrantMembershipDto | OrganizationMembershipResponseDto |
| DELETE | `/api/v1/memberships/{membershipId}` | `revoke` | Memberships | memberships:revoke | — | OrganizationMembershipResponseDto |
| PATCH | `/api/v1/memberships/{membershipId}` | `updateRoles` | Memberships | memberships:update | UpdateMembershipDto | OrganizationMembershipResponseDto |
| GET | `/api/v1/organizations` | `list` | Organizations | organizations:read | — | OrganizationListItemResponseDto[] |
| POST | `/api/v1/organizations` | `create` | Organizations | organizations:create | CreateOrganizationDto | OrganizationResponseDto |
| GET | `/api/v1/organizations/{organizationId}` | `get` | Organizations | organizations:read | — | OrganizationResponseDto |
| PATCH | `/api/v1/organizations/{organizationId}` | `update` | Organizations | organizations:update | UpdateOrganizationDto | OrganizationResponseDto |
| POST | `/api/v1/organizations/{organizationId}/activate` | `activate` | Organizations | organizations:update | — | OrganizationResponseDto |
| GET | `/api/v1/organizations/{organizationId}/cash-registers` | `listCashRegisters` | Organizations | organizations:read | — | Object[] |
| POST | `/api/v1/organizations/{organizationId}/cash-registers` | `createCashRegister` | Organizations | organizations:update | CreateCashRegisterDto | Object |
| DELETE | `/api/v1/organizations/{organizationId}/cash-registers/{registerId}` | `deleteCashRegister` | Organizations | organizations:update | — | Object |
| PATCH | `/api/v1/organizations/{organizationId}/cash-registers/{registerId}` | `updateCashRegister` | Organizations | organizations:update | UpdateCashRegisterDto | Object |
| GET | `/api/v1/organizations/{organizationId}/pos-terminals` | `listPosTerminals` | Organizations | organizations:read | — | Object[] |
| POST | `/api/v1/organizations/{organizationId}/pos-terminals` | `createPosTerminal` | Organizations | organizations:update | CreatePosTerminalDto | Object |
| DELETE | `/api/v1/organizations/{organizationId}/pos-terminals/{terminalId}` | `deletePosTerminal` | Organizations | organizations:update | — | Object |
| PATCH | `/api/v1/organizations/{organizationId}/pos-terminals/{terminalId}` | `updatePosTerminal` | Organizations | organizations:update | UpdatePosTerminalDto | Object |
| POST | `/api/v1/organizations/{organizationId}/suspend` | `suspend` | Organizations | organizations:suspend | — | OrganizationResponseDto |
| GET | `/api/v1/organizations/{organizationId}/warehouses` | `listWarehouses` | Organizations | organizations:read | — | Object[] |
| POST | `/api/v1/organizations/{organizationId}/warehouses` | `createWarehouse` | Organizations | organizations:update | CreateWarehouseDto | Object |
| DELETE | `/api/v1/organizations/{organizationId}/warehouses/{warehouseId}` | `deleteWarehouse` | Organizations | organizations:update | — | Object |
| PATCH | `/api/v1/organizations/{organizationId}/warehouses/{warehouseId}` | `updateWarehouse` | Organizations | organizations:update | UpdateWarehouseDto | Object |
| GET | `/api/v1/organizations/{organizationId}/workflows` | `listWorkflows` | Organizations | organizations:read | — | Object[] |
| POST | `/api/v1/organizations/{organizationId}/workflows` | `createWorkflow` | Organizations | organizations:update | CreateWorkflowDto | Object |
| DELETE | `/api/v1/organizations/{organizationId}/workflows/{workflowId}` | `deleteWorkflow` | Organizations | organizations:update | — | Object |
| PATCH | `/api/v1/organizations/{organizationId}/workflows/{workflowId}` | `updateWorkflow` | Organizations | organizations:update | UpdateWorkflowDto | Object |
| GET | `/api/v1/permissions` | `listPermissions` | Roles & Permissions | permissions:read | — | PermissionResponseDto[] |
| GET | `/api/v1/platform/context` | `getContext` | Platform | platform:read | — | PlatformContextResponseDto |
| GET | `/api/v1/platform/me/capabilities` | `getCapabilities` | Platform | auth | — | CapabilitiesSnapshotDto |
| GET | `/api/v1/platform/organizations` | `listOrganizations` | Platform | platform:read | — | PlatformOrganizationListItemResponseDto[] |
| POST | `/api/v1/platform/organizations/switch` | `switchOrganization` | Platform | platform:read | SwitchOrganizationDto | SwitchOrganizationResultResponseDto |
| GET | `/api/v1/policies` | `list` | API | policies:read | — | object |
| POST | `/api/v1/policies` | `upsert` | API | policies:write | UpsertPolicyDto | object |
| POST | `/api/v1/policies/{id}/publish` | `publish` | API | policies:publish | — | object |
| POST | `/api/v1/policies/evaluate` | `evaluate` | API | policies:evaluate | EvaluatePolicyDto | object |
| POST | `/api/v1/pos/checkout` | `checkoutEndpoint` | API | pos:checkout | PosCheckoutDto | object |
| GET | `/api/v1/pos/offline/pending` | `pending` | API | pos:sync | — | object |
| POST | `/api/v1/pos/offline/sync` | `sync` | API | pos:sync | OfflineSyncDto | object |
| POST | `/api/v1/pricing/discount-approvals/{id}/approve` | `approveDiscount` | API | sales:discount_approve | — | object |
| GET | `/api/v1/pricing/discount-limits` | `discountLimits` | API | pricing:read | — | object |
| GET | `/api/v1/pricing/price-lists` | `listPriceLists` | API | pricing:read | — | object |
| POST | `/api/v1/pricing/price-lists` | `createPriceList` | API | pricing:create | CreatePriceListDto | CreatePriceListDto |
| GET | `/api/v1/pricing/price-lists/{id}` | `getPriceList` | API | pricing:read | — | object |
| GET | `/api/v1/pricing/price-lists/{id}/history` | `listHistory` | API | pricing:read | — | object |
| POST | `/api/v1/pricing/price-lists/{id}/items` | `addItem` | API | pricing:create | AddPriceListItemDto | object |
| POST | `/api/v1/pricing/price-lists/{id}/publish` | `publish` | API | pricing:create | — | object |
| GET | `/api/v1/pricing/promotions` | `listPromotions` | API | promotions:read | — | object |
| POST | `/api/v1/pricing/promotions` | `createPromotion` | API | promotions:create | Record | object |
| PATCH | `/api/v1/pricing/promotions/{id}` | `updatePromotion` | API | promotions:update | Record | object |
| POST | `/api/v1/pricing/quote` | `quote` | API | pricing:read | QuotePriceDto | QuotePriceDto |
| GET | `/api/v1/pricing/tax-profiles` | `listTaxProfiles` | API | tax:read | — | object |
| POST | `/api/v1/pricing/tax-profiles` | `createTaxProfile` | API | tax:create | Record | object |
| GET | `/api/v1/pricing/tax-rates` | `listTaxRates` | API | tax:read | — | object |
| POST | `/api/v1/pricing/tax-rates` | `createTaxRate` | API | tax:create | CreateTaxRuleDto | object |
| POST | `/api/v1/pricing/tax-rules` | `createTaxRule` | API | pricing:create | CreateTaxRuleDto | object |
| POST | `/api/v1/purchasing/demand-forecasts` | `forecast` | API | purchasing:create | — | object |
| POST | `/api/v1/purchasing/orders` | `createOrder` | API | purchasing:create | CreatePoDto | object |
| POST | `/api/v1/purchasing/orders/{id}/receive` | `receive` | API | purchasing:receive | ReceiveGoodsDto | object |
| POST | `/api/v1/purchasing/orders/{id}/transition` | `transition` | API | purchasing:approve | — | object |
| POST | `/api/v1/purchasing/reorder-policies` | `upsertReorder` | API | purchasing:create | ReorderPolicyDto | object |
| POST | `/api/v1/purchasing/replenishment/suggest` | `suggestReplenishment` | API | purchasing:create | — | object |
| GET | `/api/v1/purchasing/replenishment/suggestions` | `getSuggestions` | API | purchasing:read | — | object |
| POST | `/api/v1/purchasing/replenishment/suggestions/{id}/accept` | `accept` | API | purchasing:create | — | object |
| POST | `/api/v1/purchasing/requisitions` | `createRequisition` | API | purchasing:create | CreatePrDto | object |
| POST | `/api/v1/purchasing/requisitions/{id}/approve` | `approveRequisition` | API | purchasing:approve | — | object |
| POST | `/api/v1/purchasing/requisitions/{id}/convert` | `convert` | API | purchasing:create | — | object |
| POST | `/api/v1/purchasing/requisitions/{id}/submit` | `submitRequisition` | API | purchasing:create | — | object |
| GET | `/api/v1/purchasing/suppliers` | `suppliers` | API | purchasing:read | — | object |
| POST | `/api/v1/purchasing/suppliers` | `createSupplierEndpoint` | API | purchasing:create | SupplierDto | object |
| POST | `/api/v1/purchasing/suppliers/contracts` | `createContract` | API | purchasing:create | SupplierContractDto | object |
| POST | `/api/v1/purchasing/suppliers/prices` | `upsertPrice` | API | purchasing:create | SupplierPriceDto | object |
| GET | `/api/v1/read-models/availability` | `availability` | API | readmodels:read | — | object |
| GET | `/api/v1/read-models/customers/{customerId}/balance` | `customerBalance` | API | readmodels:read | — | object |
| GET | `/api/v1/read-models/customers/{customerId}/commercial` | `customerCommercial` | API | readmodels:read | — | object |
| GET | `/api/v1/read-models/fulfillment/{orderId}` | `fulfillment` | API | readmodels:read | — | object |
| GET | `/api/v1/read-models/orders/{orderId}` | `orderSummary` | API | readmodels:read | — | object |
| GET | `/api/v1/reports/sales` | `sales` | API | reports:read | — | object |
| GET | `/api/v1/returns` | `list` | API | returns:read | — | object |
| POST | `/api/v1/returns` | `create` | API | returns:create | CreateReturnDto | object |
| POST | `/api/v1/returns/{id}/authorize` | `authorize` | API | returns:approve | — | object |
| POST | `/api/v1/returns/{id}/close` | `close` | API | returns:approve | — | object |
| POST | `/api/v1/returns/{id}/inspect` | `inspect` | API | returns:inspect | InspectReturnDto | object |
| POST | `/api/v1/returns/{id}/receive` | `receive` | API | returns:inspect | ReceiveReturnDto | object |
| POST | `/api/v1/returns/{id}/reject` | `reject` | API | returns:approve | — | object |
| GET | `/api/v1/roles` | `listRoles` | Roles & Permissions | roles:read | — | RoleResponseDto[] |
| POST | `/api/v1/roles` | `createRole` | Roles & Permissions | roles:create | CreateRoleDto | RoleResponseDto |
| DELETE | `/api/v1/roles/{roleId}` | `deleteRole` | Roles & Permissions | roles:delete | — | RoleDeletedResponseDto |
| PATCH | `/api/v1/roles/{roleId}` | `updateRole` | Roles & Permissions | roles:update | UpdateRoleDto | RoleResponseDto |
| GET | `/api/v1/sales/backorders` | `listBackorders` | API | sales:read | — | object |
| POST | `/api/v1/sales/backorders/{backorderId}/cancel` | `cancelBackorder` | API | sales:update | — | object |
| POST | `/api/v1/sales/backorders/{backorderId}/expected` | `updateExpected` | API | sales:update | UpdateBackorderExpectedDto | object |
| POST | `/api/v1/sales/backorders/{backorderId}/fulfill-partial` | `fulfillPartial` | API | sales:update | FulfillBackorderDto | object |
| POST | `/api/v1/sales/backorders/{backorderId}/substitute` | `substituteBackorder` | API | sales:update | SubstituteBackorderDto | object |
| POST | `/api/v1/sales/carts` | `createCart` | API | sales:create | CreateCartDto | object |
| POST | `/api/v1/sales/carts/{cartId}/abandon` | `abandonCart` | API | sales:update | — | object |
| POST | `/api/v1/sales/carts/{cartId}/convert` | `convertCart` | API | sales:create | — | object |
| PATCH | `/api/v1/sales/carts/{cartId}/customer` | `attachCartCustomer` | API | sales:update | — | object |
| POST | `/api/v1/sales/carts/{cartId}/lines` | `addCartLine` | API | sales:create | AddCartLineDto | object |
| GET | `/api/v1/sales/channels` | `listChannels` | API | channels:read | — | object |
| POST | `/api/v1/sales/channels` | `createChannel` | API | channels:create | Record | object |
| PATCH | `/api/v1/sales/channels/{channelId}` | `updateChannel` | API | channels:update | Record | object |
| POST | `/api/v1/sales/channels/{channelId}/inventory-allocations` | `upsertChannelAlloc` | API | channels:update | — | object |
| POST | `/api/v1/sales/channels/seed-defaults` | `seedChannels` | API | channels:create | — | object |
| GET | `/api/v1/sales/customer-groups` | `listCustomerGroups` | API | sales:read | — | object |
| POST | `/api/v1/sales/customer-groups` | `createCustomerGroup` | API | sales:create | CreateCustomerGroupDto | object |
| GET | `/api/v1/sales/customer-groups/{code}` | `getCustomerGroup` | API | sales:read | — | object |
| GET | `/api/v1/sales/orders` | `listOrders` | API | sales:read | — | object |
| POST | `/api/v1/sales/orders` | `createOrder` | API | sales:create | CreateSalesOrderDto | CreateSalesOrderDto |
| GET | `/api/v1/sales/orders/{orderId}` | `getOrder` | API | sales:read | — | CreateSalesOrderDto |
| POST | `/api/v1/sales/orders/{orderId}/allocate` | `allocateOrder` | API | sales:update | — | object |
| POST | `/api/v1/sales/orders/{orderId}/approve` | `approveOrder` | API | sales:confirm | — | object |
| POST | `/api/v1/sales/orders/{orderId}/cancel` | `cancelOrder` | API | sales:update | — | object |
| POST | `/api/v1/sales/orders/{orderId}/complete` | `completeOrder` | API | sales:update | — | object |
| POST | `/api/v1/sales/orders/{orderId}/confirm` | `confirmOrder` | API | sales:confirm | — | object |
| POST | `/api/v1/sales/orders/{orderId}/handoff` | `handoff` | API | sales:update | — | object |
| POST | `/api/v1/sales/orders/{orderId}/lines/{lineId}/substitute` | `applySubstitution` | API | catalog:substitute | — | object |
| POST | `/api/v1/sales/orders/{orderId}/payment-pending` | `paymentPending` | API | sales:update | — | object |
| POST | `/api/v1/sales/orders/{orderId}/payment-status` | `paymentStatus` | API | sales:update | RecordPaymentStatusDto | object |
| POST | `/api/v1/sales/orders/{orderId}/submit-approval` | `submitApproval` | API | sales:update | — | object |
| POST | `/api/v1/sales/quotations` | `createQuotation` | API | sales:create | CreateQuotationDto | object |
| POST | `/api/v1/sales/quotations/{quotationId}/accept` | `acceptQuotation` | API | sales:update | — | object |
| POST | `/api/v1/sales/quotations/{quotationId}/approve` | `approveQuotation` | API | sales:update | — | object |
| POST | `/api/v1/sales/quotations/{quotationId}/cancel` | `cancelQuotation` | API | sales:update | — | object |
| POST | `/api/v1/sales/quotations/{quotationId}/convert` | `convertQuotation` | API | sales:create | ConvertQuotationDto | object |
| POST | `/api/v1/sales/quotations/{quotationId}/expire` | `expireQuotation` | API | sales:update | — | object |
| POST | `/api/v1/sales/quotations/{quotationId}/reject` | `rejectQuotation` | API | sales:update | — | object |
| POST | `/api/v1/sales/quotations/{quotationId}/send` | `sendQuotation` | API | sales:update | — | object |
| POST | `/api/v1/sales/quotations/{quotationId}/viewed` | `viewQuotation` | API | sales:update | — | object |
| GET | `/api/v1/security/identity-providers` | `listIdentityProviders` | Security | security:read | — | object |
| POST | `/api/v1/security/identity-providers` | `createIdentityProvider` | Security | security:update | CreateIdentityProviderDto | Object |
| DELETE | `/api/v1/security/identity-providers/{alias}` | `deleteIdentityProvider` | Security | security:update | — | object |
| GET | `/api/v1/security/identity-providers/{alias}` | `getIdentityProvider` | Security | security:read | — | object |
| PATCH | `/api/v1/security/identity-providers/{alias}` | `updateIdentityProvider` | Security | security:update | UpdateIdentityProviderDto | object |
| GET | `/api/v1/security/mfa/status` | `getMfaStatus` | Security | users:read | — | MfaStatusResponseDto |
| GET | `/api/v1/security/policies` | `getPolicies` | Security | security:read | — | SecurityPoliciesResponseDto |
| PATCH | `/api/v1/security/policies` | `updatePolicies` | Security | security:update | UpdateSecurityPoliciesDto | SecurityPoliciesResponseDto |
| GET | `/api/v1/sessions` | `listSessions` | Security | users:read | — | SessionsListDataResponseDto |
| POST | `/api/v1/sessions/logout` | `logoutCurrentToken` | Security | users:update | — | LogoutResponseDto |
| POST | `/api/v1/sessions/revoke` | `revokeSession` | Security | users:update | RevokeSessionDto | SessionRevokeResponseDto |
| POST | `/api/v1/sessions/revoke-all` | `revokeAll` | Security | users:update | — | RevokeAllSessionsResponseDto |
| GET | `/api/v1/settings/catalog` | `catalog` | Settings | settings:read | — | Object |
| GET | `/api/v1/settings/organizations/{organizationId}/{namespace}` | `getOrganizationNamespace` | Settings | settings:read | — | OrganizationSettingsResponseDto |
| PATCH | `/api/v1/settings/organizations/{organizationId}/{namespace}` | `updateOrganizationNamespace` | Settings | settings:update | UpdateSettingsNamespaceDto | OrganizationSettingsResponseDto |
| GET | `/api/v1/settings/tenant/{namespace}` | `getTenantNamespace` | Settings | settings:read | — | SettingsNamespaceResponseDto |
| PATCH | `/api/v1/settings/tenant/{namespace}` | `updateTenantNamespace` | Settings | settings:update | UpdateSettingsNamespaceDto | SettingsNamespaceResponseDto |
| GET | `/api/v1/tenant-settings/{resource}` | `list` | Settings | settings:read | — | Object[] |
| POST | `/api/v1/tenant-settings/{resource}` | `create` | Settings | settings:update | Record | Object |
| DELETE | `/api/v1/tenant-settings/{resource}/{id}` | `remove` | Settings | settings:update | — | Object |
| PATCH | `/api/v1/tenant-settings/{resource}/{id}` | `update` | Settings | settings:update | Record | Object |
| GET | `/api/v1/tenant-settings/billing` | `billing` | Settings | tenant:billing:read | — | Object |
| GET | `/api/v1/tenant-settings/modules` | `modules` | Settings | settings:read | — | Object |
| PATCH | `/api/v1/tenant-settings/modules` | `updateModules` | Settings | settings:update | ModulesOverlayDto | Object |
| POST | `/api/v1/tenant-settings/numbering/{id}/next` | `next` | Settings | settings:update | — | Object |
| POST | `/api/v1/tenant-settings/numbering/{id}/preview` | `preview` | Settings | settings:read | — | Object |
| GET | `/api/v1/tenants/{tenantId}` | `getTenant` | Tenants | tenant:read | — | TenantResponseDto |
| PATCH | `/api/v1/tenants/{tenantId}` | `updateTenant` | Tenants | tenant:update | UpdateTenantDto | TenantResponseDto |
| POST | `/api/v1/tenants/{tenantId}/ownership/transfer` | `transferOwnership` | Tenants | tenant:ownership_transfer | TransferOwnershipDto | OwnershipTransferResponseDto |
| POST | `/api/v1/tenants/{tenantId}/status` | `transitionStatus` | Tenants | tenant:update | TransitionTenantStatusDto | TenantResponseDto |
| GET | `/api/v1/users` | `list` | Users | users:read | — | ApplicationUserResponseDto[] |
| GET | `/api/v1/users/{identityId}` | `getUser` | Users | users:read | — | ApplicationUserResponseDto |
| POST | `/api/v1/users/{identityId}/disable` | `disable` | Users | users:suspend | — | ApplicationUserResponseDto |
| POST | `/api/v1/users/{identityId}/reactivate` | `reactivate` | Users | users:update | — | ApplicationUserResponseDto |
| POST | `/api/v1/users/{identityId}/suspend` | `suspend` | Users | users:suspend | — | ApplicationUserResponseDto |
| GET | `/api/v1/users/me` | `getMe` | Users | users:read | — | ApplicationUserResponseDto |
| PATCH | `/api/v1/users/me` | `updateMe` | Users | users:update | UpdateUserProfileDto | ApplicationUserResponseDto |
| DELETE | `/api/v1/users/me/activity` | `clearActivity` | Users | users:update | — | object |
| GET | `/api/v1/users/me/activity` | `listActivity` | Users | users:read | — | object |
| POST | `/api/v1/users/me/activity` | `createActivity` | Users | users:update | CreateActivityDto | object |
| GET | `/api/v1/users/me/api-tokens` | `listApiTokens` | Users | users:read | — | object |
| POST | `/api/v1/users/me/api-tokens` | `createApiToken` | Users | users:update | CreateApiTokenDto | object |
| DELETE | `/api/v1/users/me/api-tokens/{tokenId}` | `revokeApiToken` | Users | users:update | — | object |
| POST | `/api/v1/users/me/avatar` | `uploadAvatar` | Users | users:update | — | ApplicationUserResponseDto |
| GET | `/api/v1/users/me/devices` | `listMyDevices` | Users | users:read | — | object |
| DELETE | `/api/v1/users/me/devices/{deviceId}` | `removeMyDevice` | Users | users:update | — | object |
| PATCH | `/api/v1/users/me/devices/{deviceId}` | `trustMyDevice` | Users | users:update | TrustDeviceDto | object |
| DELETE | `/api/v1/users/me/devices/{deviceId}/push` | `clearDevicePush` | Users | users:update | — | object |
| POST | `/api/v1/users/me/devices/enroll-push` | `enrollPushDevice` | Users | users:update | EnrollPushDeviceDto | object |
| GET | `/api/v1/users/me/identity` | `getMyIdentity` | Users | users:read | — | MyIdentityOverviewDto |
| DELETE | `/api/v1/users/me/identity/links/{provider}` | `unlinkMyIdentity` | Users | users:update | — | object |
| POST | `/api/v1/users/me/identity/phone/send-otp` | `sendPhoneOtp` | Users | users:update | SendPhoneVerificationDto | object |
| POST | `/api/v1/users/me/identity/phone/verify-otp` | `verifyPhoneOtp` | Users | users:update | VerifyPhoneVerificationDto | object |
| POST | `/api/v1/users/me/identity/reset-password` | `resetMyPassword` | Users | users:update | — | object |
| POST | `/api/v1/users/me/identity/verify-email` | `verifyMyEmail` | Users | users:update | — | object |
| GET | `/api/v1/users/me/login-history` | `listLoginHistory` | Users | users:read | — | object |
| POST | `/api/v1/users/me/login-history` | `recordLogin` | Users | users:update | RecordLoginDto | object |
| GET | `/api/v1/users/me/memberships` | `listMyMemberships` | Users | users:read | — | OrganizationMembershipResponseDto[] |
| GET | `/api/v1/users/me/notifications` | `listMyNotifications` | Users | users:read | — | object |
| POST | `/api/v1/users/me/notifications` | `createMyNotification` | Users | users:update | CreateNotificationDto | object |
| DELETE | `/api/v1/users/me/notifications/{notificationId}` | `deleteMyNotification` | Users | users:update | — | object |
| POST | `/api/v1/users/me/notifications/{notificationId}/read` | `markNotificationRead` | Users | users:update | — | object |
| POST | `/api/v1/users/me/notifications/read-all` | `markAllNotificationsRead` | Users | users:update | — | object |
| GET | `/api/v1/users/me/personalization` | `getMyPersonalization` | Users | users:read | — | object |
| PATCH | `/api/v1/users/me/personalization` | `updateMyPersonalization` | Users | users:update | UpdatePersonalizationDto | object |
| GET | `/api/v1/users/me/preferences` | `getMyPreferences` | Users | users:read | — | object |
| PATCH | `/api/v1/users/me/preferences` | `updateMyPreferences` | Users | users:update | UpdateUserPreferencesDto | object |
| GET | `/api/v1/users/me/security` | `getMySecurity` | Users | users:read | — | MySecurityOverviewDto |
| DELETE | `/api/v1/users/me/security/credentials/{credentialId}` | `deleteMyCredential` | Users | users:update | — | object |
| POST | `/api/v1/vouchers` | `issue` | API | vouchers:issue | IssueVoucherDto | object |
| POST | `/api/v1/vouchers/{id}/activate` | `activate` | API | vouchers:issue | — | object |
| GET | `/api/v1/vouchers/{id}/balance` | `balance` | API | vouchers:read | — | object |
| POST | `/api/v1/vouchers/{id}/cancel` | `cancel` | API | vouchers:cancel | CancelVoucherDto | object |
| POST | `/api/v1/vouchers/{id}/redeem` | `redeem` | API | vouchers:redeem | RedeemVoucherDto | object |
| POST | `/api/v1/workflow/definitions` | `definition` | API | workflow:write | UpsertWorkflowDefinitionDto | object |
| POST | `/api/v1/workflow/instances` | `start` | API | workflow:write | StartWorkflowDto | object |
| GET | `/api/v1/workflow/instances/{id}` | `get` | API | workflow:read | — | object |
| POST | `/api/v1/workflow/instances/{instanceId}/tasks/{taskId}/decide` | `decide` | API | workflow:decide | DecideTaskDto | object |
| GET | `/health` | `health` | Health | public | — | object |
| GET | `/liveness` | `liveness` | Health | public | — | object |
| GET | `/metrics` | `getMetrics` | Health | public | — | object |
| GET | `/readiness` | `readiness` | Health | public | — | object |

---

## 3. Détail des opérations

### `GET /api/v1/admin/reconciliation/report`

- **operationId :** `getReport`
- **summary :** Get last reconciliation report for current tenant
- **tags :** Admin
- **security :** Bearer JWT
- **permission :** `tenant:read`
- **source :** `src/modules/identity/presentation/controllers/reconciliation.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`ReconcileKeycloakResultResponseDto`](#schema-reconcilekeycloakresultresponsedto)

### `GET /api/v1/admin/reconciliation/reports`

- **operationId :** `listReports`
- **summary :** List reconciliation report history (paginated)
- **tags :** Admin
- **security :** Bearer JWT
- **permission :** `tenant:read`
- **source :** `src/modules/identity/presentation/controllers/reconciliation.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| page | query | false |
| limit | query | false |
| cursor | query | false |

**Response `data` schema :** [`ReconciliationReportRecordResponseDto`](#schema-reconciliationreportrecordresponsedto) (array + pagination)

### `POST /api/v1/admin/reconciliation/run`

- **operationId :** `run`
- **summary :** Run Keycloak ↔ application reconciliation for current tenant
- **tags :** Admin
- **security :** Bearer JWT
- **permission :** `tenant:update`
- **source :** `src/modules/identity/presentation/controllers/reconciliation.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`RunReconciliationDto`](#schema-runreconciliationdto)

**Response `data` schema :** [`ReconcileKeycloakResultResponseDto`](#schema-reconcilekeycloakresultresponsedto)

### `POST /api/v1/admin/tenants`

- **operationId :** `provision`
- **summary :** Provision a new tenant (DB-per-tenant + optional default Keycloak Organization)
- **tags :** Admin
- **security :** Bearer JWT
- **source :** `src/modules/platform/presentation/controllers/platform-admin.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`ProvisionTenantDto`](#schema-provisiontenantdto)

**Response `data` schema :** [`TenantProvisioningResultResponseDto`](#schema-tenantprovisioningresultresponsedto)

### `DELETE /api/v1/admin/tenants/{tenantId}`

- **operationId :** `deprovision`
- **summary :** Deprovision tenant (soft or hard)
- **tags :** Admin
- **security :** Bearer JWT
- **source :** `src/modules/platform/presentation/controllers/platform-admin.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantId | path | true |
| hard | query | false |

**Response `data` schema :** [`TenantDeprovisionResultResponseDto`](#schema-tenantdeprovisionresultresponsedto)

### `GET /api/v1/admin/tenants/{tenantId}/domains`

- **operationId :** `list`
- **summary :** List all registered domains for a tenant
- **tags :** Admin
- **security :** Bearer JWT
- **source :** `src/modules/platform/presentation/controllers/tenant-domains.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantId | path | true |

**Response `data` schema :** [`TenantDomainResponseDto`](#schema-tenantdomainresponsedto)

### `POST /api/v1/admin/tenants/{tenantId}/domains`

- **operationId :** `create`
- **summary :** Register a hostname for a tenant (SUBDOMAIN: ACTIVE, CUSTOM: PENDING verification)
- **tags :** Admin
- **security :** Bearer JWT
- **source :** `src/modules/platform/presentation/controllers/tenant-domains.controller.ts`
- **HTTP success :** 201

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantId | path | true |

**Request body schema :** [`CreateTenantDomainDto`](#schema-createtenantdomaindto)

**Response `data` schema :** [`TenantDomainResponseDto`](#schema-tenantdomainresponsedto)

### `POST /api/v1/admin/tenants/{tenantId}/domains/{domainId}/verify/check`

- **operationId :** `verifyCheck`
- **summary :** Confirm domain ownership via DNS TXT + verification token
- **tags :** Admin
- **security :** Bearer JWT
- **source :** `src/modules/platform/presentation/controllers/tenant-domains.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantId | path | true |
| domainId | path | true |

**Request body schema :** [`VerifyDomainTokenDto`](#schema-verifydomaintokendto)

**Response `data` schema :** [`TenantDomainResponseDto`](#schema-tenantdomainresponsedto)

### `POST /api/v1/admin/tenants/{tenantId}/domains/{domainId}/verify/start`

- **operationId :** `verifyStart`
- **summary :** Begin DNS TXT verification for a custom domain
- **tags :** Admin
- **security :** Bearer JWT
- **source :** `src/modules/platform/presentation/controllers/tenant-domains.controller.ts`
- **HTTP success :** 201

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantId | path | true |
| domainId | path | true |

**Response `data` schema :** [`VerifyStartResponseDto`](#schema-verifystartresponsedto)

### `GET /api/v1/admin/tenants/{tenantId}/health`

- **operationId :** `tenantHealth`
- **summary :** Get tenant infrastructure health
- **tags :** Admin
- **security :** Bearer JWT
- **source :** `src/modules/platform/presentation/controllers/platform-admin.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantId | path | true |

**Response `data` schema :** [`TenantHealthResponseDto`](#schema-tenanthealthresponsedto)

### `POST /api/v1/admin/tenants/{tenantId}/provisioning/retry`

- **operationId :** `retryProvisioning`
- **summary :** Retry a failed or stalled tenant provisioning saga
- **tags :** Admin
- **security :** Bearer JWT
- **source :** `src/modules/platform/presentation/controllers/platform-admin.controller.ts`
- **HTTP success :** 201

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantId | path | true |

**Response `data` schema :** [`TenantProvisioningResultResponseDto`](#schema-tenantprovisioningresultresponsedto)

### `POST /api/v1/admin/tenants/{tenantId}/status`

- **operationId :** `transitionStatus`
- **summary :** Transition tenant status (cross-tenant platform admin)
- **tags :** Admin
- **security :** Bearer JWT
- **source :** `src/modules/platform/presentation/controllers/platform-admin.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantId | path | true |

**Request body schema :** [`PlatformTransitionTenantStatusDto`](#schema-platformtransitiontenantstatusdto)

**Response `data` schema :** [`TenantResponseDto`](#schema-tenantresponsedto)

### `POST /api/v1/ai/forecasts/demand`

- **operationId :** `demandForecast`
- **summary :** Upsert demand forecast (demand_forecasts and/or explain snapshot) — no stock mutation
- **tags :** API
- **security :** Bearer JWT
- **permission :** `ai:forecast`
- **source :** `src/modules/commercial-ai/presentation/commercial-ai.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`DemandForecastDto`](#schema-demandforecastdto)

### `POST /api/v1/ai/forecasts/sales`

- **operationId :** `salesForecast`
- **summary :** Store sales forecast snapshot — non-transactional
- **tags :** API
- **security :** Bearer JWT
- **permission :** `ai:forecast`
- **source :** `src/modules/commercial-ai/presentation/commercial-ai.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`SalesForecastDto`](#schema-salesforecastdto)

### `GET /api/v1/ai/insights/anomalies`

- **operationId :** `anomalies`
- **summary :** Heuristic anomaly insights placeholder
- **tags :** API
- **security :** Bearer JWT
- **permission :** `ai:read`
- **source :** `src/modules/commercial-ai/presentation/commercial-ai.controller.ts`
- **HTTP success :** 200

### `GET /api/v1/ai/insights/churn`

- **operationId :** `churn`
- **summary :** Heuristic churn risk insight
- **tags :** API
- **security :** Bearer JWT
- **permission :** `ai:read`
- **source :** `src/modules/commercial-ai/presentation/commercial-ai.controller.ts`
- **HTTP success :** 200

### `GET /api/v1/ai/recommendations/price`

- **operationId :** `priceRec`
- **summary :** Heuristic price recommendation (does not write price lists)
- **tags :** API
- **security :** Bearer JWT
- **permission :** `ai:read`
- **source :** `src/modules/commercial-ai/presentation/commercial-ai.controller.ts`
- **HTTP success :** 200

### `GET /api/v1/ai/recommendations/replenishment`

- **operationId :** `replenishmentRec`
- **summary :** Heuristic replenishment recommendations (read-only)
- **tags :** API
- **security :** Bearer JWT
- **permission :** `ai:read`
- **source :** `src/modules/commercial-ai/presentation/commercial-ai.controller.ts`
- **HTTP success :** 200

### `GET /api/v1/analytics/kpis`

- **operationId :** `listKpis`
- **summary :** List KPI definitions
- **tags :** API
- **security :** Bearer JWT
- **permission :** `analytics:read`
- **source :** `src/modules/commercial-analytics/presentation/analytics.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/analytics/kpis/compute`

- **operationId :** `compute`
- **summary :** Compute and store a KPI snapshot
- **tags :** API
- **security :** Bearer JWT
- **permission :** `analytics:read`
- **source :** `src/modules/commercial-analytics/presentation/analytics.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`ComputeKpiDto`](#schema-computekpidto)

### `GET /api/v1/analytics/kpis/snapshots`

- **operationId :** `listSnapshots`
- **summary :** List computed KPI snapshots
- **tags :** API
- **security :** Bearer JWT
- **permission :** `analytics:read`
- **source :** `src/modules/commercial-analytics/presentation/analytics.controller.ts`
- **HTTP success :** 200

### `GET /api/v1/audit-logs`

- **operationId :** `list`
- **summary :** List tenant audit logs
- **tags :** Settings
- **security :** Bearer JWT
- **permission :** `audit:read`
- **source :** `src/modules/identity/presentation/controllers/tenant-settings-resources.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`Object`](#schema-object) (array + pagination)

### `POST /api/v1/catalog/kits`

- **operationId :** `create`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `catalog:kits`
- **source :** `src/modules/catalog/presentation/catalog.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`CreateKitDto`](#schema-createkitdto)

**Response `data` schema :** [`CreateKitDto`](#schema-createkitdto)

### `GET /api/v1/catalog/kits`

- **operationId :** `list`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `catalog:read`
- **source :** `src/modules/catalog/presentation/catalog.controller.ts`
- **HTTP success :** 200

### `PATCH /api/v1/catalog/kits/{kitId}`

- **operationId :** `update`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `catalog:kits`
- **source :** `src/modules/catalog/presentation/catalog.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| kitId | path | true |

**Request body schema :** [`Partial`](#schema-partial)

### `GET /api/v1/catalog/kits/explode/{skuId}`

- **operationId :** `explode`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `catalog:read`
- **source :** `src/modules/catalog/presentation/catalog.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| skuId | path | true |

### `POST /api/v1/catalog/products`

- **operationId :** `create`
- **summary :** Create product with optional SKUs
- **tags :** API
- **security :** Bearer JWT
- **permission :** `catalog:create`
- **source :** `src/modules/catalog/presentation/catalog.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`CreateProductDto`](#schema-createproductdto)

**Response `data` schema :** [`ProductResponseDto`](#schema-productresponsedto)

### `GET /api/v1/catalog/products`

- **operationId :** `list`
- **summary :** List products
- **tags :** API
- **security :** Bearer JWT
- **permission :** `catalog:read`
- **source :** `src/modules/catalog/presentation/catalog.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| page | query | false |
| limit | query | false |
| cursor | query | false |
| search | query | false |

**Response `data` schema :** [`ProductResponseDto`](#schema-productresponsedto) (array + pagination)

### `GET /api/v1/catalog/products/{productId}`

- **operationId :** `get`
- **summary :** Get product by id
- **tags :** API
- **security :** Bearer JWT
- **permission :** `catalog:read`
- **source :** `src/modules/catalog/presentation/catalog.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| productId | path | true |

**Response `data` schema :** [`ProductResponseDto`](#schema-productresponsedto)

### `PATCH /api/v1/catalog/products/{productId}/pharma`

- **operationId :** `updatePharma`
- **summary :** Update product pharma / tracking attributes
- **tags :** API
- **security :** Bearer JWT
- **permission :** `catalog:update`
- **source :** `src/modules/catalog/presentation/catalog.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| productId | path | true |

**Request body schema :** [`UpdateProductPharmaDto`](#schema-updateproductpharmadto)

**Response `data` schema :** [`ProductResponseDto`](#schema-productresponsedto)

### `PATCH /api/v1/catalog/products/{productId}/status`

- **operationId :** `updateStatus`
- **summary :** Update product commercial status
- **tags :** API
- **security :** Bearer JWT
- **permission :** `catalog:update`
- **source :** `src/modules/catalog/presentation/catalog.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| productId | path | true |

**Request body schema :** [`UpdateProductStatusDto`](#schema-updateproductstatusdto)

**Response `data` schema :** [`ProductResponseDto`](#schema-productresponsedto)

### `POST /api/v1/catalog/substitutions`

- **operationId :** `create`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `catalog:substitute`
- **source :** `src/modules/catalog/presentation/catalog.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`CreateSubstitutionDto`](#schema-createsubstitutiondto)

**Response `data` schema :** [`CreateSubstitutionDto`](#schema-createsubstitutiondto)

### `GET /api/v1/catalog/substitutions`

- **operationId :** `list`
- **summary :** List substitutions by source SKU
- **tags :** API
- **security :** Bearer JWT
- **permission :** `catalog:read`
- **source :** `src/modules/catalog/presentation/catalog.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/catalog/substitutions/approvals/{id}/approve`

- **operationId :** `approve`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `catalog:substitute`
- **source :** `src/modules/catalog/presentation/catalog.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `POST /api/v1/catalog/substitutions/approvals/{id}/reject`

- **operationId :** `reject`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `catalog:substitute`
- **source :** `src/modules/catalog/presentation/catalog.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `POST /api/v1/catalog/substitutions/request`

- **operationId :** `request`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `catalog:substitute`
- **source :** `src/modules/catalog/presentation/catalog.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`RequestSubstitutionDto`](#schema-requestsubstitutiondto)

### `GET /api/v1/commercial-config`

- **operationId :** `getConfig`
- **summary :** Get commercial org configuration
- **tags :** API
- **security :** Bearer JWT
- **permission :** `config:commercial_read`
- **source :** `src/modules/commercial-config/presentation/commercial-config.controller.ts`
- **HTTP success :** 200

### `PUT /api/v1/commercial-config`

- **operationId :** `putConfig`
- **summary :** Upsert commercial org configuration
- **tags :** API
- **security :** Bearer JWT
- **permission :** `config:commercial_write`
- **source :** `src/modules/commercial-config/presentation/commercial-config.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`UpsertOrgConfigDto`](#schema-upsertorgconfigdto)

### `GET /api/v1/commercial-config/availability-policies`

- **operationId :** `listAvailabilityPolicies`
- **summary :** List availability policies
- **tags :** API
- **security :** Bearer JWT
- **permission :** `availability_policy:manage`
- **source :** `src/modules/commercial-config/presentation/commercial-config.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/commercial-config/availability-policies`

- **operationId :** `upsertAvailabilityPolicy`
- **summary :** Create or upsert availability policy by code
- **tags :** API
- **security :** Bearer JWT
- **permission :** `availability_policy:manage`
- **source :** `src/modules/commercial-config/presentation/commercial-config.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`UpsertAvailabilityPolicyDto`](#schema-upsertavailabilitypolicydto)

### `DELETE /api/v1/commercial-config/availability-policies/{id}`

- **operationId :** `deleteAvailabilityPolicy`
- **summary :** Delete availability policy
- **tags :** API
- **security :** Bearer JWT
- **permission :** `availability_policy:manage`
- **source :** `src/modules/commercial-config/presentation/commercial-config.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `GET /api/v1/commercial-config/priority-rules`

- **operationId :** `listPriorityRules`
- **summary :** List priority rules
- **tags :** API
- **security :** Bearer JWT
- **permission :** `priority:manage`
- **source :** `src/modules/commercial-config/presentation/commercial-config.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/commercial-config/priority-rules`

- **operationId :** `upsertPriorityRule`
- **summary :** Create or upsert priority rule by code
- **tags :** API
- **security :** Bearer JWT
- **permission :** `priority:manage`
- **source :** `src/modules/commercial-config/presentation/commercial-config.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`UpsertPriorityRuleDto`](#schema-upsertpriorityruledto)

### `DELETE /api/v1/commercial-config/priority-rules/{id}`

- **operationId :** `deletePriorityRule`
- **summary :** Delete priority rule
- **tags :** API
- **security :** Bearer JWT
- **permission :** `priority:manage`
- **source :** `src/modules/commercial-config/presentation/commercial-config.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `POST /api/v1/commercial-jobs/{jobName}/run`

- **operationId :** `run`
- **summary :** Manually trigger a commercial scheduled job
- **tags :** API
- **security :** Bearer JWT
- **permission :** `jobs:run`
- **source :** `src/modules/commercial-jobs/presentation/commercial-jobs.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| jobName | path | true |

### `POST /api/v1/commercial-jobs/notifications/enqueue`

- **operationId :** `enqueue`
- **summary :** Enqueue a commercial notification outbox row
- **tags :** API
- **security :** Bearer JWT
- **permission :** `jobs:run`
- **source :** `src/modules/commercial-jobs/presentation/commercial-jobs.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`EnqueueNotificationDto`](#schema-enqueuenotificationdto)

### `GET /api/v1/commercial-jobs/reconciliation/reports`

- **operationId :** `reconciliationReports`
- **summary :** List commercial reconciliation reports
- **tags :** API
- **security :** Bearer JWT
- **permission :** `reconciliation:read`
- **source :** `src/modules/commercial-jobs/presentation/commercial-jobs.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/commercial-jobs/reconciliation/run`

- **operationId :** `reconciliationRun`
- **summary :** Run commercial reconciliation drift checks
- **tags :** API
- **security :** Bearer JWT
- **permission :** `reconciliation:run`
- **source :** `src/modules/commercial-jobs/presentation/commercial-jobs.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/commercial-ops/bulk-jobs`

- **operationId :** `bulkJob`
- **summary :** Create and run (or dry-run) a commercial bulk job
- **tags :** API
- **security :** Bearer JWT
- **permission :** `ops:bulk`
- **source :** `src/modules/commercial-ops/presentation/commercial-ops.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`BulkJobDto`](#schema-bulkjobdto)

### `POST /api/v1/commercial-ops/imports`

- **operationId :** `uploadImport`
- **summary :** Upload import batch staging rows
- **tags :** API
- **security :** Bearer JWT
- **permission :** `ops:import`
- **source :** `src/modules/commercial-ops/presentation/commercial-ops.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`UploadImportDto`](#schema-uploadimportdto)

### `POST /api/v1/commercial-ops/imports/{batchId}/approve`

- **operationId :** `approveImport`
- **summary :** Approve import batch
- **tags :** API
- **security :** Bearer JWT
- **permission :** `ops:import_approve`
- **source :** `src/modules/commercial-ops/presentation/commercial-ops.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| batchId | path | true |

### `POST /api/v1/commercial-ops/imports/{batchId}/import`

- **operationId :** `runImport`
- **summary :** Run import (MVP: staging report only)
- **tags :** API
- **security :** Bearer JWT
- **permission :** `ops:import`
- **source :** `src/modules/commercial-ops/presentation/commercial-ops.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| batchId | path | true |

### `POST /api/v1/commercial-ops/imports/{batchId}/preview`

- **operationId :** `previewImport`
- **summary :** Preview import batch
- **tags :** API
- **security :** Bearer JWT
- **permission :** `ops:import`
- **source :** `src/modules/commercial-ops/presentation/commercial-ops.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| batchId | path | true |

### `POST /api/v1/commercial-ops/imports/{batchId}/validate`

- **operationId :** `validateImport`
- **summary :** Validate import batch staging
- **tags :** API
- **security :** Bearer JWT
- **permission :** `ops:import`
- **source :** `src/modules/commercial-ops/presentation/commercial-ops.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| batchId | path | true |

### `GET /api/v1/commercial-webhooks`

- **operationId :** `list`
- **summary :** List commercial webhook configs
- **tags :** API
- **security :** Bearer JWT
- **permission :** `webhooks:read`
- **source :** `src/modules/commercial-webhooks/presentation/commercial-webhooks.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/commercial-webhooks`

- **operationId :** `create`
- **summary :** Create commercial webhook endpoint
- **tags :** API
- **security :** Bearer JWT
- **permission :** `webhooks:manage`
- **source :** `src/modules/commercial-webhooks/presentation/commercial-webhooks.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreateWebhookDto`](#schema-createwebhookdto)

### `POST /api/v1/commercial-webhooks/deliver-pending`

- **operationId :** `deliver`
- **summary :** Deliver pending webhook logs with retries / dead-letter
- **tags :** API
- **security :** Bearer JWT
- **permission :** `webhooks:manage`
- **source :** `src/modules/commercial-webhooks/presentation/commercial-webhooks.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/commercial-webhooks/dispatch`

- **operationId :** `dispatch`
- **summary :** Enqueue webhook deliveries for matching configs (HMAC signed)
- **tags :** API
- **security :** Bearer JWT
- **permission :** `webhooks:manage`
- **source :** `src/modules/commercial-webhooks/presentation/commercial-webhooks.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`DispatchWebhookDto`](#schema-dispatchwebhookdto)

### `GET /api/v1/commercial/search`

- **operationId :** `search`
- **summary :** Global commercial document / catalog search
- **tags :** API
- **security :** Bearer JWT
- **permission :** `search:commercial`
- **source :** `src/modules/commercial-search/presentation/commercial-search.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/commissions/accrue`

- **operationId :** `accrueEndpoint`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `commissions:write`
- **source :** `src/modules/commissions/presentation/commissions.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`AccrueDto`](#schema-accruedto)

### `GET /api/v1/commissions/agents`

- **operationId :** `agents`
- **summary :** List sales agents
- **tags :** API
- **security :** Bearer JWT
- **permission :** `commissions:read`
- **source :** `src/modules/commissions/presentation/commissions.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/commissions/agents`

- **operationId :** `createAgentEndpoint`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `commissions:write`
- **source :** `src/modules/commissions/presentation/commissions.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreateAgentDto`](#schema-createagentdto)

### `POST /api/v1/commissions/periods`

- **operationId :** `openPeriodEndpoint`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `commissions:write`
- **source :** `src/modules/commissions/presentation/commissions.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`OpenPeriodDto`](#schema-openperioddto)

### `POST /api/v1/commissions/periods/{id}/approve`

- **operationId :** `approve`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `commissions:approve`
- **source :** `src/modules/commissions/presentation/commissions.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `GET /api/v1/commissions/rules`

- **operationId :** `rules`
- **summary :** List commission rules
- **tags :** API
- **security :** Bearer JWT
- **permission :** `commissions:read`
- **source :** `src/modules/commissions/presentation/commissions.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/commissions/rules`

- **operationId :** `createRuleEndpoint`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `commissions:write`
- **source :** `src/modules/commissions/presentation/commissions.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreateRuleDto`](#schema-createruledto)

### `GET /api/v1/contracts`

- **operationId :** `list`
- **summary :** List commercial contracts
- **tags :** API
- **security :** Bearer JWT
- **permission :** `contracts:read`
- **source :** `src/modules/contracts/presentation/contracts.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/contracts`

- **operationId :** `create`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `contracts:create`
- **source :** `src/modules/contracts/presentation/contracts.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreateContractDto`](#schema-createcontractdto)

### `POST /api/v1/contracts/{id}/activate`

- **operationId :** `activate`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `contracts:approve`
- **source :** `src/modules/contracts/presentation/contracts.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `POST /api/v1/contracts/{id}/approve`

- **operationId :** `approve`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `contracts:approve`
- **source :** `src/modules/contracts/presentation/contracts.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `POST /api/v1/contracts/{id}/submit`

- **operationId :** `submit`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `contracts:create`
- **source :** `src/modules/contracts/presentation/contracts.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `POST /api/v1/copilot/calculate-atp`

- **operationId :** `calculateAtpEndpoint`
- **summary :** Copilot: calculate ATP (and optional CTP)
- **tags :** API
- **security :** Bearer JWT
- **permission :** `copilot:query`
- **source :** `src/modules/commercial-copilot/presentation/commercial-copilot.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CopilotCalculateAtpDto`](#schema-copilotcalculateatpdto)

### `POST /api/v1/copilot/calculate-price`

- **operationId :** `calculatePriceEndpoint`
- **summary :** Copilot: calculate price via pricing engine
- **tags :** API
- **security :** Bearer JWT
- **permission :** `copilot:query`
- **source :** `src/modules/commercial-copilot/presentation/commercial-copilot.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CopilotCalculatePriceDto`](#schema-copilotcalculatepricedto)

### `GET /api/v1/copilot/customer-summary`

- **operationId :** `customerSummaryEndpoint`
- **summary :** Copilot: customer commercial summary
- **tags :** API
- **security :** Bearer JWT
- **permission :** `copilot:query`
- **source :** `src/modules/commercial-copilot/presentation/commercial-copilot.controller.ts`
- **HTTP success :** 200

### `GET /api/v1/copilot/explain-margin`

- **operationId :** `explainMarginEndpoint`
- **summary :** Copilot: explain order margin (revenue-side)
- **tags :** API
- **security :** Bearer JWT
- **permission :** `copilot:query`
- **source :** `src/modules/commercial-copilot/presentation/commercial-copilot.controller.ts`
- **HTTP success :** 200

### `GET /api/v1/copilot/explain-stockout`

- **operationId :** `explainStockoutEndpoint`
- **summary :** Copilot: explain stockout from ATP + ledger
- **tags :** API
- **security :** Bearer JWT
- **permission :** `copilot:query`
- **source :** `src/modules/commercial-copilot/presentation/commercial-copilot.controller.ts`
- **HTTP success :** 200

### `GET /api/v1/copilot/find-abnormal-sales`

- **operationId :** `findAbnormalEndpoint`
- **summary :** Copilot: find abnormal sales (heuristic stub)
- **tags :** API
- **security :** Bearer JWT
- **permission :** `copilot:query`
- **source :** `src/modules/commercial-copilot/presentation/commercial-copilot.controller.ts`
- **HTTP success :** 200

### `GET /api/v1/copilot/find-expiring-products`

- **operationId :** `findExpiringEndpoint`
- **summary :** Copilot: find lots expiring within N days
- **tags :** API
- **security :** Bearer JWT
- **permission :** `copilot:query`
- **source :** `src/modules/commercial-copilot/presentation/commercial-copilot.controller.ts`
- **HTTP success :** 200

### `GET /api/v1/copilot/order-status`

- **operationId :** `orderStatusEndpoint`
- **summary :** Copilot: order status
- **tags :** API
- **security :** Bearer JWT
- **permission :** `copilot:query`
- **source :** `src/modules/commercial-copilot/presentation/commercial-copilot.controller.ts`
- **HTTP success :** 200

### `GET /api/v1/copilot/product-availability`

- **operationId :** `productAvailabilityEndpoint`
- **summary :** Copilot: product availability
- **tags :** API
- **security :** Bearer JWT
- **permission :** `copilot:query`
- **source :** `src/modules/commercial-copilot/presentation/commercial-copilot.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/copilot/suggest-replenishment`

- **operationId :** `suggestReplenishmentEndpoint`
- **summary :** Copilot: list open replenishment suggestions
- **tags :** API
- **security :** Bearer JWT
- **permission :** `copilot:query`
- **source :** `src/modules/commercial-copilot/presentation/commercial-copilot.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/customer-auth/login`

- **operationId :** `login`
- **summary :** Password grant login for B2C clients (mobile/dev)
- **tags :** Customers
- **security :** Public
- **source :** `src/modules/customer/presentation/controllers/customer-auth.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CustomerLoginDto`](#schema-customerlogindto)

**Response `data` schema :** [`CustomerLoginTokensResponseDto`](#schema-customerlogintokensresponsedto)

### `POST /api/v1/customer-auth/password-reset`

- **operationId :** `passwordReset`
- **summary :** Request password reset email (generic response)
- **tags :** Customers
- **security :** Public
- **source :** `src/modules/customer/presentation/controllers/customer-auth.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CustomerPasswordResetDto`](#schema-customerpasswordresetdto)

**Response `data` schema :** [`GenericMessageResponseDto`](#schema-genericmessageresponsedto)

### `POST /api/v1/customer-auth/register`

- **operationId :** `register`
- **summary :** Register B2C customer (generic response — no enumeration)
- **tags :** Customers
- **security :** Public
- **source :** `src/modules/customer/presentation/controllers/customer-auth.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`RegisterCustomerDto`](#schema-registercustomerdto)

**Response `data` schema :** [`GenericMessageResponseDto`](#schema-genericmessageresponsedto)

### `GET /api/v1/customer/addresses`

- **operationId :** `listAddresses`
- **summary :** List customer addresses
- **tags :** Customers
- **security :** Bearer JWT
- **source :** `src/modules/customer/presentation/controllers/customer-portal.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`CustomerAddressResponseDto`](#schema-customeraddressresponsedto) (array + pagination)

### `POST /api/v1/customer/addresses`

- **operationId :** `addAddress`
- **summary :** Add address
- **tags :** Customers
- **security :** Bearer JWT
- **source :** `src/modules/customer/presentation/controllers/customer-portal.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`CreateAddressDto`](#schema-createaddressdto)

**Response `data` schema :** [`CustomerAddressResponseDto`](#schema-customeraddressresponsedto)

### `PATCH /api/v1/customer/addresses/{addressId}`

- **operationId :** `updateAddress`
- **summary :** Update address
- **tags :** Customers
- **security :** Bearer JWT
- **source :** `src/modules/customer/presentation/controllers/customer-portal.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| addressId | path | true |

**Request body schema :** [`CreateAddressDto`](#schema-createaddressdto)

**Response `data` schema :** [`CustomerAddressResponseDto`](#schema-customeraddressresponsedto)

### `DELETE /api/v1/customer/addresses/{addressId}`

- **operationId :** `removeAddress`
- **summary :** Remove address
- **tags :** Customers
- **security :** Bearer JWT
- **source :** `src/modules/customer/presentation/controllers/customer-portal.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| addressId | path | true |

**Response `data` schema :** [`RemoveAddressResponseDto`](#schema-removeaddressresponsedto)

### `GET /api/v1/customer/consents`

- **operationId :** `listConsents`
- **summary :** List consent history
- **tags :** Customers
- **security :** Bearer JWT
- **source :** `src/modules/customer/presentation/controllers/customer-portal.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`CustomerConsentResponseDto`](#schema-customerconsentresponsedto) (array + pagination)

### `POST /api/v1/customer/consents/grant`

- **operationId :** `grantConsent`
- **summary :** Grant consent (immutable history entry)
- **tags :** Customers
- **security :** Bearer JWT
- **source :** `src/modules/customer/presentation/controllers/customer-portal.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`GrantConsentDto`](#schema-grantconsentdto)

**Response `data` schema :** [`CustomerConsentResponseDto`](#schema-customerconsentresponsedto)

### `POST /api/v1/customer/consents/withdraw`

- **operationId :** `withdrawConsent`
- **summary :** Withdraw consent (immutable history entry)
- **tags :** Customers
- **security :** Bearer JWT
- **source :** `src/modules/customer/presentation/controllers/customer-portal.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`WithdrawConsentDto`](#schema-withdrawconsentdto)

**Response `data` schema :** [`CustomerConsentResponseDto`](#schema-customerconsentresponsedto)

### `GET /api/v1/customer/me`

- **operationId :** `me`
- **summary :** Current B2C customer profile (JWT tenant context)
- **tags :** Customers
- **security :** Bearer JWT
- **source :** `src/modules/customer/presentation/controllers/customer-portal.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`CustomerAggregateResponseDto`](#schema-customeraggregateresponsedto)

### `GET /api/v1/customer/memberships`

- **operationId :** `memberships`
- **summary :** All tenant/establishment links for the logged-in person (unique B2C identity, per-tenant patient role)
- **tags :** Customers
- **security :** Bearer JWT
- **source :** `src/modules/customer/presentation/controllers/customer-portal.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`CustomerMembershipResponseDto`](#schema-customermembershipresponsedto) (array + pagination)

### `GET /api/v1/customers`

- **operationId :** `list`
- **summary :** List tenant customers (paginated)
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:read`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| page | query | false |
| limit | query | false |
| cursor | query | false |
| search | query | false |

**Response `data` schema :** [`TenantCustomerResponseDto`](#schema-tenantcustomerresponsedto) (array + pagination)

### `POST /api/v1/customers`

- **operationId :** `create`
- **summary :** Create identified customer and link to tenant
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:create`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`CreateCustomerDto`](#schema-createcustomerdto)

**Response `data` schema :** [`CustomerAggregateResponseDto`](#schema-customeraggregateresponsedto)

### `GET /api/v1/customers/{tenantCustomerId}`

- **operationId :** `get`
- **summary :** Get customer aggregate by tenant customer ID
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:read`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantCustomerId | path | true |

**Response `data` schema :** [`CustomerAggregateResponseDto`](#schema-customeraggregateresponsedto)

### `GET /api/v1/customers/{tenantCustomerId}/360`

- **operationId :** `get360`
- **summary :** Customer 360 view (aggregate, consents, addresses, CRM, timeline)
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:read`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantCustomerId | path | true |

**Response `data` schema :** [`Customer360ResponseDto`](#schema-customer360responsedto)

### `GET /api/v1/customers/{tenantCustomerId}/addresses`

- **operationId :** `listAddresses`
- **summary :** List customer addresses (staff)
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:read`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantCustomerId | path | true |

**Response `data` schema :** [`CustomerAddressResponseDto`](#schema-customeraddressresponsedto) (array + pagination)

### `POST /api/v1/customers/{tenantCustomerId}/anonymize`

- **operationId :** `anonymize`
- **summary :** Anonymize customer PII and archive tenant link
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:delete`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantCustomerId | path | true |

**Response `data` schema :** [`AnonymizeCustomerResponseDto`](#schema-anonymizecustomerresponsedto)

### `PATCH /api/v1/customers/{tenantCustomerId}/commercial`

- **operationId :** `updateCommercial`
- **summary :** Update customer commercial profile (credit, tax, group)
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:update`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantCustomerId | path | true |

**Request body schema :** [`UpdateCustomerCommercialProfileDto`](#schema-updatecustomercommercialprofiledto)

**Response `data` schema :** [`TenantCustomerResponseDto`](#schema-tenantcustomerresponsedto)

### `GET /api/v1/customers/{tenantCustomerId}/consents`

- **operationId :** `listConsents`
- **summary :** List customer consent history (staff)
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:read`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantCustomerId | path | true |

**Response `data` schema :** [`CustomerConsentResponseDto`](#schema-customerconsentresponsedto) (array + pagination)

### `POST /api/v1/customers/{tenantCustomerId}/consents/grant`

- **operationId :** `grantConsent`
- **summary :** Grant consent on behalf of customer (staff)
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:manage_consent`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 201

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantCustomerId | path | true |

**Request body schema :** [`GrantConsentDto`](#schema-grantconsentdto)

**Response `data` schema :** [`CustomerConsentResponseDto`](#schema-customerconsentresponsedto)

### `POST /api/v1/customers/{tenantCustomerId}/consents/withdraw`

- **operationId :** `withdrawConsent`
- **summary :** Withdraw consent on behalf of customer (staff)
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:manage_consent`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 201

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantCustomerId | path | true |

**Request body schema :** [`WithdrawConsentDto`](#schema-withdrawconsentdto)

**Response `data` schema :** [`CustomerConsentResponseDto`](#schema-customerconsentresponsedto)

### `GET /api/v1/customers/{tenantCustomerId}/contacts`

- **operationId :** `listContacts`
- **summary :** List secondary contacts for a tenant customer
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:read`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantCustomerId | path | true |

**Response `data` schema :** [`CustomerContactResponseDto`](#schema-customercontactresponsedto)

### `POST /api/v1/customers/{tenantCustomerId}/contacts`

- **operationId :** `createContact`
- **summary :** Add a secondary contact
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:update`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 201

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantCustomerId | path | true |

**Request body schema :** [`CreateCustomerContactDto`](#schema-createcustomercontactdto)

**Response `data` schema :** [`CustomerContactResponseDto`](#schema-customercontactresponsedto)

### `DELETE /api/v1/customers/{tenantCustomerId}/contacts/{contactId}`

- **operationId :** `deleteContact`
- **summary :** Delete a secondary contact
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:update`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantCustomerId | path | true |
| contactId | path | true |

### `GET /api/v1/customers/{tenantCustomerId}/credit`

- **operationId :** `getCredit`
- **summary :** Customer credit summary (limit/used/available/hold/terms)
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `credit:read`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantCustomerId | path | true |

### `GET /api/v1/customers/{tenantCustomerId}/export`

- **operationId :** `export`
- **summary :** Export full customer data package
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:export`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantCustomerId | path | true |

**Response `data` schema :** [`CustomerExportResponseDto`](#schema-customerexportresponsedto)

### `GET /api/v1/customers/{tenantCustomerId}/interactions`

- **operationId :** `listInteractions`
- **summary :** List CRM interactions (paginated)
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:crm_read`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantCustomerId | path | true |
| page | query | false |
| limit | query | false |
| cursor | query | false |

**Response `data` schema :** [`CustomerInteractionResponseDto`](#schema-customerinteractionresponsedto) (array + pagination)

### `POST /api/v1/customers/{tenantCustomerId}/interactions`

- **operationId :** `createInteraction`
- **summary :** Create CRM interaction
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:crm_write`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 201

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantCustomerId | path | true |

**Request body schema :** [`CreateCustomerInteractionDto`](#schema-createcustomerinteractiondto)

**Response `data` schema :** [`CustomerInteractionResponseDto`](#schema-customerinteractionresponsedto)

### `POST /api/v1/customers/{tenantCustomerId}/merge`

- **operationId :** `merge`
- **summary :** Merge source duplicate into survivor customer
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:merge`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantCustomerId | path | true |

**Request body schema :** [`MergeCustomersDto`](#schema-mergecustomersdto)

**Response `data` schema :** [`CustomerAggregateResponseDto`](#schema-customeraggregateresponsedto)

### `POST /api/v1/customers/{tenantCustomerId}/organizations`

- **operationId :** `linkOrganization`
- **summary :** Link tenant customer to an organization
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:update`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 201

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantCustomerId | path | true |

**Request body schema :** [`LinkOrganizationCustomerDto`](#schema-linkorganizationcustomerdto)

**Response `data` schema :** [`OrganizationCustomerResponseDto`](#schema-organizationcustomerresponsedto)

### `PATCH /api/v1/customers/{tenantCustomerId}/patient`

- **operationId :** `setPatient`
- **summary :** Mark or unmark a tenant customer as patient (care role, not a separate identity)
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:set_patient`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantCustomerId | path | true |

**Request body schema :** [`SetCustomerPatientDto`](#schema-setcustomerpatientdto)

**Response `data` schema :** [`TenantCustomerResponseDto`](#schema-tenantcustomerresponsedto)

### `POST /api/v1/customers/{tenantCustomerId}/promote`

- **operationId :** `promoteGuest`
- **summary :** Promote guest customer to identified (email or phone required)
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:update`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantCustomerId | path | true |

**Request body schema :** [`PromoteGuestCustomerDto`](#schema-promoteguestcustomerdto)

**Response `data` schema :** [`CustomerAggregateResponseDto`](#schema-customeraggregateresponsedto)

### `PATCH /api/v1/customers/{tenantCustomerId}/status`

- **operationId :** `setStatus`
- **summary :** Activate or deactivate a tenant customer
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:update`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantCustomerId | path | true |

**Request body schema :** [`SetCustomerStatusDto`](#schema-setcustomerstatusdto)

**Response `data` schema :** [`TenantCustomerResponseDto`](#schema-tenantcustomerresponsedto)

### `POST /api/v1/customers/check-duplicates`

- **operationId :** `checkDuplicates`
- **summary :** Check for duplicate customers by email, phone, or customer number
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:read`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CheckDuplicatesCustomerDto`](#schema-checkduplicatescustomerdto)

**Response `data` schema :** [`DuplicateCustomerMatchResponseDto`](#schema-duplicatecustomermatchresponsedto) (array + pagination)

### `POST /api/v1/customers/guest`

- **operationId :** `createGuest`
- **summary :** Create guest customer for POS / walk-in
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:create`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`CreateGuestCustomerDto`](#schema-createguestcustomerdto)

**Response `data` schema :** [`CustomerAggregateResponseDto`](#schema-customeraggregateresponsedto)

### `POST /api/v1/customers/identify`

- **operationId :** `identify`
- **summary :** Identify existing tenant customer by email, phone, or number
- **tags :** Customers
- **security :** Bearer JWT
- **permission :** `customers:read`
- **source :** `src/modules/customer/presentation/controllers/customers.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`IdentifyCustomerDto`](#schema-identifycustomerdto)

**Response `data` schema :** [`CustomerAggregateResponseDto`](#schema-customeraggregateresponsedto)

### `GET /api/v1/dashboards/{dashboardKey}`

- **operationId :** `get`
- **summary :** Get dashboard projection
- **tags :** API
- **security :** Bearer JWT
- **permission :** `dashboards:read`
- **source :** `src/modules/commercial-analytics/presentation/dashboard.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| dashboardKey | path | true |

### `POST /api/v1/dashboards/{dashboardKey}/refresh`

- **operationId :** `refresh`
- **summary :** Refresh dashboard projection metrics
- **tags :** API
- **security :** Bearer JWT
- **permission :** `dashboards:read`
- **source :** `src/modules/commercial-analytics/presentation/dashboard.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| dashboardKey | path | true |

### `GET /api/v1/delegations`

- **operationId :** `list`
- **summary :** List delegations in tenant
- **tags :** Security
- **security :** Bearer JWT
- **permission :** `delegation:read`
- **source :** `src/modules/identity/presentation/controllers/delegation.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| page | query | false |
| limit | query | false |
| cursor | query | false |

**Response `data` schema :** [`DelegationResponseDto`](#schema-delegationresponsedto) (array + pagination)

### `POST /api/v1/delegations`

- **operationId :** `grant`
- **summary :** Grant temporary permission delegation
- **tags :** Security
- **security :** Bearer JWT
- **permission :** `delegation:grant`
- **source :** `src/modules/identity/presentation/controllers/delegation.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`GrantDelegationDto`](#schema-grantdelegationdto)

**Response `data` schema :** [`DelegationResponseDto`](#schema-delegationresponsedto)

### `POST /api/v1/delegations/{delegationId}/revoke`

- **operationId :** `revoke`
- **summary :** Revoke delegation (grantor only)
- **tags :** Security
- **security :** Bearer JWT
- **permission :** `delegation:grant`
- **source :** `src/modules/identity/presentation/controllers/delegation.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| delegationId | path | true |

**Response `data` schema :** [`DelegationResponseDto`](#schema-delegationresponsedto)

### `GET /api/v1/emergency-access`

- **operationId :** `list`
- **summary :** List break-glass emergency access grants
- **tags :** Security
- **security :** Bearer JWT
- **permission :** `emergency_access:read`
- **source :** `src/modules/identity/presentation/controllers/delegation.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| page | query | false |
| limit | query | false |
| cursor | query | false |

**Response `data` schema :** [`EmergencyAccessGrantResponseDto`](#schema-emergencyaccessgrantresponsedto) (array + pagination)

### `POST /api/v1/emergency-access`

- **operationId :** `grant`
- **summary :** Grant break-glass emergency access (audited, max 24h)
- **tags :** Security
- **security :** Bearer JWT
- **permission :** `emergency_access:grant`
- **source :** `src/modules/identity/presentation/controllers/delegation.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`GrantEmergencyAccessDto`](#schema-grantemergencyaccessdto)

**Response `data` schema :** [`EmergencyAccessGrantResponseDto`](#schema-emergencyaccessgrantresponsedto)

### `POST /api/v1/emergency-access/{grantId}/revoke`

- **operationId :** `revoke`
- **summary :** Revoke emergency access grant
- **tags :** Security
- **security :** Bearer JWT
- **permission :** `emergency_access:grant`
- **source :** `src/modules/identity/presentation/controllers/delegation.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| grantId | path | true |

**Response `data` schema :** [`EmergencyAccessGrantResponseDto`](#schema-emergencyaccessgrantresponsedto)

### `GET /api/v1/feature-flags`

- **operationId :** `list`
- **summary :** List resolved feature flags for current tenant context (paginated)
- **tags :** Platform
- **security :** Bearer JWT
- **permission :** `platform:read`
- **source :** `src/modules/identity/presentation/controllers/feature-flags.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| page | query | false |
| limit | query | false |
| cursor | query | false |

**Response `data` schema :** [`FeatureFlagEntryResponseDto`](#schema-featureflagentryresponsedto) (array + pagination)

### `GET /api/v1/files`

- **operationId :** `getFile`
- **summary :** Download a tenant-scoped stored file (avatar, attachments)
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:read`
- **source :** `src/shared/storage/files.controller.ts`
- **HTTP success :** 200

### `GET /api/v1/finance/ar/open-items`

- **operationId :** `openItems`
- **summary :** List unpaid invoices with aging buckets
- **tags :** API
- **security :** Bearer JWT
- **permission :** `invoices:read`
- **source :** `src/modules/finance-commercial/presentation/finance-commercial.controller.ts`
- **HTTP success :** 200

### `GET /api/v1/finance/explain/ar`

- **operationId :** `explainAr`
- **summary :** Explain AR open balance for a customer (req 103)
- **tags :** API
- **security :** Bearer JWT
- **permission :** `explain:read`
- **source :** `src/modules/finance-commercial/presentation/finance-commercial.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/finance/invoices`

- **operationId :** `createInvoice`
- **summary :** Create and post commercial invoice from order
- **tags :** API
- **security :** Bearer JWT
- **permission :** `invoices:create`
- **source :** `src/modules/finance-commercial/presentation/finance-commercial.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`CreateInvoiceDto`](#schema-createinvoicedto)

**Response `data` schema :** [`CreateInvoiceDto`](#schema-createinvoicedto)

### `POST /api/v1/finance/invoices/credit-notes`

- **operationId :** `createCreditNote`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `invoices:credit_note`
- **source :** `src/modules/finance-commercial/presentation/finance-commercial.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreateCreditNoteDto`](#schema-createcreditnotedto)

### `POST /api/v1/finance/invoices/debit-notes`

- **operationId :** `createDebitNote`
- **summary :** Issue debit note (increases customer balance)
- **tags :** API
- **security :** Bearer JWT
- **permission :** `invoices:debit_note`
- **source :** `src/modules/finance-commercial/presentation/finance-commercial.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreateDebitNoteDto`](#schema-createdebitnotedto)

### `POST /api/v1/finance/invoices/proforma`

- **operationId :** `createProforma`
- **summary :** Create proforma (no AR / credit impact)
- **tags :** API
- **security :** Bearer JWT
- **permission :** `invoices:create`
- **source :** `src/modules/finance-commercial/presentation/finance-commercial.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreateInvoiceDto`](#schema-createinvoicedto)

### `POST /api/v1/finance/payments`

- **operationId :** `capturePayment`
- **summary :** Capture payment and allocate to invoice
- **tags :** API
- **security :** Bearer JWT
- **permission :** `payments:create`
- **source :** `src/modules/finance-commercial/presentation/finance-commercial.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`CapturePaymentDto`](#schema-capturepaymentdto)

**Response `data` schema :** [`CapturePaymentDto`](#schema-capturepaymentdto)

### `POST /api/v1/finance/payments/refund`

- **operationId :** `refund`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `payments:create`
- **source :** `src/modules/finance-commercial/presentation/finance-commercial.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/finance/receipts`

- **operationId :** `createReceipt`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `payments:create`
- **source :** `src/modules/finance-commercial/presentation/finance-commercial.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/fulfillment/packages`

- **operationId :** `createPackage`
- **summary :** Create packing package (PKG sequence)
- **tags :** API
- **security :** Bearer JWT
- **permission :** `fulfillment:pack`
- **source :** `src/modules/fulfillment/presentation/fulfillment.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreatePackageDto`](#schema-createpackagedto)

### `POST /api/v1/fulfillment/pick-tickets`

- **operationId :** `createPick`
- **summary :** Create pick ticket from allocated order
- **tags :** API
- **security :** Bearer JWT
- **permission :** `fulfillment:pick`
- **source :** `src/modules/fulfillment/presentation/fulfillment.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`CreatePickTicketDto`](#schema-createpickticketdto)

**Response `data` schema :** [`CreatePickTicketDto`](#schema-createpickticketdto)

### `POST /api/v1/fulfillment/pick-tickets/{pickTicketId}/complete`

- **operationId :** `completePick`
- **summary :** Complete pick ticket (partial → PARTIALLY_FULFILLED)
- **tags :** API
- **security :** Bearer JWT
- **permission :** `fulfillment:pick`
- **source :** `src/modules/fulfillment/presentation/fulfillment.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| pickTicketId | path | true |

**Request body schema :** [`CompletePickDto`](#schema-completepickdto)

**Response `data` schema :** [`CreatePickTicketDto`](#schema-createpickticketdto)

### `POST /api/v1/fulfillment/plans`

- **operationId :** `createPlan`
- **summary :** Create multi-warehouse fulfillment plan and pick tickets
- **tags :** API
- **security :** Bearer JWT
- **permission :** `fulfillment:pick`
- **source :** `src/modules/fulfillment/presentation/fulfillment.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreateFulfillmentPlanDto`](#schema-createfulfillmentplandto)

### `POST /api/v1/fulfillment/shipments`

- **operationId :** `createShipment`
- **summary :** Create shipment and commit inventory issue
- **tags :** API
- **security :** Bearer JWT
- **permission :** `fulfillment:ship`
- **source :** `src/modules/fulfillment/presentation/fulfillment.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`CreateShipmentDto`](#schema-createshipmentdto)

**Response `data` schema :** [`CreateShipmentDto`](#schema-createshipmentdto)

### `PATCH /api/v1/fulfillment/shipments/{id}/delivery`

- **operationId :** `updateDelivery`
- **summary :** Update shipment delivery address/SLA/cost/status
- **tags :** API
- **security :** Bearer JWT
- **permission :** `shipping:update`
- **source :** `src/modules/fulfillment/presentation/fulfillment.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

**Request body schema :** [`UpdateShipmentDeliveryDto`](#schema-updateshipmentdeliverydto)

### `POST /api/v1/fulfillment/shipments/{shipmentId}/deliver`

- **operationId :** `deliver`
- **summary :** Mark shipment delivered with optional POD
- **tags :** API
- **security :** Bearer JWT
- **permission :** `fulfillment:ship`
- **source :** `src/modules/fulfillment/presentation/fulfillment.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| shipmentId | path | true |

**Request body schema :** [`ProofOfDeliveryDto`](#schema-proofofdeliverydto)

**Response `data` schema :** [`CreateShipmentDto`](#schema-createshipmentdto)

### `POST /api/v1/fulfillment/shipments/{shipmentId}/pod`

- **operationId :** `attachPod`
- **summary :** Attach proof of delivery and mark delivered
- **tags :** API
- **security :** Bearer JWT
- **permission :** `shipping:update`
- **source :** `src/modules/fulfillment/presentation/fulfillment.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| shipmentId | path | true |

**Request body schema :** [`ProofOfDeliveryDto`](#schema-proofofdeliverydto)

### `POST /api/v1/fulfillment/waves`

- **operationId :** `createWave`
- **summary :** Create pick wave grouping multiple orders
- **tags :** API
- **security :** Bearer JWT
- **permission :** `fulfillment:wave`
- **source :** `src/modules/fulfillment/presentation/fulfillment.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreatePickWaveDto`](#schema-createpickwavedto)

### `POST /api/v1/inventory/adjustments`

- **operationId :** `adjust`
- **summary :** Adjust on-hand quantity (refuses negative on-hand)
- **tags :** API
- **security :** Bearer JWT
- **permission :** `inventory:adjust`
- **source :** `src/modules/inventory/presentation/inventory.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`AdjustStockDto`](#schema-adjuststockdto)

### `POST /api/v1/inventory/allocate`

- **operationId :** `allocate`
- **summary :** Allocate all reservations for an order (strategy-aware)
- **tags :** API
- **security :** Bearer JWT
- **permission :** `inventory:allocate`
- **source :** `src/modules/inventory/presentation/inventory.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`AllocateOrderDto`](#schema-allocateorderdto)

**Response `data` schema :** [`AvailabilityResponseDto`](#schema-availabilityresponsedto)

### `GET /api/v1/inventory/availability`

- **operationId :** `availability`
- **summary :** Check ATP / availability for SKU at warehouse
- **tags :** API
- **security :** Bearer JWT
- **permission :** `inventory:read`
- **source :** `src/modules/inventory/presentation/inventory.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`AvailabilityResponseDto`](#schema-availabilityresponsedto)

### `POST /api/v1/inventory/availability/check`

- **operationId :** `availabilityCheck`
- **summary :** Check ATP / availability (POST alias)
- **tags :** API
- **security :** Bearer JWT
- **permission :** `inventory:read`
- **source :** `src/modules/inventory/presentation/inventory.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CheckAvailabilityDto`](#schema-checkavailabilitydto)

**Response `data` schema :** [`AvailabilityResponseDto`](#schema-availabilityresponsedto)

### `GET /api/v1/inventory/consignment-accounts`

- **operationId :** `listConsignmentAccounts`
- **summary :** List consignment / ownership accounts
- **tags :** API
- **security :** Bearer JWT
- **permission :** `inventory:read`
- **source :** `src/modules/inventory/presentation/inventory.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/inventory/consignment-accounts`

- **operationId :** `createConsignmentAccount`
- **summary :** Create consignment / ownership account
- **tags :** API
- **security :** Bearer JWT
- **permission :** `inventory:receive`
- **source :** `src/modules/inventory/presentation/inventory.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreateConsignmentAccountDto`](#schema-createconsignmentaccountdto)

### `POST /api/v1/inventory/ctp`

- **operationId :** `ctp`
- **summary :** Capable-to-promise check against ATP + inbound
- **tags :** API
- **security :** Bearer JWT
- **permission :** `inventory:read`
- **source :** `src/modules/inventory/presentation/inventory.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CheckCtpDto`](#schema-checkctpdto)

**Response `data` schema :** [`CheckCtpDto`](#schema-checkctpdto)

### `GET /api/v1/inventory/ledger/explain`

- **operationId :** `explainLedger`
- **summary :** Explain stock movement narrative from ledger entry_type sums (req 103)
- **tags :** API
- **security :** Bearer JWT
- **permission :** `explain:read`
- **source :** `src/modules/inventory/presentation/inventory.controller.ts`
- **HTTP success :** 200

### `GET /api/v1/inventory/ledger/reconstruct`

- **operationId :** `reconstruct`
- **summary :** Compare ledger SUM(delta) vs stock_lots on-hand
- **tags :** API
- **security :** Bearer JWT
- **permission :** `inventory:read`
- **source :** `src/modules/inventory/presentation/inventory.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/inventory/lots/{lotId}/quarantine`

- **operationId :** `quarantineLot`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `inventory:adjust`
- **source :** `src/modules/inventory/presentation/inventory.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| lotId | path | true |

**Request body schema :** [`QuarantineLotDto`](#schema-quarantinelotdto)

### `POST /api/v1/inventory/lots/{lotId}/recall`

- **operationId :** `recallLot`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `inventory:adjust`
- **source :** `src/modules/inventory/presentation/inventory.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| lotId | path | true |

**Request body schema :** [`RecallLotDto`](#schema-recalllotdto)

### `POST /api/v1/inventory/recalls`

- **operationId :** `createRecall`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `inventory:adjust`
- **source :** `src/modules/inventory/presentation/inventory.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreateRecallDto`](#schema-createrecalldto)

### `POST /api/v1/inventory/receive`

- **operationId :** `receive`
- **summary :** Receive stock into a lot
- **tags :** API
- **security :** Bearer JWT
- **permission :** `inventory:receive`
- **source :** `src/modules/inventory/presentation/inventory.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`ReceiveStockDto`](#schema-receivestockdto)

**Response `data` schema :** [`AvailabilityResponseDto`](#schema-availabilityresponsedto)

### `POST /api/v1/inventory/reserve`

- **operationId :** `reserve`
- **summary :** Reserve stock for a sales order line
- **tags :** API
- **security :** Bearer JWT
- **permission :** `inventory:reserve`
- **source :** `src/modules/inventory/presentation/inventory.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`ReserveStockDto`](#schema-reservestockdto)

**Response `data` schema :** [`AvailabilityResponseDto`](#schema-availabilityresponsedto)

### `POST /api/v1/inventory/transfers`

- **operationId :** `transfer`
- **summary :** Transfer stock between warehouses (TRANSFER_OUT/IN ledger)
- **tags :** API
- **security :** Bearer JWT
- **permission :** `inventory:transfer`
- **source :** `src/modules/inventory/presentation/inventory.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`TransferStockDto`](#schema-transferstockdto)

### `GET /api/v1/invitations`

- **operationId :** `list`
- **summary :** List invitations (paginated)
- **tags :** Invitations
- **security :** Bearer JWT
- **permission :** `users:invite`
- **source :** `src/modules/identity/presentation/controllers/invitations.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`InvitationResponseDto`](#schema-invitationresponsedto) (array + pagination)

### `POST /api/v1/invitations`

- **operationId :** `create`
- **summary :** Create invitation
- **tags :** Invitations
- **security :** Bearer JWT
- **permission :** `users:invite`
- **source :** `src/modules/identity/presentation/controllers/invitations.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`CreateInvitationDto`](#schema-createinvitationdto)

**Response `data` schema :** [`InvitationCreatedResponseDto`](#schema-invitationcreatedresponsedto)

### `POST /api/v1/invitations/{invitationId}/revoke`

- **operationId :** `revoke`
- **summary :** Revoke pending invitation
- **tags :** Invitations
- **security :** Bearer JWT
- **permission :** `users:invite`
- **source :** `src/modules/identity/presentation/controllers/invitations.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| invitationId | path | true |

**Response `data` schema :** [`InvitationResponseDto`](#schema-invitationresponsedto)

### `POST /api/v1/invitations/accept`

- **operationId :** `accept`
- **summary :** Accept invitation with token (authenticated user)
- **tags :** Invitations
- **security :** Bearer JWT
- **source :** `src/modules/identity/presentation/controllers/invitations.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`AcceptInvitationDto`](#schema-acceptinvitationdto)

**Response `data` schema :** [`InvitationAcceptResponseDto`](#schema-invitationacceptresponsedto)

### `POST /api/v1/loyalty/accounts`

- **operationId :** `account`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `loyalty:write`
- **source :** `src/modules/loyalty/presentation/loyalty.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`OpenAccountDto`](#schema-openaccountdto)

### `POST /api/v1/loyalty/earn`

- **operationId :** `earn`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `loyalty:write`
- **source :** `src/modules/loyalty/presentation/loyalty.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`EarnPointsDto`](#schema-earnpointsdto)

### `POST /api/v1/loyalty/expire`

- **operationId :** `expire`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `loyalty:write`
- **source :** `src/modules/loyalty/presentation/loyalty.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`ExpirePointsDto`](#schema-expirepointsdto)

### `POST /api/v1/loyalty/redeem`

- **operationId :** `redeem`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `loyalty:write`
- **source :** `src/modules/loyalty/presentation/loyalty.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`RedeemPointsDto`](#schema-redeempointsdto)

### `GET /api/v1/loyalty/rewards`

- **operationId :** `rewards`
- **summary :** List loyalty rewards
- **tags :** API
- **security :** Bearer JWT
- **permission :** `loyalty:read`
- **source :** `src/modules/loyalty/presentation/loyalty.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/loyalty/rewards`

- **operationId :** `createRewardEndpoint`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `loyalty:write`
- **source :** `src/modules/loyalty/presentation/loyalty.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreateRewardDto`](#schema-createrewarddto)

### `POST /api/v1/loyalty/tiers`

- **operationId :** `tier`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `loyalty:write`
- **source :** `src/modules/loyalty/presentation/loyalty.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`UpsertTierDto`](#schema-upserttierdto)

### `GET /api/v1/memberships`

- **operationId :** `list`
- **summary :** List memberships for user or organization
- **tags :** Memberships
- **security :** Bearer JWT
- **permission :** `memberships:read`
- **source :** `src/modules/identity/presentation/controllers/memberships.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`OrganizationMembershipResponseDto`](#schema-organizationmembershipresponsedto) (array + pagination)

### `POST /api/v1/memberships`

- **operationId :** `grant`
- **summary :** Grant organization membership
- **tags :** Memberships
- **security :** Bearer JWT
- **permission :** `memberships:create`
- **source :** `src/modules/identity/presentation/controllers/memberships.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`GrantMembershipDto`](#schema-grantmembershipdto)

**Response `data` schema :** [`OrganizationMembershipResponseDto`](#schema-organizationmembershipresponsedto)

### `PATCH /api/v1/memberships/{membershipId}`

- **operationId :** `updateRoles`
- **summary :** Update membership roles, permissions, and employment context
- **tags :** Memberships
- **security :** Bearer JWT
- **permission :** `memberships:update`
- **source :** `src/modules/identity/presentation/controllers/memberships.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| membershipId | path | true |

**Request body schema :** [`UpdateMembershipDto`](#schema-updatemembershipdto)

**Response `data` schema :** [`OrganizationMembershipResponseDto`](#schema-organizationmembershipresponsedto)

### `DELETE /api/v1/memberships/{membershipId}`

- **operationId :** `revoke`
- **summary :** Revoke membership (last-admin protected)
- **tags :** Memberships
- **security :** Bearer JWT
- **permission :** `memberships:revoke`
- **source :** `src/modules/identity/presentation/controllers/memberships.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| membershipId | path | true |

**Response `data` schema :** [`OrganizationMembershipResponseDto`](#schema-organizationmembershipresponsedto)

### `GET /api/v1/organizations`

- **operationId :** `list`
- **summary :** List organizations (membership or tenant scope; optional tree)
- **tags :** Organizations
- **security :** Bearer JWT
- **permission :** `organizations:read`
- **source :** `src/modules/identity/presentation/controllers/organizations.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`OrganizationListItemResponseDto`](#schema-organizationlistitemresponsedto) (array + pagination)

### `POST /api/v1/organizations`

- **operationId :** `create`
- **summary :** Create organization (syncs to Keycloak when available)
- **tags :** Organizations
- **security :** Bearer JWT
- **permission :** `organizations:create`
- **source :** `src/modules/identity/presentation/controllers/organizations.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`CreateOrganizationDto`](#schema-createorganizationdto)

**Response `data` schema :** [`OrganizationResponseDto`](#schema-organizationresponsedto)

### `GET /api/v1/organizations/{organizationId}`

- **operationId :** `get`
- **summary :** Get organization by ID
- **tags :** Organizations
- **security :** Bearer JWT
- **permission :** `organizations:read`
- **source :** `src/modules/identity/presentation/controllers/organizations.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| organizationId | path | true |
| organizationId | query | false |

**Response `data` schema :** [`OrganizationResponseDto`](#schema-organizationresponsedto)

### `PATCH /api/v1/organizations/{organizationId}`

- **operationId :** `update`
- **summary :** Update organization
- **tags :** Organizations
- **security :** Bearer JWT
- **permission :** `organizations:update`
- **source :** `src/modules/identity/presentation/controllers/organizations.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| organizationId | path | true |
| organizationId | query | false |

**Request body schema :** [`UpdateOrganizationDto`](#schema-updateorganizationdto)

**Response `data` schema :** [`OrganizationResponseDto`](#schema-organizationresponsedto)

### `POST /api/v1/organizations/{organizationId}/activate`

- **operationId :** `activate`
- **summary :** Activate a suspended organization
- **tags :** Organizations
- **security :** Bearer JWT
- **permission :** `organizations:update`
- **source :** `src/modules/identity/presentation/controllers/organizations.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| organizationId | path | true |
| organizationId | query | false |

**Response `data` schema :** [`OrganizationResponseDto`](#schema-organizationresponsedto)

### `GET /api/v1/organizations/{organizationId}/cash-registers`

- **operationId :** `listCashRegisters`
- **summary :** List organization cash registers
- **tags :** Organizations
- **security :** Bearer JWT
- **permission :** `organizations:read`
- **source :** `src/modules/identity/presentation/controllers/organization-ops.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| organizationId | path | true |
| organizationId | query | false |

**Response `data` schema :** [`Object`](#schema-object) (array + pagination)

### `POST /api/v1/organizations/{organizationId}/cash-registers`

- **operationId :** `createCashRegister`
- **summary :** Create organization cash register
- **tags :** Organizations
- **security :** Bearer JWT
- **permission :** `organizations:update`
- **source :** `src/modules/identity/presentation/controllers/organization-ops.controller.ts`
- **HTTP success :** 201

**Parameters**

| Name | In | Required |
|------|----|----------|
| organizationId | path | true |
| organizationId | query | false |

**Request body schema :** [`CreateCashRegisterDto`](#schema-createcashregisterdto)

**Response `data` schema :** [`Object`](#schema-object)

### `PATCH /api/v1/organizations/{organizationId}/cash-registers/{registerId}`

- **operationId :** `updateCashRegister`
- **summary :** Update organization cash register
- **tags :** Organizations
- **security :** Bearer JWT
- **permission :** `organizations:update`
- **source :** `src/modules/identity/presentation/controllers/organization-ops.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| organizationId | path | true |
| registerId | path | true |
| organizationId | query | false |

**Request body schema :** [`UpdateCashRegisterDto`](#schema-updatecashregisterdto)

**Response `data` schema :** [`Object`](#schema-object)

### `DELETE /api/v1/organizations/{organizationId}/cash-registers/{registerId}`

- **operationId :** `deleteCashRegister`
- **summary :** Delete organization cash register
- **tags :** Organizations
- **security :** Bearer JWT
- **permission :** `organizations:update`
- **source :** `src/modules/identity/presentation/controllers/organization-ops.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| organizationId | path | true |
| registerId | path | true |
| organizationId | query | false |

**Response `data` schema :** [`Object`](#schema-object)

### `GET /api/v1/organizations/{organizationId}/pos-terminals`

- **operationId :** `listPosTerminals`
- **summary :** List organization POS terminals
- **tags :** Organizations
- **security :** Bearer JWT
- **permission :** `organizations:read`
- **source :** `src/modules/identity/presentation/controllers/organization-ops.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| organizationId | path | true |
| organizationId | query | false |

**Response `data` schema :** [`Object`](#schema-object) (array + pagination)

### `POST /api/v1/organizations/{organizationId}/pos-terminals`

- **operationId :** `createPosTerminal`
- **summary :** Create organization POS terminal
- **tags :** Organizations
- **security :** Bearer JWT
- **permission :** `organizations:update`
- **source :** `src/modules/identity/presentation/controllers/organization-ops.controller.ts`
- **HTTP success :** 201

**Parameters**

| Name | In | Required |
|------|----|----------|
| organizationId | path | true |
| organizationId | query | false |

**Request body schema :** [`CreatePosTerminalDto`](#schema-createposterminaldto)

**Response `data` schema :** [`Object`](#schema-object)

### `PATCH /api/v1/organizations/{organizationId}/pos-terminals/{terminalId}`

- **operationId :** `updatePosTerminal`
- **summary :** Update organization POS terminal
- **tags :** Organizations
- **security :** Bearer JWT
- **permission :** `organizations:update`
- **source :** `src/modules/identity/presentation/controllers/organization-ops.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| organizationId | path | true |
| terminalId | path | true |
| organizationId | query | false |

**Request body schema :** [`UpdatePosTerminalDto`](#schema-updateposterminaldto)

**Response `data` schema :** [`Object`](#schema-object)

### `DELETE /api/v1/organizations/{organizationId}/pos-terminals/{terminalId}`

- **operationId :** `deletePosTerminal`
- **summary :** Delete organization POS terminal
- **tags :** Organizations
- **security :** Bearer JWT
- **permission :** `organizations:update`
- **source :** `src/modules/identity/presentation/controllers/organization-ops.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| organizationId | path | true |
| terminalId | path | true |
| organizationId | query | false |

**Response `data` schema :** [`Object`](#schema-object)

### `POST /api/v1/organizations/{organizationId}/suspend`

- **operationId :** `suspend`
- **summary :** Suspend organization
- **tags :** Organizations
- **security :** Bearer JWT
- **permission :** `organizations:suspend`
- **source :** `src/modules/identity/presentation/controllers/organizations.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| organizationId | path | true |
| organizationId | query | false |

**Response `data` schema :** [`OrganizationResponseDto`](#schema-organizationresponsedto)

### `GET /api/v1/organizations/{organizationId}/warehouses`

- **operationId :** `listWarehouses`
- **summary :** List organization warehouses
- **tags :** Organizations
- **security :** Bearer JWT
- **permission :** `organizations:read`
- **source :** `src/modules/identity/presentation/controllers/organization-ops.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| organizationId | path | true |
| organizationId | query | false |

**Response `data` schema :** [`Object`](#schema-object) (array + pagination)

### `POST /api/v1/organizations/{organizationId}/warehouses`

- **operationId :** `createWarehouse`
- **summary :** Create organization warehouse
- **tags :** Organizations
- **security :** Bearer JWT
- **permission :** `organizations:update`
- **source :** `src/modules/identity/presentation/controllers/organization-ops.controller.ts`
- **HTTP success :** 201

**Parameters**

| Name | In | Required |
|------|----|----------|
| organizationId | path | true |
| organizationId | query | false |

**Request body schema :** [`CreateWarehouseDto`](#schema-createwarehousedto)

**Response `data` schema :** [`Object`](#schema-object)

### `PATCH /api/v1/organizations/{organizationId}/warehouses/{warehouseId}`

- **operationId :** `updateWarehouse`
- **summary :** Update organization warehouse
- **tags :** Organizations
- **security :** Bearer JWT
- **permission :** `organizations:update`
- **source :** `src/modules/identity/presentation/controllers/organization-ops.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| organizationId | path | true |
| warehouseId | path | true |
| organizationId | query | false |

**Request body schema :** [`UpdateWarehouseDto`](#schema-updatewarehousedto)

**Response `data` schema :** [`Object`](#schema-object)

### `DELETE /api/v1/organizations/{organizationId}/warehouses/{warehouseId}`

- **operationId :** `deleteWarehouse`
- **summary :** Delete organization warehouse
- **tags :** Organizations
- **security :** Bearer JWT
- **permission :** `organizations:update`
- **source :** `src/modules/identity/presentation/controllers/organization-ops.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| organizationId | path | true |
| warehouseId | path | true |
| organizationId | query | false |

**Response `data` schema :** [`Object`](#schema-object)

### `GET /api/v1/organizations/{organizationId}/workflows`

- **operationId :** `listWorkflows`
- **summary :** List organization workflows
- **tags :** Organizations
- **security :** Bearer JWT
- **permission :** `organizations:read`
- **source :** `src/modules/identity/presentation/controllers/organization-ops.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| organizationId | path | true |
| organizationId | query | false |

**Response `data` schema :** [`Object`](#schema-object) (array + pagination)

### `POST /api/v1/organizations/{organizationId}/workflows`

- **operationId :** `createWorkflow`
- **summary :** Create organization workflow with steps
- **tags :** Organizations
- **security :** Bearer JWT
- **permission :** `organizations:update`
- **source :** `src/modules/identity/presentation/controllers/organization-ops.controller.ts`
- **HTTP success :** 201

**Parameters**

| Name | In | Required |
|------|----|----------|
| organizationId | path | true |
| organizationId | query | false |

**Request body schema :** [`CreateWorkflowDto`](#schema-createworkflowdto)

**Response `data` schema :** [`Object`](#schema-object)

### `PATCH /api/v1/organizations/{organizationId}/workflows/{workflowId}`

- **operationId :** `updateWorkflow`
- **summary :** Update organization workflow (replace steps when provided)
- **tags :** Organizations
- **security :** Bearer JWT
- **permission :** `organizations:update`
- **source :** `src/modules/identity/presentation/controllers/organization-ops.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| organizationId | path | true |
| workflowId | path | true |
| organizationId | query | false |

**Request body schema :** [`UpdateWorkflowDto`](#schema-updateworkflowdto)

**Response `data` schema :** [`Object`](#schema-object)

### `DELETE /api/v1/organizations/{organizationId}/workflows/{workflowId}`

- **operationId :** `deleteWorkflow`
- **summary :** Delete organization workflow
- **tags :** Organizations
- **security :** Bearer JWT
- **permission :** `organizations:update`
- **source :** `src/modules/identity/presentation/controllers/organization-ops.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| organizationId | path | true |
| workflowId | path | true |
| organizationId | query | false |

**Response `data` schema :** [`Object`](#schema-object)

### `GET /api/v1/permissions`

- **operationId :** `listPermissions`
- **summary :** List permission catalog
- **tags :** Roles & Permissions
- **security :** Bearer JWT
- **permission :** `permissions:read`
- **source :** `src/modules/identity/presentation/controllers/roles.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| page | query | false |
| limit | query | false |
| cursor | query | false |

**Response `data` schema :** [`PermissionResponseDto`](#schema-permissionresponsedto) (array + pagination)

### `GET /api/v1/platform/context`

- **operationId :** `getContext`
- **summary :** Get current request context (tenant, org, user, permissions)
- **tags :** Platform
- **security :** Bearer JWT
- **permission :** `platform:read`
- **source :** `src/modules/platform/presentation/controllers/platform.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`PlatformContextResponseDto`](#schema-platformcontextresponsedto)

### `GET /api/v1/platform/me/capabilities`

- **operationId :** `getCapabilities`
- **summary :** Get effective capabilities for the authenticated user (plan, modules, permissions, navigation hints)
- **tags :** Platform
- **security :** Bearer JWT
- **source :** `src/modules/platform/presentation/controllers/platform.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`CapabilitiesSnapshotDto`](#schema-capabilitiessnapshotdto)

### `GET /api/v1/platform/organizations`

- **operationId :** `listOrganizations`
- **summary :** List organizations for current user (Keycloak memberships mirrored in app DB)
- **tags :** Platform
- **security :** Bearer JWT
- **permission :** `platform:read`
- **source :** `src/modules/platform/presentation/controllers/platform.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| page | query | false |
| limit | query | false |
| cursor | query | false |

**Response `data` schema :** [`PlatformOrganizationListItemResponseDto`](#schema-platformorganizationlistitemresponsedto) (array + pagination)

### `POST /api/v1/platform/organizations/switch`

- **operationId :** `switchOrganization`
- **summary :** Switch active organization (updates Keycloak; client must refresh token)
- **tags :** Platform
- **security :** Bearer JWT
- **permission :** `platform:read`
- **source :** `src/modules/platform/presentation/controllers/platform.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`SwitchOrganizationDto`](#schema-switchorganizationdto)

**Response `data` schema :** [`SwitchOrganizationResultResponseDto`](#schema-switchorganizationresultresponsedto)

### `GET /api/v1/policies`

- **operationId :** `list`
- **summary :** List commercial policies
- **tags :** API
- **security :** Bearer JWT
- **permission :** `policies:read`
- **source :** `src/modules/rules/presentation/policies.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/policies`

- **operationId :** `upsert`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `policies:write`
- **source :** `src/modules/rules/presentation/policies.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`UpsertPolicyDto`](#schema-upsertpolicydto)

### `POST /api/v1/policies/{id}/publish`

- **operationId :** `publish`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `policies:publish`
- **source :** `src/modules/rules/presentation/policies.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `POST /api/v1/policies/evaluate`

- **operationId :** `evaluate`
- **summary :** Evaluate a published (or inline) policy
- **tags :** API
- **security :** Bearer JWT
- **permission :** `policies:evaluate`
- **source :** `src/modules/rules/presentation/policies.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`EvaluatePolicyDto`](#schema-evaluatepolicydto)

### `POST /api/v1/pos/checkout`

- **operationId :** `checkoutEndpoint`
- **summary :** POS checkout (order → confirm → invoice → payment)
- **tags :** API
- **security :** Bearer JWT
- **permission :** `pos:checkout`
- **source :** `src/modules/pos/presentation/pos.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`PosCheckoutDto`](#schema-poscheckoutdto)

### `GET /api/v1/pos/offline/pending`

- **operationId :** `pending`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `pos:sync`
- **source :** `src/modules/pos/presentation/pos.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/pos/offline/sync`

- **operationId :** `sync`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `pos:sync`
- **source :** `src/modules/pos/presentation/pos.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`OfflineSyncDto`](#schema-offlinesyncdto)

### `POST /api/v1/pricing/discount-approvals/{id}/approve`

- **operationId :** `approveDiscount`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:discount_approve`
- **source :** `src/modules/pricing/presentation/pricing.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `GET /api/v1/pricing/discount-limits`

- **operationId :** `discountLimits`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `pricing:read`
- **source :** `src/modules/pricing/presentation/pricing.controller.ts`
- **HTTP success :** 200

### `GET /api/v1/pricing/price-lists`

- **operationId :** `listPriceLists`
- **summary :** List price lists for organization
- **tags :** API
- **security :** Bearer JWT
- **permission :** `pricing:read`
- **source :** `src/modules/pricing/presentation/pricing.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/pricing/price-lists`

- **operationId :** `createPriceList`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `pricing:create`
- **source :** `src/modules/pricing/presentation/pricing.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`CreatePriceListDto`](#schema-createpricelistdto)

**Response `data` schema :** [`CreatePriceListDto`](#schema-createpricelistdto)

### `GET /api/v1/pricing/price-lists/{id}`

- **operationId :** `getPriceList`
- **summary :** Get price list (cache-aside, non-transactional)
- **tags :** API
- **security :** Bearer JWT
- **permission :** `pricing:read`
- **source :** `src/modules/pricing/presentation/pricing.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `GET /api/v1/pricing/price-lists/{id}/history`

- **operationId :** `listHistory`
- **summary :** List price list item history (optional skuId filter)
- **tags :** API
- **security :** Bearer JWT
- **permission :** `pricing:read`
- **source :** `src/modules/pricing/presentation/pricing.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `POST /api/v1/pricing/price-lists/{id}/items`

- **operationId :** `addItem`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `pricing:create`
- **source :** `src/modules/pricing/presentation/pricing.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

**Request body schema :** [`AddPriceListItemDto`](#schema-addpricelistitemdto)

### `POST /api/v1/pricing/price-lists/{id}/publish`

- **operationId :** `publish`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `pricing:create`
- **source :** `src/modules/pricing/presentation/pricing.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `POST /api/v1/pricing/promotions`

- **operationId :** `createPromotion`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `promotions:create`
- **source :** `src/modules/pricing/presentation/pricing.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`Record`](#schema-record)

### `GET /api/v1/pricing/promotions`

- **operationId :** `listPromotions`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `promotions:read`
- **source :** `src/modules/pricing/presentation/pricing.controller.ts`
- **HTTP success :** 200

### `PATCH /api/v1/pricing/promotions/{id}`

- **operationId :** `updatePromotion`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `promotions:update`
- **source :** `src/modules/pricing/presentation/pricing.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

**Request body schema :** [`Record`](#schema-record)

### `POST /api/v1/pricing/quote`

- **operationId :** `quote`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `pricing:read`
- **source :** `src/modules/pricing/presentation/pricing.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`QuotePriceDto`](#schema-quotepricedto)

**Response `data` schema :** [`QuotePriceDto`](#schema-quotepricedto)

### `POST /api/v1/pricing/tax-profiles`

- **operationId :** `createTaxProfile`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `tax:create`
- **source :** `src/modules/pricing/presentation/pricing.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`Record`](#schema-record)

### `GET /api/v1/pricing/tax-profiles`

- **operationId :** `listTaxProfiles`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `tax:read`
- **source :** `src/modules/pricing/presentation/pricing.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/pricing/tax-rates`

- **operationId :** `createTaxRate`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `tax:create`
- **source :** `src/modules/pricing/presentation/pricing.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreateTaxRuleDto`](#schema-createtaxruledto)

### `GET /api/v1/pricing/tax-rates`

- **operationId :** `listTaxRates`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `tax:read`
- **source :** `src/modules/pricing/presentation/pricing.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/pricing/tax-rules`

- **operationId :** `createTaxRule`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `pricing:create`
- **source :** `src/modules/pricing/presentation/pricing.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreateTaxRuleDto`](#schema-createtaxruledto)

### `POST /api/v1/purchasing/demand-forecasts`

- **operationId :** `forecast`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `purchasing:create`
- **source :** `src/modules/purchasing/presentation/purchasing.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/purchasing/orders`

- **operationId :** `createOrder`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `purchasing:create`
- **source :** `src/modules/purchasing/presentation/purchasing.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreatePoDto`](#schema-createpodto)

### `POST /api/v1/purchasing/orders/{id}/receive`

- **operationId :** `receive`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `purchasing:receive`
- **source :** `src/modules/purchasing/presentation/purchasing.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

**Request body schema :** [`ReceiveGoodsDto`](#schema-receivegoodsdto)

### `POST /api/v1/purchasing/orders/{id}/transition`

- **operationId :** `transition`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `purchasing:approve`
- **source :** `src/modules/purchasing/presentation/purchasing.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `POST /api/v1/purchasing/reorder-policies`

- **operationId :** `upsertReorder`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `purchasing:create`
- **source :** `src/modules/purchasing/presentation/purchasing.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`ReorderPolicyDto`](#schema-reorderpolicydto)

### `POST /api/v1/purchasing/replenishment/suggest`

- **operationId :** `suggestReplenishment`
- **summary :** Suggest replenishment from reorder policies
- **tags :** API
- **security :** Bearer JWT
- **permission :** `purchasing:create`
- **source :** `src/modules/purchasing/presentation/purchasing.controller.ts`
- **HTTP success :** 200

### `GET /api/v1/purchasing/replenishment/suggestions`

- **operationId :** `getSuggestions`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `purchasing:read`
- **source :** `src/modules/purchasing/presentation/purchasing.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/purchasing/replenishment/suggestions/{id}/accept`

- **operationId :** `accept`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `purchasing:create`
- **source :** `src/modules/purchasing/presentation/purchasing.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `POST /api/v1/purchasing/requisitions`

- **operationId :** `createRequisition`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `purchasing:create`
- **source :** `src/modules/purchasing/presentation/purchasing.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreatePrDto`](#schema-createprdto)

### `POST /api/v1/purchasing/requisitions/{id}/approve`

- **operationId :** `approveRequisition`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `purchasing:approve`
- **source :** `src/modules/purchasing/presentation/purchasing.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `POST /api/v1/purchasing/requisitions/{id}/convert`

- **operationId :** `convert`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `purchasing:create`
- **source :** `src/modules/purchasing/presentation/purchasing.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `POST /api/v1/purchasing/requisitions/{id}/submit`

- **operationId :** `submitRequisition`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `purchasing:create`
- **source :** `src/modules/purchasing/presentation/purchasing.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `GET /api/v1/purchasing/suppliers`

- **operationId :** `suppliers`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `purchasing:read`
- **source :** `src/modules/purchasing/presentation/purchasing.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/purchasing/suppliers`

- **operationId :** `createSupplierEndpoint`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `purchasing:create`
- **source :** `src/modules/purchasing/presentation/purchasing.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`SupplierDto`](#schema-supplierdto)

### `POST /api/v1/purchasing/suppliers/contracts`

- **operationId :** `createContract`
- **summary :** Create supplier contract
- **tags :** API
- **security :** Bearer JWT
- **permission :** `purchasing:create`
- **source :** `src/modules/purchasing/presentation/purchasing.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`SupplierContractDto`](#schema-suppliercontractdto)

### `POST /api/v1/purchasing/suppliers/prices`

- **operationId :** `upsertPrice`
- **summary :** Upsert supplier SKU price
- **tags :** API
- **security :** Bearer JWT
- **permission :** `purchasing:create`
- **source :** `src/modules/purchasing/presentation/purchasing.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`SupplierPriceDto`](#schema-supplierpricedto)

### `GET /api/v1/read-models/availability`

- **operationId :** `availability`
- **summary :** Get product availability projection
- **tags :** API
- **security :** Bearer JWT
- **permission :** `readmodels:read`
- **source :** `src/modules/commercial-readmodels/presentation/commercial-readmodels.controller.ts`
- **HTTP success :** 200

### `GET /api/v1/read-models/customers/{customerId}/balance`

- **operationId :** `customerBalance`
- **summary :** Get customer AR balance read model
- **tags :** API
- **security :** Bearer JWT
- **permission :** `readmodels:read`
- **source :** `src/modules/commercial-readmodels/presentation/commercial-readmodels.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| customerId | path | true |

### `GET /api/v1/read-models/customers/{customerId}/commercial`

- **operationId :** `customerCommercial`
- **summary :** Get customer commercial summary read model
- **tags :** API
- **security :** Bearer JWT
- **permission :** `readmodels:read`
- **source :** `src/modules/commercial-readmodels/presentation/commercial-readmodels.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| customerId | path | true |

### `GET /api/v1/read-models/fulfillment/{orderId}`

- **operationId :** `fulfillment`
- **summary :** Get fulfillment status read model
- **tags :** API
- **security :** Bearer JWT
- **permission :** `readmodels:read`
- **source :** `src/modules/commercial-readmodels/presentation/commercial-readmodels.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| orderId | path | true |

### `GET /api/v1/read-models/orders/{orderId}`

- **operationId :** `orderSummary`
- **summary :** Get order summary read model
- **tags :** API
- **security :** Bearer JWT
- **permission :** `readmodels:read`
- **source :** `src/modules/commercial-readmodels/presentation/commercial-readmodels.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| orderId | path | true |

### `GET /api/v1/reports/sales`

- **operationId :** `sales`
- **summary :** Sales reports by day / product / customer / channel
- **tags :** API
- **security :** Bearer JWT
- **permission :** `reports:read`
- **source :** `src/modules/commercial-analytics/presentation/reports.controller.ts`
- **HTTP success :** 200

### `GET /api/v1/returns`

- **operationId :** `list`
- **summary :** List commercial returns
- **tags :** API
- **security :** Bearer JWT
- **permission :** `returns:read`
- **source :** `src/modules/returns/presentation/returns.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/returns`

- **operationId :** `create`
- **summary :** Create return request
- **tags :** API
- **security :** Bearer JWT
- **permission :** `returns:create`
- **source :** `src/modules/returns/presentation/returns.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreateReturnDto`](#schema-createreturndto)

### `POST /api/v1/returns/{id}/authorize`

- **operationId :** `authorize`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `returns:approve`
- **source :** `src/modules/returns/presentation/returns.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `POST /api/v1/returns/{id}/close`

- **operationId :** `close`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `returns:approve`
- **source :** `src/modules/returns/presentation/returns.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `POST /api/v1/returns/{id}/inspect`

- **operationId :** `inspect`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `returns:inspect`
- **source :** `src/modules/returns/presentation/returns.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

**Request body schema :** [`InspectReturnDto`](#schema-inspectreturndto)

### `POST /api/v1/returns/{id}/receive`

- **operationId :** `receive`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `returns:inspect`
- **source :** `src/modules/returns/presentation/returns.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

**Request body schema :** [`ReceiveReturnDto`](#schema-receivereturndto)

### `POST /api/v1/returns/{id}/reject`

- **operationId :** `reject`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `returns:approve`
- **source :** `src/modules/returns/presentation/returns.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `GET /api/v1/roles`

- **operationId :** `listRoles`
- **summary :** List roles for current tenant (includes system roles)
- **tags :** Roles & Permissions
- **security :** Bearer JWT
- **permission :** `roles:read`
- **source :** `src/modules/identity/presentation/controllers/roles.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| page | query | false |
| limit | query | false |
| cursor | query | false |

**Response `data` schema :** [`RoleResponseDto`](#schema-roleresponsedto) (array + pagination)

### `POST /api/v1/roles`

- **operationId :** `createRole`
- **summary :** Create custom tenant or organization role
- **tags :** Roles & Permissions
- **security :** Bearer JWT
- **permission :** `roles:create`
- **source :** `src/modules/identity/presentation/controllers/roles.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`CreateRoleDto`](#schema-createroledto)

**Response `data` schema :** [`RoleResponseDto`](#schema-roleresponsedto)

### `PATCH /api/v1/roles/{roleId}`

- **operationId :** `updateRole`
- **summary :** Update custom role
- **tags :** Roles & Permissions
- **security :** Bearer JWT
- **permission :** `roles:update`
- **source :** `src/modules/identity/presentation/controllers/roles.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| roleId | path | true |

**Request body schema :** [`UpdateRoleDto`](#schema-updateroledto)

**Response `data` schema :** [`RoleResponseDto`](#schema-roleresponsedto)

### `DELETE /api/v1/roles/{roleId}`

- **operationId :** `deleteRole`
- **summary :** Delete custom role
- **tags :** Roles & Permissions
- **security :** Bearer JWT
- **permission :** `roles:delete`
- **source :** `src/modules/identity/presentation/controllers/roles.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| roleId | path | true |

**Response `data` schema :** [`RoleDeletedResponseDto`](#schema-roledeletedresponsedto)

### `GET /api/v1/sales/backorders`

- **operationId :** `listBackorders`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:read`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/sales/backorders/{backorderId}/cancel`

- **operationId :** `cancelBackorder`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:update`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| backorderId | path | true |

### `POST /api/v1/sales/backorders/{backorderId}/expected`

- **operationId :** `updateExpected`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:update`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| backorderId | path | true |

**Request body schema :** [`UpdateBackorderExpectedDto`](#schema-updatebackorderexpecteddto)

### `POST /api/v1/sales/backorders/{backorderId}/fulfill-partial`

- **operationId :** `fulfillPartial`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:update`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| backorderId | path | true |

**Request body schema :** [`FulfillBackorderDto`](#schema-fulfillbackorderdto)

### `POST /api/v1/sales/backorders/{backorderId}/substitute`

- **operationId :** `substituteBackorder`
- **summary :** Mark backorder as substituted with alternate SKU
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:update`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| backorderId | path | true |

**Request body schema :** [`SubstituteBackorderDto`](#schema-substitutebackorderdto)

### `POST /api/v1/sales/carts`

- **operationId :** `createCart`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:create`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreateCartDto`](#schema-createcartdto)

### `POST /api/v1/sales/carts/{cartId}/abandon`

- **operationId :** `abandonCart`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:update`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| cartId | path | true |

### `POST /api/v1/sales/carts/{cartId}/convert`

- **operationId :** `convertCart`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:create`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| cartId | path | true |

### `PATCH /api/v1/sales/carts/{cartId}/customer`

- **operationId :** `attachCartCustomer`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:update`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| cartId | path | true |

### `POST /api/v1/sales/carts/{cartId}/lines`

- **operationId :** `addCartLine`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:create`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| cartId | path | true |

**Request body schema :** [`AddCartLineDto`](#schema-addcartlinedto)

### `GET /api/v1/sales/channels`

- **operationId :** `listChannels`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `channels:read`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/sales/channels`

- **operationId :** `createChannel`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `channels:create`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`Record`](#schema-record)

### `PATCH /api/v1/sales/channels/{channelId}`

- **operationId :** `updateChannel`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `channels:update`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| channelId | path | true |

**Request body schema :** [`Record`](#schema-record)

### `POST /api/v1/sales/channels/{channelId}/inventory-allocations`

- **operationId :** `upsertChannelAlloc`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `channels:update`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| channelId | path | true |

### `POST /api/v1/sales/channels/seed-defaults`

- **operationId :** `seedChannels`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `channels:create`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

### `GET /api/v1/sales/customer-groups`

- **operationId :** `listCustomerGroups`
- **summary :** List customer groups
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:read`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/sales/customer-groups`

- **operationId :** `createCustomerGroup`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:create`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreateCustomerGroupDto`](#schema-createcustomergroupdto)

### `GET /api/v1/sales/customer-groups/{code}`

- **operationId :** `getCustomerGroup`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:read`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| code | path | true |

### `POST /api/v1/sales/orders`

- **operationId :** `createOrder`
- **summary :** Create draft sales order
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:create`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`CreateSalesOrderDto`](#schema-createsalesorderdto)

**Response `data` schema :** [`CreateSalesOrderDto`](#schema-createsalesorderdto)

### `GET /api/v1/sales/orders`

- **operationId :** `listOrders`
- **summary :** List sales orders with filters
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:read`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

### `GET /api/v1/sales/orders/{orderId}`

- **operationId :** `getOrder`
- **summary :** Get sales order
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:read`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| orderId | path | true |

**Response `data` schema :** [`CreateSalesOrderDto`](#schema-createsalesorderdto)

### `POST /api/v1/sales/orders/{orderId}/allocate`

- **operationId :** `allocateOrder`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:update`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| orderId | path | true |

### `POST /api/v1/sales/orders/{orderId}/approve`

- **operationId :** `approveOrder`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:confirm`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| orderId | path | true |

### `POST /api/v1/sales/orders/{orderId}/cancel`

- **operationId :** `cancelOrder`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:update`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| orderId | path | true |

### `POST /api/v1/sales/orders/{orderId}/complete`

- **operationId :** `completeOrder`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:update`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| orderId | path | true |

### `POST /api/v1/sales/orders/{orderId}/confirm`

- **operationId :** `confirmOrder`
- **summary :** Confirm sales order (quote, credit, ATP, reserve)
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:confirm`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| orderId | path | true |

### `POST /api/v1/sales/orders/{orderId}/handoff`

- **operationId :** `handoff`
- **summary :** Omnichannel fulfill handoff
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:update`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| orderId | path | true |

### `POST /api/v1/sales/orders/{orderId}/lines/{lineId}/substitute`

- **operationId :** `applySubstitution`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `catalog:substitute`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| orderId | path | true |
| lineId | path | true |

### `POST /api/v1/sales/orders/{orderId}/payment-pending`

- **operationId :** `paymentPending`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:update`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| orderId | path | true |

### `POST /api/v1/sales/orders/{orderId}/payment-status`

- **operationId :** `paymentStatus`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:update`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| orderId | path | true |

**Request body schema :** [`RecordPaymentStatusDto`](#schema-recordpaymentstatusdto)

### `POST /api/v1/sales/orders/{orderId}/submit-approval`

- **operationId :** `submitApproval`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:update`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| orderId | path | true |

### `POST /api/v1/sales/quotations`

- **operationId :** `createQuotation`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:create`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreateQuotationDto`](#schema-createquotationdto)

### `POST /api/v1/sales/quotations/{quotationId}/accept`

- **operationId :** `acceptQuotation`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:update`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| quotationId | path | true |

### `POST /api/v1/sales/quotations/{quotationId}/approve`

- **operationId :** `approveQuotation`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:update`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| quotationId | path | true |

### `POST /api/v1/sales/quotations/{quotationId}/cancel`

- **operationId :** `cancelQuotation`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:update`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| quotationId | path | true |

### `POST /api/v1/sales/quotations/{quotationId}/convert`

- **operationId :** `convertQuotation`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:create`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| quotationId | path | true |

**Request body schema :** [`ConvertQuotationDto`](#schema-convertquotationdto)

### `POST /api/v1/sales/quotations/{quotationId}/expire`

- **operationId :** `expireQuotation`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:update`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| quotationId | path | true |

### `POST /api/v1/sales/quotations/{quotationId}/reject`

- **operationId :** `rejectQuotation`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:update`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| quotationId | path | true |

### `POST /api/v1/sales/quotations/{quotationId}/send`

- **operationId :** `sendQuotation`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:update`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| quotationId | path | true |

### `POST /api/v1/sales/quotations/{quotationId}/viewed`

- **operationId :** `viewQuotation`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `sales:update`
- **source :** `src/modules/sales/presentation/sales.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| quotationId | path | true |

### `GET /api/v1/security/identity-providers`

- **operationId :** `listIdentityProviders`
- **summary :** List Keycloak realm identity providers (Google, SAML, OIDC, LDAP, …)
- **tags :** Security
- **security :** Bearer JWT
- **permission :** `security:read`
- **source :** `src/modules/identity/presentation/controllers/security.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/security/identity-providers`

- **operationId :** `createIdentityProvider`
- **summary :** Create Keycloak realm identity provider
- **tags :** Security
- **security :** Bearer JWT
- **permission :** `security:update`
- **source :** `src/modules/identity/presentation/controllers/security.controller.ts`
- **HTTP success :** 201

**Request body schema :** [`CreateIdentityProviderDto`](#schema-createidentityproviderdto)

**Response `data` schema :** [`Object`](#schema-object)

### `GET /api/v1/security/identity-providers/{alias}`

- **operationId :** `getIdentityProvider`
- **summary :** Get one Keycloak identity provider (secrets redacted)
- **tags :** Security
- **security :** Bearer JWT
- **permission :** `security:read`
- **source :** `src/modules/identity/presentation/controllers/security.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| alias | path | true |

### `PATCH /api/v1/security/identity-providers/{alias}`

- **operationId :** `updateIdentityProvider`
- **summary :** Update Keycloak identity provider
- **tags :** Security
- **security :** Bearer JWT
- **permission :** `security:update`
- **source :** `src/modules/identity/presentation/controllers/security.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| alias | path | true |

**Request body schema :** [`UpdateIdentityProviderDto`](#schema-updateidentityproviderdto)

### `DELETE /api/v1/security/identity-providers/{alias}`

- **operationId :** `deleteIdentityProvider`
- **summary :** Delete Keycloak identity provider
- **tags :** Security
- **security :** Bearer JWT
- **permission :** `security:update`
- **source :** `src/modules/identity/presentation/controllers/security.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| alias | path | true |

### `GET /api/v1/security/mfa/status`

- **operationId :** `getMfaStatus`
- **summary :** Get MFA enrollment status for current user (Keycloak)
- **tags :** Security
- **security :** Bearer JWT
- **permission :** `users:read`
- **source :** `src/modules/identity/presentation/controllers/security.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`MfaStatusResponseDto`](#schema-mfastatusresponsedto)

### `GET /api/v1/security/policies`

- **operationId :** `getPolicies`
- **summary :** Get tenant security policies (MFA, session lifetime)
- **tags :** Security
- **security :** Bearer JWT
- **permission :** `security:read`
- **source :** `src/modules/identity/presentation/controllers/security.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`SecurityPoliciesResponseDto`](#schema-securitypoliciesresponsedto)

### `PATCH /api/v1/security/policies`

- **operationId :** `updatePolicies`
- **summary :** Update tenant security policies
- **tags :** Security
- **security :** Bearer JWT
- **permission :** `security:update`
- **source :** `src/modules/identity/presentation/controllers/security.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`UpdateSecurityPoliciesDto`](#schema-updatesecuritypoliciesdto)

**Response `data` schema :** [`SecurityPoliciesResponseDto`](#schema-securitypoliciesresponsedto)

### `GET /api/v1/sessions`

- **operationId :** `listSessions`
- **summary :** List current user sessions (Keycloak)
- **tags :** Security
- **security :** Bearer JWT
- **permission :** `users:read`
- **source :** `src/modules/identity/presentation/controllers/security.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| page | query | false |
| limit | query | false |
| cursor | query | false |

**Response `data` schema :** [`SessionsListDataResponseDto`](#schema-sessionslistdataresponsedto)

### `POST /api/v1/sessions/logout`

- **operationId :** `logoutCurrentToken`
- **summary :** Denylist current JWT (logout without Keycloak session revoke)
- **tags :** Security
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/security.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`LogoutResponseDto`](#schema-logoutresponsedto)

### `POST /api/v1/sessions/revoke`

- **operationId :** `revokeSession`
- **summary :** Revoke a specific session
- **tags :** Security
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/security.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`RevokeSessionDto`](#schema-revokesessiondto)

**Response `data` schema :** [`SessionRevokeResponseDto`](#schema-sessionrevokeresponsedto)

### `POST /api/v1/sessions/revoke-all`

- **operationId :** `revokeAll`
- **summary :** Revoke all sessions for current user
- **tags :** Security
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/security.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`RevokeAllSessionsResponseDto`](#schema-revokeallsessionsresponsedto)

### `GET /api/v1/settings/catalog`

- **operationId :** `catalog`
- **summary :** List settings namespaces and typed key definitions
- **tags :** Settings
- **security :** Bearer JWT
- **permission :** `settings:read`
- **source :** `src/modules/identity/presentation/controllers/settings.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`Object`](#schema-object)

### `GET /api/v1/settings/organizations/{organizationId}/{namespace}`

- **operationId :** `getOrganizationNamespace`
- **summary :** Get organization settings namespace (with tenant defaults)
- **tags :** Settings
- **security :** Bearer JWT
- **permission :** `settings:read`
- **source :** `src/modules/identity/presentation/controllers/settings.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| organizationId | path | true |
| namespace | path | true |
| organizationId | query | false |

**Response `data` schema :** [`OrganizationSettingsResponseDto`](#schema-organizationsettingsresponsedto)

### `PATCH /api/v1/settings/organizations/{organizationId}/{namespace}`

- **operationId :** `updateOrganizationNamespace`
- **summary :** Update organization settings overrides
- **tags :** Settings
- **security :** Bearer JWT
- **permission :** `settings:update`
- **source :** `src/modules/identity/presentation/controllers/settings.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| organizationId | path | true |
| namespace | path | true |
| organizationId | query | false |

**Request body schema :** [`UpdateSettingsNamespaceDto`](#schema-updatesettingsnamespacedto)

**Response `data` schema :** [`OrganizationSettingsResponseDto`](#schema-organizationsettingsresponsedto)

### `GET /api/v1/settings/tenant/{namespace}`

- **operationId :** `getTenantNamespace`
- **summary :** Get tenant settings namespace (resolved with defaults)
- **tags :** Settings
- **security :** Bearer JWT
- **permission :** `settings:read`
- **source :** `src/modules/identity/presentation/controllers/settings.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| namespace | path | true |

**Response `data` schema :** [`SettingsNamespaceResponseDto`](#schema-settingsnamespaceresponsedto)

### `PATCH /api/v1/settings/tenant/{namespace}`

- **operationId :** `updateTenantNamespace`
- **summary :** Update tenant settings namespace
- **tags :** Settings
- **security :** Bearer JWT
- **permission :** `settings:update`
- **source :** `src/modules/identity/presentation/controllers/settings.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| namespace | path | true |

**Request body schema :** [`UpdateSettingsNamespaceDto`](#schema-updatesettingsnamespacedto)

**Response `data` schema :** [`SettingsNamespaceResponseDto`](#schema-settingsnamespaceresponsedto)

### `GET /api/v1/tenant-settings/{resource}`

- **operationId :** `list`
- **summary :** List tenant settings resource collection
- **tags :** Settings
- **security :** Bearer JWT
- **permission :** `settings:read`
- **source :** `src/modules/identity/presentation/controllers/tenant-settings-resources.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| resource | path | true |

**Response `data` schema :** [`Object`](#schema-object) (array + pagination)

### `POST /api/v1/tenant-settings/{resource}`

- **operationId :** `create`
- **summary :** Create tenant settings resource row
- **tags :** Settings
- **security :** Bearer JWT
- **permission :** `settings:update`
- **source :** `src/modules/identity/presentation/controllers/tenant-settings-resources.controller.ts`
- **HTTP success :** 201

**Parameters**

| Name | In | Required |
|------|----|----------|
| resource | path | true |

**Request body schema :** [`Record`](#schema-record)

**Response `data` schema :** [`Object`](#schema-object)

### `PATCH /api/v1/tenant-settings/{resource}/{id}`

- **operationId :** `update`
- **summary :** Update tenant settings resource row
- **tags :** Settings
- **security :** Bearer JWT
- **permission :** `settings:update`
- **source :** `src/modules/identity/presentation/controllers/tenant-settings-resources.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| resource | path | true |
| id | path | true |

**Request body schema :** [`Record`](#schema-record)

**Response `data` schema :** [`Object`](#schema-object)

### `DELETE /api/v1/tenant-settings/{resource}/{id}`

- **operationId :** `remove`
- **summary :** Delete tenant settings resource row
- **tags :** Settings
- **security :** Bearer JWT
- **permission :** `settings:update`
- **source :** `src/modules/identity/presentation/controllers/tenant-settings-resources.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| resource | path | true |
| id | path | true |

**Response `data` schema :** [`Object`](#schema-object)

### `GET /api/v1/tenant-settings/billing`

- **operationId :** `billing`
- **summary :** Tenant billing overview (plan, quotas, invoices)
- **tags :** Settings
- **security :** Bearer JWT
- **permission :** `tenant:billing:read`
- **source :** `src/modules/identity/presentation/controllers/tenant-settings-resources.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`Object`](#schema-object)

### `GET /api/v1/tenant-settings/modules`

- **operationId :** `modules`
- **summary :** List effective tenant modules (plan ∩ overlay)
- **tags :** Settings
- **security :** Bearer JWT
- **permission :** `settings:read`
- **source :** `src/modules/identity/presentation/controllers/tenant-settings-resources.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`Object`](#schema-object)

### `PATCH /api/v1/tenant-settings/modules`

- **operationId :** `updateModules`
- **summary :** Patch module overlay flags
- **tags :** Settings
- **security :** Bearer JWT
- **permission :** `settings:update`
- **source :** `src/modules/identity/presentation/controllers/tenant-settings-resources.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`ModulesOverlayDto`](#schema-modulesoverlaydto)

**Response `data` schema :** [`Object`](#schema-object)

### `POST /api/v1/tenant-settings/numbering/{id}/next`

- **operationId :** `next`
- **summary :** Atomically allocate next document number
- **tags :** Settings
- **security :** Bearer JWT
- **permission :** `settings:update`
- **source :** `src/modules/identity/presentation/controllers/tenant-settings-resources.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

**Response `data` schema :** [`Object`](#schema-object)

### `POST /api/v1/tenant-settings/numbering/{id}/preview`

- **operationId :** `preview`
- **summary :** Preview next document number without consuming
- **tags :** Settings
- **security :** Bearer JWT
- **permission :** `settings:read`
- **source :** `src/modules/identity/presentation/controllers/tenant-settings-resources.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

**Response `data` schema :** [`Object`](#schema-object)

### `GET /api/v1/tenants/{tenantId}`

- **operationId :** `getTenant`
- **summary :** Get tenant profile (must match JWT tenant)
- **tags :** Tenants
- **security :** Bearer JWT
- **permission :** `tenant:read`
- **source :** `src/modules/identity/presentation/controllers/tenants.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantId | path | true |

**Response `data` schema :** [`TenantResponseDto`](#schema-tenantresponsedto)

### `PATCH /api/v1/tenants/{tenantId}`

- **operationId :** `updateTenant`
- **summary :** Update tenant profile fields
- **tags :** Tenants
- **security :** Bearer JWT
- **permission :** `tenant:update`
- **source :** `src/modules/identity/presentation/controllers/tenants.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantId | path | true |

**Request body schema :** [`UpdateTenantDto`](#schema-updatetenantdto)

**Response `data` schema :** [`TenantResponseDto`](#schema-tenantresponsedto)

### `POST /api/v1/tenants/{tenantId}/ownership/transfer`

- **operationId :** `transferOwnership`
- **summary :** Transfer tenant ownership to another identity
- **tags :** Tenants
- **security :** Bearer JWT
- **permission :** `tenant:ownership_transfer`
- **source :** `src/modules/identity/presentation/controllers/tenants.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantId | path | true |

**Request body schema :** [`TransferOwnershipDto`](#schema-transferownershipdto)

**Response `data` schema :** [`OwnershipTransferResponseDto`](#schema-ownershiptransferresponsedto)

### `POST /api/v1/tenants/{tenantId}/status`

- **operationId :** `transitionStatus`
- **summary :** Transition tenant lifecycle status
- **tags :** Tenants
- **security :** Bearer JWT
- **permission :** `tenant:update`
- **source :** `src/modules/identity/presentation/controllers/tenants.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tenantId | path | true |

**Request body schema :** [`TransitionTenantStatusDto`](#schema-transitiontenantstatusdto)

**Response `data` schema :** [`TenantResponseDto`](#schema-tenantresponsedto)

### `GET /api/v1/users`

- **operationId :** `list`
- **summary :** List application users (paginated)
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:read`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`ApplicationUserResponseDto`](#schema-applicationuserresponsedto) (array + pagination)

### `GET /api/v1/users/{identityId}`

- **operationId :** `getUser`
- **summary :** Get user by Keycloak subject or application user id
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:read`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| identityId | path | true |

**Response `data` schema :** [`ApplicationUserResponseDto`](#schema-applicationuserresponsedto)

### `POST /api/v1/users/{identityId}/disable`

- **operationId :** `disable`
- **summary :** Disable user (app + Keycloak disable)
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:suspend`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| identityId | path | true |

**Response `data` schema :** [`ApplicationUserResponseDto`](#schema-applicationuserresponsedto)

### `POST /api/v1/users/{identityId}/reactivate`

- **operationId :** `reactivate`
- **summary :** Reactivate suspended/disabled user
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| identityId | path | true |

**Response `data` schema :** [`ApplicationUserResponseDto`](#schema-applicationuserresponsedto)

### `POST /api/v1/users/{identityId}/suspend`

- **operationId :** `suspend`
- **summary :** Suspend user (app + Keycloak disable)
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:suspend`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| identityId | path | true |

**Response `data` schema :** [`ApplicationUserResponseDto`](#schema-applicationuserresponsedto)

### `GET /api/v1/users/me`

- **operationId :** `getMe`
- **summary :** Get current user application profile (with employment projection)
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:read`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`ApplicationUserResponseDto`](#schema-applicationuserresponsedto)

### `PATCH /api/v1/users/me`

- **operationId :** `updateMe`
- **summary :** Update current user profile
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`UpdateUserProfileDto`](#schema-updateuserprofiledto)

**Response `data` schema :** [`ApplicationUserResponseDto`](#schema-applicationuserresponsedto)

### `GET /api/v1/users/me/activity`

- **operationId :** `listActivity`
- **summary :** List synced activity feed for the current user
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:read`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| page | query | false |
| limit | query | false |
| cursor | query | false |

### `POST /api/v1/users/me/activity`

- **operationId :** `createActivity`
- **summary :** Append an activity event
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreateActivityDto`](#schema-createactivitydto)

### `DELETE /api/v1/users/me/activity`

- **operationId :** `clearActivity`
- **summary :** Clear activity feed for the current user
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

### `GET /api/v1/users/me/api-tokens`

- **operationId :** `listApiTokens`
- **summary :** List personal API tokens (hashes only)
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:read`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/users/me/api-tokens`

- **operationId :** `createApiToken`
- **summary :** Create a personal API token (plaintext returned once)
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreateApiTokenDto`](#schema-createapitokendto)

### `DELETE /api/v1/users/me/api-tokens/{tokenId}`

- **operationId :** `revokeApiToken`
- **summary :** Revoke a personal API token
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| tokenId | path | true |

### `POST /api/v1/users/me/avatar`

- **operationId :** `uploadAvatar`
- **summary :** Upload current user avatar (stored in R2/S3 or local disk)
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`ApplicationUserResponseDto`](#schema-applicationuserresponsedto)

### `GET /api/v1/users/me/devices`

- **operationId :** `listMyDevices`
- **summary :** List soft device registry (optionally sync from Keycloak sessions)
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:read`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

### `PATCH /api/v1/users/me/devices/{deviceId}`

- **operationId :** `trustMyDevice`
- **summary :** Mark a soft device as trusted / untrusted
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| deviceId | path | true |

**Request body schema :** [`TrustDeviceDto`](#schema-trustdevicedto)

### `DELETE /api/v1/users/me/devices/{deviceId}`

- **operationId :** `removeMyDevice`
- **summary :** Remove a soft device registry entry
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| deviceId | path | true |

### `DELETE /api/v1/users/me/devices/{deviceId}/push`

- **operationId :** `clearDevicePush`
- **summary :** Clear push enrollment for a device
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| deviceId | path | true |

### `POST /api/v1/users/me/devices/enroll-push`

- **operationId :** `enrollPushDevice`
- **summary :** Enroll a hard device for push notifications
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`EnrollPushDeviceDto`](#schema-enrollpushdevicedto)

### `GET /api/v1/users/me/identity`

- **operationId :** `getMyIdentity`
- **summary :** Identity overview (Keycloak SoT): credentials, MFA, linked IdPs, verification, enroll URLs
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:read`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`MyIdentityOverviewDto`](#schema-myidentityoverviewdto)

### `DELETE /api/v1/users/me/identity/links/{provider}`

- **operationId :** `unlinkMyIdentity`
- **summary :** Unlink a federated identity provider from the current user
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| provider | path | true |

### `POST /api/v1/users/me/identity/phone/send-otp`

- **operationId :** `sendPhoneOtp`
- **summary :** Send phone KYC OTP via WhatsApp (dry-run when WHATSAPP_OTP_ENABLED=false)
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`SendPhoneVerificationDto`](#schema-sendphoneverificationdto)

### `POST /api/v1/users/me/identity/phone/verify-otp`

- **operationId :** `verifyPhoneOtp`
- **summary :** Verify phone KYC OTP and set verification.phoneVerified
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`VerifyPhoneVerificationDto`](#schema-verifyphoneverificationdto)

### `POST /api/v1/users/me/identity/reset-password`

- **operationId :** `resetMyPassword`
- **summary :** Send Keycloak UPDATE_PASSWORD required-action email
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/users/me/identity/verify-email`

- **operationId :** `verifyMyEmail`
- **summary :** Send Keycloak VERIFY_EMAIL required-action email
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

### `GET /api/v1/users/me/login-history`

- **operationId :** `listLoginHistory`
- **summary :** List login history for the current user
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:read`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| page | query | false |
| limit | query | false |
| cursor | query | false |

### `POST /api/v1/users/me/login-history`

- **operationId :** `recordLogin`
- **summary :** Record a login (deduped by JWT jti / session id)
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`RecordLoginDto`](#schema-recordlogindto)

### `GET /api/v1/users/me/memberships`

- **operationId :** `listMyMemberships`
- **summary :** List organization memberships for the current user
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:read`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| page | query | false |
| limit | query | false |
| cursor | query | false |

**Response `data` schema :** [`OrganizationMembershipResponseDto`](#schema-organizationmembershipresponsedto) (array + pagination)

### `GET /api/v1/users/me/notifications`

- **operationId :** `listMyNotifications`
- **summary :** List in-app notification inbox for current user
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:read`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

### `POST /api/v1/users/me/notifications`

- **operationId :** `createMyNotification`
- **summary :** Create an in-app notification for the current user (seed/self-test)
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`CreateNotificationDto`](#schema-createnotificationdto)

### `DELETE /api/v1/users/me/notifications/{notificationId}`

- **operationId :** `deleteMyNotification`
- **summary :** Delete a notification from the inbox
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| notificationId | path | true |

### `POST /api/v1/users/me/notifications/{notificationId}/read`

- **operationId :** `markNotificationRead`
- **summary :** Mark one notification as read
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| notificationId | path | true |

### `POST /api/v1/users/me/notifications/read-all`

- **operationId :** `markAllNotificationsRead`
- **summary :** Mark all notifications as read
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

### `GET /api/v1/users/me/personalization`

- **operationId :** `getMyPersonalization`
- **summary :** Get shell personalization (favorites, pins, widgets, saved views)
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:read`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

### `PATCH /api/v1/users/me/personalization`

- **operationId :** `updateMyPersonalization`
- **summary :** Patch personalization (partial merge of top-level keys)
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`UpdatePersonalizationDto`](#schema-updatepersonalizationdto)

### `GET /api/v1/users/me/preferences`

- **operationId :** `getMyPreferences`
- **summary :** Get current user preferences (resolved with tenant/org defaults)
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:read`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

### `PATCH /api/v1/users/me/preferences`

- **operationId :** `updateMyPreferences`
- **summary :** Patch current user preferences (flat dotted keys)
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`UpdateUserPreferencesDto`](#schema-updateuserpreferencesdto)

### `GET /api/v1/users/me/security`

- **operationId :** `getMySecurity`
- **summary :** Self-service security overview (compat; prefer GET /users/me/identity)
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:read`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Response `data` schema :** [`MySecurityOverviewDto`](#schema-mysecurityoverviewdto)

### `DELETE /api/v1/users/me/security/credentials/{credentialId}`

- **operationId :** `deleteMyCredential`
- **summary :** Remove an MFA/passkey credential for the current user
- **tags :** Users
- **security :** Bearer JWT
- **permission :** `users:update`
- **source :** `src/modules/identity/presentation/controllers/users.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| credentialId | path | true |

### `POST /api/v1/vouchers`

- **operationId :** `issue`
- **summary :** Issue gift voucher
- **tags :** API
- **security :** Bearer JWT
- **permission :** `vouchers:issue`
- **source :** `src/modules/vouchers/presentation/vouchers.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`IssueVoucherDto`](#schema-issuevoucherdto)

### `POST /api/v1/vouchers/{id}/activate`

- **operationId :** `activate`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `vouchers:issue`
- **source :** `src/modules/vouchers/presentation/vouchers.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `GET /api/v1/vouchers/{id}/balance`

- **operationId :** `balance`
- **summary :** Get voucher balance
- **tags :** API
- **security :** Bearer JWT
- **permission :** `vouchers:read`
- **source :** `src/modules/vouchers/presentation/vouchers.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `POST /api/v1/vouchers/{id}/cancel`

- **operationId :** `cancel`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `vouchers:cancel`
- **source :** `src/modules/vouchers/presentation/vouchers.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

**Request body schema :** [`CancelVoucherDto`](#schema-cancelvoucherdto)

### `POST /api/v1/vouchers/{id}/redeem`

- **operationId :** `redeem`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `vouchers:redeem`
- **source :** `src/modules/vouchers/presentation/vouchers.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

**Request body schema :** [`RedeemVoucherDto`](#schema-redeemvoucherdto)

### `POST /api/v1/workflow/definitions`

- **operationId :** `definition`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `workflow:write`
- **source :** `src/modules/workflow/presentation/workflow.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`UpsertWorkflowDefinitionDto`](#schema-upsertworkflowdefinitiondto)

### `POST /api/v1/workflow/instances`

- **operationId :** `start`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `workflow:write`
- **source :** `src/modules/workflow/presentation/workflow.controller.ts`
- **HTTP success :** 200

**Request body schema :** [`StartWorkflowDto`](#schema-startworkflowdto)

### `GET /api/v1/workflow/instances/{id}`

- **operationId :** `get`
- **summary :** Get workflow instance
- **tags :** API
- **security :** Bearer JWT
- **permission :** `workflow:read`
- **source :** `src/modules/workflow/presentation/workflow.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| id | path | true |

### `POST /api/v1/workflow/instances/{instanceId}/tasks/{taskId}/decide`

- **operationId :** `decide`
- **tags :** API
- **security :** Bearer JWT
- **permission :** `workflow:decide`
- **source :** `src/modules/workflow/presentation/workflow.controller.ts`
- **HTTP success :** 200

**Parameters**

| Name | In | Required |
|------|----|----------|
| instanceId | path | true |
| taskId | path | true |

**Request body schema :** [`DecideTaskDto`](#schema-decidetaskdto)

### `GET /health`

- **operationId :** `health`
- **summary :** Service health summary
- **tags :** Health
- **security :** Public
- **source :** `src/modules/platform/presentation/controllers/health.controller.ts`
- **HTTP success :** 200

### `GET /liveness`

- **operationId :** `liveness`
- **summary :** Liveness probe
- **tags :** Health
- **security :** Public
- **source :** `src/modules/platform/presentation/controllers/health.controller.ts`
- **HTTP success :** 200

### `GET /metrics`

- **operationId :** `getMetrics`
- **summary :** Prometheus metrics
- **tags :** Health
- **security :** Public
- **source :** `src/modules/platform/presentation/controllers/metrics.controller.ts`
- **HTTP success :** 200

### `GET /readiness`

- **operationId :** `readiness`
- **summary :** Readiness probe (DB, Redis, RabbitMQ)
- **tags :** Health
- **security :** Public
- **source :** `src/modules/platform/presentation/controllers/health.controller.ts`
- **HTTP success :** 200

---

## 4. Catalogue complet des schémas (`components.schemas`)

### `AcceptInvitationDto` {#schema-acceptinvitationdto}

Source : `src/modules/identity/presentation/dto/invitation.dto.ts`

```json
{
  "type": "object",
  "required": [
    "token"
  ],
  "properties": {
    "token": {
      "type": "string",
      "description": "Plain invitation token (single-use)"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/invitation.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `token` | `{"type":"string","description":"Plain invitation token (single-use)"}` | oui |

### `AddCartLineDto` {#schema-addcartlinedto}

Source : `src/modules/sales/presentation/sales.controller.ts`

```json
{
  "type": "object",
  "required": [
    "skuId",
    "quantity"
  ],
  "properties": {
    "skuId": {
      "type": "string",
      "format": "uuid"
    },
    "quantity": {
      "type": "number"
    }
  },
  "x-source-file": "src/modules/sales/presentation/sales.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `skuId` | `{"type":"string","format":"uuid"}` | oui |
| `quantity` | `{"type":"number"}` | oui |

### `AdjustStockDto` {#schema-adjuststockdto}

Source : `src/modules/inventory/presentation/dto/inventory.dto.ts`

```json
{
  "type": "object",
  "required": [
    "warehouseId",
    "skuId",
    "quantityDelta",
    "reason"
  ],
  "properties": {
    "warehouseId": {
      "type": "string",
      "format": "uuid"
    },
    "skuId": {
      "type": "string",
      "format": "uuid"
    },
    "lotId": {
      "type": "string",
      "format": "uuid"
    },
    "quantityDelta": {
      "type": "number",
      "example": -2
    },
    "reason": {
      "type": "string",
      "example": "cycle count variance"
    }
  },
  "x-source-file": "src/modules/inventory/presentation/dto/inventory.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `warehouseId` | `{"type":"string","format":"uuid"}` | oui |
| `skuId` | `{"type":"string","format":"uuid"}` | oui |
| `lotId` | `{"type":"string","format":"uuid"}` | non |
| `quantityDelta` | `{"type":"number","example":-2}` | oui |
| `reason` | `{"type":"string","example":"cycle count variance"}` | oui |

### `AllocateOrderDto` {#schema-allocateorderdto}

Source : `src/modules/inventory/presentation/dto/inventory.dto.ts`

```json
{
  "type": "object",
  "required": [
    "salesOrderId"
  ],
  "properties": {
    "salesOrderId": {
      "type": "string",
      "format": "uuid"
    },
    "strategy": {
      "type": "string",
      "example": "FEFO"
    }
  },
  "x-source-file": "src/modules/inventory/presentation/dto/inventory.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `salesOrderId` | `{"type":"string","format":"uuid"}` | oui |
| `strategy` | `{"type":"string","example":"FEFO"}` | non |

### `AnonymizeCustomerResponseDto` {#schema-anonymizecustomerresponsedto}

Source : `src/modules/customer/presentation/dto/customer-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "anonymized"
  ],
  "properties": {
    "anonymized": {
      "type": "boolean",
      "example": true
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `anonymized` | `{"type":"boolean","example":true}` | oui |

### `ApiDataWrapperDto` {#schema-apidatawrapperdto}

Source : `src/shared/swagger/api-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "data"
  ],
  "properties": {
    "data": {
      "type": "object",
      "additionalProperties": true,
      "description": "Response payload"
    }
  },
  "x-source-file": "src/shared/swagger/api-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `data` | `{"type":"object","additionalProperties":true,"description":"Response payload"}` | oui |

### `ApiErrorBodyDto` {#schema-apierrorbodydto}

Source : `src/shared/swagger/api-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "code",
    "message",
    "details",
    "requestId",
    "correlationId"
  ],
  "properties": {
    "code": {
      "type": "string",
      "example": "FORBIDDEN"
    },
    "message": {
      "type": "string",
      "example": "Access denied"
    },
    "details": {
      "type": "object",
      "additionalProperties": true
    },
    "requestId": {
      "type": "string",
      "example": "req-abc123"
    },
    "correlationId": {
      "type": "string",
      "example": "corr-abc123"
    }
  },
  "x-source-file": "src/shared/swagger/api-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `code` | `{"type":"string","example":"FORBIDDEN"}` | oui |
| `message` | `{"type":"string","example":"Access denied"}` | oui |
| `details` | `{"type":"object","additionalProperties":true}` | oui |
| `requestId` | `{"type":"string","example":"req-abc123"}` | oui |
| `correlationId` | `{"type":"string","example":"corr-abc123"}` | oui |

### `ApiErrorResponseDto` {#schema-apierrorresponsedto}

Source : `src/shared/swagger/api-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "error"
  ],
  "properties": {
    "error": {
      "$ref": "#/components/schemas/ApiErrorBodyDto"
    }
  },
  "x-source-file": "src/shared/swagger/api-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `error` | `{"$ref":"#/components/schemas/ApiErrorBodyDto"}` | oui |

### `ApplicationUserProfileResponseDto` {#schema-applicationuserprofileresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "firstName": {
      "type": "string",
      "example": "Jane"
    },
    "lastName": {
      "type": "string",
      "example": "Doe"
    },
    "displayName": {
      "type": "string",
      "example": "Jane Doe"
    },
    "preferredName": {
      "type": "string",
      "example": "Jane"
    },
    "avatarUrl": {
      "type": "string",
      "nullable": true,
      "example": "https://cdn.example.com/avatar.png"
    },
    "gender": {
      "type": "string",
      "nullable": true
    },
    "dateOfBirth": {
      "type": "string",
      "nullable": true
    },
    "biography": {
      "type": "string",
      "nullable": true
    },
    "email": {
      "type": "string",
      "nullable": true,
      "example": "jane@example.com"
    },
    "phone": {
      "type": "string",
      "nullable": true
    },
    "mobile": {
      "type": "string",
      "nullable": true
    },
    "alternatePhone": {
      "type": "string",
      "nullable": true
    },
    "address": {
      "type": "object",
      "additionalProperties": true,
      "nullable": true
    },
    "employeeNumber": {
      "type": "string",
      "nullable": true
    },
    "jobTitle": {
      "type": "string",
      "nullable": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `firstName` | `{"type":"string","example":"Jane"}` | non |
| `lastName` | `{"type":"string","example":"Doe"}` | non |
| `displayName` | `{"type":"string","example":"Jane Doe"}` | non |
| `preferredName` | `{"type":"string","example":"Jane"}` | non |
| `avatarUrl` | `{"type":"string","nullable":true,"example":"https://cdn.example.com/avatar.png"}` | non |
| `gender` | `{"type":"string","nullable":true}` | non |
| `dateOfBirth` | `{"type":"string","nullable":true}` | non |
| `biography` | `{"type":"string","nullable":true}` | non |
| `email` | `{"type":"string","nullable":true,"example":"jane@example.com"}` | non |
| `phone` | `{"type":"string","nullable":true}` | non |
| `mobile` | `{"type":"string","nullable":true}` | non |
| `alternatePhone` | `{"type":"string","nullable":true}` | non |
| `address` | `{"type":"object","additionalProperties":true,"nullable":true}` | non |
| `employeeNumber` | `{"type":"string","nullable":true}` | non |
| `jobTitle` | `{"type":"string","nullable":true}` | non |

### `ApplicationUserResponseDto` {#schema-applicationuserresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id",
    "identityId",
    "tenantId",
    "status",
    "profile",
    "createdAt",
    "updatedAt"
  ],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "identityId": {
      "type": "string",
      "description": "Keycloak subject ID"
    },
    "tenantId": {
      "type": "string",
      "format": "uuid"
    },
    "status": {
      "type": "string",
      "description": "INVITED | PENDING_ACTIVATION | ACTIVE | SUSPENDED | LOCKED | DISABLED | DELETED",
      "example": "ACTIVE"
    },
    "profile": {
      "$ref": "#/components/schemas/ApplicationUserProfileResponseDto"
    },
    "employment": {
      "$ref": "#/components/schemas/UserEmploymentResponseDto",
      "nullable": true
    },
    "organizations": {
      "type": "array",
      "items": {
        "type": "object"
      }
    },
    "lastSeenAt": {
      "type": "string",
      "format": "date-time",
      "nullable": true
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string","format":"uuid"}` | oui |
| `identityId` | `{"type":"string","description":"Keycloak subject ID"}` | oui |
| `tenantId` | `{"type":"string","format":"uuid"}` | oui |
| `status` | `{"type":"string","description":"INVITED \| PENDING_ACTIVATION \| ACTIVE \| SUSPENDED \| LOCKED \| DISABLED \| DELETED","example":"ACTIVE"}` | oui |
| `profile` | `{"$ref":"#/components/schemas/ApplicationUserProfileResponseDto"}` | oui |
| `employment` | `{"$ref":"#/components/schemas/UserEmploymentResponseDto","nullable":true}` | non |
| `organizations` | `{"type":"array","items":{"type":"object"}}` | non |
| `lastSeenAt` | `{"type":"string","format":"date-time","nullable":true}` | non |
| `createdAt` | `{"type":"string","format":"date-time"}` | oui |
| `updatedAt` | `{"type":"string","format":"date-time"}` | oui |

### `AvailabilityQueryDto` {#schema-availabilityquerydto}

Source : `src/modules/commercial-readmodels/presentation/commercial-readmodels.controller.ts`

```json
{
  "type": "object",
  "properties": {
    "skuId": {
      "type": "string",
      "format": "uuid"
    },
    "warehouseId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "x-source-file": "src/modules/commercial-readmodels/presentation/commercial-readmodels.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `skuId` | `{"type":"string","format":"uuid"}` | non |
| `warehouseId` | `{"type":"string","format":"uuid"}` | non |

### `AvailabilityResponseDto` {#schema-availabilityresponsedto}

Source : `src/modules/inventory/presentation/dto/inventory.dto.ts`

```json
{
  "type": "object",
  "required": [
    "skuId",
    "warehouseId",
    "onHand",
    "reserved",
    "allocated",
    "quarantine",
    "blocked",
    "recalled",
    "expired",
    "damaged",
    "inTransit",
    "available",
    "sellable",
    "atp",
    "physical",
    "protectedStock",
    "safetyStock",
    "confirmedInbound"
  ],
  "properties": {
    "skuId": {
      "type": "string"
    },
    "warehouseId": {
      "type": "string"
    },
    "onHand": {
      "type": "number"
    },
    "reserved": {
      "type": "number"
    },
    "allocated": {
      "type": "number"
    },
    "quarantine": {
      "type": "number"
    },
    "blocked": {
      "type": "number"
    },
    "recalled": {
      "type": "number"
    },
    "expired": {
      "type": "number"
    },
    "damaged": {
      "type": "number"
    },
    "inTransit": {
      "type": "number"
    },
    "available": {
      "type": "number"
    },
    "sellable": {
      "type": "number"
    },
    "atp": {
      "type": "number"
    },
    "ctp": {
      "type": "number",
      "nullable": true
    },
    "physical": {
      "type": "number"
    },
    "protectedStock": {
      "type": "number"
    },
    "safetyStock": {
      "type": "number"
    },
    "confirmedInbound": {
      "type": "number"
    }
  },
  "x-source-file": "src/modules/inventory/presentation/dto/inventory.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `skuId` | `{"type":"string"}` | oui |
| `warehouseId` | `{"type":"string"}` | oui |
| `onHand` | `{"type":"number"}` | oui |
| `reserved` | `{"type":"number"}` | oui |
| `allocated` | `{"type":"number"}` | oui |
| `quarantine` | `{"type":"number"}` | oui |
| `blocked` | `{"type":"number"}` | oui |
| `recalled` | `{"type":"number"}` | oui |
| `expired` | `{"type":"number"}` | oui |
| `damaged` | `{"type":"number"}` | oui |
| `inTransit` | `{"type":"number"}` | oui |
| `available` | `{"type":"number"}` | oui |
| `sellable` | `{"type":"number"}` | oui |
| `atp` | `{"type":"number"}` | oui |
| `ctp` | `{"type":"number","nullable":true}` | non |
| `physical` | `{"type":"number"}` | oui |
| `protectedStock` | `{"type":"number"}` | oui |
| `safetyStock` | `{"type":"number"}` | oui |
| `confirmedInbound` | `{"type":"number"}` | oui |

### `BulkJobDto` {#schema-bulkjobdto}

Source : `src/modules/commercial-ops/presentation/commercial-ops.controller.ts`

```json
{
  "type": "object",
  "required": [
    "jobType",
    "ids"
  ],
  "properties": {
    "jobType": {
      "$ref": "#/components/schemas/BulkJobType"
    },
    "ids": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "dryRun": {
      "type": "boolean"
    },
    "payload": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "x-source-file": "src/modules/commercial-ops/presentation/commercial-ops.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `jobType` | `{"$ref":"#/components/schemas/BulkJobType"}` | oui |
| `ids` | `{"type":"array","items":{"type":"string"}}` | oui |
| `dryRun` | `{"type":"boolean"}` | non |
| `payload` | `{"type":"object","additionalProperties":true}` | non |

### `CapabilitiesOrganizationDto` {#schema-capabilitiesorganizationdto}

Source : `src/modules/platform/presentation/dto/platform-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id",
    "name",
    "slug",
    "status"
  ],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "example": "Acme HQ"
    },
    "slug": {
      "type": "string",
      "example": "acme-hq"
    },
    "status": {
      "type": "string",
      "example": "ACTIVE"
    }
  },
  "x-source-file": "src/modules/platform/presentation/dto/platform-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string","format":"uuid"}` | oui |
| `name` | `{"type":"string","example":"Acme HQ"}` | oui |
| `slug` | `{"type":"string","example":"acme-hq"}` | oui |
| `status` | `{"type":"string","example":"ACTIVE"}` | oui |

### `CapabilitiesPlanDto` {#schema-capabilitiesplandto}

Source : `src/modules/platform/presentation/dto/platform-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "code",
    "name",
    "maxOrganizations",
    "maxUsers"
  ],
  "properties": {
    "code": {
      "type": "string",
      "example": "STANDARD"
    },
    "name": {
      "type": "string",
      "example": "Standard"
    },
    "maxOrganizations": {
      "type": "number",
      "example": 25
    },
    "maxUsers": {
      "type": "number",
      "example": 100
    }
  },
  "x-source-file": "src/modules/platform/presentation/dto/platform-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `code` | `{"type":"string","example":"STANDARD"}` | oui |
| `name` | `{"type":"string","example":"Standard"}` | oui |
| `maxOrganizations` | `{"type":"number","example":25}` | oui |
| `maxUsers` | `{"type":"number","example":100}` | oui |

### `CapabilitiesSnapshotDto` {#schema-capabilitiessnapshotdto}

Source : `src/modules/platform/presentation/dto/platform-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "modules",
    "permissions",
    "capabilityMap",
    "features",
    "organizations",
    "navigationHints"
  ],
  "properties": {
    "plan": {
      "$ref": "#/components/schemas/CapabilitiesPlanDto",
      "nullable": true
    },
    "modules": {
      "type": "object",
      "additionalProperties": true,
      "description": "Effective module enablement for the tenant plan (+ feature flags)"
    },
    "permissions": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "example": "['users:read'"
    },
    "capabilityMap": {
      "type": "object",
      "additionalProperties": true,
      "description": "Flat map of effective permission codes for frontend gating"
    },
    "features": {
      "type": "object",
      "additionalProperties": true,
      "description": "All resolved feature flags for the current context"
    },
    "organizations": {
      "type": "array",
      "items": {
        "type": "object"
      }
    },
    "defaultOrganizationId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "navigationHints": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Module keys that are enabled AND the user has at least one related permission",
      "example": "['identity'"
    }
  },
  "x-source-file": "src/modules/platform/presentation/dto/platform-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `plan` | `{"$ref":"#/components/schemas/CapabilitiesPlanDto","nullable":true}` | non |
| `modules` | `{"type":"object","additionalProperties":true,"description":"Effective module enablement for the tenant plan (+ feature flags)"}` | oui |
| `permissions` | `{"type":"array","items":{"type":"string"},"example":"['users:read'"}` | oui |
| `capabilityMap` | `{"type":"object","additionalProperties":true,"description":"Flat map of effective permission codes for frontend gating"}` | oui |
| `features` | `{"type":"object","additionalProperties":true,"description":"All resolved feature flags for the current context"}` | oui |
| `organizations` | `{"type":"array","items":{"type":"object"}}` | oui |
| `defaultOrganizationId` | `{"type":"string","format":"uuid","nullable":true}` | non |
| `navigationHints` | `{"type":"array","items":{"type":"string"},"description":"Module keys that are enabled AND the user has at least one related permission","example":"['identity'"}` | oui |

### `CapturePaymentDto` {#schema-capturepaymentdto}

Source : `src/modules/finance-commercial/presentation/finance-commercial.controller.ts`

```json
{
  "type": "object",
  "required": [
    "invoiceId",
    "amount",
    "method"
  ],
  "properties": {
    "invoiceId": {
      "type": "string",
      "format": "uuid"
    },
    "amount": {
      "type": "number"
    },
    "method": {
      "type": "string",
      "example": "CASH"
    },
    "methods": {
      "type": "object",
      "additionalProperties": true
    },
    "currency": {
      "type": "string"
    },
    "idempotencyKey": {
      "type": "string"
    }
  },
  "x-source-file": "src/modules/finance-commercial/presentation/finance-commercial.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `invoiceId` | `{"type":"string","format":"uuid"}` | oui |
| `amount` | `{"type":"number"}` | oui |
| `method` | `{"type":"string","example":"CASH"}` | oui |
| `methods` | `{"type":"object","additionalProperties":true}` | non |
| `currency` | `{"type":"string"}` | non |
| `idempotencyKey` | `{"type":"string"}` | non |

### `CheckAvailabilityDto` {#schema-checkavailabilitydto}

Source : `src/modules/inventory/presentation/dto/inventory.dto.ts`

```json
{
  "type": "object",
  "required": [
    "skuId",
    "warehouseId"
  ],
  "properties": {
    "skuId": {
      "type": "string",
      "format": "uuid"
    },
    "warehouseId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "x-source-file": "src/modules/inventory/presentation/dto/inventory.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `skuId` | `{"type":"string","format":"uuid"}` | oui |
| `warehouseId` | `{"type":"string","format":"uuid"}` | oui |

### `CheckCtpDto` {#schema-checkctpdto}

Source : `src/modules/inventory/presentation/dto/inventory.dto.ts`

```json
{
  "type": "object",
  "required": [
    "skuId",
    "warehouseId",
    "requestQty"
  ],
  "properties": {
    "skuId": {
      "type": "string",
      "format": "uuid"
    },
    "warehouseId": {
      "type": "string",
      "format": "uuid"
    },
    "requestQty": {
      "type": "number",
      "example": 50
    },
    "supplierLeadTimeDays": {
      "type": "number",
      "example": 7
    }
  },
  "x-source-file": "src/modules/inventory/presentation/dto/inventory.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `skuId` | `{"type":"string","format":"uuid"}` | oui |
| `warehouseId` | `{"type":"string","format":"uuid"}` | oui |
| `requestQty` | `{"type":"number","example":50}` | oui |
| `supplierLeadTimeDays` | `{"type":"number","example":7}` | non |

### `CheckDuplicatesCustomerDto` {#schema-checkduplicatescustomerdto}

Source : `src/modules/customer/presentation/dto/customer.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email"
    },
    "phone": {
      "type": "string"
    },
    "customerNumber": {
      "type": "string",
      "example": "CUS-000001"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `email` | `{"type":"string","format":"email"}` | non |
| `phone` | `{"type":"string"}` | non |
| `customerNumber` | `{"type":"string","example":"CUS-000001"}` | non |

### `CompletePickDto` {#schema-completepickdto}

Source : `src/modules/fulfillment/presentation/fulfillment.controller.ts`

```json
{
  "type": "object",
  "properties": {
    "linePicks": {
      "type": "array",
      "items": {
        "type": "object"
      }
    }
  },
  "x-source-file": "src/modules/fulfillment/presentation/fulfillment.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `linePicks` | `{"type":"array","items":{"type":"object"}}` | non |

### `ComputeKpiDto` {#schema-computekpidto}

Source : `src/modules/commercial-analytics/presentation/analytics.controller.ts`

```json
{
  "type": "object",
  "required": [
    "kpiKey",
    "periodStart",
    "periodEnd"
  ],
  "properties": {
    "kpiKey": {
      "$ref": "#/components/schemas/KpiKey"
    },
    "periodStart": {
      "type": "string",
      "example": "2026-01-01"
    },
    "periodEnd": {
      "type": "string",
      "example": "2026-01-31"
    }
  },
  "x-source-file": "src/modules/commercial-analytics/presentation/analytics.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `kpiKey` | `{"$ref":"#/components/schemas/KpiKey"}` | oui |
| `periodStart` | `{"type":"string","example":"2026-01-01"}` | oui |
| `periodEnd` | `{"type":"string","example":"2026-01-31"}` | oui |

### `ConvertCartDto` {#schema-convertcartdto}

Source : `src/modules/sales/presentation/sales.controller.ts`

```json
{
  "type": "object",
  "required": [
    "warehouseId"
  ],
  "properties": {
    "warehouseId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "x-source-file": "src/modules/sales/presentation/sales.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `warehouseId` | `{"type":"string","format":"uuid"}` | oui |

### `ConvertQuotationDto` {#schema-convertquotationdto}

Source : `src/modules/sales/presentation/sales.controller.ts`

```json
{
  "type": "object",
  "required": [
    "warehouseId"
  ],
  "properties": {
    "warehouseId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "x-source-file": "src/modules/sales/presentation/sales.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `warehouseId` | `{"type":"string","format":"uuid"}` | oui |

### `CopilotCalculateAtpDto` {#schema-copilotcalculateatpdto}

Source : `src/modules/commercial-copilot/presentation/commercial-copilot.controller.ts`

```json
{
  "type": "object",
  "required": [
    "skuId",
    "warehouseId"
  ],
  "properties": {
    "skuId": {
      "type": "string",
      "format": "uuid"
    },
    "warehouseId": {
      "type": "string",
      "format": "uuid"
    },
    "requestQty": {
      "type": "number"
    }
  },
  "x-source-file": "src/modules/commercial-copilot/presentation/commercial-copilot.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `skuId` | `{"type":"string","format":"uuid"}` | oui |
| `warehouseId` | `{"type":"string","format":"uuid"}` | oui |
| `requestQty` | `{"type":"number"}` | non |

### `CopilotCalculatePriceDto` {#schema-copilotcalculatepricedto}

Source : `src/modules/commercial-copilot/presentation/commercial-copilot.controller.ts`

```json
{
  "type": "object",
  "required": [
    "skuId",
    "quantity"
  ],
  "properties": {
    "skuId": {
      "type": "string",
      "format": "uuid"
    },
    "quantity": {
      "type": "number"
    },
    "customerId": {
      "type": "string",
      "format": "uuid"
    },
    "channelId": {
      "type": "string",
      "format": "uuid"
    },
    "customerGroupId": {
      "type": "string",
      "format": "uuid"
    },
    "currency": {
      "type": "string"
    }
  },
  "x-source-file": "src/modules/commercial-copilot/presentation/commercial-copilot.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `skuId` | `{"type":"string","format":"uuid"}` | oui |
| `quantity` | `{"type":"number"}` | oui |
| `customerId` | `{"type":"string","format":"uuid"}` | non |
| `channelId` | `{"type":"string","format":"uuid"}` | non |
| `customerGroupId` | `{"type":"string","format":"uuid"}` | non |
| `currency` | `{"type":"string"}` | non |

### `CreateActivityDto` {#schema-createactivitydto}

Source : `src/modules/identity/presentation/dto/user.dto.ts`

```json
{
  "type": "object",
  "required": [
    "title"
  ],
  "properties": {
    "title": {
      "type": "string",
      "example": "Switched organization"
    },
    "detail": {
      "type": "string"
    },
    "category": {
      "type": "string",
      "example": "navigation"
    },
    "href": {
      "type": "string"
    },
    "payload": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/user.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `title` | `{"type":"string","example":"Switched organization"}` | oui |
| `detail` | `{"type":"string"}` | non |
| `category` | `{"type":"string","example":"navigation"}` | non |
| `href` | `{"type":"string"}` | non |
| `payload` | `{"type":"object","additionalProperties":true}` | non |

### `CreateAddressDto` {#schema-createaddressdto}

Source : `src/modules/customer/presentation/dto/customer-b2c.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "country": {
      "type": "string"
    },
    "province": {
      "type": "string"
    },
    "city": {
      "type": "string"
    },
    "district": {
      "type": "string"
    },
    "commune": {
      "type": "string"
    },
    "street": {
      "type": "string"
    },
    "postalCode": {
      "type": "string"
    },
    "deliveryInstructions": {
      "type": "string"
    },
    "isDefault": {
      "type": "boolean"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-b2c.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `country` | `{"type":"string"}` | non |
| `province` | `{"type":"string"}` | non |
| `city` | `{"type":"string"}` | non |
| `district` | `{"type":"string"}` | non |
| `commune` | `{"type":"string"}` | non |
| `street` | `{"type":"string"}` | non |
| `postalCode` | `{"type":"string"}` | non |
| `deliveryInstructions` | `{"type":"string"}` | non |
| `isDefault` | `{"type":"boolean"}` | non |

### `CreateApiTokenDto` {#schema-createapitokendto}

Source : `src/modules/identity/presentation/dto/user.dto.ts`

```json
{
  "type": "object",
  "required": [
    "name"
  ],
  "properties": {
    "name": {
      "type": "string",
      "example": "CI bot"
    },
    "scopes": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "example": [
        "users:read"
      ]
    },
    "expiresAt": {
      "type": "string",
      "description": "ISO datetime"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/user.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `name` | `{"type":"string","example":"CI bot"}` | oui |
| `scopes` | `{"type":"array","items":{"type":"string"},"example":["users:read"]}` | non |
| `expiresAt` | `{"type":"string","description":"ISO datetime"}` | non |

### `CreateBarcodeDto` {#schema-createbarcodedto}

Source : `src/modules/catalog/presentation/dto/catalog.dto.ts`

```json
{
  "type": "object",
  "required": [
    "barcode"
  ],
  "properties": {
    "barcode": {
      "type": "string",
      "example": "3760123456789"
    },
    "symbology": {
      "type": "string",
      "example": "EAN13"
    }
  },
  "x-source-file": "src/modules/catalog/presentation/dto/catalog.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `barcode` | `{"type":"string","example":"3760123456789"}` | oui |
| `symbology` | `{"type":"string","example":"EAN13"}` | non |

### `CreateCartDto` {#schema-createcartdto}

Source : `src/modules/sales/presentation/sales.controller.ts`

```json
{
  "type": "object",
  "properties": {
    "customerId": {
      "type": "string",
      "format": "uuid"
    },
    "channelId": {
      "type": "string",
      "format": "uuid"
    },
    "cartType": {
      "type": "string"
    }
  },
  "x-source-file": "src/modules/sales/presentation/sales.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `customerId` | `{"type":"string","format":"uuid"}` | non |
| `channelId` | `{"type":"string","format":"uuid"}` | non |
| `cartType` | `{"type":"string"}` | non |

### `CreateCashRegisterDto` {#schema-createcashregisterdto}

Source : `src/modules/identity/presentation/dto/organization-ops.dto.ts`

```json
{
  "type": "object",
  "required": [
    "code",
    "name"
  ],
  "properties": {
    "code": {
      "type": "string",
      "example": "CR-01"
    },
    "name": {
      "type": "string",
      "example": "Register 1"
    },
    "posTerminalId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "status": {
      "type": "string",
      "enum": [
        "OPS_STATUSES"
      ]
    },
    "isDefault": {
      "type": "boolean"
    },
    "openingBalance": {
      "type": "number",
      "example": 0
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/organization-ops.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `code` | `{"type":"string","example":"CR-01"}` | oui |
| `name` | `{"type":"string","example":"Register 1"}` | oui |
| `posTerminalId` | `{"type":"string","format":"uuid","nullable":true}` | non |
| `status` | `{"type":"string","enum":["OPS_STATUSES"]}` | non |
| `isDefault` | `{"type":"boolean"}` | non |
| `openingBalance` | `{"type":"number","example":0}` | non |
| `metadata` | `{"type":"object","additionalProperties":true}` | non |

### `CreateConsignmentAccountDto` {#schema-createconsignmentaccountdto}

Source : `src/modules/inventory/presentation/dto/inventory.dto.ts`

```json
{
  "type": "object",
  "required": [
    "code",
    "name",
    "ownership"
  ],
  "properties": {
    "code": {
      "type": "string",
      "example": "SUP-CONS-01"
    },
    "name": {
      "type": "string",
      "example": "Supplier consignment A"
    },
    "ownership": {
      "type": "string",
      "enum": [
        "OWNED",
        "CONSIGNED",
        "CUSTOMER_OWNED",
        "SUPPLIER_OWNED",
        "THIRD_PARTY"
      ],
      "example": "SUPPLIER_OWNED"
    },
    "partnerRef": {
      "type": "string"
    },
    "isSellable": {
      "type": "boolean",
      "example": true
    }
  },
  "x-source-file": "src/modules/inventory/presentation/dto/inventory.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `code` | `{"type":"string","example":"SUP-CONS-01"}` | oui |
| `name` | `{"type":"string","example":"Supplier consignment A"}` | oui |
| `ownership` | `{"type":"string","enum":["OWNED","CONSIGNED","CUSTOMER_OWNED","SUPPLIER_OWNED","THIRD_PARTY"],"example":"SUPPLIER_OWNED"}` | oui |
| `partnerRef` | `{"type":"string"}` | non |
| `isSellable` | `{"type":"boolean","example":true}` | non |

### `CreateCustomerContactDto` {#schema-createcustomercontactdto}

Source : `src/modules/customer/presentation/dto/customer.dto.ts`

```json
{
  "type": "object",
  "required": [
    "fullName"
  ],
  "properties": {
    "fullName": {
      "type": "string",
      "example": "Jane Doe"
    },
    "role": {
      "type": "string",
      "example": "Procurement"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "phone": {
      "type": "string"
    },
    "isPrimary": {
      "type": "boolean",
      "example": false
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `fullName` | `{"type":"string","example":"Jane Doe"}` | oui |
| `role` | `{"type":"string","example":"Procurement"}` | non |
| `email` | `{"type":"string","format":"email"}` | non |
| `phone` | `{"type":"string"}` | non |
| `isPrimary` | `{"type":"boolean","example":false}` | non |

### `CreateCustomerDto` {#schema-createcustomerdto}

Source : `src/modules/customer/presentation/dto/customer.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "example": "client@example.com"
    },
    "phone": {
      "type": "string",
      "example": "+25779123456"
    },
    "profile": {
      "type": "object",
      "additionalProperties": true
    },
    "organizationId": {
      "type": "string",
      "format": "uuid",
      "description": "Link to organization on creation"
    },
    "creditLimit": {
      "type": "number",
      "example": 5000
    },
    "paymentTerms": {
      "type": "string",
      "example": "NET30"
    },
    "currencyCode": {
      "type": "string",
      "example": "USD"
    },
    "taxProfileCode": {
      "type": "string",
      "example": "STANDARD"
    },
    "customerGroupCode": {
      "type": "string",
      "example": "RETAIL"
    },
    "creditHold": {
      "type": "boolean",
      "example": false
    },
    "category": {
      "type": "string",
      "example": "PREMIUM"
    },
    "segment": {
      "type": "string",
      "example": "VIP"
    },
    "priceGroupCode": {
      "type": "string",
      "example": "PG-STD"
    },
    "riskLevel": {
      "type": "string",
      "enum": [
        "LOW",
        "NORMAL",
        "ELEVATED",
        "HIGH",
        "CRITICAL"
      ]
    },
    "riskScore": {
      "type": "number",
      "example": 0
    },
    "defaultBillingAddressId": {
      "type": "string",
      "format": "uuid"
    },
    "defaultShippingAddressId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `email` | `{"type":"string","format":"email","example":"client@example.com"}` | non |
| `phone` | `{"type":"string","example":"+25779123456"}` | non |
| `profile` | `{"type":"object","additionalProperties":true}` | non |
| `organizationId` | `{"type":"string","format":"uuid","description":"Link to organization on creation"}` | non |
| `creditLimit` | `{"type":"number","example":5000}` | non |
| `paymentTerms` | `{"type":"string","example":"NET30"}` | non |
| `currencyCode` | `{"type":"string","example":"USD"}` | non |
| `taxProfileCode` | `{"type":"string","example":"STANDARD"}` | non |
| `customerGroupCode` | `{"type":"string","example":"RETAIL"}` | non |
| `creditHold` | `{"type":"boolean","example":false}` | non |
| `category` | `{"type":"string","example":"PREMIUM"}` | non |
| `segment` | `{"type":"string","example":"VIP"}` | non |
| `priceGroupCode` | `{"type":"string","example":"PG-STD"}` | non |
| `riskLevel` | `{"type":"string","enum":["LOW","NORMAL","ELEVATED","HIGH","CRITICAL"]}` | non |
| `riskScore` | `{"type":"number","example":0}` | non |
| `defaultBillingAddressId` | `{"type":"string","format":"uuid"}` | non |
| `defaultShippingAddressId` | `{"type":"string","format":"uuid"}` | non |

### `CreateCustomerGroupDto` {#schema-createcustomergroupdto}

Source : `src/modules/sales/presentation/sales.controller.ts`

```json
{
  "type": "object",
  "required": [
    "code",
    "name"
  ],
  "properties": {
    "code": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "allocationPriority": {
      "type": "number"
    },
    "discountPercent": {
      "type": "number"
    },
    "creditLimitDefault": {
      "type": "number"
    },
    "paymentTermsDefault": {
      "type": "string"
    },
    "promotionEligible": {
      "type": "boolean"
    },
    "slaHours": {
      "type": "number"
    },
    "deliveryPriority": {
      "type": "number"
    }
  },
  "x-source-file": "src/modules/sales/presentation/sales.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `code` | `{"type":"string"}` | oui |
| `name` | `{"type":"string"}` | oui |
| `allocationPriority` | `{"type":"number"}` | non |
| `discountPercent` | `{"type":"number"}` | non |
| `creditLimitDefault` | `{"type":"number"}` | non |
| `paymentTermsDefault` | `{"type":"string"}` | non |
| `promotionEligible` | `{"type":"boolean"}` | non |
| `slaHours` | `{"type":"number"}` | non |
| `deliveryPriority` | `{"type":"number"}` | non |

### `CreateCustomerInteractionDto` {#schema-createcustomerinteractiondto}

Source : `src/modules/customer/presentation/dto/customer.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "organizationId": {
      "type": "string",
      "format": "uuid"
    },
    "subject": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "channel": {
      "type": "string"
    },
    "occurredAt": {
      "type": "string",
      "description": "ISO-8601 timestamp"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `organizationId` | `{"type":"string","format":"uuid"}` | non |
| `subject` | `{"type":"string"}` | non |
| `description` | `{"type":"string"}` | non |
| `channel` | `{"type":"string"}` | non |
| `occurredAt` | `{"type":"string","description":"ISO-8601 timestamp"}` | non |

### `CreateFulfillmentPlanDto` {#schema-createfulfillmentplandto}

Source : `src/modules/fulfillment/presentation/fulfillment.controller.ts`

```json
{
  "type": "object",
  "properties": {
    "warehouseAtp": {
      "type": "array",
      "items": {
        "type": "object"
      }
    }
  },
  "x-source-file": "src/modules/fulfillment/presentation/fulfillment.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `warehouseAtp` | `{"type":"array","items":{"type":"object"}}` | non |

### `CreateGuestCustomerDto` {#schema-createguestcustomerdto}

Source : `src/modules/customer/presentation/dto/customer.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "organizationId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `organizationId` | `{"type":"string","format":"uuid"}` | non |

### `CreateIdentityProviderDto` {#schema-createidentityproviderdto}

Source : `src/modules/identity/presentation/dto/security.dto.ts`

```json
{
  "type": "object",
  "required": [
    "alias",
    "providerId"
  ],
  "properties": {
    "alias": {
      "type": "string",
      "example": "google"
    },
    "providerId": {
      "type": "string",
      "description": "Keycloak provider id: google, microsoft, github, oidc, saml, …",
      "example": "google"
    },
    "displayName": {
      "type": "string",
      "example": "Google"
    },
    "enabled": {
      "type": "boolean"
    },
    "linkOnly": {
      "type": "boolean"
    },
    "config": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/security.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `alias` | `{"type":"string","example":"google"}` | oui |
| `providerId` | `{"type":"string","description":"Keycloak provider id: google, microsoft, github, oidc, saml, …","example":"google"}` | oui |
| `displayName` | `{"type":"string","example":"Google"}` | non |
| `enabled` | `{"type":"boolean"}` | non |
| `linkOnly` | `{"type":"boolean"}` | non |
| `config` | `{"type":"object","additionalProperties":true}` | non |

### `CreateInvitationDto` {#schema-createinvitationdto}

Source : `src/modules/identity/presentation/dto/invitation.dto.ts`

```json
{
  "type": "object",
  "required": [
    "organizationId",
    "email"
  ],
  "properties": {
    "organizationId": {
      "type": "string",
      "format": "uuid"
    },
    "email": {
      "type": "string",
      "format": "email",
      "example": "new.user@company.com"
    },
    "roles": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "example": [
        "viewer"
      ]
    },
    "permissions": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "example": []
    },
    "expiresInHours": {
      "type": "number",
      "description": "Hours until invitation expires",
      "example": 72
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/invitation.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `organizationId` | `{"type":"string","format":"uuid"}` | oui |
| `email` | `{"type":"string","format":"email","example":"new.user@company.com"}` | oui |
| `roles` | `{"type":"array","items":{"type":"string"},"example":["viewer"]}` | non |
| `permissions` | `{"type":"array","items":{"type":"string"},"example":[]}` | non |
| `expiresInHours` | `{"type":"number","description":"Hours until invitation expires","example":72}` | non |

### `CreateInvoiceDto` {#schema-createinvoicedto}

Source : `src/modules/finance-commercial/presentation/finance-commercial.controller.ts`

```json
{
  "type": "object",
  "required": [
    "salesOrderId"
  ],
  "properties": {
    "salesOrderId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "x-source-file": "src/modules/finance-commercial/presentation/finance-commercial.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `salesOrderId` | `{"type":"string","format":"uuid"}` | oui |

### `CreateKitDto` {#schema-createkitdto}

Source : `src/modules/catalog/presentation/catalog.controller.ts`

```json
{
  "type": "object",
  "properties": {
    "components": {
      "type": "array",
      "items": {
        "type": "object"
      },
      "example": "EXPLODED"
    }
  },
  "x-source-file": "src/modules/catalog/presentation/catalog.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `components` | `{"type":"array","items":{"type":"object"},"example":"EXPLODED"}` | non |

### `CreateNotificationDto` {#schema-createnotificationdto}

Source : `src/modules/identity/presentation/dto/user.dto.ts`

```json
{
  "type": "object",
  "required": [
    "title"
  ],
  "properties": {
    "title": {
      "type": "string",
      "example": "Welcome"
    },
    "body": {
      "type": "string"
    },
    "category": {
      "type": "string",
      "example": "system"
    },
    "priority": {
      "type": "string",
      "example": "normal"
    },
    "payload": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/user.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `title` | `{"type":"string","example":"Welcome"}` | oui |
| `body` | `{"type":"string"}` | non |
| `category` | `{"type":"string","example":"system"}` | non |
| `priority` | `{"type":"string","example":"normal"}` | non |
| `payload` | `{"type":"object","additionalProperties":true}` | non |

### `CreateOrganizationDto` {#schema-createorganizationdto}

Source : `src/modules/identity/presentation/dto/organization.dto.ts`

```json
{
  "type": "object",
  "required": [
    "name",
    "slug"
  ],
  "properties": {
    "name": {
      "type": "string",
      "example": "Branch Paris"
    },
    "slug": {
      "type": "string",
      "description": "URL-safe slug",
      "example": "branch-paris"
    },
    "code": {
      "type": "string",
      "example": "PAR-01"
    },
    "parentId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "isPrimary": {
      "type": "boolean"
    },
    "description": {
      "type": "string"
    },
    "timezone": {
      "type": "string",
      "example": "Europe/Paris"
    },
    "locale": {
      "type": "string",
      "example": "fr"
    },
    "address": {
      "$ref": "#/components/schemas/OrganizationAddressDto"
    },
    "contact": {
      "$ref": "#/components/schemas/OrganizationContactDto"
    },
    "openingHours": {
      "$ref": "#/components/schemas/OpeningHoursDto"
    },
    "operationalSettings": {
      "$ref": "#/components/schemas/OperationalSettingsDto"
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/organization.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `name` | `{"type":"string","example":"Branch Paris"}` | oui |
| `slug` | `{"type":"string","description":"URL-safe slug","example":"branch-paris"}` | oui |
| `code` | `{"type":"string","example":"PAR-01"}` | non |
| `parentId` | `{"type":"string","format":"uuid","nullable":true}` | non |
| `isPrimary` | `{"type":"boolean"}` | non |
| `description` | `{"type":"string"}` | non |
| `timezone` | `{"type":"string","example":"Europe/Paris"}` | non |
| `locale` | `{"type":"string","example":"fr"}` | non |
| `address` | `{"$ref":"#/components/schemas/OrganizationAddressDto"}` | non |
| `contact` | `{"$ref":"#/components/schemas/OrganizationContactDto"}` | non |
| `openingHours` | `{"$ref":"#/components/schemas/OpeningHoursDto"}` | non |
| `operationalSettings` | `{"$ref":"#/components/schemas/OperationalSettingsDto"}` | non |
| `metadata` | `{"type":"object","additionalProperties":true}` | non |

### `CreatePackageDto` {#schema-createpackagedto}

Source : `src/modules/fulfillment/presentation/fulfillment.controller.ts`

```json
{
  "type": "object",
  "properties": {
    "lines": {
      "type": "array",
      "items": {
        "type": "object"
      }
    }
  },
  "x-source-file": "src/modules/fulfillment/presentation/fulfillment.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `lines` | `{"type":"array","items":{"type":"object"}}` | non |

### `CreatePosTerminalDto` {#schema-createposterminaldto}

Source : `src/modules/identity/presentation/dto/organization-ops.dto.ts`

```json
{
  "type": "object",
  "required": [
    "code",
    "name"
  ],
  "properties": {
    "code": {
      "type": "string",
      "example": "POS-01"
    },
    "name": {
      "type": "string",
      "example": "Front counter"
    },
    "warehouseId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "status": {
      "type": "string",
      "enum": [
        "OPS_STATUSES"
      ]
    },
    "isDefault": {
      "type": "boolean"
    },
    "offlineEnabled": {
      "type": "boolean"
    },
    "receiptTemplate": {
      "type": "string",
      "nullable": true
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/organization-ops.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `code` | `{"type":"string","example":"POS-01"}` | oui |
| `name` | `{"type":"string","example":"Front counter"}` | oui |
| `warehouseId` | `{"type":"string","format":"uuid","nullable":true}` | non |
| `status` | `{"type":"string","enum":["OPS_STATUSES"]}` | non |
| `isDefault` | `{"type":"boolean"}` | non |
| `offlineEnabled` | `{"type":"boolean"}` | non |
| `receiptTemplate` | `{"type":"string","nullable":true}` | non |
| `metadata` | `{"type":"object","additionalProperties":true}` | non |

### `CreateProductDto` {#schema-createproductdto}

Source : `src/modules/catalog/presentation/dto/catalog.dto.ts`

```json
{
  "type": "object",
  "required": [
    "code",
    "name"
  ],
  "properties": {
    "code": {
      "type": "string",
      "example": "PARA-500"
    },
    "name": {
      "type": "string",
      "example": "Paracetamol"
    },
    "description": {
      "type": "string"
    },
    "taxCategory": {
      "type": "string",
      "example": "STANDARD"
    },
    "lotTrackingRequired": {
      "type": "boolean"
    },
    "serialTrackingRequired": {
      "type": "boolean"
    },
    "coldChainRequired": {
      "type": "boolean"
    },
    "controlledSubstance": {
      "type": "boolean"
    },
    "controlledSchedule": {
      "type": "string"
    },
    "requiresPrescription": {
      "type": "boolean"
    },
    "minShelfLifeDays": {
      "type": "number"
    },
    "storageConditions": {
      "type": "object",
      "additionalProperties": true
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    },
    "skus": {
      "type": "array",
      "items": {
        "type": "object"
      }
    }
  },
  "x-source-file": "src/modules/catalog/presentation/dto/catalog.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `code` | `{"type":"string","example":"PARA-500"}` | oui |
| `name` | `{"type":"string","example":"Paracetamol"}` | oui |
| `description` | `{"type":"string"}` | non |
| `taxCategory` | `{"type":"string","example":"STANDARD"}` | non |
| `lotTrackingRequired` | `{"type":"boolean"}` | non |
| `serialTrackingRequired` | `{"type":"boolean"}` | non |
| `coldChainRequired` | `{"type":"boolean"}` | non |
| `controlledSubstance` | `{"type":"boolean"}` | non |
| `controlledSchedule` | `{"type":"string"}` | non |
| `requiresPrescription` | `{"type":"boolean"}` | non |
| `minShelfLifeDays` | `{"type":"number"}` | non |
| `storageConditions` | `{"type":"object","additionalProperties":true}` | non |
| `metadata` | `{"type":"object","additionalProperties":true}` | non |
| `skus` | `{"type":"array","items":{"type":"object"}}` | non |

### `CreateQuotationDto` {#schema-createquotationdto}

Source : `src/modules/sales/presentation/sales.controller.ts`

```json
{
  "type": "object",
  "required": [
    "customerId",
    "lines"
  ],
  "properties": {
    "customerId": {
      "type": "string",
      "format": "uuid"
    },
    "channelId": {
      "type": "string",
      "format": "uuid"
    },
    "notes": {
      "type": "string"
    },
    "conditions": {
      "type": "string"
    },
    "validUntil": {
      "type": "string"
    },
    "approvalRequired": {
      "type": "boolean"
    },
    "lines": {
      "type": "array",
      "items": {
        "type": "object"
      }
    }
  },
  "x-source-file": "src/modules/sales/presentation/sales.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `customerId` | `{"type":"string","format":"uuid"}` | oui |
| `channelId` | `{"type":"string","format":"uuid"}` | non |
| `notes` | `{"type":"string"}` | non |
| `conditions` | `{"type":"string"}` | non |
| `validUntil` | `{"type":"string"}` | non |
| `approvalRequired` | `{"type":"boolean"}` | non |
| `lines` | `{"type":"array","items":{"type":"object"}}` | oui |

### `CreateRecallDto` {#schema-createrecalldto}

Source : `src/modules/inventory/presentation/dto/inventory.dto.ts`

```json
{
  "type": "object",
  "required": [
    "reason"
  ],
  "properties": {
    "reason": {
      "type": "string"
    },
    "productId": {
      "type": "string",
      "format": "uuid"
    },
    "skuId": {
      "type": "string",
      "format": "uuid"
    },
    "lotId": {
      "type": "string",
      "format": "uuid"
    },
    "markProductRecalled": {
      "type": "boolean",
      "description": "When true (default for product-level), sets product/SKU status to RECALLED"
    },
    "recallNumber": {
      "type": "string"
    }
  },
  "x-source-file": "src/modules/inventory/presentation/dto/inventory.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `reason` | `{"type":"string"}` | oui |
| `productId` | `{"type":"string","format":"uuid"}` | non |
| `skuId` | `{"type":"string","format":"uuid"}` | non |
| `lotId` | `{"type":"string","format":"uuid"}` | non |
| `markProductRecalled` | `{"type":"boolean","description":"When true (default for product-level), sets product/SKU status to RECALLED"}` | non |
| `recallNumber` | `{"type":"string"}` | non |

### `CreateReturnDto` {#schema-createreturndto}

Source : `src/modules/returns/presentation/returns.controller.ts`

```json
{
  "type": "object",
  "properties": {
    "lines": {
      "type": "array",
      "items": {
        "type": "object"
      },
      "example": "CUSTOMER"
    }
  },
  "x-source-file": "src/modules/returns/presentation/returns.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `lines` | `{"type":"array","items":{"type":"object"},"example":"CUSTOMER"}` | non |

### `CreateRoleDto` {#schema-createroledto}

Source : `src/modules/identity/presentation/dto/role.dto.ts`

```json
{
  "type": "object",
  "required": [
    "name",
    "scope"
  ],
  "properties": {
    "name": {
      "type": "string",
      "example": "branch-manager"
    },
    "scope": {
      "type": "string",
      "enum": [
        "tenant",
        "organization"
      ]
    },
    "description": {
      "type": "string"
    },
    "permissions": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "example": [
        "organizations:read"
      ]
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/role.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `name` | `{"type":"string","example":"branch-manager"}` | oui |
| `scope` | `{"type":"string","enum":["tenant","organization"]}` | oui |
| `description` | `{"type":"string"}` | non |
| `permissions` | `{"type":"array","items":{"type":"string"},"example":["organizations:read"]}` | non |

### `CreateSalesOrderDto` {#schema-createsalesorderdto}

Source : `src/modules/sales/presentation/sales.controller.ts`

```json
{
  "type": "object",
  "required": [
    "customerId",
    "lines"
  ],
  "properties": {
    "customerId": {
      "type": "string",
      "format": "uuid"
    },
    "warehouseId": {
      "type": "string",
      "format": "uuid"
    },
    "channelId": {
      "type": "string",
      "format": "uuid"
    },
    "originChannelId": {
      "type": "string",
      "format": "uuid"
    },
    "fulfillChannelId": {
      "type": "string",
      "format": "uuid"
    },
    "fulfillWarehouseId": {
      "type": "string",
      "format": "uuid"
    },
    "omnichannelMode": {
      "type": "string"
    },
    "currency": {
      "type": "string"
    },
    "notes": {
      "type": "string"
    },
    "shippingAddress": {
      "type": "object",
      "additionalProperties": true
    },
    "lines": {
      "type": "array",
      "items": {
        "type": "object"
      }
    }
  },
  "x-source-file": "src/modules/sales/presentation/sales.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `customerId` | `{"type":"string","format":"uuid"}` | oui |
| `warehouseId` | `{"type":"string","format":"uuid"}` | non |
| `channelId` | `{"type":"string","format":"uuid"}` | non |
| `originChannelId` | `{"type":"string","format":"uuid"}` | non |
| `fulfillChannelId` | `{"type":"string","format":"uuid"}` | non |
| `fulfillWarehouseId` | `{"type":"string","format":"uuid"}` | non |
| `omnichannelMode` | `{"type":"string"}` | non |
| `currency` | `{"type":"string"}` | non |
| `notes` | `{"type":"string"}` | non |
| `shippingAddress` | `{"type":"object","additionalProperties":true}` | non |
| `lines` | `{"type":"array","items":{"type":"object"}}` | oui |

### `CreateShipmentDto` {#schema-createshipmentdto}

Source : `src/modules/fulfillment/presentation/fulfillment.controller.ts`

```json
{
  "type": "object",
  "properties": {
    "deliveryAddress": {
      "type": "object",
      "format": "uuid",
      "additionalProperties": true
    }
  },
  "x-source-file": "src/modules/fulfillment/presentation/fulfillment.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `deliveryAddress` | `{"type":"object","format":"uuid","additionalProperties":true}` | non |

### `CreateSkuDto` {#schema-createskudto}

Source : `src/modules/catalog/presentation/dto/catalog.dto.ts`

```json
{
  "type": "object",
  "required": [
    "sku",
    "name"
  ],
  "properties": {
    "sku": {
      "type": "string",
      "example": "SKU-PARA-500"
    },
    "name": {
      "type": "string",
      "example": "Paracetamol 500mg"
    },
    "uom": {
      "type": "string",
      "example": "EA"
    },
    "barcodes": {
      "type": "array",
      "items": {
        "type": "object"
      }
    }
  },
  "x-source-file": "src/modules/catalog/presentation/dto/catalog.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `sku` | `{"type":"string","example":"SKU-PARA-500"}` | oui |
| `name` | `{"type":"string","example":"Paracetamol 500mg"}` | oui |
| `uom` | `{"type":"string","example":"EA"}` | non |
| `barcodes` | `{"type":"array","items":{"type":"object"}}` | non |

### `CreateTenantDomainDto` {#schema-createtenantdomaindto}

Source : `src/modules/platform/presentation/controllers/tenant-domains.controller.ts`

```json
{
  "type": "object",
  "required": [
    "hostname"
  ],
  "properties": {
    "hostname": {
      "type": "string",
      "description": "Fully-qualified hostname to register",
      "example": "acme.example.com"
    }
  },
  "x-source-file": "src/modules/platform/presentation/controllers/tenant-domains.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `hostname` | `{"type":"string","description":"Fully-qualified hostname to register","example":"acme.example.com"}` | oui |

### `CreateWarehouseDto` {#schema-createwarehousedto}

Source : `src/modules/identity/presentation/dto/organization-ops.dto.ts`

```json
{
  "type": "object",
  "required": [
    "code",
    "name"
  ],
  "properties": {
    "code": {
      "type": "string",
      "example": "WH-MAIN"
    },
    "name": {
      "type": "string",
      "example": "Main warehouse"
    },
    "status": {
      "type": "string",
      "enum": [
        "OPS_STATUSES"
      ]
    },
    "isDefault": {
      "type": "boolean"
    },
    "address": {
      "type": "object",
      "additionalProperties": true
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/organization-ops.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `code` | `{"type":"string","example":"WH-MAIN"}` | oui |
| `name` | `{"type":"string","example":"Main warehouse"}` | oui |
| `status` | `{"type":"string","enum":["OPS_STATUSES"]}` | non |
| `isDefault` | `{"type":"boolean"}` | non |
| `address` | `{"type":"object","additionalProperties":true}` | non |
| `metadata` | `{"type":"object","additionalProperties":true}` | non |

### `CreateWebhookDto` {#schema-createwebhookdto}

Source : `src/modules/commercial-webhooks/presentation/commercial-webhooks.controller.ts`

```json
{
  "type": "object",
  "required": [
    "url",
    "events"
  ],
  "properties": {
    "url": {
      "type": "string",
      "example": "https://example.com/hooks/commercial"
    },
    "events": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "example": "['order.confirmed'"
    },
    "secretRef": {
      "type": "string",
      "description": "Secret or secret_ref for HMAC-SHA256"
    },
    "maxRetries": {
      "type": "number"
    },
    "backoffSeconds": {
      "type": "number"
    }
  },
  "x-source-file": "src/modules/commercial-webhooks/presentation/commercial-webhooks.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `url` | `{"type":"string","example":"https://example.com/hooks/commercial"}` | oui |
| `events` | `{"type":"array","items":{"type":"string"},"example":"['order.confirmed'"}` | oui |
| `secretRef` | `{"type":"string","description":"Secret or secret_ref for HMAC-SHA256"}` | non |
| `maxRetries` | `{"type":"number"}` | non |
| `backoffSeconds` | `{"type":"number"}` | non |

### `CreateWorkflowDto` {#schema-createworkflowdto}

Source : `src/modules/identity/presentation/dto/organization-ops.dto.ts`

```json
{
  "type": "object",
  "required": [
    "code",
    "name",
    "kind"
  ],
  "properties": {
    "code": {
      "type": "string",
      "example": "PO-APPROVAL"
    },
    "name": {
      "type": "string",
      "example": "Purchase order approval"
    },
    "kind": {
      "type": "string",
      "enum": [
        "WORKFLOW_KINDS"
      ]
    },
    "status": {
      "type": "string",
      "enum": [
        "OPS_STATUSES"
      ]
    },
    "conditions": {
      "type": "object",
      "additionalProperties": true
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    },
    "steps": {
      "type": "array",
      "items": {
        "type": "object"
      }
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/organization-ops.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `code` | `{"type":"string","example":"PO-APPROVAL"}` | oui |
| `name` | `{"type":"string","example":"Purchase order approval"}` | oui |
| `kind` | `{"type":"string","enum":["WORKFLOW_KINDS"]}` | oui |
| `status` | `{"type":"string","enum":["OPS_STATUSES"]}` | non |
| `conditions` | `{"type":"object","additionalProperties":true}` | non |
| `metadata` | `{"type":"object","additionalProperties":true}` | non |
| `steps` | `{"type":"array","items":{"type":"object"}}` | non |

### `Customer360ResponseDto` {#schema-customer360responsedto}

Source : `src/modules/customer/presentation/dto/customer-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "aggregate",
    "consents",
    "addresses",
    "interactions",
    "timeline"
  ],
  "properties": {
    "aggregate": {
      "$ref": "#/components/schemas/CustomerAggregateResponseDto"
    },
    "consents": {
      "type": "array",
      "items": {
        "type": "object"
      }
    },
    "addresses": {
      "type": "array",
      "items": {
        "type": "object"
      }
    },
    "interactions": {
      "type": "array",
      "items": {
        "type": "object"
      }
    },
    "timeline": {
      "type": "object",
      "additionalProperties": true,
      "description": "Timeline events"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `aggregate` | `{"$ref":"#/components/schemas/CustomerAggregateResponseDto"}` | oui |
| `consents` | `{"type":"array","items":{"type":"object"}}` | oui |
| `addresses` | `{"type":"array","items":{"type":"object"}}` | oui |
| `interactions` | `{"type":"array","items":{"type":"object"}}` | oui |
| `timeline` | `{"type":"object","additionalProperties":true,"description":"Timeline events"}` | oui |

### `CustomerAddressResponseDto` {#schema-customeraddressresponsedto}

Source : `src/modules/customer/presentation/dto/customer-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id",
    "globalCustomerId",
    "isDefault",
    "metadata",
    "createdAt",
    "updatedAt"
  ],
  "properties": {
    "id": {
      "type": "string",
      "example": "address-uuid"
    },
    "globalCustomerId": {
      "type": "string",
      "example": "global-customer-uuid"
    },
    "country": {
      "type": "string",
      "example": "BI"
    },
    "province": {
      "type": "string",
      "example": "Bujumbura Mairie"
    },
    "city": {
      "type": "string",
      "example": "Bujumbura"
    },
    "district": {
      "type": "string",
      "example": "Mukaza"
    },
    "commune": {
      "type": "string",
      "example": "Rohero"
    },
    "street": {
      "type": "string",
      "example": "Av. de la Mission 10"
    },
    "postalCode": {
      "type": "string",
      "example": null
    },
    "latitude": {
      "type": "number",
      "example": null
    },
    "longitude": {
      "type": "number",
      "example": null
    },
    "deliveryInstructions": {
      "type": "string",
      "example": "Leave at the gate"
    },
    "isDefault": {
      "type": "boolean",
      "example": true
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    },
    "createdAt": {
      "type": "string",
      "example": "2026-01-01T00:00:00.000Z"
    },
    "updatedAt": {
      "type": "string",
      "example": "2026-01-01T00:00:00.000Z"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string","example":"address-uuid"}` | oui |
| `globalCustomerId` | `{"type":"string","example":"global-customer-uuid"}` | oui |
| `country` | `{"type":"string","example":"BI"}` | non |
| `province` | `{"type":"string","example":"Bujumbura Mairie"}` | non |
| `city` | `{"type":"string","example":"Bujumbura"}` | non |
| `district` | `{"type":"string","example":"Mukaza"}` | non |
| `commune` | `{"type":"string","example":"Rohero"}` | non |
| `street` | `{"type":"string","example":"Av. de la Mission 10"}` | non |
| `postalCode` | `{"type":"string","example":null}` | non |
| `latitude` | `{"type":"number","example":null}` | non |
| `longitude` | `{"type":"number","example":null}` | non |
| `deliveryInstructions` | `{"type":"string","example":"Leave at the gate"}` | non |
| `isDefault` | `{"type":"boolean","example":true}` | oui |
| `metadata` | `{"type":"object","additionalProperties":true}` | oui |
| `createdAt` | `{"type":"string","example":"2026-01-01T00:00:00.000Z"}` | oui |
| `updatedAt` | `{"type":"string","example":"2026-01-01T00:00:00.000Z"}` | oui |

### `CustomerAggregateResponseDto` {#schema-customeraggregateresponsedto}

Source : `src/modules/customer/presentation/dto/customer-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "tenant",
    "global"
  ],
  "properties": {
    "tenant": {
      "$ref": "#/components/schemas/TenantCustomerResponseDto"
    },
    "global": {
      "$ref": "#/components/schemas/GlobalCustomerResponseDto"
    },
    "identity": {
      "$ref": "#/components/schemas/GlobalCustomerIdentityResponseDto"
    },
    "organizations": {
      "type": "array",
      "items": {
        "type": "object"
      }
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `tenant` | `{"$ref":"#/components/schemas/TenantCustomerResponseDto"}` | oui |
| `global` | `{"$ref":"#/components/schemas/GlobalCustomerResponseDto"}` | oui |
| `identity` | `{"$ref":"#/components/schemas/GlobalCustomerIdentityResponseDto"}` | non |
| `organizations` | `{"type":"array","items":{"type":"object"}}` | non |

### `CustomerConsentResponseDto` {#schema-customerconsentresponsedto}

Source : `src/modules/customer/presentation/dto/customer-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id",
    "globalCustomerId",
    "purpose",
    "policyVersion",
    "status",
    "metadata",
    "createdAt"
  ],
  "properties": {
    "id": {
      "type": "string",
      "example": "consent-uuid"
    },
    "globalCustomerId": {
      "type": "string",
      "example": "global-customer-uuid"
    },
    "purpose": {
      "type": "string",
      "enum": [
        "ACCOUNT",
        "ORDER_PROCESSING",
        "MARKETING",
        "ANALYTICS",
        "PERSONALIZATION",
        "LOYALTY",
        "NOTIFICATIONS",
        "SENSITIVE_DATA_PROCESSING"
      ],
      "example": "MARKETING"
    },
    "policyVersion": {
      "type": "string",
      "example": "2026-01"
    },
    "status": {
      "type": "string",
      "enum": [
        "GRANTED",
        "WITHDRAWN"
      ],
      "example": "GRANTED"
    },
    "grantedAt": {
      "type": "string",
      "example": "2026-01-01T00:00:00.000Z"
    },
    "withdrawnAt": {
      "type": "string",
      "example": null
    },
    "source": {
      "type": "string",
      "example": "WEB"
    },
    "channel": {
      "type": "string",
      "example": "online"
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    },
    "createdAt": {
      "type": "string",
      "example": "2026-01-01T00:00:00.000Z"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string","example":"consent-uuid"}` | oui |
| `globalCustomerId` | `{"type":"string","example":"global-customer-uuid"}` | oui |
| `purpose` | `{"type":"string","enum":["ACCOUNT","ORDER_PROCESSING","MARKETING","ANALYTICS","PERSONALIZATION","LOYALTY","NOTIFICATIONS","SENSITIVE_DATA_PROCESSING"],"example":"MARKETING"}` | oui |
| `policyVersion` | `{"type":"string","example":"2026-01"}` | oui |
| `status` | `{"type":"string","enum":["GRANTED","WITHDRAWN"],"example":"GRANTED"}` | oui |
| `grantedAt` | `{"type":"string","example":"2026-01-01T00:00:00.000Z"}` | non |
| `withdrawnAt` | `{"type":"string","example":null}` | non |
| `source` | `{"type":"string","example":"WEB"}` | non |
| `channel` | `{"type":"string","example":"online"}` | non |
| `metadata` | `{"type":"object","additionalProperties":true}` | oui |
| `createdAt` | `{"type":"string","example":"2026-01-01T00:00:00.000Z"}` | oui |

### `CustomerContactResponseDto` {#schema-customercontactresponsedto}

Source : `src/modules/customer/presentation/dto/customer-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id",
    "tenantId",
    "tenantCustomerId",
    "fullName",
    "isPrimary",
    "metadata",
    "createdAt",
    "updatedAt"
  ],
  "properties": {
    "id": {
      "type": "string"
    },
    "tenantId": {
      "type": "string"
    },
    "tenantCustomerId": {
      "type": "string"
    },
    "fullName": {
      "type": "string",
      "example": "Jane Doe"
    },
    "role": {
      "type": "string",
      "nullable": true
    },
    "email": {
      "type": "string",
      "nullable": true
    },
    "phone": {
      "type": "string",
      "nullable": true
    },
    "isPrimary": {
      "type": "boolean",
      "example": false
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    },
    "createdAt": {
      "type": "string"
    },
    "updatedAt": {
      "type": "string"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string"}` | oui |
| `tenantId` | `{"type":"string"}` | oui |
| `tenantCustomerId` | `{"type":"string"}` | oui |
| `fullName` | `{"type":"string","example":"Jane Doe"}` | oui |
| `role` | `{"type":"string","nullable":true}` | non |
| `email` | `{"type":"string","nullable":true}` | non |
| `phone` | `{"type":"string","nullable":true}` | non |
| `isPrimary` | `{"type":"boolean","example":false}` | oui |
| `metadata` | `{"type":"object","additionalProperties":true}` | oui |
| `createdAt` | `{"type":"string"}` | oui |
| `updatedAt` | `{"type":"string"}` | oui |

### `CustomerExportResponseDto` {#schema-customerexportresponsedto}

Source : `src/modules/customer/presentation/dto/customer-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "tenantCustomerId",
    "aggregate",
    "consents",
    "addresses",
    "interactions",
    "exportedAt"
  ],
  "properties": {
    "tenantCustomerId": {
      "type": "string",
      "example": "tenant-customer-uuid"
    },
    "aggregate": {
      "$ref": "#/components/schemas/CustomerAggregateResponseDto"
    },
    "consents": {
      "type": "array",
      "items": {
        "type": "object"
      }
    },
    "addresses": {
      "type": "array",
      "items": {
        "type": "object"
      }
    },
    "interactions": {
      "type": "array",
      "items": {
        "type": "object"
      }
    },
    "exportedAt": {
      "type": "string",
      "example": "2026-08-01T12:00:00.000Z"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `tenantCustomerId` | `{"type":"string","example":"tenant-customer-uuid"}` | oui |
| `aggregate` | `{"$ref":"#/components/schemas/CustomerAggregateResponseDto"}` | oui |
| `consents` | `{"type":"array","items":{"type":"object"}}` | oui |
| `addresses` | `{"type":"array","items":{"type":"object"}}` | oui |
| `interactions` | `{"type":"array","items":{"type":"object"}}` | oui |
| `exportedAt` | `{"type":"string","example":"2026-08-01T12:00:00.000Z"}` | oui |

### `CustomerInteractionResponseDto` {#schema-customerinteractionresponsedto}

Source : `src/modules/customer/presentation/dto/customer-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id",
    "tenantId",
    "tenantCustomerId",
    "occurredAt",
    "createdBy",
    "metadata",
    "createdAt"
  ],
  "properties": {
    "id": {
      "type": "string",
      "example": "interaction-uuid"
    },
    "tenantId": {
      "type": "string",
      "example": "tenant-uuid"
    },
    "organizationId": {
      "type": "string",
      "example": "organization-uuid"
    },
    "tenantCustomerId": {
      "type": "string",
      "example": "tenant-customer-uuid"
    },
    "subject": {
      "type": "string",
      "example": "Follow-up call"
    },
    "description": {
      "type": "string",
      "example": "Customer enquired about delivery status."
    },
    "channel": {
      "type": "string",
      "example": "PHONE"
    },
    "occurredAt": {
      "type": "string",
      "example": "2026-08-01T09:00:00.000Z"
    },
    "createdBy": {
      "type": "string",
      "example": "staff-user-uuid"
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    },
    "createdAt": {
      "type": "string",
      "example": "2026-08-01T09:00:00.000Z"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string","example":"interaction-uuid"}` | oui |
| `tenantId` | `{"type":"string","example":"tenant-uuid"}` | oui |
| `organizationId` | `{"type":"string","example":"organization-uuid"}` | non |
| `tenantCustomerId` | `{"type":"string","example":"tenant-customer-uuid"}` | oui |
| `subject` | `{"type":"string","example":"Follow-up call"}` | non |
| `description` | `{"type":"string","example":"Customer enquired about delivery status."}` | non |
| `channel` | `{"type":"string","example":"PHONE"}` | non |
| `occurredAt` | `{"type":"string","example":"2026-08-01T09:00:00.000Z"}` | oui |
| `createdBy` | `{"type":"string","example":"staff-user-uuid"}` | oui |
| `metadata` | `{"type":"object","additionalProperties":true}` | oui |
| `createdAt` | `{"type":"string","example":"2026-08-01T09:00:00.000Z"}` | oui |

### `CustomerLoginDto` {#schema-customerlogindto}

Source : `src/modules/customer/presentation/dto/customer-b2c.dto.ts`

```json
{
  "type": "object",
  "required": [
    "tenantSlug",
    "email",
    "password"
  ],
  "properties": {
    "tenantSlug": {
      "type": "string"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "password": {
      "type": "string"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-b2c.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `tenantSlug` | `{"type":"string"}` | oui |
| `email` | `{"type":"string","format":"email"}` | oui |
| `password` | `{"type":"string"}` | oui |

### `CustomerLoginTokensResponseDto` {#schema-customerlogintokensresponsedto}

Source : `src/modules/customer/presentation/dto/customer-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "accessToken",
    "expiresIn",
    "tokenType"
  ],
  "properties": {
    "accessToken": {
      "type": "string",
      "example": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "refreshToken": {
      "type": "string",
      "example": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "expiresIn": {
      "type": "number",
      "example": 300
    },
    "tokenType": {
      "type": "string",
      "example": "Bearer"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `accessToken` | `{"type":"string","example":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."}` | oui |
| `refreshToken` | `{"type":"string","example":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."}` | non |
| `expiresIn` | `{"type":"number","example":300}` | oui |
| `tokenType` | `{"type":"string","example":"Bearer"}` | oui |

### `CustomerMembershipResponseDto` {#schema-customermembershipresponsedto}

Source : `src/modules/customer/presentation/dto/customer-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "tenantId",
    "tenantCustomerId",
    "customerNumber",
    "status",
    "isPatient",
    "patientProfile",
    "isCurrent",
    "organizations"
  ],
  "properties": {
    "tenantId": {
      "type": "string",
      "example": "tenant-uuid"
    },
    "tenantSlug": {
      "type": "string",
      "example": "pharmacie-centrale"
    },
    "tenantDisplayName": {
      "type": "string",
      "example": "Pharmacie Centrale"
    },
    "tenantCustomerId": {
      "type": "string",
      "example": "tenant-customer-uuid"
    },
    "customerNumber": {
      "type": "string",
      "example": "CUS-000001"
    },
    "status": {
      "type": "string",
      "example": "ACTIVE"
    },
    "isPatient": {
      "type": "boolean",
      "description": "Patient role at this tenant (source of truth)",
      "example": true
    },
    "patientStatus": {
      "type": "string",
      "enum": [
        "ACTIVE",
        "INACTIVE",
        "ARCHIVED"
      ],
      "example": "ACTIVE"
    },
    "patientNumber": {
      "type": "string",
      "example": "PAT-000001"
    },
    "patientProfile": {
      "type": "object",
      "additionalProperties": true
    },
    "isCurrent": {
      "type": "boolean",
      "description": "Matches JWT tenant_id of the current session",
      "example": true
    },
    "organizations": {
      "type": "array",
      "items": {
        "type": "object"
      }
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `tenantId` | `{"type":"string","example":"tenant-uuid"}` | oui |
| `tenantSlug` | `{"type":"string","example":"pharmacie-centrale"}` | non |
| `tenantDisplayName` | `{"type":"string","example":"Pharmacie Centrale"}` | non |
| `tenantCustomerId` | `{"type":"string","example":"tenant-customer-uuid"}` | oui |
| `customerNumber` | `{"type":"string","example":"CUS-000001"}` | oui |
| `status` | `{"type":"string","example":"ACTIVE"}` | oui |
| `isPatient` | `{"type":"boolean","description":"Patient role at this tenant (source of truth)","example":true}` | oui |
| `patientStatus` | `{"type":"string","enum":["ACTIVE","INACTIVE","ARCHIVED"],"example":"ACTIVE"}` | non |
| `patientNumber` | `{"type":"string","example":"PAT-000001"}` | non |
| `patientProfile` | `{"type":"object","additionalProperties":true}` | oui |
| `isCurrent` | `{"type":"boolean","description":"Matches JWT tenant_id of the current session","example":true}` | oui |
| `organizations` | `{"type":"array","items":{"type":"object"}}` | oui |

### `CustomerPasswordResetDto` {#schema-customerpasswordresetdto}

Source : `src/modules/customer/presentation/dto/customer-b2c.dto.ts`

```json
{
  "type": "object",
  "required": [
    "tenantSlug",
    "email"
  ],
  "properties": {
    "tenantSlug": {
      "type": "string"
    },
    "email": {
      "type": "string",
      "format": "email"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-b2c.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `tenantSlug` | `{"type":"string"}` | oui |
| `email` | `{"type":"string","format":"email"}` | oui |

### `DayHoursDto` {#schema-dayhoursdto}

Source : `src/modules/identity/presentation/dto/organization.dto.ts`

```json
{
  "type": "object",
  "required": [
    "open",
    "close"
  ],
  "properties": {
    "open": {
      "type": "string",
      "example": "08:00"
    },
    "close": {
      "type": "string",
      "example": "18:00"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/organization.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `open` | `{"type":"string","example":"08:00"}` | oui |
| `close` | `{"type":"string","example":"18:00"}` | oui |

### `DecideTaskDto` {#schema-decidetaskdto}

Source : `src/modules/workflow/presentation/workflow.controller.ts`

```json
{
  "type": "object",
  "required": [
    "decision"
  ],
  "properties": {
    "decision": {
      "type": "string",
      "enum": [
        "APPROVED",
        "REJECTED"
      ]
    }
  },
  "x-source-file": "src/modules/workflow/presentation/workflow.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `decision` | `{"type":"string","enum":["APPROVED","REJECTED"]}` | oui |

### `DelegationResponseDto` {#schema-delegationresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id",
    "tenantId",
    "organizationId",
    "grantorIdentityId",
    "granteeIdentityId",
    "permissions",
    "expiresAt",
    "createdAt"
  ],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "tenantId": {
      "type": "string",
      "format": "uuid"
    },
    "organizationId": {
      "type": "string",
      "format": "uuid"
    },
    "grantorIdentityId": {
      "type": "string",
      "description": "Keycloak subject of the grantor"
    },
    "granteeIdentityId": {
      "type": "string",
      "description": "Keycloak subject of the grantee"
    },
    "permissions": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "example": [
        "orders:read"
      ]
    },
    "expiresAt": {
      "type": "string",
      "format": "date-time"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "revokedAt": {
      "type": "string",
      "format": "date-time",
      "nullable": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string","format":"uuid"}` | oui |
| `tenantId` | `{"type":"string","format":"uuid"}` | oui |
| `organizationId` | `{"type":"string","format":"uuid"}` | oui |
| `grantorIdentityId` | `{"type":"string","description":"Keycloak subject of the grantor"}` | oui |
| `granteeIdentityId` | `{"type":"string","description":"Keycloak subject of the grantee"}` | oui |
| `permissions` | `{"type":"array","items":{"type":"string"},"example":["orders:read"]}` | oui |
| `expiresAt` | `{"type":"string","format":"date-time"}` | oui |
| `createdAt` | `{"type":"string","format":"date-time"}` | oui |
| `revokedAt` | `{"type":"string","format":"date-time","nullable":true}` | non |

### `DemandForecastDto` {#schema-demandforecastdto}

Source : `src/modules/commercial-ai/presentation/commercial-ai.controller.ts`

```json
{
  "type": "object",
  "required": [
    "skuId",
    "periodStart",
    "periodEnd",
    "forecastQty"
  ],
  "properties": {
    "skuId": {
      "type": "string",
      "format": "uuid"
    },
    "warehouseId": {
      "type": "string",
      "format": "uuid"
    },
    "periodStart": {
      "type": "string",
      "example": "2026-01-01"
    },
    "periodEnd": {
      "type": "string",
      "example": "2026-01-31"
    },
    "forecastQty": {
      "type": "number"
    },
    "method": {
      "type": "string",
      "enum": [
        "MANUAL",
        "HISTORICAL",
        "SEASONAL",
        "PROMOTION_ADJUSTED"
      ]
    }
  },
  "x-source-file": "src/modules/commercial-ai/presentation/commercial-ai.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `skuId` | `{"type":"string","format":"uuid"}` | oui |
| `warehouseId` | `{"type":"string","format":"uuid"}` | non |
| `periodStart` | `{"type":"string","example":"2026-01-01"}` | oui |
| `periodEnd` | `{"type":"string","example":"2026-01-31"}` | oui |
| `forecastQty` | `{"type":"number"}` | oui |
| `method` | `{"type":"string","enum":["MANUAL","HISTORICAL","SEASONAL","PROMOTION_ADJUSTED"]}` | non |

### `DispatchWebhookDto` {#schema-dispatchwebhookdto}

Source : `src/modules/commercial-webhooks/presentation/commercial-webhooks.controller.ts`

```json
{
  "type": "object",
  "required": [
    "eventType",
    "payload"
  ],
  "properties": {
    "eventType": {
      "type": "string",
      "example": "order.confirmed"
    },
    "payload": {
      "type": "object",
      "additionalProperties": true
    },
    "idempotencyKey": {
      "type": "string"
    }
  },
  "x-source-file": "src/modules/commercial-webhooks/presentation/commercial-webhooks.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `eventType` | `{"type":"string","example":"order.confirmed"}` | oui |
| `payload` | `{"type":"object","additionalProperties":true}` | oui |
| `idempotencyKey` | `{"type":"string"}` | non |

### `DuplicateCustomerMatchResponseDto` {#schema-duplicatecustomermatchresponsedto}

Source : `src/modules/customer/presentation/dto/customer-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "matchedOn",
    "customer"
  ],
  "properties": {
    "matchedOn": {
      "type": "string",
      "enum": [
        "email",
        "phone",
        "customerNumber"
      ],
      "example": "email"
    },
    "customer": {
      "$ref": "#/components/schemas/TenantCustomerResponseDto"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `matchedOn` | `{"type":"string","enum":["email","phone","customerNumber"],"example":"email"}` | oui |
| `customer` | `{"$ref":"#/components/schemas/TenantCustomerResponseDto"}` | oui |

### `EmergencyAccessGrantResponseDto` {#schema-emergencyaccessgrantresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id",
    "tenantId",
    "operatorIdentityId",
    "approvedByIdentityId",
    "reason",
    "scope",
    "expiresAt",
    "createdAt"
  ],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "tenantId": {
      "type": "string",
      "format": "uuid"
    },
    "organizationId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "operatorIdentityId": {
      "type": "string",
      "description": "Keycloak subject of the operator"
    },
    "approvedByIdentityId": {
      "type": "string",
      "description": "Keycloak subject of the approver"
    },
    "reason": {
      "type": "string",
      "example": "Investigating production incident"
    },
    "scope": {
      "type": "object",
      "additionalProperties": true
    },
    "expiresAt": {
      "type": "string",
      "format": "date-time"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "revokedAt": {
      "type": "string",
      "format": "date-time",
      "nullable": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string","format":"uuid"}` | oui |
| `tenantId` | `{"type":"string","format":"uuid"}` | oui |
| `organizationId` | `{"type":"string","format":"uuid","nullable":true}` | non |
| `operatorIdentityId` | `{"type":"string","description":"Keycloak subject of the operator"}` | oui |
| `approvedByIdentityId` | `{"type":"string","description":"Keycloak subject of the approver"}` | oui |
| `reason` | `{"type":"string","example":"Investigating production incident"}` | oui |
| `scope` | `{"type":"object","additionalProperties":true}` | oui |
| `expiresAt` | `{"type":"string","format":"date-time"}` | oui |
| `createdAt` | `{"type":"string","format":"date-time"}` | oui |
| `revokedAt` | `{"type":"string","format":"date-time","nullable":true}` | non |

### `EnqueueNotificationDto` {#schema-enqueuenotificationdto}

Source : `src/modules/commercial-jobs/presentation/commercial-jobs.controller.ts`

```json
{
  "type": "object",
  "required": [
    "eventType",
    "channel"
  ],
  "properties": {
    "eventType": {
      "$ref": "#/components/schemas/CommercialNotificationEventType"
    },
    "channel": {
      "$ref": "#/components/schemas/CommercialNotificationChannel"
    },
    "recipient": {
      "type": "string"
    },
    "payload": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "x-source-file": "src/modules/commercial-jobs/presentation/commercial-jobs.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `eventType` | `{"$ref":"#/components/schemas/CommercialNotificationEventType"}` | oui |
| `channel` | `{"$ref":"#/components/schemas/CommercialNotificationChannel"}` | oui |
| `recipient` | `{"type":"string"}` | non |
| `payload` | `{"type":"object","additionalProperties":true}` | non |

### `EnrollPushDeviceDto` {#schema-enrollpushdevicedto}

Source : `src/modules/identity/presentation/dto/user.dto.ts`

```json
{
  "type": "object",
  "required": [
    "deviceName",
    "pushToken",
    "pushPlatform"
  ],
  "properties": {
    "deviceName": {
      "type": "string",
      "example": "Pixel 8"
    },
    "pushToken": {
      "type": "string",
      "example": "fcm_token_..."
    },
    "pushPlatform": {
      "type": "string",
      "description": "fcm | apns | webpush",
      "example": "fcm"
    },
    "platform": {
      "type": "string",
      "example": "android"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/user.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `deviceName` | `{"type":"string","example":"Pixel 8"}` | oui |
| `pushToken` | `{"type":"string","example":"fcm_token_..."}` | oui |
| `pushPlatform` | `{"type":"string","description":"fcm \| apns \| webpush","example":"fcm"}` | oui |
| `platform` | `{"type":"string","example":"android"}` | non |

### `EvaluatePolicyDto` {#schema-evaluatepolicydto}

Source : `src/modules/rules/presentation/policies.controller.ts`

```json
{
  "type": "object",
  "required": [
    "policyType"
  ],
  "properties": {
    "policyType": {
      "type": "string",
      "enum": [
        "COMMERCIAL_POLICY_TYPES"
      ],
      "example": "ORDER"
    }
  },
  "x-source-file": "src/modules/rules/presentation/policies.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `policyType` | `{"type":"string","enum":["COMMERCIAL_POLICY_TYPES"],"example":"ORDER"}` | oui |

### `FeatureFlagEntryResponseDto` {#schema-featureflagentryresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "key",
    "enabled"
  ],
  "properties": {
    "key": {
      "type": "string",
      "example": "enable_pharmacy"
    },
    "enabled": {
      "type": "boolean"
    },
    "description": {
      "type": "string",
      "nullable": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `key` | `{"type":"string","example":"enable_pharmacy"}` | oui |
| `enabled` | `{"type":"boolean"}` | oui |
| `description` | `{"type":"string","nullable":true}` | non |

### `FulfillBackorderDto` {#schema-fulfillbackorderdto}

Source : `src/modules/sales/presentation/sales.controller.ts`

```json
{
  "type": "object",
  "required": [
    "quantity"
  ],
  "properties": {
    "quantity": {
      "type": "number"
    }
  },
  "x-source-file": "src/modules/sales/presentation/sales.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `quantity` | `{"type":"number"}` | oui |

### `GenericMessageResponseDto` {#schema-genericmessageresponsedto}

Source : `src/modules/customer/presentation/dto/customer-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "message"
  ],
  "properties": {
    "message": {
      "type": "string",
      "example": "Operation completed successfully."
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `message` | `{"type":"string","example":"Operation completed successfully."}` | oui |

### `GlobalCustomerIdentityResponseDto` {#schema-globalcustomeridentityresponsedto}

Source : `src/modules/customer/presentation/dto/customer-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id",
    "globalCustomerId",
    "createdAt",
    "updatedAt"
  ],
  "properties": {
    "id": {
      "type": "string",
      "example": "identity-uuid"
    },
    "globalCustomerId": {
      "type": "string",
      "example": "global-customer-uuid"
    },
    "keycloakSubjectId": {
      "type": "string",
      "example": "keycloak-subject-id"
    },
    "externalIdentityId": {
      "type": "string",
      "example": null
    },
    "emailNormalized": {
      "type": "string",
      "example": "customer@example.com"
    },
    "phoneNormalized": {
      "type": "string",
      "example": "+25779123456"
    },
    "emailVerifiedAt": {
      "type": "string",
      "example": "2026-01-01T00:00:00.000Z"
    },
    "phoneVerifiedAt": {
      "type": "string",
      "example": null
    },
    "lastLoginAt": {
      "type": "string",
      "example": "2026-08-01T12:00:00.000Z"
    },
    "createdAt": {
      "type": "string",
      "example": "2026-01-01T00:00:00.000Z"
    },
    "updatedAt": {
      "type": "string",
      "example": "2026-01-01T00:00:00.000Z"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string","example":"identity-uuid"}` | oui |
| `globalCustomerId` | `{"type":"string","example":"global-customer-uuid"}` | oui |
| `keycloakSubjectId` | `{"type":"string","example":"keycloak-subject-id"}` | non |
| `externalIdentityId` | `{"type":"string","example":null}` | non |
| `emailNormalized` | `{"type":"string","example":"customer@example.com"}` | non |
| `phoneNormalized` | `{"type":"string","example":"+25779123456"}` | non |
| `emailVerifiedAt` | `{"type":"string","example":"2026-01-01T00:00:00.000Z"}` | non |
| `phoneVerifiedAt` | `{"type":"string","example":null}` | non |
| `lastLoginAt` | `{"type":"string","example":"2026-08-01T12:00:00.000Z"}` | non |
| `createdAt` | `{"type":"string","example":"2026-01-01T00:00:00.000Z"}` | oui |
| `updatedAt` | `{"type":"string","example":"2026-01-01T00:00:00.000Z"}` | oui |

### `GlobalCustomerProfileResponseDto` {#schema-globalcustomerprofileresponsedto}

Source : `src/modules/customer/presentation/dto/customer-response.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "firstName": {
      "type": "string",
      "example": "Jane"
    },
    "lastName": {
      "type": "string",
      "example": "Doe"
    },
    "displayName": {
      "type": "string",
      "example": "Jane Doe"
    },
    "dateOfBirth": {
      "type": "string",
      "example": "1990-01-15"
    },
    "gender": {
      "type": "string",
      "example": "F"
    },
    "preferredLanguage": {
      "type": "string",
      "example": "fr"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `firstName` | `{"type":"string","example":"Jane"}` | non |
| `lastName` | `{"type":"string","example":"Doe"}` | non |
| `displayName` | `{"type":"string","example":"Jane Doe"}` | non |
| `dateOfBirth` | `{"type":"string","example":"1990-01-15"}` | non |
| `gender` | `{"type":"string","example":"F"}` | non |
| `preferredLanguage` | `{"type":"string","example":"fr"}` | non |

### `GlobalCustomerResponseDto` {#schema-globalcustomerresponsedto}

Source : `src/modules/customer/presentation/dto/customer-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id",
    "status",
    "locale",
    "timezone",
    "profile",
    "isPatient",
    "version",
    "createdAt",
    "updatedAt"
  ],
  "properties": {
    "id": {
      "type": "string",
      "example": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    },
    "status": {
      "type": "string",
      "enum": [
        "GUEST",
        "IDENTIFIED",
        "REGISTERED",
        "ACTIVE",
        "SUSPENDED",
        "ANONYMIZED",
        "DELETED"
      ],
      "example": "ACTIVE"
    },
    "locale": {
      "type": "string",
      "example": "fr-FR"
    },
    "timezone": {
      "type": "string",
      "example": "Africa/Bujumbura"
    },
    "country": {
      "type": "string",
      "example": "BI"
    },
    "profile": {
      "$ref": "#/components/schemas/GlobalCustomerProfileResponseDto"
    },
    "isPatient": {
      "type": "boolean",
      "description": "Derived B2C convenience: true if any non-archived tenant link has patient role",
      "example": false
    },
    "version": {
      "type": "number",
      "example": 1
    },
    "createdAt": {
      "type": "string",
      "example": "2026-01-01T00:00:00.000Z"
    },
    "updatedAt": {
      "type": "string",
      "example": "2026-01-01T00:00:00.000Z"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string","example":"a1b2c3d4-e5f6-7890-abcd-ef1234567890"}` | oui |
| `status` | `{"type":"string","enum":["GUEST","IDENTIFIED","REGISTERED","ACTIVE","SUSPENDED","ANONYMIZED","DELETED"],"example":"ACTIVE"}` | oui |
| `locale` | `{"type":"string","example":"fr-FR"}` | oui |
| `timezone` | `{"type":"string","example":"Africa/Bujumbura"}` | oui |
| `country` | `{"type":"string","example":"BI"}` | non |
| `profile` | `{"$ref":"#/components/schemas/GlobalCustomerProfileResponseDto"}` | oui |
| `isPatient` | `{"type":"boolean","description":"Derived B2C convenience: true if any non-archived tenant link has patient role","example":false}` | oui |
| `version` | `{"type":"number","example":1}` | oui |
| `createdAt` | `{"type":"string","example":"2026-01-01T00:00:00.000Z"}` | oui |
| `updatedAt` | `{"type":"string","example":"2026-01-01T00:00:00.000Z"}` | oui |

### `GrantConsentDto` {#schema-grantconsentdto}

Source : `src/modules/customer/presentation/dto/customer-b2c.dto.ts`

```json
{
  "type": "object",
  "required": [
    "purpose",
    "policyVersion"
  ],
  "properties": {
    "purpose": {
      "type": "string",
      "example": "MARKETING"
    },
    "policyVersion": {
      "type": "string",
      "example": "2026-01"
    },
    "channel": {
      "type": "string"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-b2c.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `purpose` | `{"type":"string","example":"MARKETING"}` | oui |
| `policyVersion` | `{"type":"string","example":"2026-01"}` | oui |
| `channel` | `{"type":"string"}` | non |

### `GrantDelegationDto` {#schema-grantdelegationdto}

Source : `src/modules/identity/presentation/dto/delegation.dto.ts`

```json
{
  "type": "object",
  "required": [
    "organizationId",
    "granteeIdentityId",
    "permissions"
  ],
  "properties": {
    "organizationId": {
      "type": "string",
      "format": "uuid"
    },
    "granteeIdentityId": {
      "type": "string"
    },
    "permissions": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "expiresInHours": {
      "type": "number",
      "description": "Expiry in hours (max 720)"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/delegation.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `organizationId` | `{"type":"string","format":"uuid"}` | oui |
| `granteeIdentityId` | `{"type":"string"}` | oui |
| `permissions` | `{"type":"array","items":{"type":"string"}}` | oui |
| `expiresInHours` | `{"type":"number","description":"Expiry in hours (max 720)"}` | non |

### `GrantEmergencyAccessDto` {#schema-grantemergencyaccessdto}

Source : `src/modules/identity/presentation/dto/delegation.dto.ts`

```json
{
  "type": "object",
  "required": [
    "operatorIdentityId",
    "reason"
  ],
  "properties": {
    "operatorIdentityId": {
      "type": "string"
    },
    "reason": {
      "type": "string"
    },
    "organizationId": {
      "type": "string",
      "format": "uuid"
    },
    "scope": {
      "type": "object",
      "additionalProperties": true
    },
    "expiresInHours": {
      "type": "number",
      "description": "Expiry in hours (max 24)"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/delegation.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `operatorIdentityId` | `{"type":"string"}` | oui |
| `reason` | `{"type":"string"}` | oui |
| `organizationId` | `{"type":"string","format":"uuid"}` | non |
| `scope` | `{"type":"object","additionalProperties":true}` | non |
| `expiresInHours` | `{"type":"number","description":"Expiry in hours (max 24)"}` | non |

### `GrantMembershipDto` {#schema-grantmembershipdto}

Source : `src/modules/identity/presentation/dto/membership.dto.ts`

```json
{
  "type": "object",
  "required": [
    "userId",
    "organizationId"
  ],
  "properties": {
    "userId": {
      "type": "string",
      "description": "Stable identity key (Keycloak sub)"
    },
    "organizationId": {
      "type": "string",
      "format": "uuid"
    },
    "roles": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "example": [
        "viewer"
      ]
    },
    "permissions": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "example": [
        "organizations:read"
      ]
    },
    "status": {
      "$ref": "#/components/schemas/MembershipStatus"
    },
    "department": {
      "type": "string"
    },
    "position": {
      "type": "string"
    },
    "managerUserId": {
      "type": "string"
    },
    "resourceScopes": {
      "type": "array",
      "items": {
        "type": "object"
      }
    },
    "expiresAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/membership.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `userId` | `{"type":"string","description":"Stable identity key (Keycloak sub)"}` | oui |
| `organizationId` | `{"type":"string","format":"uuid"}` | oui |
| `roles` | `{"type":"array","items":{"type":"string"},"example":["viewer"]}` | non |
| `permissions` | `{"type":"array","items":{"type":"string"},"example":["organizations:read"]}` | non |
| `status` | `{"$ref":"#/components/schemas/MembershipStatus"}` | non |
| `department` | `{"type":"string"}` | non |
| `position` | `{"type":"string"}` | non |
| `managerUserId` | `{"type":"string"}` | non |
| `resourceScopes` | `{"type":"array","items":{"type":"object"}}` | non |
| `expiresAt` | `{"type":"string","format":"date-time"}` | non |

### `IdentifyCustomerDto` {#schema-identifycustomerdto}

Source : `src/modules/customer/presentation/dto/customer.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email"
    },
    "phone": {
      "type": "string"
    },
    "customerNumber": {
      "type": "string",
      "example": "CUS-000001"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `email` | `{"type":"string","format":"email"}` | non |
| `phone` | `{"type":"string"}` | non |
| `customerNumber` | `{"type":"string","example":"CUS-000001"}` | non |

### `IdentityMfaDto` {#schema-identitymfadto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "enabled",
    "methods"
  ],
  "properties": {
    "enabled": {
      "type": "boolean"
    },
    "methods": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "example": "['totp'"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `enabled` | `{"type":"boolean"}` | oui |
| `methods` | `{"type":"array","items":{"type":"string"},"example":"['totp'"}` | oui |

### `IdentityVerificationDto` {#schema-identityverificationdto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "emailVerified",
    "mfaEnrolled",
    "phoneVerified"
  ],
  "properties": {
    "emailVerified": {
      "type": "boolean"
    },
    "mfaEnrolled": {
      "type": "boolean"
    },
    "phoneVerified": {
      "type": "boolean",
      "description": "True only after successful phone OTP KYC (POST /users/me/identity/phone/verify-otp)"
    },
    "phoneE164": {
      "type": "string",
      "nullable": true,
      "description": "E.164 phone stored after OTP send/verify",
      "example": "+243970000000"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `emailVerified` | `{"type":"boolean"}` | oui |
| `mfaEnrolled` | `{"type":"boolean"}` | oui |
| `phoneVerified` | `{"type":"boolean","description":"True only after successful phone OTP KYC (POST /users/me/identity/phone/verify-otp)"}` | oui |
| `phoneE164` | `{"type":"string","nullable":true,"description":"E.164 phone stored after OTP send/verify","example":"+243970000000"}` | non |

### `InvitationAcceptResponseDto` {#schema-invitationacceptresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "membershipId",
    "organizationId"
  ],
  "properties": {
    "membershipId": {
      "type": "string",
      "format": "uuid"
    },
    "organizationId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `membershipId` | `{"type":"string","format":"uuid"}` | oui |
| `organizationId` | `{"type":"string","format":"uuid"}` | oui |

### `InvitationCreatedResponseDto` {#schema-invitationcreatedresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id",
    "email",
    "organizationId",
    "status",
    "expiresAt",
    "token",
    "emailSent",
    "emailProvider"
  ],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "email": {
      "type": "string",
      "example": "jane@example.com"
    },
    "organizationId": {
      "type": "string",
      "format": "uuid"
    },
    "status": {
      "type": "string",
      "example": "PENDING"
    },
    "expiresAt": {
      "type": "string",
      "format": "date-time"
    },
    "token": {
      "type": "string",
      "description": "One-time plain-text token (not stored); always returned so it can be copied even if email send fails"
    },
    "emailSent": {
      "type": "boolean",
      "description": "Whether the invitation email was sent (SMTP or Resend). Create still succeeds if send fails."
    },
    "emailProvider": {
      "type": "string",
      "description": "none | smtp | resend",
      "example": "none"
    },
    "emailError": {
      "type": "string",
      "nullable": true,
      "description": "Short send error when emailSent is false"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string","format":"uuid"}` | oui |
| `email` | `{"type":"string","example":"jane@example.com"}` | oui |
| `organizationId` | `{"type":"string","format":"uuid"}` | oui |
| `status` | `{"type":"string","example":"PENDING"}` | oui |
| `expiresAt` | `{"type":"string","format":"date-time"}` | oui |
| `token` | `{"type":"string","description":"One-time plain-text token (not stored); always returned so it can be copied even if email send fails"}` | oui |
| `emailSent` | `{"type":"boolean","description":"Whether the invitation email was sent (SMTP or Resend). Create still succeeds if send fails."}` | oui |
| `emailProvider` | `{"type":"string","description":"none \| smtp \| resend","example":"none"}` | oui |
| `emailError` | `{"type":"string","nullable":true,"description":"Short send error when emailSent is false"}` | non |

### `InvitationResponseDto` {#schema-invitationresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id",
    "tenantId",
    "organizationId",
    "email",
    "invitedBy",
    "roles",
    "permissions",
    "status",
    "expiresAt",
    "createdAt"
  ],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "tenantId": {
      "type": "string",
      "format": "uuid"
    },
    "organizationId": {
      "type": "string",
      "format": "uuid"
    },
    "email": {
      "type": "string",
      "example": "jane@example.com"
    },
    "invitedBy": {
      "type": "string",
      "description": "Keycloak subject of the inviter"
    },
    "roles": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "example": [
        "org-member"
      ]
    },
    "permissions": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "example": []
    },
    "status": {
      "type": "string",
      "description": "PENDING | ACCEPTED | EXPIRED | REVOKED",
      "example": "PENDING"
    },
    "expiresAt": {
      "type": "string",
      "format": "date-time"
    },
    "acceptedAt": {
      "type": "string",
      "format": "date-time",
      "nullable": true
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string","format":"uuid"}` | oui |
| `tenantId` | `{"type":"string","format":"uuid"}` | oui |
| `organizationId` | `{"type":"string","format":"uuid"}` | oui |
| `email` | `{"type":"string","example":"jane@example.com"}` | oui |
| `invitedBy` | `{"type":"string","description":"Keycloak subject of the inviter"}` | oui |
| `roles` | `{"type":"array","items":{"type":"string"},"example":["org-member"]}` | oui |
| `permissions` | `{"type":"array","items":{"type":"string"},"example":[]}` | oui |
| `status` | `{"type":"string","description":"PENDING \| ACCEPTED \| EXPIRED \| REVOKED","example":"PENDING"}` | oui |
| `expiresAt` | `{"type":"string","format":"date-time"}` | oui |
| `acceptedAt` | `{"type":"string","format":"date-time","nullable":true}` | non |
| `createdAt` | `{"type":"string","format":"date-time"}` | oui |

### `LinkOrganizationCustomerDto` {#schema-linkorganizationcustomerdto}

Source : `src/modules/customer/presentation/dto/customer.dto.ts`

```json
{
  "type": "object",
  "required": [
    "organizationId"
  ],
  "properties": {
    "organizationId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `organizationId` | `{"type":"string","format":"uuid"}` | oui |

### `LinkedIdentityDto` {#schema-linkedidentitydto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "provider",
    "providerUserId",
    "username",
    "primary"
  ],
  "properties": {
    "provider": {
      "type": "string",
      "example": "google"
    },
    "providerUserId": {
      "type": "string"
    },
    "username": {
      "type": "string"
    },
    "primary": {
      "type": "boolean",
      "description": "Primary sign-in method for this user"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `provider` | `{"type":"string","example":"google"}` | oui |
| `providerUserId` | `{"type":"string"}` | oui |
| `username` | `{"type":"string"}` | oui |
| `primary` | `{"type":"boolean","description":"Primary sign-in method for this user"}` | oui |

### `ListDevicesQueryDto` {#schema-listdevicesquerydto}

Source : `src/modules/identity/presentation/dto/user.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "syncSessions": {
      "type": "boolean",
      "description": "Sync soft device list from Keycloak sessions (default true)"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/user.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `syncSessions` | `{"type":"boolean","description":"Sync soft device list from Keycloak sessions (default true)"}` | non |

### `ListInvitationsQueryDto` {#schema-listinvitationsquerydto}

Source : `src/modules/identity/presentation/dto/list-invitations-query.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "organizationId": {
      "type": "string",
      "format": "uuid"
    },
    "status": {
      "$ref": "#/components/schemas/InvitationStatus"
    },
    "search": {
      "type": "string",
      "description": "Search invitation email"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/list-invitations-query.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `organizationId` | `{"type":"string","format":"uuid"}` | non |
| `status` | `{"$ref":"#/components/schemas/InvitationStatus"}` | non |
| `search` | `{"type":"string","description":"Search invitation email"}` | non |

### `ListMembershipsQueryDto` {#schema-listmembershipsquerydto}

Source : `src/modules/identity/presentation/dto/list-memberships-query.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "organizationId": {
      "type": "string",
      "format": "uuid"
    },
    "status": {
      "$ref": "#/components/schemas/MembershipStatus"
    },
    "search": {
      "type": "string",
      "description": "Search userId, department, position, or roles"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/list-memberships-query.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `organizationId` | `{"type":"string","format":"uuid"}` | non |
| `status` | `{"$ref":"#/components/schemas/MembershipStatus"}` | non |
| `search` | `{"type":"string","description":"Search userId, department, position, or roles"}` | non |

### `ListNotificationsQueryDto` {#schema-listnotificationsquerydto}

Source : `src/modules/identity/presentation/dto/user.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "page": {
      "type": "number"
    },
    "limit": {
      "type": "number"
    },
    "unreadOnly": {
      "type": "boolean",
      "description": "Only unread notifications"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/user.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `page` | `{"type":"number"}` | non |
| `limit` | `{"type":"number"}` | non |
| `unreadOnly` | `{"type":"boolean","description":"Only unread notifications"}` | non |

### `ListOrganizationsQueryDto` {#schema-listorganizationsquerydto}

Source : `src/modules/identity/presentation/dto/organization.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "page": {
      "type": "number"
    },
    "limit": {
      "type": "number"
    },
    "parentId": {
      "type": "string",
      "description": "Filter by parent. Pass empty string for roots only."
    },
    "scope": {
      "type": "string",
      "enum": [
        "membership",
        "tenant"
      ]
    },
    "tree": {
      "type": "boolean",
      "description": "When true, returns flat tree list (all matching orgs)"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/organization.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `page` | `{"type":"number"}` | non |
| `limit` | `{"type":"number"}` | non |
| `parentId` | `{"type":"string","description":"Filter by parent. Pass empty string for roots only."}` | non |
| `scope` | `{"type":"string","enum":["membership","tenant"]}` | non |
| `tree` | `{"type":"boolean","description":"When true, returns flat tree list (all matching orgs)"}` | non |

### `ListUsersQueryDto` {#schema-listusersquerydto}

Source : `src/modules/identity/presentation/dto/list-users-query.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "status": {
      "$ref": "#/components/schemas/ApplicationUserStatus"
    },
    "search": {
      "type": "string",
      "description": "Search name, email, job title, or employee number"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/list-users-query.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `status` | `{"$ref":"#/components/schemas/ApplicationUserStatus"}` | non |
| `search` | `{"type":"string","description":"Search name, email, job title, or employee number"}` | non |

### `LogoutResponseDto` {#schema-logoutresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "loggedOut"
  ],
  "properties": {
    "loggedOut": {
      "type": "boolean"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `loggedOut` | `{"type":"boolean"}` | oui |

### `MembershipResourceScopeDto` {#schema-membershipresourcescopedto}

Source : `src/modules/identity/presentation/dto/membership.dto.ts`

```json
{
  "type": "object",
  "required": [
    "permission"
  ],
  "properties": {
    "permission": {
      "type": "string",
      "description": "Catalog key resource:action",
      "example": "inventory:read"
    },
    "organizationId": {
      "type": "string",
      "format": "uuid"
    },
    "resourceType": {
      "type": "string",
      "example": "warehouse"
    },
    "resourceId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/membership.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `permission` | `{"type":"string","description":"Catalog key resource:action","example":"inventory:read"}` | oui |
| `organizationId` | `{"type":"string","format":"uuid"}` | non |
| `resourceType` | `{"type":"string","example":"warehouse"}` | non |
| `resourceId` | `{"type":"string","format":"uuid"}` | non |

### `MergeCustomersDto` {#schema-mergecustomersdto}

Source : `src/modules/customer/presentation/dto/customer.dto.ts`

```json
{
  "type": "object",
  "required": [
    "sourceTenantCustomerId"
  ],
  "properties": {
    "sourceTenantCustomerId": {
      "type": "string",
      "format": "uuid",
      "description": "Tenant customer ID to merge into survivor (archived)"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `sourceTenantCustomerId` | `{"type":"string","format":"uuid","description":"Tenant customer ID to merge into survivor (archived)"}` | oui |

### `MfaStatusResponseDto` {#schema-mfastatusresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "enabled",
    "methods",
    "keycloakAvailable"
  ],
  "properties": {
    "enabled": {
      "type": "boolean"
    },
    "methods": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "example": "['totp'"
    },
    "keycloakAvailable": {
      "type": "boolean"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `enabled` | `{"type":"boolean"}` | oui |
| `methods` | `{"type":"array","items":{"type":"string"},"example":"['totp'"}` | oui |
| `keycloakAvailable` | `{"type":"boolean"}` | oui |

### `MyIdentityOverviewDto` {#schema-myidentityoverviewdto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "keycloakId",
    "enabled",
    "verification",
    "mfa",
    "credentials",
    "linkedIdentities",
    "urls",
    "keycloakAvailable"
  ],
  "properties": {
    "keycloakId": {
      "type": "string",
      "description": "Keycloak subject (sub)"
    },
    "enabled": {
      "type": "boolean"
    },
    "email": {
      "type": "string",
      "nullable": true
    },
    "username": {
      "type": "string",
      "nullable": true
    },
    "verification": {
      "$ref": "#/components/schemas/IdentityVerificationDto"
    },
    "mfa": {
      "$ref": "#/components/schemas/IdentityMfaDto"
    },
    "credentials": {
      "type": "array",
      "items": {
        "type": "object"
      }
    },
    "linkedIdentities": {
      "type": "array",
      "items": {
        "type": "object"
      }
    },
    "urls": {
      "type": "object",
      "additionalProperties": true
    },
    "keycloakAvailable": {
      "type": "boolean"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `keycloakId` | `{"type":"string","description":"Keycloak subject (sub)"}` | oui |
| `enabled` | `{"type":"boolean"}` | oui |
| `email` | `{"type":"string","nullable":true}` | non |
| `username` | `{"type":"string","nullable":true}` | non |
| `verification` | `{"$ref":"#/components/schemas/IdentityVerificationDto"}` | oui |
| `mfa` | `{"$ref":"#/components/schemas/IdentityMfaDto"}` | oui |
| `credentials` | `{"type":"array","items":{"type":"object"}}` | oui |
| `linkedIdentities` | `{"type":"array","items":{"type":"object"}}` | oui |
| `urls` | `{"type":"object","additionalProperties":true}` | oui |
| `keycloakAvailable` | `{"type":"boolean"}` | oui |

### `MySecurityOverviewDto` {#schema-mysecurityoverviewdto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "enabled",
    "methods",
    "credentials",
    "urls",
    "keycloakAvailable"
  ],
  "properties": {
    "enabled": {
      "type": "boolean"
    },
    "methods": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "credentials": {
      "type": "array",
      "items": {
        "type": "object"
      }
    },
    "urls": {
      "type": "object",
      "additionalProperties": true
    },
    "keycloakAvailable": {
      "type": "boolean"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `enabled` | `{"type":"boolean"}` | oui |
| `methods` | `{"type":"array","items":{"type":"string"}}` | oui |
| `credentials` | `{"type":"array","items":{"type":"object"}}` | oui |
| `urls` | `{"type":"object","additionalProperties":true}` | oui |
| `keycloakAvailable` | `{"type":"boolean"}` | oui |

### `MySecurityQueryDto` {#schema-mysecurityquerydto}

Source : `src/modules/identity/presentation/dto/user.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "redirectUri": {
      "type": "string",
      "description": "Redirect URI after Keycloak required action"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/user.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `redirectUri` | `{"type":"string","description":"Redirect URI after Keycloak required action"}` | non |

### `OpeningHoursDto` {#schema-openinghoursdto}

Source : `src/modules/identity/presentation/dto/organization.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "monday": {
      "$ref": "#/components/schemas/DayHoursDto",
      "nullable": true
    },
    "tuesday": {
      "$ref": "#/components/schemas/DayHoursDto",
      "nullable": true
    },
    "wednesday": {
      "$ref": "#/components/schemas/DayHoursDto",
      "nullable": true
    },
    "thursday": {
      "$ref": "#/components/schemas/DayHoursDto",
      "nullable": true
    },
    "friday": {
      "$ref": "#/components/schemas/DayHoursDto",
      "nullable": true
    },
    "saturday": {
      "$ref": "#/components/schemas/DayHoursDto",
      "nullable": true
    },
    "sunday": {
      "$ref": "#/components/schemas/DayHoursDto",
      "nullable": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/organization.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `monday` | `{"$ref":"#/components/schemas/DayHoursDto","nullable":true}` | non |
| `tuesday` | `{"$ref":"#/components/schemas/DayHoursDto","nullable":true}` | non |
| `wednesday` | `{"$ref":"#/components/schemas/DayHoursDto","nullable":true}` | non |
| `thursday` | `{"$ref":"#/components/schemas/DayHoursDto","nullable":true}` | non |
| `friday` | `{"$ref":"#/components/schemas/DayHoursDto","nullable":true}` | non |
| `saturday` | `{"$ref":"#/components/schemas/DayHoursDto","nullable":true}` | non |
| `sunday` | `{"$ref":"#/components/schemas/DayHoursDto","nullable":true}` | non |

### `OperationalSettingsDto` {#schema-operationalsettingsdto}

Source : `src/modules/identity/presentation/dto/organization.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "defaultCurrency": {
      "type": "string",
      "example": "BIF"
    },
    "defaultTaxCategoryId": {
      "type": "string",
      "format": "uuid"
    },
    "defaultPriceListId": {
      "type": "string",
      "format": "uuid"
    },
    "defaultWarehouseId": {
      "type": "string",
      "format": "uuid"
    },
    "defaultPosId": {
      "type": "string",
      "format": "uuid"
    },
    "defaultCashRegisterId": {
      "type": "string",
      "format": "uuid"
    },
    "defaultPaymentMethods": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "businessDays": {
      "type": "number",
      "example": "[1"
    },
    "holidayCalendarId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/organization.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `defaultCurrency` | `{"type":"string","example":"BIF"}` | non |
| `defaultTaxCategoryId` | `{"type":"string","format":"uuid"}` | non |
| `defaultPriceListId` | `{"type":"string","format":"uuid"}` | non |
| `defaultWarehouseId` | `{"type":"string","format":"uuid"}` | non |
| `defaultPosId` | `{"type":"string","format":"uuid"}` | non |
| `defaultCashRegisterId` | `{"type":"string","format":"uuid"}` | non |
| `defaultPaymentMethods` | `{"type":"array","items":{"type":"string"}}` | non |
| `businessDays` | `{"type":"number","example":"[1"}` | non |
| `holidayCalendarId` | `{"type":"string","format":"uuid"}` | non |

### `OrderLineDto` {#schema-orderlinedto}

Source : `src/modules/sales/presentation/sales.controller.ts`

```json
{
  "type": "object",
  "required": [
    "skuId",
    "quantity"
  ],
  "properties": {
    "skuId": {
      "type": "string",
      "format": "uuid"
    },
    "quantity": {
      "type": "number"
    },
    "discountAmount": {
      "type": "number"
    }
  },
  "x-source-file": "src/modules/sales/presentation/sales.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `skuId` | `{"type":"string","format":"uuid"}` | oui |
| `quantity` | `{"type":"number"}` | oui |
| `discountAmount` | `{"type":"number"}` | non |

### `OrganizationAddressDto` {#schema-organizationaddressdto}

Source : `src/modules/identity/presentation/dto/organization.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "line1": {
      "type": "string"
    },
    "line2": {
      "type": "string"
    },
    "country": {
      "type": "string",
      "example": "BI"
    },
    "province": {
      "type": "string"
    },
    "commune": {
      "type": "string"
    },
    "zone": {
      "type": "string"
    },
    "quartier": {
      "type": "string"
    },
    "city": {
      "type": "string"
    },
    "postalCode": {
      "type": "string"
    },
    "latitude": {
      "type": "number"
    },
    "longitude": {
      "type": "number"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/organization.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `line1` | `{"type":"string"}` | non |
| `line2` | `{"type":"string"}` | non |
| `country` | `{"type":"string","example":"BI"}` | non |
| `province` | `{"type":"string"}` | non |
| `commune` | `{"type":"string"}` | non |
| `zone` | `{"type":"string"}` | non |
| `quartier` | `{"type":"string"}` | non |
| `city` | `{"type":"string"}` | non |
| `postalCode` | `{"type":"string"}` | non |
| `latitude` | `{"type":"number"}` | non |
| `longitude` | `{"type":"number"}` | non |

### `OrganizationContactDto` {#schema-organizationcontactdto}

Source : `src/modules/identity/presentation/dto/organization.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "phone": {
      "type": "string"
    },
    "email": {
      "type": "string"
    },
    "website": {
      "type": "string"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/organization.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `phone` | `{"type":"string"}` | non |
| `email` | `{"type":"string"}` | non |
| `website` | `{"type":"string"}` | non |

### `OrganizationCustomerResponseDto` {#schema-organizationcustomerresponsedto}

Source : `src/modules/customer/presentation/dto/customer-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id",
    "tenantId",
    "organizationId",
    "tenantCustomerId",
    "status",
    "metadata",
    "createdAt",
    "updatedAt"
  ],
  "properties": {
    "id": {
      "type": "string",
      "example": "org-customer-uuid"
    },
    "tenantId": {
      "type": "string",
      "example": "tenant-uuid"
    },
    "organizationId": {
      "type": "string",
      "example": "organization-uuid"
    },
    "tenantCustomerId": {
      "type": "string",
      "example": "tenant-customer-uuid"
    },
    "status": {
      "type": "string",
      "enum": [
        "ACTIVE",
        "INACTIVE",
        "BLOCKED",
        "ARCHIVED"
      ],
      "example": "ACTIVE"
    },
    "localCustomerNumber": {
      "type": "string",
      "example": "LOCAL-001"
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    },
    "createdAt": {
      "type": "string",
      "example": "2026-01-01T00:00:00.000Z"
    },
    "updatedAt": {
      "type": "string",
      "example": "2026-01-01T00:00:00.000Z"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string","example":"org-customer-uuid"}` | oui |
| `tenantId` | `{"type":"string","example":"tenant-uuid"}` | oui |
| `organizationId` | `{"type":"string","example":"organization-uuid"}` | oui |
| `tenantCustomerId` | `{"type":"string","example":"tenant-customer-uuid"}` | oui |
| `status` | `{"type":"string","enum":["ACTIVE","INACTIVE","BLOCKED","ARCHIVED"],"example":"ACTIVE"}` | oui |
| `localCustomerNumber` | `{"type":"string","example":"LOCAL-001"}` | non |
| `metadata` | `{"type":"object","additionalProperties":true}` | oui |
| `createdAt` | `{"type":"string","example":"2026-01-01T00:00:00.000Z"}` | oui |
| `updatedAt` | `{"type":"string","example":"2026-01-01T00:00:00.000Z"}` | oui |

### `OrganizationListItemResponseDto` {#schema-organizationlistitemresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id",
    "name",
    "slug",
    "status"
  ],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "example": "Acme Corp"
    },
    "slug": {
      "type": "string",
      "example": "acme-corp"
    },
    "status": {
      "type": "string",
      "description": "ACTIVE | SUSPENDED | ARCHIVED",
      "example": "ACTIVE"
    },
    "code": {
      "type": "string",
      "nullable": true,
      "example": "HQ-01"
    },
    "parentId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "isPrimary": {
      "type": "boolean"
    },
    "description": {
      "type": "string",
      "nullable": true
    },
    "timezone": {
      "type": "string",
      "nullable": true
    },
    "locale": {
      "type": "string",
      "nullable": true
    },
    "country": {
      "type": "string",
      "nullable": true
    },
    "city": {
      "type": "string",
      "nullable": true
    },
    "province": {
      "type": "string",
      "nullable": true
    },
    "phone": {
      "type": "string",
      "nullable": true
    },
    "email": {
      "type": "string",
      "nullable": true
    },
    "defaultCurrency": {
      "type": "string",
      "nullable": true
    },
    "childCount": {
      "type": "number",
      "description": "Direct children count (tree responses)"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string","format":"uuid"}` | oui |
| `name` | `{"type":"string","example":"Acme Corp"}` | oui |
| `slug` | `{"type":"string","example":"acme-corp"}` | oui |
| `status` | `{"type":"string","description":"ACTIVE \| SUSPENDED \| ARCHIVED","example":"ACTIVE"}` | oui |
| `code` | `{"type":"string","nullable":true,"example":"HQ-01"}` | non |
| `parentId` | `{"type":"string","format":"uuid","nullable":true}` | non |
| `isPrimary` | `{"type":"boolean"}` | non |
| `description` | `{"type":"string","nullable":true}` | non |
| `timezone` | `{"type":"string","nullable":true}` | non |
| `locale` | `{"type":"string","nullable":true}` | non |
| `country` | `{"type":"string","nullable":true}` | non |
| `city` | `{"type":"string","nullable":true}` | non |
| `province` | `{"type":"string","nullable":true}` | non |
| `phone` | `{"type":"string","nullable":true}` | non |
| `email` | `{"type":"string","nullable":true}` | non |
| `defaultCurrency` | `{"type":"string","nullable":true}` | non |
| `childCount` | `{"type":"number","description":"Direct children count (tree responses)"}` | non |

### `OrganizationMembershipResponseDto` {#schema-organizationmembershipresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id",
    "userId",
    "organizationId",
    "tenantId",
    "status",
    "roles",
    "permissions",
    "joinedAt",
    "createdAt",
    "updatedAt"
  ],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "userId": {
      "type": "string",
      "format": "uuid"
    },
    "organizationId": {
      "type": "string",
      "format": "uuid"
    },
    "tenantId": {
      "type": "string",
      "format": "uuid"
    },
    "status": {
      "type": "string",
      "description": "INVITED | ACTIVE | SUSPENDED | REMOVED | EXPIRED",
      "example": "ACTIVE"
    },
    "roles": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "example": [
        "org-admin"
      ]
    },
    "permissions": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "example": [
        "users:read"
      ]
    },
    "department": {
      "type": "string",
      "nullable": true
    },
    "position": {
      "type": "string",
      "nullable": true
    },
    "managerUserId": {
      "type": "string",
      "nullable": true
    },
    "resourceScopes": {
      "type": "array",
      "items": {
        "type": "unknown"
      }
    },
    "joinedAt": {
      "type": "string",
      "format": "date-time"
    },
    "expiresAt": {
      "type": "string",
      "format": "date-time",
      "nullable": true
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string","format":"uuid"}` | oui |
| `userId` | `{"type":"string","format":"uuid"}` | oui |
| `organizationId` | `{"type":"string","format":"uuid"}` | oui |
| `tenantId` | `{"type":"string","format":"uuid"}` | oui |
| `status` | `{"type":"string","description":"INVITED \| ACTIVE \| SUSPENDED \| REMOVED \| EXPIRED","example":"ACTIVE"}` | oui |
| `roles` | `{"type":"array","items":{"type":"string"},"example":["org-admin"]}` | oui |
| `permissions` | `{"type":"array","items":{"type":"string"},"example":["users:read"]}` | oui |
| `department` | `{"type":"string","nullable":true}` | non |
| `position` | `{"type":"string","nullable":true}` | non |
| `managerUserId` | `{"type":"string","nullable":true}` | non |
| `resourceScopes` | `{"type":"array","items":{"type":"unknown"}}` | non |
| `joinedAt` | `{"type":"string","format":"date-time"}` | oui |
| `expiresAt` | `{"type":"string","format":"date-time","nullable":true}` | non |
| `createdAt` | `{"type":"string","format":"date-time"}` | oui |
| `updatedAt` | `{"type":"string","format":"date-time"}` | oui |

### `OrganizationResponseDto` {#schema-organizationresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "tenantId",
    "address",
    "contact",
    "openingHours",
    "operationalSettings",
    "metadata",
    "createdAt",
    "updatedAt"
  ],
  "properties": {
    "tenantId": {
      "type": "string",
      "format": "uuid"
    },
    "keycloakOrganizationId": {
      "type": "string",
      "nullable": true
    },
    "address": {
      "type": "object",
      "additionalProperties": true
    },
    "contact": {
      "type": "object",
      "additionalProperties": true
    },
    "openingHours": {
      "type": "object",
      "additionalProperties": true
    },
    "operationalSettings": {
      "type": "object",
      "additionalProperties": true
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `tenantId` | `{"type":"string","format":"uuid"}` | oui |
| `keycloakOrganizationId` | `{"type":"string","nullable":true}` | non |
| `address` | `{"type":"object","additionalProperties":true}` | oui |
| `contact` | `{"type":"object","additionalProperties":true}` | oui |
| `openingHours` | `{"type":"object","additionalProperties":true}` | oui |
| `operationalSettings` | `{"type":"object","additionalProperties":true}` | oui |
| `metadata` | `{"type":"object","additionalProperties":true}` | oui |
| `createdAt` | `{"type":"string","format":"date-time"}` | oui |
| `updatedAt` | `{"type":"string","format":"date-time"}` | oui |

### `OrganizationSettingsResponseDto` {#schema-organizationsettingsresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "organizationId",
    "namespace",
    "values"
  ],
  "properties": {
    "organizationId": {
      "type": "string",
      "format": "uuid"
    },
    "namespace": {
      "type": "string",
      "example": "ui"
    },
    "values": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `organizationId` | `{"type":"string","format":"uuid"}` | oui |
| `namespace` | `{"type":"string","example":"ui"}` | oui |
| `values` | `{"type":"object","additionalProperties":true}` | oui |

### `OwnershipTransferResponseDto` {#schema-ownershiptransferresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "tenantId",
    "ownerIdentityId"
  ],
  "properties": {
    "tenantId": {
      "type": "string",
      "format": "uuid"
    },
    "ownerIdentityId": {
      "type": "string",
      "description": "Keycloak subject of the new owner"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `tenantId` | `{"type":"string","format":"uuid"}` | oui |
| `ownerIdentityId` | `{"type":"string","description":"Keycloak subject of the new owner"}` | oui |

### `PaginationMetaDto` {#schema-paginationmetadto}

Source : `src/shared/swagger/api-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "page",
    "limit",
    "total",
    "totalPages",
    "hasNext",
    "hasPrevious"
  ],
  "properties": {
    "page": {
      "type": "number",
      "example": 1
    },
    "limit": {
      "type": "number",
      "example": 20
    },
    "total": {
      "type": "number",
      "example": 42
    },
    "totalPages": {
      "type": "number",
      "example": 3
    },
    "hasNext": {
      "type": "boolean",
      "example": true
    },
    "hasPrevious": {
      "type": "boolean",
      "example": false
    },
    "nextCursor": {
      "type": "string",
      "nullable": true,
      "example": null
    }
  },
  "x-source-file": "src/shared/swagger/api-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `page` | `{"type":"number","example":1}` | oui |
| `limit` | `{"type":"number","example":20}` | oui |
| `total` | `{"type":"number","example":42}` | oui |
| `totalPages` | `{"type":"number","example":3}` | oui |
| `hasNext` | `{"type":"boolean","example":true}` | oui |
| `hasPrevious` | `{"type":"boolean","example":false}` | oui |
| `nextCursor` | `{"type":"string","nullable":true,"example":null}` | non |

### `PaginationQueryDto` {#schema-paginationquerydto}

Source : `src/shared/validation/query.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "page": {
      "type": "number",
      "example": 1
    },
    "limit": {
      "type": "number",
      "example": 20
    },
    "cursor": {
      "type": "string",
      "description": "Cursor for cursor-based pagination"
    }
  },
  "x-source-file": "src/shared/validation/query.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `page` | `{"type":"number","example":1}` | non |
| `limit` | `{"type":"number","example":20}` | non |
| `cursor` | `{"type":"string","description":"Cursor for cursor-based pagination"}` | non |

### `PermissionResponseDto` {#schema-permissionresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id",
    "resource",
    "action"
  ],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "resource": {
      "type": "string",
      "example": "users"
    },
    "action": {
      "type": "string",
      "example": "read"
    },
    "description": {
      "type": "string",
      "nullable": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string","format":"uuid"}` | oui |
| `resource` | `{"type":"string","example":"users"}` | oui |
| `action` | `{"type":"string","example":"read"}` | oui |
| `description` | `{"type":"string","nullable":true}` | non |

### `PlatformContextResponseDto` {#schema-platformcontextresponsedto}

Source : `src/modules/platform/presentation/dto/platform-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "roles",
    "permissions"
  ],
  "properties": {
    "tenantId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "organizationId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "userId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "username": {
      "type": "string",
      "nullable": true
    },
    "roles": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "example": [
        "org-admin"
      ]
    },
    "permissions": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "example": "['users:read'"
    },
    "locale": {
      "type": "string",
      "nullable": true
    },
    "timezone": {
      "type": "string",
      "nullable": true
    }
  },
  "x-source-file": "src/modules/platform/presentation/dto/platform-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `tenantId` | `{"type":"string","format":"uuid","nullable":true}` | non |
| `organizationId` | `{"type":"string","format":"uuid","nullable":true}` | non |
| `userId` | `{"type":"string","format":"uuid","nullable":true}` | non |
| `username` | `{"type":"string","nullable":true}` | non |
| `roles` | `{"type":"array","items":{"type":"string"},"example":["org-admin"]}` | oui |
| `permissions` | `{"type":"array","items":{"type":"string"},"example":"['users:read'"}` | oui |
| `locale` | `{"type":"string","nullable":true}` | non |
| `timezone` | `{"type":"string","nullable":true}` | non |

### `PlatformOrganizationListItemResponseDto` {#schema-platformorganizationlistitemresponsedto}

Source : `src/modules/platform/presentation/dto/platform-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id",
    "name",
    "slug",
    "status"
  ],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "example": "Acme Corp"
    },
    "slug": {
      "type": "string",
      "example": "acme-corp"
    },
    "status": {
      "type": "string",
      "example": "ACTIVE"
    },
    "keycloakOrganizationId": {
      "type": "string",
      "nullable": true,
      "description": "Keycloak organization UUID"
    }
  },
  "x-source-file": "src/modules/platform/presentation/dto/platform-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string","format":"uuid"}` | oui |
| `name` | `{"type":"string","example":"Acme Corp"}` | oui |
| `slug` | `{"type":"string","example":"acme-corp"}` | oui |
| `status` | `{"type":"string","example":"ACTIVE"}` | oui |
| `keycloakOrganizationId` | `{"type":"string","nullable":true,"description":"Keycloak organization UUID"}` | non |

### `PlatformTransitionTenantStatusDto` {#schema-platformtransitiontenantstatusdto}

Source : `src/modules/platform/presentation/dto/platform-admin.dto.ts`

```json
{
  "type": "object",
  "required": [
    "status"
  ],
  "properties": {
    "status": {
      "$ref": "#/components/schemas/TenantStatus"
    }
  },
  "x-source-file": "src/modules/platform/presentation/dto/platform-admin.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `status` | `{"$ref":"#/components/schemas/TenantStatus"}` | oui |

### `ProductResponseDto` {#schema-productresponsedto}

Source : `src/modules/catalog/presentation/dto/catalog.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id",
    "organizationId",
    "code",
    "name",
    "status",
    "lotTrackingRequired",
    "serialTrackingRequired",
    "coldChainRequired",
    "controlledSubstance",
    "requiresPrescription",
    "storageConditions",
    "metadata",
    "createdAt",
    "updatedAt"
  ],
  "properties": {
    "id": {
      "type": "string"
    },
    "organizationId": {
      "type": "string"
    },
    "code": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string",
      "nullable": true
    },
    "status": {
      "type": "string"
    },
    "taxCategory": {
      "type": "string",
      "nullable": true
    },
    "lotTrackingRequired": {
      "type": "boolean"
    },
    "serialTrackingRequired": {
      "type": "boolean"
    },
    "coldChainRequired": {
      "type": "boolean"
    },
    "controlledSubstance": {
      "type": "boolean"
    },
    "controlledSchedule": {
      "type": "string",
      "nullable": true
    },
    "requiresPrescription": {
      "type": "boolean"
    },
    "minShelfLifeDays": {
      "type": "number",
      "nullable": true
    },
    "storageConditions": {
      "type": "object",
      "additionalProperties": true
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    },
    "skus": {
      "type": "array",
      "items": {
        "type": "unknown"
      }
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "x-source-file": "src/modules/catalog/presentation/dto/catalog.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string"}` | oui |
| `organizationId` | `{"type":"string"}` | oui |
| `code` | `{"type":"string"}` | oui |
| `name` | `{"type":"string"}` | oui |
| `description` | `{"type":"string","nullable":true}` | non |
| `status` | `{"type":"string"}` | oui |
| `taxCategory` | `{"type":"string","nullable":true}` | non |
| `lotTrackingRequired` | `{"type":"boolean"}` | oui |
| `serialTrackingRequired` | `{"type":"boolean"}` | oui |
| `coldChainRequired` | `{"type":"boolean"}` | oui |
| `controlledSubstance` | `{"type":"boolean"}` | oui |
| `controlledSchedule` | `{"type":"string","nullable":true}` | non |
| `requiresPrescription` | `{"type":"boolean"}` | oui |
| `minShelfLifeDays` | `{"type":"number","nullable":true}` | non |
| `storageConditions` | `{"type":"object","additionalProperties":true}` | oui |
| `metadata` | `{"type":"object","additionalProperties":true}` | oui |
| `skus` | `{"type":"array","items":{"type":"unknown"}}` | non |
| `createdAt` | `{"type":"string","format":"date-time"}` | oui |
| `updatedAt` | `{"type":"string","format":"date-time"}` | oui |

### `PromoteGuestCustomerDto` {#schema-promoteguestcustomerdto}

Source : `src/modules/customer/presentation/dto/customer.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email"
    },
    "phone": {
      "type": "string"
    },
    "firstName": {
      "type": "string"
    },
    "lastName": {
      "type": "string"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `email` | `{"type":"string","format":"email"}` | non |
| `phone` | `{"type":"string"}` | non |
| `firstName` | `{"type":"string"}` | non |
| `lastName` | `{"type":"string"}` | non |

### `ProvisionTenantDto` {#schema-provisiontenantdto}

Source : `src/modules/platform/presentation/dto/platform-admin.dto.ts`

```json
{
  "type": "object",
  "required": [
    "slug"
  ],
  "properties": {
    "slug": {
      "type": "string",
      "description": "Unique tenant slug",
      "example": "pharma-group"
    },
    "region": {
      "type": "string",
      "example": "eu-west-1"
    },
    "environment": {
      "type": "string",
      "example": "production"
    },
    "databaseName": {
      "type": "string",
      "description": "PostgreSQL database name for tenant pool"
    },
    "databaseHost": {
      "type": "string"
    },
    "databasePort": {
      "type": "number"
    },
    "credentialsReference": {
      "type": "string",
      "description": "Secret reference (env: TENANT_DB_PASSWORD). Defaults to TENANT_DB_PASSWORD."
    },
    "ownerIdentityId": {
      "type": "string",
      "description": "Initial tenant owner Keycloak subject id"
    },
    "bootstrapOrganization": {
      "type": "boolean",
      "description": "Create a default Keycloak Organization in the shared realm and mirror it in the control plane (default true)"
    },
    "defaultOrganizationName": {
      "type": "string",
      "description": "Display name for the default organization"
    },
    "defaultOrganizationSlug": {
      "type": "string",
      "description": "Slug/alias for the default Keycloak Organization"
    }
  },
  "x-source-file": "src/modules/platform/presentation/dto/platform-admin.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `slug` | `{"type":"string","description":"Unique tenant slug","example":"pharma-group"}` | oui |
| `region` | `{"type":"string","example":"eu-west-1"}` | non |
| `environment` | `{"type":"string","example":"production"}` | non |
| `databaseName` | `{"type":"string","description":"PostgreSQL database name for tenant pool"}` | non |
| `databaseHost` | `{"type":"string"}` | non |
| `databasePort` | `{"type":"number"}` | non |
| `credentialsReference` | `{"type":"string","description":"Secret reference (env: TENANT_DB_PASSWORD). Defaults to TENANT_DB_PASSWORD."}` | non |
| `ownerIdentityId` | `{"type":"string","description":"Initial tenant owner Keycloak subject id"}` | non |
| `bootstrapOrganization` | `{"type":"boolean","description":"Create a default Keycloak Organization in the shared realm and mirror it in the control plane (default true)"}` | non |
| `defaultOrganizationName` | `{"type":"string","description":"Display name for the default organization"}` | non |
| `defaultOrganizationSlug` | `{"type":"string","description":"Slug/alias for the default Keycloak Organization"}` | non |

### `QuarantineLotDto` {#schema-quarantinelotdto}

Source : `src/modules/inventory/presentation/dto/inventory.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "reason": {
      "type": "string"
    }
  },
  "x-source-file": "src/modules/inventory/presentation/dto/inventory.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `reason` | `{"type":"string"}` | non |

### `RecallLotDto` {#schema-recalllotdto}

Source : `src/modules/inventory/presentation/dto/inventory.dto.ts`

```json
{
  "type": "object",
  "required": [
    "reason"
  ],
  "properties": {
    "reason": {
      "type": "string"
    }
  },
  "x-source-file": "src/modules/inventory/presentation/dto/inventory.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `reason` | `{"type":"string"}` | oui |

### `ReceiveReturnDto` {#schema-receivereturndto}

Source : `src/modules/returns/presentation/returns.controller.ts`

```json
{
  "type": "object",
  "properties": {
    "lineReceipts": {
      "type": "array",
      "items": {
        "type": "object"
      }
    }
  },
  "x-source-file": "src/modules/returns/presentation/returns.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `lineReceipts` | `{"type":"array","items":{"type":"object"}}` | non |

### `ReceiveStockDto` {#schema-receivestockdto}

Source : `src/modules/inventory/presentation/dto/inventory.dto.ts`

```json
{
  "type": "object",
  "required": [
    "warehouseId",
    "skuId",
    "quantity"
  ],
  "properties": {
    "warehouseId": {
      "type": "string",
      "format": "uuid"
    },
    "skuId": {
      "type": "string",
      "format": "uuid"
    },
    "lotNumber": {
      "type": "string",
      "example": "LOT-2026-001"
    },
    "quantity": {
      "type": "number",
      "example": 100
    },
    "expiresAt": {
      "type": "string",
      "example": "2027-12-31"
    },
    "locationId": {
      "type": "string",
      "format": "uuid"
    },
    "ownership": {
      "type": "string",
      "example": "OWNED"
    },
    "consignmentAccountId": {
      "type": "string",
      "format": "uuid"
    },
    "reason": {
      "type": "string"
    },
    "serials": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Required when product has serial tracking"
    }
  },
  "x-source-file": "src/modules/inventory/presentation/dto/inventory.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `warehouseId` | `{"type":"string","format":"uuid"}` | oui |
| `skuId` | `{"type":"string","format":"uuid"}` | oui |
| `lotNumber` | `{"type":"string","example":"LOT-2026-001"}` | non |
| `quantity` | `{"type":"number","example":100}` | oui |
| `expiresAt` | `{"type":"string","example":"2027-12-31"}` | non |
| `locationId` | `{"type":"string","format":"uuid"}` | non |
| `ownership` | `{"type":"string","example":"OWNED"}` | non |
| `consignmentAccountId` | `{"type":"string","format":"uuid"}` | non |
| `reason` | `{"type":"string"}` | non |
| `serials` | `{"type":"array","items":{"type":"string"},"description":"Required when product has serial tracking"}` | non |

### `ReconcileKeycloakResultResponseDto` {#schema-reconcilekeycloakresultresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "tenantId",
    "ranAt",
    "keycloakAvailable",
    "drifts",
    "repairs",
    "summary"
  ],
  "properties": {
    "tenantId": {
      "type": "string",
      "format": "uuid"
    },
    "ranAt": {
      "type": "string",
      "format": "date-time"
    },
    "keycloakAvailable": {
      "type": "boolean"
    },
    "drifts": {
      "type": "array",
      "items": {
        "type": "object"
      }
    },
    "repairs": {
      "type": "array",
      "items": {
        "type": "object"
      }
    },
    "summary": {
      "$ref": "#/components/schemas/ReconciliationSummaryDto"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `tenantId` | `{"type":"string","format":"uuid"}` | oui |
| `ranAt` | `{"type":"string","format":"date-time"}` | oui |
| `keycloakAvailable` | `{"type":"boolean"}` | oui |
| `drifts` | `{"type":"array","items":{"type":"object"}}` | oui |
| `repairs` | `{"type":"array","items":{"type":"object"}}` | oui |
| `summary` | `{"$ref":"#/components/schemas/ReconciliationSummaryDto"}` | oui |

### `ReconciliationDriftDto` {#schema-reconciliationdriftdto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "resourceId",
    "message",
    "severity",
    "repairable"
  ],
  "properties": {
    "resourceId": {
      "type": "string"
    },
    "message": {
      "type": "string"
    },
    "severity": {
      "type": "string",
      "description": "info | warning | critical",
      "example": "warning"
    },
    "repairable": {
      "type": "boolean"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `resourceId` | `{"type":"string"}` | oui |
| `message` | `{"type":"string"}` | oui |
| `severity` | `{"type":"string","description":"info \| warning \| critical","example":"warning"}` | oui |
| `repairable` | `{"type":"boolean"}` | oui |

### `ReconciliationRepairDto` {#schema-reconciliationrepairdto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "resourceId",
    "status"
  ],
  "properties": {
    "resourceId": {
      "type": "string"
    },
    "status": {
      "type": "string",
      "description": "applied | skipped | failed",
      "example": "applied"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `resourceId` | `{"type":"string"}` | oui |
| `status` | `{"type":"string","description":"applied \| skipped \| failed","example":"applied"}` | oui |

### `ReconciliationReportRecordResponseDto` {#schema-reconciliationreportrecordresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id",
    "tenantId",
    "ranAt",
    "keycloakAvailable",
    "summary"
  ],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "tenantId": {
      "type": "string",
      "format": "uuid"
    },
    "ranAt": {
      "type": "string",
      "format": "date-time"
    },
    "keycloakAvailable": {
      "type": "boolean"
    },
    "summary": {
      "$ref": "#/components/schemas/ReconciliationSummaryDto"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string","format":"uuid"}` | oui |
| `tenantId` | `{"type":"string","format":"uuid"}` | oui |
| `ranAt` | `{"type":"string","format":"date-time"}` | oui |
| `keycloakAvailable` | `{"type":"boolean"}` | oui |
| `summary` | `{"$ref":"#/components/schemas/ReconciliationSummaryDto"}` | oui |

### `ReconciliationSummaryDto` {#schema-reconciliationsummarydto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "total",
    "critical",
    "warning",
    "repaired"
  ],
  "properties": {
    "total": {
      "type": "number"
    },
    "critical": {
      "type": "number"
    },
    "warning": {
      "type": "number"
    },
    "repaired": {
      "type": "number"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `total` | `{"type":"number"}` | oui |
| `critical` | `{"type":"number"}` | oui |
| `warning` | `{"type":"number"}` | oui |
| `repaired` | `{"type":"number"}` | oui |

### `RecordLoginDto` {#schema-recordlogindto}

Source : `src/modules/identity/presentation/dto/user.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "eventType": {
      "type": "string",
      "example": "login"
    },
    "success": {
      "type": "boolean"
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/user.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `eventType` | `{"type":"string","example":"login"}` | non |
| `success` | `{"type":"boolean"}` | non |
| `metadata` | `{"type":"object","additionalProperties":true}` | non |

### `RecordPaymentStatusDto` {#schema-recordpaymentstatusdto}

Source : `src/modules/sales/presentation/sales.controller.ts`

```json
{
  "type": "object",
  "required": [
    "status"
  ],
  "properties": {
    "status": {
      "type": "string",
      "enum": [
        "PAID",
        "PARTIALLY_PAID"
      ]
    },
    "amountPaid": {
      "type": "number"
    }
  },
  "x-source-file": "src/modules/sales/presentation/sales.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `status` | `{"type":"string","enum":["PAID","PARTIALLY_PAID"]}` | oui |
| `amountPaid` | `{"type":"number"}` | non |

### `RegisterCustomerDto` {#schema-registercustomerdto}

Source : `src/modules/customer/presentation/dto/customer-b2c.dto.ts`

```json
{
  "type": "object",
  "required": [
    "tenantSlug",
    "email",
    "password"
  ],
  "properties": {
    "tenantSlug": {
      "type": "string",
      "example": "tenant-a"
    },
    "email": {
      "type": "string",
      "format": "email",
      "example": "customer@example.com"
    },
    "password": {
      "type": "string"
    },
    "firstName": {
      "type": "string"
    },
    "lastName": {
      "type": "string"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-b2c.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `tenantSlug` | `{"type":"string","example":"tenant-a"}` | oui |
| `email` | `{"type":"string","format":"email","example":"customer@example.com"}` | oui |
| `password` | `{"type":"string"}` | oui |
| `firstName` | `{"type":"string"}` | non |
| `lastName` | `{"type":"string"}` | non |

### `RemoveAddressResponseDto` {#schema-removeaddressresponsedto}

Source : `src/modules/customer/presentation/dto/customer-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "removed"
  ],
  "properties": {
    "removed": {
      "type": "boolean",
      "example": true
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `removed` | `{"type":"boolean","example":true}` | oui |

### `ReserveStockDto` {#schema-reservestockdto}

Source : `src/modules/inventory/presentation/dto/inventory.dto.ts`

```json
{
  "type": "object",
  "required": [
    "warehouseId",
    "skuId",
    "quantity"
  ],
  "properties": {
    "warehouseId": {
      "type": "string",
      "format": "uuid"
    },
    "skuId": {
      "type": "string",
      "format": "uuid"
    },
    "quantity": {
      "type": "number"
    },
    "salesOrderId": {
      "type": "string",
      "format": "uuid"
    },
    "salesOrderLineId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "x-source-file": "src/modules/inventory/presentation/dto/inventory.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `warehouseId` | `{"type":"string","format":"uuid"}` | oui |
| `skuId` | `{"type":"string","format":"uuid"}` | oui |
| `quantity` | `{"type":"number"}` | oui |
| `salesOrderId` | `{"type":"string","format":"uuid"}` | non |
| `salesOrderLineId` | `{"type":"string","format":"uuid"}` | non |

### `RevokeAllSessionsResponseDto` {#schema-revokeallsessionsresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "revoked"
  ],
  "properties": {
    "revoked": {
      "type": "boolean"
    },
    "count": {
      "type": "number"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `revoked` | `{"type":"boolean"}` | oui |
| `count` | `{"type":"number"}` | non |

### `RevokeSessionDto` {#schema-revokesessiondto}

Source : `src/modules/identity/presentation/dto/security.dto.ts`

```json
{
  "type": "object",
  "required": [
    "sessionId"
  ],
  "properties": {
    "sessionId": {
      "type": "string",
      "description": "Keycloak session ID"
    },
    "denylistCallerToken": {
      "type": "boolean",
      "description": "Also denylist the caller JWT (logout current device)"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/security.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `sessionId` | `{"type":"string","description":"Keycloak session ID"}` | oui |
| `denylistCallerToken` | `{"type":"boolean","description":"Also denylist the caller JWT (logout current device)"}` | non |

### `RoleDeletedResponseDto` {#schema-roledeletedresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "deleted",
    "roleId"
  ],
  "properties": {
    "deleted": {
      "type": "boolean"
    },
    "roleId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `deleted` | `{"type":"boolean"}` | oui |
| `roleId` | `{"type":"string","format":"uuid"}` | oui |

### `RoleResponseDto` {#schema-roleresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id",
    "scope",
    "name",
    "isSystem",
    "createdAt"
  ],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "tenantId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "scope": {
      "type": "string",
      "description": "platform | tenant | organization",
      "example": "tenant"
    },
    "name": {
      "type": "string",
      "example": "org-admin"
    },
    "isSystem": {
      "type": "boolean"
    },
    "description": {
      "type": "string",
      "nullable": true
    },
    "permissions": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Permission catalog keys (resource:action) attached to this role",
      "example": "['organizations:read'"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string","format":"uuid"}` | oui |
| `tenantId` | `{"type":"string","format":"uuid","nullable":true}` | non |
| `scope` | `{"type":"string","description":"platform \| tenant \| organization","example":"tenant"}` | oui |
| `name` | `{"type":"string","example":"org-admin"}` | oui |
| `isSystem` | `{"type":"boolean"}` | oui |
| `description` | `{"type":"string","nullable":true}` | non |
| `permissions` | `{"type":"array","items":{"type":"string"},"description":"Permission catalog keys (resource:action) attached to this role","example":"['organizations:read'"}` | non |
| `createdAt` | `{"type":"string","format":"date-time"}` | oui |

### `RunReconciliationDto` {#schema-runreconciliationdto}

Source : `src/modules/identity/presentation/dto/reconciliation.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "repair": {
      "type": "boolean",
      "description": "Apply automatic repairs for safe drift types (KC org create, membership sync)"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/reconciliation.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `repair` | `{"type":"boolean","description":"Apply automatic repairs for safe drift types (KC org create, membership sync)"}` | non |

### `SalesForecastDto` {#schema-salesforecastdto}

Source : `src/modules/commercial-ai/presentation/commercial-ai.controller.ts`

```json
{
  "type": "object",
  "required": [
    "scope",
    "periodStart",
    "periodEnd",
    "forecastAmount"
  ],
  "properties": {
    "scope": {
      "type": "string",
      "example": "org:channel:retail"
    },
    "periodStart": {
      "type": "string"
    },
    "periodEnd": {
      "type": "string"
    },
    "forecastAmount": {
      "type": "number"
    },
    "currency": {
      "type": "string"
    }
  },
  "x-source-file": "src/modules/commercial-ai/presentation/commercial-ai.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `scope` | `{"type":"string","example":"org:channel:retail"}` | oui |
| `periodStart` | `{"type":"string"}` | oui |
| `periodEnd` | `{"type":"string"}` | oui |
| `forecastAmount` | `{"type":"number"}` | oui |
| `currency` | `{"type":"string"}` | non |

### `SearchQueryDto` {#schema-searchquerydto}

Source : `src/shared/validation/query.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "search": {
      "type": "string"
    },
    "filter": {
      "type": "string"
    }
  },
  "x-source-file": "src/shared/validation/query.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `search` | `{"type":"string"}` | non |
| `filter` | `{"type":"string"}` | non |

### `SecurityPoliciesResponseDto` {#schema-securitypoliciesresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "policies",
    "keycloakAvailable"
  ],
  "properties": {
    "policies": {
      "type": "object",
      "additionalProperties": true,
      "description": "Dynamic policy key/value pairs (mfaRequired, sessionLifetimeSeconds, etc.)"
    },
    "keycloakAvailable": {
      "type": "boolean"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `policies` | `{"type":"object","additionalProperties":true,"description":"Dynamic policy key/value pairs (mfaRequired, sessionLifetimeSeconds, etc.)"}` | oui |
| `keycloakAvailable` | `{"type":"boolean"}` | oui |

### `SendPhoneVerificationDto` {#schema-sendphoneverificationdto}

Source : `src/modules/identity/presentation/dto/user.dto.ts`

```json
{
  "type": "object",
  "required": [
    "phoneE164"
  ],
  "properties": {
    "phoneE164": {
      "type": "string",
      "example": "+243970000000"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/user.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `phoneE164` | `{"type":"string","example":"+243970000000"}` | oui |

### `SessionObjectDto` {#schema-sessionobjectdto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id"
  ],
  "properties": {
    "id": {
      "type": "string",
      "description": "Keycloak session ID"
    },
    "username": {
      "type": "string"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time",
      "nullable": true
    },
    "started": {
      "type": "string",
      "format": "date-time",
      "nullable": true
    },
    "lastAccessedAt": {
      "type": "string",
      "format": "date-time",
      "nullable": true
    },
    "lastAccess": {
      "type": "string",
      "format": "date-time",
      "nullable": true
    },
    "ipAddress": {
      "type": "string",
      "nullable": true
    },
    "userAgent": {
      "type": "string",
      "nullable": true
    },
    "clients": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "browser": {
      "type": "string",
      "nullable": true
    },
    "os": {
      "type": "string",
      "nullable": true
    },
    "device": {
      "type": "string",
      "nullable": true
    },
    "current": {
      "type": "boolean"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string","description":"Keycloak session ID"}` | oui |
| `username` | `{"type":"string"}` | non |
| `createdAt` | `{"type":"string","format":"date-time","nullable":true}` | non |
| `started` | `{"type":"string","format":"date-time","nullable":true}` | non |
| `lastAccessedAt` | `{"type":"string","format":"date-time","nullable":true}` | non |
| `lastAccess` | `{"type":"string","format":"date-time","nullable":true}` | non |
| `ipAddress` | `{"type":"string","nullable":true}` | non |
| `userAgent` | `{"type":"string","nullable":true}` | non |
| `clients` | `{"type":"array","items":{"type":"string"}}` | non |
| `browser` | `{"type":"string","nullable":true}` | non |
| `os` | `{"type":"string","nullable":true}` | non |
| `device` | `{"type":"string","nullable":true}` | non |
| `current` | `{"type":"boolean"}` | non |

### `SessionRevokeResponseDto` {#schema-sessionrevokeresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "revoked"
  ],
  "properties": {
    "revoked": {
      "type": "boolean"
    },
    "sessionId": {
      "type": "string"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `revoked` | `{"type":"boolean"}` | oui |
| `sessionId` | `{"type":"string"}` | non |

### `SessionsListDataResponseDto` {#schema-sessionslistdataresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "sessions",
    "keycloakAvailable"
  ],
  "properties": {
    "sessions": {
      "type": "array",
      "items": {
        "type": "object"
      }
    },
    "keycloakAvailable": {
      "type": "boolean"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `sessions` | `{"type":"array","items":{"type":"object"}}` | oui |
| `keycloakAvailable` | `{"type":"boolean"}` | oui |

### `SetCustomerPatientDto` {#schema-setcustomerpatientdto}

Source : `src/modules/customer/presentation/dto/customer.dto.ts`

```json
{
  "type": "object",
  "required": [
    "isPatient"
  ],
  "properties": {
    "isPatient": {
      "type": "boolean",
      "example": true
    },
    "patientStatus": {
      "type": "string",
      "enum": [
        "ACTIVE",
        "INACTIVE",
        "ARCHIVED"
      ]
    },
    "patientNumber": {
      "type": "string",
      "example": "PAT-000001"
    },
    "patientProfile": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `isPatient` | `{"type":"boolean","example":true}` | oui |
| `patientStatus` | `{"type":"string","enum":["ACTIVE","INACTIVE","ARCHIVED"]}` | non |
| `patientNumber` | `{"type":"string","example":"PAT-000001"}` | non |
| `patientProfile` | `{"type":"object","additionalProperties":true}` | non |

### `SetCustomerStatusDto` {#schema-setcustomerstatusdto}

Source : `src/modules/customer/presentation/dto/customer.dto.ts`

```json
{
  "type": "object",
  "required": [
    "status"
  ],
  "properties": {
    "status": {
      "type": "string",
      "enum": [
        "ACTIVE",
        "INACTIVE"
      ],
      "example": "ACTIVE"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `status` | `{"type":"string","enum":["ACTIVE","INACTIVE"],"example":"ACTIVE"}` | oui |

### `SettingsNamespaceParamDto` {#schema-settingsnamespaceparamdto}

Source : `src/modules/identity/presentation/dto/settings.dto.ts`

```json
{
  "type": "object",
  "required": [
    "namespace"
  ],
  "properties": {
    "namespace": {
      "type": "string",
      "example": "localization"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/settings.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `namespace` | `{"type":"string","example":"localization"}` | oui |

### `SettingsNamespaceResponseDto` {#schema-settingsnamespaceresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "namespace",
    "values"
  ],
  "properties": {
    "namespace": {
      "type": "string",
      "example": "localization"
    },
    "values": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `namespace` | `{"type":"string","example":"localization"}` | oui |
| `values` | `{"type":"object","additionalProperties":true}` | oui |

### `SortQueryDto` {#schema-sortquerydto}

Source : `src/shared/validation/query.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "sort": {
      "type": "string",
      "example": "createdAt:desc"
    },
    "order": {
      "type": "string",
      "enum": [
        "asc",
        "desc"
      ]
    }
  },
  "x-source-file": "src/shared/validation/query.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `sort` | `{"type":"string","example":"createdAt:desc"}` | non |
| `order` | `{"type":"string","enum":["asc","desc"]}` | non |

### `SubstituteBackorderDto` {#schema-substitutebackorderdto}

Source : `src/modules/sales/presentation/sales.controller.ts`

```json
{
  "type": "object",
  "required": [
    "substituteSkuId"
  ],
  "properties": {
    "substituteSkuId": {
      "type": "string",
      "format": "uuid"
    },
    "notes": {
      "type": "string"
    }
  },
  "x-source-file": "src/modules/sales/presentation/sales.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `substituteSkuId` | `{"type":"string","format":"uuid"}` | oui |
| `notes` | `{"type":"string"}` | non |

### `SwitchOrganizationDto` {#schema-switchorganizationdto}

Source : `src/modules/platform/presentation/dto/switch-organization.dto.ts`

```json
{
  "type": "object",
  "required": [
    "organizationId"
  ],
  "properties": {
    "organizationId": {
      "type": "string",
      "format": "uuid",
      "description": "Target organization ID (application UUID)"
    }
  },
  "x-source-file": "src/modules/platform/presentation/dto/switch-organization.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `organizationId` | `{"type":"string","format":"uuid","description":"Target organization ID (application UUID)"}` | oui |

### `SwitchOrganizationResultResponseDto` {#schema-switchorganizationresultresponsedto}

Source : `src/modules/platform/presentation/dto/platform-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "organizationId",
    "refreshRequired"
  ],
  "properties": {
    "organizationId": {
      "type": "string",
      "format": "uuid",
      "description": "Organization that is now active"
    },
    "refreshRequired": {
      "type": "boolean",
      "description": "Client must exchange this for a refreshed JWT"
    }
  },
  "x-source-file": "src/modules/platform/presentation/dto/platform-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `organizationId` | `{"type":"string","format":"uuid","description":"Organization that is now active"}` | oui |
| `refreshRequired` | `{"type":"boolean","description":"Client must exchange this for a refreshed JWT"}` | oui |

### `TenantCustomerResponseDto` {#schema-tenantcustomerresponsedto}

Source : `src/modules/customer/presentation/dto/customer-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id",
    "tenantId",
    "globalCustomerId",
    "customerNumber",
    "status",
    "metadata",
    "totalOrders",
    "totalSpent",
    "isPatient",
    "patientProfile",
    "creditLimit",
    "creditUsed",
    "currencyCode",
    "creditHold",
    "riskLevel",
    "version",
    "createdAt",
    "updatedAt"
  ],
  "properties": {
    "id": {
      "type": "string",
      "example": "tenant-customer-uuid"
    },
    "tenantId": {
      "type": "string",
      "example": "tenant-uuid"
    },
    "globalCustomerId": {
      "type": "string",
      "example": "global-customer-uuid"
    },
    "customerNumber": {
      "type": "string",
      "example": "CUS-000001"
    },
    "status": {
      "type": "string",
      "enum": [
        "ACTIVE",
        "INACTIVE",
        "BLOCKED",
        "ARCHIVED"
      ],
      "example": "ACTIVE"
    },
    "category": {
      "type": "string",
      "example": "PREMIUM"
    },
    "segment": {
      "type": "string",
      "example": "VIP"
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    },
    "firstPurchaseAt": {
      "type": "string",
      "example": "2026-01-01T00:00:00.000Z"
    },
    "lastPurchaseAt": {
      "type": "string",
      "example": "2026-08-01T00:00:00.000Z"
    },
    "totalOrders": {
      "type": "number",
      "example": 3
    },
    "totalSpent": {
      "type": "number",
      "example": 150000
    },
    "isPatient": {
      "type": "boolean",
      "description": "Patient role for this tenant",
      "example": false
    },
    "patientStatus": {
      "type": "string",
      "enum": [
        "ACTIVE",
        "INACTIVE",
        "ARCHIVED"
      ],
      "nullable": true
    },
    "patientNumber": {
      "type": "string",
      "nullable": true,
      "example": "PAT-000001"
    },
    "patientProfile": {
      "type": "object",
      "additionalProperties": true
    },
    "creditLimit": {
      "type": "number",
      "example": 0
    },
    "creditUsed": {
      "type": "number",
      "example": 0
    },
    "paymentTerms": {
      "type": "string",
      "nullable": true,
      "example": "NET30"
    },
    "currencyCode": {
      "type": "string",
      "example": "USD"
    },
    "taxProfileCode": {
      "type": "string",
      "nullable": true
    },
    "customerGroupCode": {
      "type": "string",
      "nullable": true
    },
    "creditHold": {
      "type": "boolean",
      "example": false
    },
    "priceGroupCode": {
      "type": "string",
      "nullable": true
    },
    "riskLevel": {
      "type": "string",
      "enum": [
        "LOW",
        "NORMAL",
        "ELEVATED",
        "HIGH",
        "CRITICAL"
      ],
      "example": "NORMAL"
    },
    "riskScore": {
      "type": "number",
      "nullable": true,
      "example": 12.5
    },
    "defaultBillingAddressId": {
      "type": "string",
      "nullable": true
    },
    "defaultShippingAddressId": {
      "type": "string",
      "nullable": true
    },
    "version": {
      "type": "number",
      "example": 1
    },
    "createdAt": {
      "type": "string",
      "example": "2026-01-01T00:00:00.000Z"
    },
    "updatedAt": {
      "type": "string",
      "example": "2026-01-01T00:00:00.000Z"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string","example":"tenant-customer-uuid"}` | oui |
| `tenantId` | `{"type":"string","example":"tenant-uuid"}` | oui |
| `globalCustomerId` | `{"type":"string","example":"global-customer-uuid"}` | oui |
| `customerNumber` | `{"type":"string","example":"CUS-000001"}` | oui |
| `status` | `{"type":"string","enum":["ACTIVE","INACTIVE","BLOCKED","ARCHIVED"],"example":"ACTIVE"}` | oui |
| `category` | `{"type":"string","example":"PREMIUM"}` | non |
| `segment` | `{"type":"string","example":"VIP"}` | non |
| `metadata` | `{"type":"object","additionalProperties":true}` | oui |
| `firstPurchaseAt` | `{"type":"string","example":"2026-01-01T00:00:00.000Z"}` | non |
| `lastPurchaseAt` | `{"type":"string","example":"2026-08-01T00:00:00.000Z"}` | non |
| `totalOrders` | `{"type":"number","example":3}` | oui |
| `totalSpent` | `{"type":"number","example":150000}` | oui |
| `isPatient` | `{"type":"boolean","description":"Patient role for this tenant","example":false}` | oui |
| `patientStatus` | `{"type":"string","enum":["ACTIVE","INACTIVE","ARCHIVED"],"nullable":true}` | non |
| `patientNumber` | `{"type":"string","nullable":true,"example":"PAT-000001"}` | non |
| `patientProfile` | `{"type":"object","additionalProperties":true}` | oui |
| `creditLimit` | `{"type":"number","example":0}` | oui |
| `creditUsed` | `{"type":"number","example":0}` | oui |
| `paymentTerms` | `{"type":"string","nullable":true,"example":"NET30"}` | non |
| `currencyCode` | `{"type":"string","example":"USD"}` | oui |
| `taxProfileCode` | `{"type":"string","nullable":true}` | non |
| `customerGroupCode` | `{"type":"string","nullable":true}` | non |
| `creditHold` | `{"type":"boolean","example":false}` | oui |
| `priceGroupCode` | `{"type":"string","nullable":true}` | non |
| `riskLevel` | `{"type":"string","enum":["LOW","NORMAL","ELEVATED","HIGH","CRITICAL"],"example":"NORMAL"}` | oui |
| `riskScore` | `{"type":"number","nullable":true,"example":12.5}` | non |
| `defaultBillingAddressId` | `{"type":"string","nullable":true}` | non |
| `defaultShippingAddressId` | `{"type":"string","nullable":true}` | non |
| `version` | `{"type":"number","example":1}` | oui |
| `createdAt` | `{"type":"string","example":"2026-01-01T00:00:00.000Z"}` | oui |
| `updatedAt` | `{"type":"string","example":"2026-01-01T00:00:00.000Z"}` | oui |

### `TenantDatabaseConfigResponseDto` {#schema-tenantdatabaseconfigresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "host",
    "port",
    "name",
    "credentialsReference"
  ],
  "properties": {
    "host": {
      "type": "string",
      "example": "db.example.com"
    },
    "port": {
      "type": "number",
      "example": 5432
    },
    "name": {
      "type": "string",
      "example": "tenant_acme"
    },
    "username": {
      "type": "string",
      "nullable": true,
      "description": "Dedicated PostgreSQL LOGIN role for this tenant database",
      "example": "t_acme_app"
    },
    "credentialsReference": {
      "type": "string",
      "example": "TENANT_DB_PASSWORD"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `host` | `{"type":"string","example":"db.example.com"}` | oui |
| `port` | `{"type":"number","example":5432}` | oui |
| `name` | `{"type":"string","example":"tenant_acme"}` | oui |
| `username` | `{"type":"string","nullable":true,"description":"Dedicated PostgreSQL LOGIN role for this tenant database","example":"t_acme_app"}` | non |
| `credentialsReference` | `{"type":"string","example":"TENANT_DB_PASSWORD"}` | oui |

### `TenantDeprovisionResultResponseDto` {#schema-tenantdeprovisionresultresponsedto}

Source : `src/modules/platform/presentation/dto/platform-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "tenantId",
    "hard"
  ],
  "properties": {
    "tenantId": {
      "type": "string",
      "format": "uuid"
    },
    "hard": {
      "type": "boolean",
      "description": "true = DROP DATABASE/ROLE; false = soft DELETED status only"
    }
  },
  "x-source-file": "src/modules/platform/presentation/dto/platform-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `tenantId` | `{"type":"string","format":"uuid"}` | oui |
| `hard` | `{"type":"boolean","description":"true = DROP DATABASE/ROLE; false = soft DELETED status only"}` | oui |

### `TenantDomainResponseDto` {#schema-tenantdomainresponsedto}

Source : `src/modules/platform/presentation/controllers/tenant-domains.controller.ts`

```json
{
  "type": "object",
  "required": [
    "id",
    "tenantId",
    "hostname",
    "isPrimary",
    "status",
    "verificationMethod",
    "createdAt",
    "updatedAt"
  ],
  "properties": {
    "id": {
      "type": "string"
    },
    "tenantId": {
      "type": "string"
    },
    "hostname": {
      "type": "string"
    },
    "isPrimary": {
      "type": "boolean"
    },
    "status": {
      "type": "string"
    },
    "verificationToken": {
      "type": "string"
    },
    "verificationMethod": {
      "type": "string"
    },
    "verifiedAt": {
      "type": "string",
      "format": "date-time"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "x-source-file": "src/modules/platform/presentation/controllers/tenant-domains.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string"}` | oui |
| `tenantId` | `{"type":"string"}` | oui |
| `hostname` | `{"type":"string"}` | oui |
| `isPrimary` | `{"type":"boolean"}` | oui |
| `status` | `{"type":"string"}` | oui |
| `verificationToken` | `{"type":"string"}` | non |
| `verificationMethod` | `{"type":"string"}` | oui |
| `verifiedAt` | `{"type":"string","format":"date-time"}` | non |
| `createdAt` | `{"type":"string","format":"date-time"}` | oui |
| `updatedAt` | `{"type":"string","format":"date-time"}` | oui |

### `TenantHealthDatabaseDto` {#schema-tenanthealthdatabasedto}

Source : `src/modules/platform/presentation/dto/platform-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "reachable"
  ],
  "properties": {
    "reachable": {
      "type": "boolean"
    },
    "latencyMs": {
      "type": "number"
    },
    "schemaVersions": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "x-source-file": "src/modules/platform/presentation/dto/platform-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `reachable` | `{"type":"boolean"}` | oui |
| `latencyMs` | `{"type":"number"}` | non |
| `schemaVersions` | `{"type":"array","items":{"type":"string"}}` | non |

### `TenantHealthDomainsDto` {#schema-tenanthealthdomainsdto}

Source : `src/modules/platform/presentation/dto/platform-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "total"
  ],
  "properties": {
    "primary": {
      "type": "string",
      "nullable": true
    },
    "total": {
      "type": "number"
    }
  },
  "x-source-file": "src/modules/platform/presentation/dto/platform-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `primary` | `{"type":"string","nullable":true}` | non |
| `total` | `{"type":"number"}` | oui |

### `TenantHealthKeycloakDto` {#schema-tenanthealthkeycloakdto}

Source : `src/modules/platform/presentation/dto/platform-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "organizationsExpected",
    "organizationsPresent",
    "missing"
  ],
  "properties": {
    "organizationsExpected": {
      "type": "number"
    },
    "organizationsPresent": {
      "type": "number"
    },
    "missing": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "x-source-file": "src/modules/platform/presentation/dto/platform-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `organizationsExpected` | `{"type":"number"}` | oui |
| `organizationsPresent` | `{"type":"number"}` | oui |
| `missing` | `{"type":"array","items":{"type":"string"}}` | oui |

### `TenantHealthResponseDto` {#schema-tenanthealthresponsedto}

Source : `src/modules/platform/presentation/dto/platform-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "tenantId",
    "status",
    "database",
    "keycloak",
    "domains",
    "healthy"
  ],
  "properties": {
    "tenantId": {
      "type": "string",
      "format": "uuid"
    },
    "status": {
      "type": "string",
      "example": "ACTIVE"
    },
    "provisioningStep": {
      "type": "string",
      "nullable": true
    },
    "database": {
      "$ref": "#/components/schemas/TenantHealthDatabaseDto"
    },
    "keycloak": {
      "$ref": "#/components/schemas/TenantHealthKeycloakDto"
    },
    "domains": {
      "$ref": "#/components/schemas/TenantHealthDomainsDto"
    },
    "healthy": {
      "type": "boolean"
    }
  },
  "x-source-file": "src/modules/platform/presentation/dto/platform-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `tenantId` | `{"type":"string","format":"uuid"}` | oui |
| `status` | `{"type":"string","example":"ACTIVE"}` | oui |
| `provisioningStep` | `{"type":"string","nullable":true}` | non |
| `database` | `{"$ref":"#/components/schemas/TenantHealthDatabaseDto"}` | oui |
| `keycloak` | `{"$ref":"#/components/schemas/TenantHealthKeycloakDto"}` | oui |
| `domains` | `{"$ref":"#/components/schemas/TenantHealthDomainsDto"}` | oui |
| `healthy` | `{"type":"boolean"}` | oui |

### `TenantProvisioningResultResponseDto` {#schema-tenantprovisioningresultresponsedto}

Source : `src/modules/platform/presentation/dto/platform-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "tenantId",
    "slug",
    "databaseName",
    "databaseUsername",
    "status"
  ],
  "properties": {
    "tenantId": {
      "type": "string",
      "format": "uuid"
    },
    "slug": {
      "type": "string",
      "example": "acme-corp"
    },
    "databaseName": {
      "type": "string",
      "example": "tenant_acme_prod"
    },
    "databaseUsername": {
      "type": "string",
      "description": "Dedicated PostgreSQL LOGIN role",
      "example": "t_acme_prod_app"
    },
    "status": {
      "type": "string",
      "example": "ACTIVE"
    },
    "provisioningStep": {
      "type": "string",
      "nullable": true,
      "example": "READY"
    },
    "defaultOrganizationId": {
      "type": "string",
      "format": "uuid",
      "nullable": true,
      "description": "Default organization created in the shared Keycloak realm (when bootstrap enabled)"
    },
    "failureReason": {
      "type": "string",
      "nullable": true
    },
    "failureStep": {
      "type": "string",
      "nullable": true
    },
    "lastAttemptAt": {
      "type": "string",
      "format": "date-time",
      "nullable": true
    },
    "retryCount": {
      "type": "number",
      "example": 0
    }
  },
  "x-source-file": "src/modules/platform/presentation/dto/platform-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `tenantId` | `{"type":"string","format":"uuid"}` | oui |
| `slug` | `{"type":"string","example":"acme-corp"}` | oui |
| `databaseName` | `{"type":"string","example":"tenant_acme_prod"}` | oui |
| `databaseUsername` | `{"type":"string","description":"Dedicated PostgreSQL LOGIN role","example":"t_acme_prod_app"}` | oui |
| `status` | `{"type":"string","example":"ACTIVE"}` | oui |
| `provisioningStep` | `{"type":"string","nullable":true,"example":"READY"}` | non |
| `defaultOrganizationId` | `{"type":"string","format":"uuid","nullable":true,"description":"Default organization created in the shared Keycloak realm (when bootstrap enabled)"}` | non |
| `failureReason` | `{"type":"string","nullable":true}` | non |
| `failureStep` | `{"type":"string","nullable":true}` | non |
| `lastAttemptAt` | `{"type":"string","format":"date-time","nullable":true}` | non |
| `retryCount` | `{"type":"number","example":0}` | non |

### `TenantResponseDto` {#schema-tenantresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id",
    "slug",
    "status",
    "database",
    "region",
    "environment",
    "legalIdentifiers",
    "timezone",
    "locale",
    "defaultCurrency",
    "defaultLanguage",
    "dateFormat",
    "timeFormat",
    "numberFormat",
    "fiscalCalendar",
    "fiscalYearStartMonth",
    "fiscalYearStartDay",
    "retryCount",
    "createdAt",
    "updatedAt"
  ],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "slug": {
      "type": "string",
      "example": "acme"
    },
    "status": {
      "type": "string",
      "description": "PROVISIONING | ACTIVE | SUSPENDED | READ_ONLY | DEACTIVATING | ARCHIVED | DELETED | FAILED | LOCKED",
      "example": "ACTIVE"
    },
    "database": {
      "$ref": "#/components/schemas/TenantDatabaseConfigResponseDto"
    },
    "region": {
      "type": "string",
      "example": "eu-west-1"
    },
    "environment": {
      "type": "string",
      "example": "production"
    },
    "legalName": {
      "type": "string",
      "nullable": true
    },
    "displayName": {
      "type": "string",
      "nullable": true
    },
    "tradeName": {
      "type": "string",
      "nullable": true
    },
    "description": {
      "type": "string",
      "nullable": true
    },
    "companyType": {
      "type": "string",
      "nullable": true
    },
    "industry": {
      "type": "string",
      "nullable": true
    },
    "registrationNumber": {
      "type": "string",
      "nullable": true
    },
    "taxId": {
      "type": "string",
      "nullable": true
    },
    "commerceRegister": {
      "type": "string",
      "nullable": true
    },
    "legalIdentifiers": {
      "type": "object",
      "additionalProperties": true
    },
    "logoUrl": {
      "type": "string",
      "nullable": true
    },
    "logoCompactUrl": {
      "type": "string",
      "nullable": true
    },
    "faviconUrl": {
      "type": "string",
      "nullable": true
    },
    "country": {
      "type": "string",
      "nullable": true
    },
    "adminRegion": {
      "type": "string",
      "nullable": true
    },
    "city": {
      "type": "string",
      "nullable": true
    },
    "addressLine1": {
      "type": "string",
      "nullable": true
    },
    "addressLine2": {
      "type": "string",
      "nullable": true
    },
    "postalCode": {
      "type": "string",
      "nullable": true
    },
    "phone": {
      "type": "string",
      "nullable": true
    },
    "email": {
      "type": "string",
      "nullable": true
    },
    "website": {
      "type": "string",
      "nullable": true
    },
    "timezone": {
      "type": "string",
      "example": "Africa/Bujumbura"
    },
    "locale": {
      "type": "string",
      "example": "fr-BI"
    },
    "defaultCurrency": {
      "type": "string",
      "example": "BIF"
    },
    "defaultLanguage": {
      "type": "string",
      "example": "fr"
    },
    "dateFormat": {
      "type": "string",
      "example": "DD/MM/YYYY"
    },
    "timeFormat": {
      "type": "string",
      "example": "24h"
    },
    "numberFormat": {
      "type": "string",
      "example": "1 234"
    },
    "fiscalCalendar": {
      "type": "string",
      "example": "gregorian"
    },
    "fiscalYearStartMonth": {
      "type": "number",
      "example": 1
    },
    "fiscalYearStartDay": {
      "type": "number",
      "example": 1
    },
    "primaryContactName": {
      "type": "string",
      "nullable": true
    },
    "primaryContactEmail": {
      "type": "string",
      "nullable": true
    },
    "primaryContactPhone": {
      "type": "string",
      "nullable": true
    },
    "planReference": {
      "type": "string",
      "nullable": true
    },
    "planId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "maxOrganizationsOverride": {
      "type": "number",
      "nullable": true
    },
    "maxUsersOverride": {
      "type": "number",
      "nullable": true
    },
    "maxCustomersOverride": {
      "type": "number",
      "nullable": true
    },
    "maxProductsOverride": {
      "type": "number",
      "nullable": true
    },
    "keycloakRealm": {
      "type": "string",
      "nullable": true,
      "description": "DEPRECATED unused field. Platform uses one shared Keycloak realm; tenants have one or more Keycloak Organizations."
    },
    "provisioningStep": {
      "type": "string",
      "nullable": true
    },
    "failureReason": {
      "type": "string",
      "nullable": true
    },
    "failureStep": {
      "type": "string",
      "nullable": true
    },
    "lastAttemptAt": {
      "type": "string",
      "format": "date-time",
      "nullable": true
    },
    "retryCount": {
      "type": "number",
      "example": 0
    },
    "defaultOrganizationId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "primaryEstablishmentId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "referenceOrganizationId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "provisionIdempotencyKey": {
      "type": "string",
      "nullable": true
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string","format":"uuid"}` | oui |
| `slug` | `{"type":"string","example":"acme"}` | oui |
| `status` | `{"type":"string","description":"PROVISIONING \| ACTIVE \| SUSPENDED \| READ_ONLY \| DEACTIVATING \| ARCHIVED \| DELETED \| FAILED \| LOCKED","example":"ACTIVE"}` | oui |
| `database` | `{"$ref":"#/components/schemas/TenantDatabaseConfigResponseDto"}` | oui |
| `region` | `{"type":"string","example":"eu-west-1"}` | oui |
| `environment` | `{"type":"string","example":"production"}` | oui |
| `legalName` | `{"type":"string","nullable":true}` | non |
| `displayName` | `{"type":"string","nullable":true}` | non |
| `tradeName` | `{"type":"string","nullable":true}` | non |
| `description` | `{"type":"string","nullable":true}` | non |
| `companyType` | `{"type":"string","nullable":true}` | non |
| `industry` | `{"type":"string","nullable":true}` | non |
| `registrationNumber` | `{"type":"string","nullable":true}` | non |
| `taxId` | `{"type":"string","nullable":true}` | non |
| `commerceRegister` | `{"type":"string","nullable":true}` | non |
| `legalIdentifiers` | `{"type":"object","additionalProperties":true}` | oui |
| `logoUrl` | `{"type":"string","nullable":true}` | non |
| `logoCompactUrl` | `{"type":"string","nullable":true}` | non |
| `faviconUrl` | `{"type":"string","nullable":true}` | non |
| `country` | `{"type":"string","nullable":true}` | non |
| `adminRegion` | `{"type":"string","nullable":true}` | non |
| `city` | `{"type":"string","nullable":true}` | non |
| `addressLine1` | `{"type":"string","nullable":true}` | non |
| `addressLine2` | `{"type":"string","nullable":true}` | non |
| `postalCode` | `{"type":"string","nullable":true}` | non |
| `phone` | `{"type":"string","nullable":true}` | non |
| `email` | `{"type":"string","nullable":true}` | non |
| `website` | `{"type":"string","nullable":true}` | non |
| `timezone` | `{"type":"string","example":"Africa/Bujumbura"}` | oui |
| `locale` | `{"type":"string","example":"fr-BI"}` | oui |
| `defaultCurrency` | `{"type":"string","example":"BIF"}` | oui |
| `defaultLanguage` | `{"type":"string","example":"fr"}` | oui |
| `dateFormat` | `{"type":"string","example":"DD/MM/YYYY"}` | oui |
| `timeFormat` | `{"type":"string","example":"24h"}` | oui |
| `numberFormat` | `{"type":"string","example":"1 234"}` | oui |
| `fiscalCalendar` | `{"type":"string","example":"gregorian"}` | oui |
| `fiscalYearStartMonth` | `{"type":"number","example":1}` | oui |
| `fiscalYearStartDay` | `{"type":"number","example":1}` | oui |
| `primaryContactName` | `{"type":"string","nullable":true}` | non |
| `primaryContactEmail` | `{"type":"string","nullable":true}` | non |
| `primaryContactPhone` | `{"type":"string","nullable":true}` | non |
| `planReference` | `{"type":"string","nullable":true}` | non |
| `planId` | `{"type":"string","format":"uuid","nullable":true}` | non |
| `maxOrganizationsOverride` | `{"type":"number","nullable":true}` | non |
| `maxUsersOverride` | `{"type":"number","nullable":true}` | non |
| `maxCustomersOverride` | `{"type":"number","nullable":true}` | non |
| `maxProductsOverride` | `{"type":"number","nullable":true}` | non |
| `keycloakRealm` | `{"type":"string","nullable":true,"description":"DEPRECATED unused field. Platform uses one shared Keycloak realm; tenants have one or more Keycloak Organizations."}` | non |
| `provisioningStep` | `{"type":"string","nullable":true}` | non |
| `failureReason` | `{"type":"string","nullable":true}` | non |
| `failureStep` | `{"type":"string","nullable":true}` | non |
| `lastAttemptAt` | `{"type":"string","format":"date-time","nullable":true}` | non |
| `retryCount` | `{"type":"number","example":0}` | oui |
| `defaultOrganizationId` | `{"type":"string","format":"uuid","nullable":true}` | non |
| `primaryEstablishmentId` | `{"type":"string","format":"uuid","nullable":true}` | non |
| `referenceOrganizationId` | `{"type":"string","format":"uuid","nullable":true}` | non |
| `provisionIdempotencyKey` | `{"type":"string","nullable":true}` | non |
| `createdAt` | `{"type":"string","format":"date-time"}` | oui |
| `updatedAt` | `{"type":"string","format":"date-time"}` | oui |

### `TenantStatus` {#schema-tenantstatus}


```json
{
  "type": "string",
  "enum": [
    "PROVISIONING",
    "ACTIVE",
    "SUSPENDED",
    "READ_ONLY",
    "DEACTIVATING",
    "ARCHIVED",
    "DELETED",
    "FAILED",
    "LOCKED"
  ],
  "description": "Tenant lifecycle status"
}
```

### `TransferOwnershipDto` {#schema-transferownershipdto}

Source : `src/modules/identity/presentation/dto/tenant.dto.ts`

```json
{
  "type": "object",
  "required": [
    "newOwnerIdentityId"
  ],
  "properties": {
    "newOwnerIdentityId": {
      "type": "string",
      "description": "Keycloak subject ID of the new owner",
      "example": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/tenant.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `newOwnerIdentityId` | `{"type":"string","description":"Keycloak subject ID of the new owner","example":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001"}` | oui |

### `TransferStockDto` {#schema-transferstockdto}

Source : `src/modules/inventory/presentation/dto/inventory.dto.ts`

```json
{
  "type": "object",
  "required": [
    "fromWarehouseId",
    "toWarehouseId",
    "lines"
  ],
  "properties": {
    "fromWarehouseId": {
      "type": "string",
      "format": "uuid"
    },
    "toWarehouseId": {
      "type": "string",
      "format": "uuid"
    },
    "transferNumber": {
      "type": "string"
    },
    "notes": {
      "type": "string"
    },
    "lines": {
      "type": "array",
      "items": {
        "type": "object"
      }
    }
  },
  "x-source-file": "src/modules/inventory/presentation/dto/inventory.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `fromWarehouseId` | `{"type":"string","format":"uuid"}` | oui |
| `toWarehouseId` | `{"type":"string","format":"uuid"}` | oui |
| `transferNumber` | `{"type":"string"}` | non |
| `notes` | `{"type":"string"}` | non |
| `lines` | `{"type":"array","items":{"type":"object"}}` | oui |

### `TransferStockLineDto` {#schema-transferstocklinedto}

Source : `src/modules/inventory/presentation/dto/inventory.dto.ts`

```json
{
  "type": "object",
  "required": [
    "skuId",
    "quantity"
  ],
  "properties": {
    "skuId": {
      "type": "string",
      "format": "uuid"
    },
    "lotId": {
      "type": "string",
      "format": "uuid"
    },
    "quantity": {
      "type": "number"
    }
  },
  "x-source-file": "src/modules/inventory/presentation/dto/inventory.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `skuId` | `{"type":"string","format":"uuid"}` | oui |
| `lotId` | `{"type":"string","format":"uuid"}` | non |
| `quantity` | `{"type":"number"}` | oui |

### `TransitionTenantStatusDto` {#schema-transitiontenantstatusdto}

Source : `src/modules/identity/presentation/dto/tenant.dto.ts`

```json
{
  "type": "object",
  "required": [
    "status"
  ],
  "properties": {
    "status": {
      "$ref": "#/components/schemas/TenantStatus"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/tenant.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `status` | `{"$ref":"#/components/schemas/TenantStatus"}` | oui |

### `TrustDeviceDto` {#schema-trustdevicedto}

Source : `src/modules/identity/presentation/dto/user.dto.ts`

```json
{
  "type": "object",
  "required": [
    "trusted"
  ],
  "properties": {
    "trusted": {
      "type": "boolean",
      "example": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/user.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `trusted` | `{"type":"boolean","example":true}` | oui |

### `UpdateBackorderExpectedDto` {#schema-updatebackorderexpecteddto}

Source : `src/modules/sales/presentation/sales.controller.ts`

```json
{
  "type": "object",
  "properties": {
    "expectedAt": {
      "type": "string",
      "nullable": true
    }
  },
  "x-source-file": "src/modules/sales/presentation/sales.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `expectedAt` | `{"type":"string","nullable":true}` | non |

### `UpdateCashRegisterDto` {#schema-updatecashregisterdto}

Source : `src/modules/identity/presentation/dto/organization-ops.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "posTerminalId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "code": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "status": {
      "type": "string",
      "enum": [
        "OPS_STATUSES"
      ]
    },
    "isDefault": {
      "type": "boolean"
    },
    "openingBalance": {
      "type": "number"
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/organization-ops.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `posTerminalId` | `{"type":"string","format":"uuid","nullable":true}` | non |
| `code` | `{"type":"string"}` | non |
| `name` | `{"type":"string"}` | non |
| `status` | `{"type":"string","enum":["OPS_STATUSES"]}` | non |
| `isDefault` | `{"type":"boolean"}` | non |
| `openingBalance` | `{"type":"number"}` | non |
| `metadata` | `{"type":"object","additionalProperties":true}` | non |

### `UpdateCustomerCommercialProfileDto` {#schema-updatecustomercommercialprofiledto}

Source : `src/modules/customer/presentation/dto/customer.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "creditLimit": {
      "type": "number",
      "example": 5000
    },
    "paymentTerms": {
      "type": "string",
      "example": "NET30"
    },
    "currencyCode": {
      "type": "string",
      "example": "USD"
    },
    "taxProfileCode": {
      "type": "string"
    },
    "customerGroupCode": {
      "type": "string"
    },
    "creditHold": {
      "type": "boolean"
    },
    "category": {
      "type": "string"
    },
    "segment": {
      "type": "string"
    },
    "priceGroupCode": {
      "type": "string"
    },
    "riskLevel": {
      "type": "string",
      "enum": [
        "LOW",
        "NORMAL",
        "ELEVATED",
        "HIGH",
        "CRITICAL"
      ]
    },
    "riskScore": {
      "type": "number"
    },
    "defaultBillingAddressId": {
      "type": "string",
      "format": "uuid"
    },
    "defaultShippingAddressId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `creditLimit` | `{"type":"number","example":5000}` | non |
| `paymentTerms` | `{"type":"string","example":"NET30"}` | non |
| `currencyCode` | `{"type":"string","example":"USD"}` | non |
| `taxProfileCode` | `{"type":"string"}` | non |
| `customerGroupCode` | `{"type":"string"}` | non |
| `creditHold` | `{"type":"boolean"}` | non |
| `category` | `{"type":"string"}` | non |
| `segment` | `{"type":"string"}` | non |
| `priceGroupCode` | `{"type":"string"}` | non |
| `riskLevel` | `{"type":"string","enum":["LOW","NORMAL","ELEVATED","HIGH","CRITICAL"]}` | non |
| `riskScore` | `{"type":"number"}` | non |
| `defaultBillingAddressId` | `{"type":"string","format":"uuid"}` | non |
| `defaultShippingAddressId` | `{"type":"string","format":"uuid"}` | non |

### `UpdateCustomerContactDto` {#schema-updatecustomercontactdto}

Source : `src/modules/customer/presentation/dto/customer.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "fullName": {
      "type": "string"
    },
    "role": {
      "type": "string"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "phone": {
      "type": "string"
    },
    "isPrimary": {
      "type": "boolean"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `fullName` | `{"type":"string"}` | non |
| `role` | `{"type":"string"}` | non |
| `email` | `{"type":"string","format":"email"}` | non |
| `phone` | `{"type":"string"}` | non |
| `isPrimary` | `{"type":"boolean"}` | non |

### `UpdateIdentityProviderDto` {#schema-updateidentityproviderdto}

Source : `src/modules/identity/presentation/dto/security.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "displayName": {
      "type": "string"
    },
    "enabled": {
      "type": "boolean"
    },
    "linkOnly": {
      "type": "boolean"
    },
    "config": {
      "type": "object",
      "additionalProperties": true,
      "description": "Merged into existing config; empty secret keeps previous value"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/security.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `displayName` | `{"type":"string"}` | non |
| `enabled` | `{"type":"boolean"}` | non |
| `linkOnly` | `{"type":"boolean"}` | non |
| `config` | `{"type":"object","additionalProperties":true,"description":"Merged into existing config; empty secret keeps previous value"}` | non |

### `UpdateMembershipDto` {#schema-updatemembershipdto}

Source : `src/modules/identity/presentation/dto/membership.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "roles": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "example": [
        "manager"
      ]
    },
    "permissions": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "example": "['organizations:read'"
    },
    "status": {
      "$ref": "#/components/schemas/MembershipStatus"
    },
    "department": {
      "type": "string"
    },
    "position": {
      "type": "string"
    },
    "managerUserId": {
      "type": "string",
      "nullable": true
    },
    "resourceScopes": {
      "type": "array",
      "items": {
        "type": "object"
      }
    },
    "expiresAt": {
      "type": "string",
      "format": "date-time",
      "nullable": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/membership.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `roles` | `{"type":"array","items":{"type":"string"},"example":["manager"]}` | non |
| `permissions` | `{"type":"array","items":{"type":"string"},"example":"['organizations:read'"}` | non |
| `status` | `{"$ref":"#/components/schemas/MembershipStatus"}` | non |
| `department` | `{"type":"string"}` | non |
| `position` | `{"type":"string"}` | non |
| `managerUserId` | `{"type":"string","nullable":true}` | non |
| `resourceScopes` | `{"type":"array","items":{"type":"object"}}` | non |
| `expiresAt` | `{"type":"string","format":"date-time","nullable":true}` | non |

### `UpdateOrganizationDto` {#schema-updateorganizationdto}

Source : `src/modules/identity/presentation/dto/organization.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "slug": {
      "type": "string"
    },
    "code": {
      "type": "string",
      "nullable": true,
      "example": "PAR-01"
    },
    "parentId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "isPrimary": {
      "type": "boolean"
    },
    "description": {
      "type": "string"
    },
    "timezone": {
      "type": "string"
    },
    "locale": {
      "type": "string"
    },
    "address": {
      "$ref": "#/components/schemas/OrganizationAddressDto"
    },
    "contact": {
      "$ref": "#/components/schemas/OrganizationContactDto"
    },
    "openingHours": {
      "$ref": "#/components/schemas/OpeningHoursDto"
    },
    "operationalSettings": {
      "$ref": "#/components/schemas/OperationalSettingsDto"
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/organization.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `name` | `{"type":"string"}` | non |
| `slug` | `{"type":"string"}` | non |
| `code` | `{"type":"string","nullable":true,"example":"PAR-01"}` | non |
| `parentId` | `{"type":"string","format":"uuid","nullable":true}` | non |
| `isPrimary` | `{"type":"boolean"}` | non |
| `description` | `{"type":"string"}` | non |
| `timezone` | `{"type":"string"}` | non |
| `locale` | `{"type":"string"}` | non |
| `address` | `{"$ref":"#/components/schemas/OrganizationAddressDto"}` | non |
| `contact` | `{"$ref":"#/components/schemas/OrganizationContactDto"}` | non |
| `openingHours` | `{"$ref":"#/components/schemas/OpeningHoursDto"}` | non |
| `operationalSettings` | `{"$ref":"#/components/schemas/OperationalSettingsDto"}` | non |
| `metadata` | `{"type":"object","additionalProperties":true}` | non |

### `UpdatePersonalizationDto` {#schema-updatepersonalizationdto}

Source : `src/modules/identity/presentation/dto/user.dto.ts`

```json
{
  "type": "object",
  "required": [
    "personalization"
  ],
  "properties": {
    "personalization": {
      "type": "object",
      "additionalProperties": true,
      "description": "Partial personalization (favorites, pinnedPages, widgets, savedFilters, …)"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/user.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `personalization` | `{"type":"object","additionalProperties":true,"description":"Partial personalization (favorites, pinnedPages, widgets, savedFilters, …)"}` | oui |

### `UpdatePosTerminalDto` {#schema-updateposterminaldto}

Source : `src/modules/identity/presentation/dto/organization-ops.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "warehouseId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "code": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "status": {
      "type": "string",
      "enum": [
        "OPS_STATUSES"
      ]
    },
    "isDefault": {
      "type": "boolean"
    },
    "offlineEnabled": {
      "type": "boolean"
    },
    "receiptTemplate": {
      "type": "string",
      "nullable": true
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/organization-ops.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `warehouseId` | `{"type":"string","format":"uuid","nullable":true}` | non |
| `code` | `{"type":"string"}` | non |
| `name` | `{"type":"string"}` | non |
| `status` | `{"type":"string","enum":["OPS_STATUSES"]}` | non |
| `isDefault` | `{"type":"boolean"}` | non |
| `offlineEnabled` | `{"type":"boolean"}` | non |
| `receiptTemplate` | `{"type":"string","nullable":true}` | non |
| `metadata` | `{"type":"object","additionalProperties":true}` | non |

### `UpdateProductPharmaDto` {#schema-updateproductpharmadto}

Source : `src/modules/catalog/presentation/dto/catalog.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "coldChainRequired": {
      "type": "boolean"
    },
    "controlledSubstance": {
      "type": "boolean"
    },
    "controlledSchedule": {
      "type": "string"
    },
    "requiresPrescription": {
      "type": "boolean"
    },
    "minShelfLifeDays": {
      "type": "number"
    },
    "storageConditions": {
      "type": "object",
      "additionalProperties": true
    },
    "lotTrackingRequired": {
      "type": "boolean"
    },
    "serialTrackingRequired": {
      "type": "boolean"
    }
  },
  "x-source-file": "src/modules/catalog/presentation/dto/catalog.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `coldChainRequired` | `{"type":"boolean"}` | non |
| `controlledSubstance` | `{"type":"boolean"}` | non |
| `controlledSchedule` | `{"type":"string"}` | non |
| `requiresPrescription` | `{"type":"boolean"}` | non |
| `minShelfLifeDays` | `{"type":"number"}` | non |
| `storageConditions` | `{"type":"object","additionalProperties":true}` | non |
| `lotTrackingRequired` | `{"type":"boolean"}` | non |
| `serialTrackingRequired` | `{"type":"boolean"}` | non |

### `UpdateProductStatusDto` {#schema-updateproductstatusdto}

Source : `src/modules/catalog/presentation/dto/catalog.dto.ts`

```json
{
  "type": "object",
  "required": [
    "status"
  ],
  "properties": {
    "status": {
      "type": "string",
      "example": "ACTIVE"
    }
  },
  "x-source-file": "src/modules/catalog/presentation/dto/catalog.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `status` | `{"type":"string","example":"ACTIVE"}` | oui |

### `UpdateRoleDto` {#schema-updateroledto}

Source : `src/modules/identity/presentation/dto/role.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "description": {
      "type": "string"
    },
    "permissions": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/role.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `description` | `{"type":"string"}` | non |
| `permissions` | `{"type":"array","items":{"type":"string"}}` | non |

### `UpdateSecurityPoliciesDto` {#schema-updatesecuritypoliciesdto}

Source : `src/modules/identity/presentation/dto/security.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "mfaPolicy": {
      "type": "string",
      "example": "required_for_admins"
    },
    "mfaMethods": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "example": "['totp'"
    },
    "sessionLifetimeMinutes": {
      "type": "number",
      "example": 480
    },
    "idleTimeoutMinutes": {
      "type": "number",
      "example": 30
    },
    "maxSessionDurationMinutes": {
      "type": "number",
      "example": 1440
    },
    "rememberMe": {
      "type": "boolean"
    },
    "sessionConcurrency": {
      "type": "number"
    },
    "failedLoginThreshold": {
      "type": "number"
    },
    "accountLockoutMinutes": {
      "type": "number"
    },
    "passwordMinLength": {
      "type": "number"
    },
    "passwordRequireUpper": {
      "type": "boolean"
    },
    "passwordRequireNumber": {
      "type": "boolean"
    },
    "passwordRequireSymbol": {
      "type": "boolean"
    },
    "ipAllowlist": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "ipDenylist": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "countryRestrictions": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "suspiciousLoginDetection": {
      "type": "boolean"
    },
    "ssoProviders": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "extra": {
      "type": "object",
      "additionalProperties": true,
      "description": "Additional security policy keys"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/security.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `mfaPolicy` | `{"type":"string","example":"required_for_admins"}` | non |
| `mfaMethods` | `{"type":"array","items":{"type":"string"},"example":"['totp'"}` | non |
| `sessionLifetimeMinutes` | `{"type":"number","example":480}` | non |
| `idleTimeoutMinutes` | `{"type":"number","example":30}` | non |
| `maxSessionDurationMinutes` | `{"type":"number","example":1440}` | non |
| `rememberMe` | `{"type":"boolean"}` | non |
| `sessionConcurrency` | `{"type":"number"}` | non |
| `failedLoginThreshold` | `{"type":"number"}` | non |
| `accountLockoutMinutes` | `{"type":"number"}` | non |
| `passwordMinLength` | `{"type":"number"}` | non |
| `passwordRequireUpper` | `{"type":"boolean"}` | non |
| `passwordRequireNumber` | `{"type":"boolean"}` | non |
| `passwordRequireSymbol` | `{"type":"boolean"}` | non |
| `ipAllowlist` | `{"type":"array","items":{"type":"string"}}` | non |
| `ipDenylist` | `{"type":"array","items":{"type":"string"}}` | non |
| `countryRestrictions` | `{"type":"array","items":{"type":"string"}}` | non |
| `suspiciousLoginDetection` | `{"type":"boolean"}` | non |
| `ssoProviders` | `{"type":"array","items":{"type":"string"}}` | non |
| `extra` | `{"type":"object","additionalProperties":true,"description":"Additional security policy keys"}` | non |

### `UpdateSettingsNamespaceDto` {#schema-updatesettingsnamespacedto}

Source : `src/modules/identity/presentation/dto/settings.dto.ts`

```json
{
  "type": "object",
  "required": [
    "values"
  ],
  "properties": {
    "values": {
      "type": "object",
      "additionalProperties": true,
      "description": "Key-value settings within the namespace"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/settings.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `values` | `{"type":"object","additionalProperties":true,"description":"Key-value settings within the namespace"}` | oui |

### `UpdateShipmentDeliveryDto` {#schema-updateshipmentdeliverydto}

Source : `src/modules/fulfillment/presentation/fulfillment.controller.ts`

```json
{
  "type": "object",
  "properties": {
    "deliveryAddress": {
      "type": "object",
      "additionalProperties": true
    },
    "proofOfDelivery": {
      "$ref": "#/components/schemas/ProofOfDeliveryDto"
    }
  },
  "x-source-file": "src/modules/fulfillment/presentation/fulfillment.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `deliveryAddress` | `{"type":"object","additionalProperties":true}` | non |
| `proofOfDelivery` | `{"$ref":"#/components/schemas/ProofOfDeliveryDto"}` | non |

### `UpdateTenantDto` {#schema-updatetenantdto}

Source : `src/modules/identity/presentation/dto/tenant.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "legalName": {
      "type": "string",
      "example": "Tenant A Legal"
    },
    "displayName": {
      "type": "string",
      "example": "Tenant A"
    },
    "tradeName": {
      "type": "string",
      "example": "Acme Trading"
    },
    "description": {
      "type": "string"
    },
    "companyType": {
      "type": "string",
      "example": "SARL"
    },
    "industry": {
      "type": "string",
      "example": "pharmacy"
    },
    "registrationNumber": {
      "type": "string"
    },
    "taxId": {
      "type": "string"
    },
    "commerceRegister": {
      "type": "string"
    },
    "legalIdentifiers": {
      "type": "object",
      "additionalProperties": true
    },
    "logoUrl": {
      "type": "string"
    },
    "logoCompactUrl": {
      "type": "string"
    },
    "faviconUrl": {
      "type": "string"
    },
    "country": {
      "type": "string",
      "example": "BI"
    },
    "adminRegion": {
      "type": "string",
      "example": "Bujumbura Mairie"
    },
    "city": {
      "type": "string",
      "example": "Bujumbura"
    },
    "addressLine1": {
      "type": "string"
    },
    "addressLine2": {
      "type": "string"
    },
    "postalCode": {
      "type": "string"
    },
    "phone": {
      "type": "string"
    },
    "email": {
      "type": "string"
    },
    "website": {
      "type": "string"
    },
    "timezone": {
      "type": "string",
      "example": "Africa/Bujumbura"
    },
    "locale": {
      "type": "string",
      "example": "fr-BI"
    },
    "defaultCurrency": {
      "type": "string",
      "example": "BIF"
    },
    "defaultLanguage": {
      "type": "string",
      "example": "fr"
    },
    "dateFormat": {
      "type": "string",
      "example": "DD/MM/YYYY"
    },
    "timeFormat": {
      "type": "string",
      "example": "24h"
    },
    "numberFormat": {
      "type": "string",
      "example": "1 234"
    },
    "fiscalCalendar": {
      "type": "string",
      "example": "gregorian"
    },
    "fiscalYearStartMonth": {
      "type": "number",
      "example": 1
    },
    "fiscalYearStartDay": {
      "type": "number",
      "example": 1
    },
    "primaryContactName": {
      "type": "string"
    },
    "primaryContactEmail": {
      "type": "string"
    },
    "primaryContactPhone": {
      "type": "string"
    },
    "planReference": {
      "type": "string"
    },
    "defaultOrganizationId": {
      "type": "string",
      "format": "uuid"
    },
    "primaryEstablishmentId": {
      "type": "string",
      "format": "uuid"
    },
    "referenceOrganizationId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/tenant.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `legalName` | `{"type":"string","example":"Tenant A Legal"}` | non |
| `displayName` | `{"type":"string","example":"Tenant A"}` | non |
| `tradeName` | `{"type":"string","example":"Acme Trading"}` | non |
| `description` | `{"type":"string"}` | non |
| `companyType` | `{"type":"string","example":"SARL"}` | non |
| `industry` | `{"type":"string","example":"pharmacy"}` | non |
| `registrationNumber` | `{"type":"string"}` | non |
| `taxId` | `{"type":"string"}` | non |
| `commerceRegister` | `{"type":"string"}` | non |
| `legalIdentifiers` | `{"type":"object","additionalProperties":true}` | non |
| `logoUrl` | `{"type":"string"}` | non |
| `logoCompactUrl` | `{"type":"string"}` | non |
| `faviconUrl` | `{"type":"string"}` | non |
| `country` | `{"type":"string","example":"BI"}` | non |
| `adminRegion` | `{"type":"string","example":"Bujumbura Mairie"}` | non |
| `city` | `{"type":"string","example":"Bujumbura"}` | non |
| `addressLine1` | `{"type":"string"}` | non |
| `addressLine2` | `{"type":"string"}` | non |
| `postalCode` | `{"type":"string"}` | non |
| `phone` | `{"type":"string"}` | non |
| `email` | `{"type":"string"}` | non |
| `website` | `{"type":"string"}` | non |
| `timezone` | `{"type":"string","example":"Africa/Bujumbura"}` | non |
| `locale` | `{"type":"string","example":"fr-BI"}` | non |
| `defaultCurrency` | `{"type":"string","example":"BIF"}` | non |
| `defaultLanguage` | `{"type":"string","example":"fr"}` | non |
| `dateFormat` | `{"type":"string","example":"DD/MM/YYYY"}` | non |
| `timeFormat` | `{"type":"string","example":"24h"}` | non |
| `numberFormat` | `{"type":"string","example":"1 234"}` | non |
| `fiscalCalendar` | `{"type":"string","example":"gregorian"}` | non |
| `fiscalYearStartMonth` | `{"type":"number","example":1}` | non |
| `fiscalYearStartDay` | `{"type":"number","example":1}` | non |
| `primaryContactName` | `{"type":"string"}` | non |
| `primaryContactEmail` | `{"type":"string"}` | non |
| `primaryContactPhone` | `{"type":"string"}` | non |
| `planReference` | `{"type":"string"}` | non |
| `defaultOrganizationId` | `{"type":"string","format":"uuid"}` | non |
| `primaryEstablishmentId` | `{"type":"string","format":"uuid"}` | non |
| `referenceOrganizationId` | `{"type":"string","format":"uuid"}` | non |

### `UpdateUserPreferencesDto` {#schema-updateuserpreferencesdto}

Source : `src/modules/identity/presentation/dto/user.dto.ts`

```json
{
  "type": "object",
  "required": [
    "settings"
  ],
  "properties": {
    "settings": {
      "type": "object",
      "additionalProperties": true,
      "description": "Flat dotted preference keys (localization.locale, ui.theme, …)"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/user.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `settings` | `{"type":"object","additionalProperties":true,"description":"Flat dotted preference keys (localization.locale, ui.theme, …)"}` | oui |

### `UpdateUserProfileDto` {#schema-updateuserprofiledto}

Source : `src/modules/identity/presentation/dto/user.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "profile": {
      "type": "object",
      "additionalProperties": true,
      "description": "User profile fields (personal, contact, professional). Partial merge."
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/user.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `profile` | `{"type":"object","additionalProperties":true,"description":"User profile fields (personal, contact, professional). Partial merge."}` | non |

### `UpdateWarehouseDto` {#schema-updatewarehousedto}

Source : `src/modules/identity/presentation/dto/organization-ops.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "code": {
      "type": "string",
      "example": "WH-MAIN"
    },
    "name": {
      "type": "string"
    },
    "status": {
      "type": "string",
      "enum": [
        "OPS_STATUSES"
      ]
    },
    "isDefault": {
      "type": "boolean"
    },
    "address": {
      "type": "object",
      "additionalProperties": true
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/organization-ops.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `code` | `{"type":"string","example":"WH-MAIN"}` | non |
| `name` | `{"type":"string"}` | non |
| `status` | `{"type":"string","enum":["OPS_STATUSES"]}` | non |
| `isDefault` | `{"type":"boolean"}` | non |
| `address` | `{"type":"object","additionalProperties":true}` | non |
| `metadata` | `{"type":"object","additionalProperties":true}` | non |

### `UpdateWorkflowDto` {#schema-updateworkflowdto}

Source : `src/modules/identity/presentation/dto/organization-ops.dto.ts`

```json
{
  "type": "object",
  "properties": {
    "code": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "kind": {
      "type": "string",
      "enum": [
        "WORKFLOW_KINDS"
      ]
    },
    "status": {
      "type": "string",
      "enum": [
        "OPS_STATUSES"
      ]
    },
    "conditions": {
      "type": "object",
      "additionalProperties": true
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    },
    "steps": {
      "type": "array",
      "items": {
        "type": "object"
      }
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/organization-ops.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `code` | `{"type":"string"}` | non |
| `name` | `{"type":"string"}` | non |
| `kind` | `{"type":"string","enum":["WORKFLOW_KINDS"]}` | non |
| `status` | `{"type":"string","enum":["OPS_STATUSES"]}` | non |
| `conditions` | `{"type":"object","additionalProperties":true}` | non |
| `metadata` | `{"type":"object","additionalProperties":true}` | non |
| `steps` | `{"type":"array","items":{"type":"object"}}` | non |

### `UploadImportDto` {#schema-uploadimportdto}

Source : `src/modules/commercial-ops/presentation/commercial-ops.controller.ts`

```json
{
  "type": "object",
  "required": [
    "entityType",
    "rows"
  ],
  "properties": {
    "entityType": {
      "$ref": "#/components/schemas/ImportEntityType"
    },
    "fileName": {
      "type": "string"
    },
    "rows": {
      "type": "array",
      "items": {
        "type": "unknown"
      }
    }
  },
  "x-source-file": "src/modules/commercial-ops/presentation/commercial-ops.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `entityType` | `{"$ref":"#/components/schemas/ImportEntityType"}` | oui |
| `fileName` | `{"type":"string"}` | non |
| `rows` | `{"type":"array","items":{"type":"unknown"}}` | oui |

### `UpsertAvailabilityPolicyDto` {#schema-upsertavailabilitypolicydto}

Source : `src/modules/commercial-config/presentation/commercial-config.controller.ts`

```json
{
  "type": "object",
  "properties": {
    "ownershipMode": {
      "type": "string",
      "enum": [
        "DEFAULT",
        "OWNED_ONLY"
      ]
    },
    "status": {
      "type": "string",
      "enum": [
        "ACTIVE",
        "INACTIVE"
      ],
      "additionalProperties": true
    }
  },
  "x-source-file": "src/modules/commercial-config/presentation/commercial-config.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `ownershipMode` | `{"type":"string","enum":["DEFAULT","OWNED_ONLY"]}` | non |
| `status` | `{"type":"string","enum":["ACTIVE","INACTIVE"],"additionalProperties":true}` | non |

### `UpsertOrgConfigDto` {#schema-upsertorgconfigdto}

Source : `src/modules/commercial-config/presentation/commercial-config.controller.ts`

```json
{
  "type": "object",
  "properties": {
    "reservationTimeoutMinutes": {
      "type": "number"
    },
    "transactionRetentionDays": {
      "type": "number"
    }
  },
  "x-source-file": "src/modules/commercial-config/presentation/commercial-config.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `reservationTimeoutMinutes` | `{"type":"number"}` | non |
| `transactionRetentionDays` | `{"type":"number"}` | non |

### `UpsertPolicyDto` {#schema-upsertpolicydto}

Source : `src/modules/rules/presentation/policies.controller.ts`

```json
{
  "type": "object",
  "required": [
    "policyType"
  ],
  "properties": {
    "policyType": {
      "type": "string",
      "enum": [
        "COMMERCIAL_POLICY_TYPES"
      ],
      "example": "ORDER"
    }
  },
  "x-source-file": "src/modules/rules/presentation/policies.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `policyType` | `{"type":"string","enum":["COMMERCIAL_POLICY_TYPES"],"example":"ORDER"}` | oui |

### `UpsertPriorityRuleDto` {#schema-upsertpriorityruledto}

Source : `src/modules/commercial-config/presentation/commercial-config.controller.ts`

```json
{
  "type": "object",
  "required": [
    "criteria"
  ],
  "properties": {
    "criteria": {
      "type": "array",
      "items": {
        "type": "object"
      }
    },
    "status": {
      "type": "string",
      "enum": [
        "ACTIVE",
        "INACTIVE"
      ]
    }
  },
  "x-source-file": "src/modules/commercial-config/presentation/commercial-config.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `criteria` | `{"type":"array","items":{"type":"object"}}` | oui |
| `status` | `{"type":"string","enum":["ACTIVE","INACTIVE"]}` | non |

### `UserCredentialDto` {#schema-usercredentialdto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "id"
  ],
  "properties": {
    "id": {
      "type": "string"
    },
    "userLabel": {
      "type": "string",
      "nullable": true
    },
    "createdDate": {
      "type": "string",
      "format": "date-time",
      "nullable": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `id` | `{"type":"string"}` | oui |
| `userLabel` | `{"type":"string","nullable":true}` | non |
| `createdDate` | `{"type":"string","format":"date-time","nullable":true}` | non |

### `UserEmploymentResponseDto` {#schema-useremploymentresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "organizationId",
    "roles"
  ],
  "properties": {
    "organizationId": {
      "type": "string",
      "format": "uuid"
    },
    "organizationName": {
      "type": "string",
      "nullable": true
    },
    "department": {
      "type": "string",
      "nullable": true
    },
    "position": {
      "type": "string",
      "nullable": true
    },
    "managerUserId": {
      "type": "string",
      "nullable": true
    },
    "joinedAt": {
      "type": "string",
      "format": "date-time",
      "nullable": true
    },
    "status": {
      "type": "string",
      "nullable": true
    },
    "roles": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `organizationId` | `{"type":"string","format":"uuid"}` | oui |
| `organizationName` | `{"type":"string","nullable":true}` | non |
| `department` | `{"type":"string","nullable":true}` | non |
| `position` | `{"type":"string","nullable":true}` | non |
| `managerUserId` | `{"type":"string","nullable":true}` | non |
| `joinedAt` | `{"type":"string","format":"date-time","nullable":true}` | non |
| `status` | `{"type":"string","nullable":true}` | non |
| `roles` | `{"type":"array","items":{"type":"string"}}` | oui |

### `UserOrganizationSummaryResponseDto` {#schema-userorganizationsummaryresponsedto}

Source : `src/modules/identity/presentation/dto/identity-response.dto.ts`

```json
{
  "type": "object",
  "required": [
    "organizationId",
    "roles"
  ],
  "properties": {
    "organizationId": {
      "type": "string",
      "format": "uuid"
    },
    "organizationName": {
      "type": "string",
      "nullable": true
    },
    "roles": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "department": {
      "type": "string",
      "nullable": true
    },
    "position": {
      "type": "string",
      "nullable": true
    },
    "status": {
      "type": "string",
      "nullable": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/identity-response.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `organizationId` | `{"type":"string","format":"uuid"}` | oui |
| `organizationName` | `{"type":"string","nullable":true}` | non |
| `roles` | `{"type":"array","items":{"type":"string"}}` | oui |
| `department` | `{"type":"string","nullable":true}` | non |
| `position` | `{"type":"string","nullable":true}` | non |
| `status` | `{"type":"string","nullable":true}` | non |

### `VerifyDomainTokenDto` {#schema-verifydomaintokendto}

Source : `src/modules/platform/presentation/controllers/tenant-domains.controller.ts`

```json
{
  "type": "object",
  "required": [
    "token"
  ],
  "properties": {
    "token": {
      "type": "string",
      "description": "Verification token returned by /verify/start"
    }
  },
  "x-source-file": "src/modules/platform/presentation/controllers/tenant-domains.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `token` | `{"type":"string","description":"Verification token returned by /verify/start"}` | oui |

### `VerifyPhoneVerificationDto` {#schema-verifyphoneverificationdto}

Source : `src/modules/identity/presentation/dto/user.dto.ts`

```json
{
  "type": "object",
  "required": [
    "phoneE164",
    "code"
  ],
  "properties": {
    "phoneE164": {
      "type": "string",
      "example": "+243970000000"
    },
    "code": {
      "type": "string",
      "example": "123456"
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/user.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `phoneE164` | `{"type":"string","example":"+243970000000"}` | oui |
| `code` | `{"type":"string","example":"123456"}` | oui |

### `VerifyStartResponseDto` {#schema-verifystartresponsedto}

Source : `src/modules/platform/presentation/controllers/tenant-domains.controller.ts`

```json
{
  "type": "object",
  "required": [
    "txtName",
    "token",
    "instructions"
  ],
  "properties": {
    "txtName": {
      "type": "string",
      "description": "DNS TXT record name to create"
    },
    "token": {
      "type": "string",
      "description": "Value to place in the TXT record"
    },
    "instructions": {
      "type": "string",
      "description": "Instruction text"
    }
  },
  "x-source-file": "src/modules/platform/presentation/controllers/tenant-domains.controller.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `txtName` | `{"type":"string","description":"DNS TXT record name to create"}` | oui |
| `token` | `{"type":"string","description":"Value to place in the TXT record"}` | oui |
| `instructions` | `{"type":"string","description":"Instruction text"}` | oui |

### `WithdrawConsentDto` {#schema-withdrawconsentdto}

Source : `src/modules/customer/presentation/dto/customer-b2c.dto.ts`

```json
{
  "type": "object",
  "required": [
    "purpose",
    "policyVersion"
  ],
  "properties": {
    "purpose": {
      "type": "string"
    },
    "policyVersion": {
      "type": "string"
    }
  },
  "x-source-file": "src/modules/customer/presentation/dto/customer-b2c.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `purpose` | `{"type":"string"}` | oui |
| `policyVersion` | `{"type":"string"}` | oui |

### `WorkflowStepDto` {#schema-workflowstepdto}

Source : `src/modules/identity/presentation/dto/organization-ops.dto.ts`

```json
{
  "type": "object",
  "required": [
    "stepIndex",
    "name"
  ],
  "properties": {
    "stepIndex": {
      "type": "number",
      "example": 0
    },
    "name": {
      "type": "string",
      "example": "Manager approval"
    },
    "approverRoles": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "example": [
        "org_admin"
      ]
    },
    "approverUserIds": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "threshold": {
      "type": "object",
      "additionalProperties": true
    },
    "escalation": {
      "type": "object",
      "additionalProperties": true
    },
    "slaHours": {
      "type": "number",
      "nullable": true
    }
  },
  "x-source-file": "src/modules/identity/presentation/dto/organization-ops.dto.ts"
}
```

| Field | Schema | Required |
|-------|--------|----------|
| `stepIndex` | `{"type":"number","example":0}` | oui |
| `name` | `{"type":"string","example":"Manager approval"}` | oui |
| `approverRoles` | `{"type":"array","items":{"type":"string"},"example":["org_admin"]}` | non |
| `approverUserIds` | `{"type":"array","items":{"type":"string"}}` | non |
| `threshold` | `{"type":"object","additionalProperties":true}` | non |
| `escalation` | `{"type":"object","additionalProperties":true}` | non |
| `slaHours` | `{"type":"number","nullable":true}` | non |

---

## 5. Fichier OpenAPI machine-readable

Le JSON complet est versionné dans [`edge-frontend/docs/openapi.json`](./openapi.json).
Quand l’API tourne, préférer `/docs-json` (génération runtime Nest) pour coller à 100 % au process live.
