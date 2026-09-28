# API Coverage Matrix — Staff Edge Frontend

> 112 Nest operations. Staff shell target ≈ 100. Status: `done` | `todo` | `out`.

| Module | Method | Path | Permission | Screen | Status |
|--------|--------|------|------------|--------|--------|
| platform | GET | /platform/context | platform:read | Shell boot | done |
| platform | GET | /platform/organizations | platform:organizations:read | Org switcher | done |
| platform | GET | /platform/me/capabilities | auth | Shell boot | done |
| platform | POST | /platform/organizations/switch | platform:organizations:read | Org switcher | done |
| identity | GET | /organizations | organizations:read | /identity/organizations | done |
| identity | GET | /organizations/:id | organizations:read | /identity/organizations/:id | done |
| identity | POST | /organizations | organizations:create | /identity/organizations | done |
| identity | PATCH | /organizations/:id | organizations:update | /identity/organizations/:id | done |
| identity | POST | /organizations/:id/suspend | organizations:suspend | /identity/organizations/:id | done |
| identity | GET | /users | users:read | /identity/users | done |
| identity | GET | /users/me | users:read | /settings/profile | done |
| identity | PATCH | /users/me | users:update | /settings/profile | done |
| identity | GET | /users/:identityId | users:read | /identity/users/:id | done |
| identity | POST | /users/:id/suspend | users:suspend | /identity/users/:id | done |
| identity | POST | /users/:id/disable | users:suspend | /identity/users/:id | done |
| identity | POST | /users/:id/reactivate | users:update | /identity/users/:id | done |
| identity | GET | /memberships | memberships:read | /identity/memberships | done |
| identity | POST | /memberships | memberships:create | /identity/memberships | done |
| identity | PATCH | /memberships/:id | memberships:update | /identity/memberships | done |
| identity | DELETE | /memberships/:id | memberships:revoke | /identity/memberships | done |
| identity | GET | /invitations | users:invite | /identity/invitations | done |
| identity | POST | /invitations | users:invite | /identity/invitations | done |
| identity | POST | /invitations/accept | users:read | /identity/invitations/accept | done |
| identity | POST | /invitations/:id/revoke | users:invite | /identity/invitations | done |
| identity | GET | /roles | roles:read | /identity/roles | done |
| identity | POST | /roles | roles:create | /identity/roles | done |
| identity | PATCH | /roles/:id | roles:update | /identity/roles | done |
| identity | DELETE | /roles/:id | roles:delete | /identity/roles | done |
| identity | GET | /permissions | permissions:read | /identity/roles | done |
| identity | GET | /tenants/:id | tenant:read | /settings/tenant | done |
| identity | PATCH | /tenants/:id | tenant:update | /settings/tenant | done |
| identity | POST | /tenants/:id/status | tenant:update | /settings/tenant | done |
| identity | POST | /tenants/:id/ownership/transfer | tenant:ownership_transfer | /settings/tenant | done |
| identity | GET | /settings/tenant/:ns | settings:read | /settings | done |
| identity | PATCH | /settings/tenant/:ns | settings:update | /settings | done |
| identity | GET | /settings/organizations/:orgId/:ns | settings:read | /settings | done |
| identity | PATCH | /settings/organizations/:orgId/:ns | settings:update | /settings | done |
| identity | GET | /security/policies | security:read | /settings/authentication | done |
| identity | PATCH | /security/policies | security:update | /settings/authentication | done |
| identity | GET | /security/mfa/status | users:read | /settings/security (compat; prefer me/identity) | done |
| identity | GET | /security/identity-providers | security:read | /settings/identity-providers | done |
| identity | POST | /security/identity-providers | security:update | /settings/identity-providers | done |
| identity | PATCH | /security/identity-providers/:alias | security:update | /settings/identity-providers | done |
| identity | DELETE | /security/identity-providers/:alias | security:update | /settings/identity-providers | done |
| identity | POST | /users/me/identity/phone/send-otp | users:update | /settings/security?tab=account | done |
| identity | POST | /users/me/identity/phone/verify-otp | users:update | /settings/security?tab=account | done |
| identity | GET | /users/me/identity | users:read | /settings/security | done |
| identity | DELETE | /users/me/identity/links/:provider | users:update | /settings/security | done |
| identity | POST | /users/me/identity/verify-email | users:update | /settings/security | done |
| identity | POST | /users/me/identity/reset-password | users:update | /settings/security | done |
| identity | GET | /users/me/security | users:read | /settings/security (compat) | done |
| identity | DELETE | /users/me/security/credentials/:credentialId | users:update | /settings/security | done |
| identity | GET | /users/me/preferences | users:read | /settings/preferences | done |
| identity | PATCH | /users/me/preferences | users:update | /settings/preferences | done |
| identity | GET | /users/me/personalization | users:read | shell personalization | done |
| identity | PATCH | /users/me/personalization | users:update | shell personalization | done |
| identity | GET | /users/me/notifications | users:read | shell notification bell | done |
| identity | POST | /users/me/notifications | users:update | shell / tests | done |
| identity | POST | /users/me/notifications/read-all | users:update | shell notification bell | done |
| identity | POST | /users/me/notifications/:id/read | users:update | shell notification bell | done |
| identity | DELETE | /users/me/notifications/:id | users:update | shell notification bell | done |
| identity | GET | /users/me/devices | users:read | /settings/security?tab=devices | done |
| identity | PATCH | /users/me/devices/:id | users:update | /settings/security?tab=devices | done |
| identity | DELETE | /users/me/devices/:id | users:update | /settings/security?tab=devices | done |
| identity | POST | /users/me/devices/enroll-push | users:update | /settings/security?tab=devices | done |
| identity | DELETE | /users/me/devices/:id/push | users:update | /settings/security?tab=devices | done |
| identity | GET | /users/me/login-history | users:read | /settings/security?tab=history | done |
| identity | POST | /users/me/login-history | users:update | shell boot | done |
| identity | GET | /users/me/activity | users:read | /settings/activity + shell | done |
| identity | POST | /users/me/activity | users:update | shell pushActivity | done |
| identity | DELETE | /users/me/activity | users:update | shell activity clear | done |
| identity | GET | /users/me/api-tokens | users:read | /settings/security?tab=tokens | done |
| identity | POST | /users/me/api-tokens | users:update | /settings/security?tab=tokens | done |
| identity | DELETE | /users/me/api-tokens/:id | users:update | /settings/security?tab=tokens | done |
| identity | GET | /users/me/memberships | users:read | /settings/memberships | done |
| identity | GET | /sessions | users:read | /settings/security | done |
| identity | POST | /sessions/revoke | users:update | /settings/security | done |
| identity | POST | /sessions/logout | users:update | compat (shell uses revoke-all + Keycloak logout) | done |
| identity | POST | /sessions/revoke-all | users:update | /settings/security | done |
| identity | GET | /feature-flags | platform:read | /settings/flags | done |
| identity | GET | /delegations | delegation:read | /identity/delegations | done |
| identity | POST | /delegations | delegation:grant | /identity/delegations | done |
| identity | POST | /delegations/:id/revoke | delegation:grant | /identity/delegations | done |
| identity | GET | /emergency-access | emergency_access:read | /identity/emergency | done |
| identity | POST | /emergency-access | emergency_access:grant | /identity/emergency | done |
| identity | POST | /emergency-access/:id/revoke | emergency_access:grant | /identity/emergency | done |
| customer | GET | /customers | customers:read | /customers | done |
| customer | POST | /customers | customers:create | /customers | done |
| customer | POST | /customers/guest | customers:create | /customers | done |
| customer | POST | /customers/check-duplicates | customers:read | /customers | done |
| customer | POST | /customers/identify | customers:read | /customers | done |
| customer | GET | /customers/:id | customers:read | /customers/:id | done |
| customer | GET | /customers/:id/360 | customers:read | /customers/:id | done |
| customer | GET | /customers/:id/export | customers:export | /customers/:id | done |
| customer | POST | /customers/:id/promote | customers:update | /customers/:id | done |
| customer | POST | /customers/:id/merge | customers:merge | /customers/:id | done |
| customer | POST | /customers/:id/anonymize | customers:delete | /customers/:id | done |
| customer | GET | /customers/:id/consents | customers:read | /customers/:id | done |
| customer | POST | /customers/:id/consents/grant | customers:manage_consent | /customers/:id | done |
| customer | POST | /customers/:id/consents/withdraw | customers:manage_consent | /customers/:id | done |
| customer | GET | /customers/:id/addresses | customers:read | /customers/:id | done |
| customer | GET | /customers/:id/interactions | customers:crm_read | /customers/:id | done |
| customer | POST | /customers/:id/interactions | customers:crm_write | /customers/:id | done |
| customer | POST | /customers/:id/organizations | customers:update | /customers/:id | done |
| customers | GET | /customers?isPatient=true | customers:read | /customers?patient=1 | done |
| customers | PATCH | /customers/:id/patient | customers:set_patient | /customers/:id?tab=patient | done |
| admin | POST | /admin/tenants | platform-admin | /admin/tenants | done |
| admin | POST | /admin/tenants/:id/provisioning/retry | platform-admin | /admin/tenants | done |
| admin | DELETE | /admin/tenants/:id | platform-admin | /admin/tenants | done |
| admin | POST | /admin/tenants/:id/status | platform-admin | /admin/tenants | done |
| admin | GET | /admin/tenants/:id/health | platform-admin | /admin/tenants | done |
| admin | GET | /admin/tenants/:id/domains | platform-admin | /admin/domains | done |
| admin | POST | /admin/tenants/:id/domains | platform-admin | /admin/domains | done |
| admin | POST | /admin/tenants/:id/domains/:did/verify/start | platform-admin | /admin/domains | done |
| admin | POST | /admin/tenants/:id/domains/:did/verify/check | platform-admin | /admin/domains | done |
| admin | POST | /admin/reconciliation/run | tenant:update | /admin/reconciliation | done |
| admin | GET | /admin/reconciliation/report | tenant:read | /admin/reconciliation | done |
| admin | GET | /admin/reconciliation/reports | tenant:read | /admin/reconciliation | done |
| b2c | * | /customer-auth/* /customer/* | — | — | out |
| health | * | /liveness /readiness /health /metrics | — | — | out |
