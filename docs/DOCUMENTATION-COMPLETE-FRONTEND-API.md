# Documentation complète — Frontend & API Platform Core

> **Version document :** 1.4.0  
> **Date / revue :** 2026-09-04  
> **Statut :** contrat API + **Wave 0 Shell as-is** dans `edge-frontend/`  
> **Source de vérité API :** code NestJS (`src/`) + [`openapi.json`](./openapi.json)  
> **Audience :** développeurs frontend, intégrateurs mobile, auditeurs sécurité  
> **Fichier :** `edge-frontend/docs/DOCUMENTATION-COMPLETE-FRONTEND-API.md`

### Contrats obligatoires (lire ensemble)

| Contrat | Fichier | Portée |
|---------|---------|--------|
| Architecture Shell / Identity / Apps | [`MASTER-PROMPT-EDGE-FRONTEND.md`](./MASTER-PROMPT-EDGE-FRONTEND.md) | OS ERP cible |
| UX/UI Design System | [`MASTER-UX-UI-SPECIFICATION.md`](./MASTER-UX-UI-SPECIFICATION.md) | Interaction & densité |
| **Ce document** | `DOCUMENTATION-COMPLETE-FRONTEND-API.md` | HTTP, authz, endpoints |
| OpenAPI machine + lisible | [`openapi.json`](./openapi.json) · [`OPENAPI-SCHEMAS-REFERENCE.md`](./OPENAPI-SCHEMAS-REFERENCE.md) | Schémas |

> Toute UI livrée doit respecter le master prompt **et** le contrat UX. Ne pas inventer un frontend « déjà intégré » : l’état réel est décrit en §3.

### Documents compagnons (référence schémas)

| Artefact | Contenu | Métrique |
|----------|---------|----------|
| **[`OPENAPI-SCHEMAS-REFERENCE.md`](./OPENAPI-SCHEMAS-REFERENCE.md)** | Index opérations + schémas JSON complets | **110** ops · **90** paths · **120** schemas |
| **[`openapi.json`](./openapi.json)** | OpenAPI 3.0.3 (Postman / `openapi-typescript`) | ~300 KB |
| **Swagger UI live** | `http://localhost:3000/docs` — Try it out + Authorize JWT | runtime Nest |
| **OpenAPI live** | `http://localhost:3000/docs-json` | runtime Nest |

```bash
# Régénérer snapshot schémas depuis les décorateurs du code (écrit dans edge-frontend/docs/)
pnpm docs:openapi
```

---

## Table des matières

1. [Vue d’ensemble du projet](#1-vue-densemble-du-projet)
2. [Architecture globale](#2-architecture-globale)
3. [Frontend `edge-frontend` — état actuel et cible](#3-frontend-edge-frontend--état-actuel-et-cible)
4. [Contrats HTTP globaux](#4-contrats-http-globaux)
5. [Authentification & sécurité](#5-authentification--sécurité)
6. [Autorisation (RBAC, modules, step-up)](#6-autorisation-rbac-modules-step-up)
7. [Catalogue complet des endpoints](#7-catalogue-complet-des-endpoints)
8. [Catalogue des permissions](#8-catalogue-des-permissions)
9. [Modèles de domaine & enums](#9-modèles-de-domaine--enums)
10. [Multi-tenancy pour le frontend](#10-multi-tenancy-pour-le-frontend)
11. [Spécifications produit mobile (`docs/backend/`)](#11-spécifications-produit-mobile-docsbackend)
12. [Environnement, CORS, Swagger, local](#12-environnement-cors-swagger-local)
13. [Guide d’intégration frontend (checklist)](#13-guide-dintégration-frontend-checklist)
14. [Écarts docs / code & dettes](#14-écarts-docs--code--dettes)
15. [Flux séquentiels (auth, switch org, B2C)](#15-flux-séquentiels-auth-switch-org-b2c)
16. [Exemples JSON complets (Platform Core)](#16-exemples-json-complets-platform-core)
17. [Catalogue exhaustif des endpoints mobile (specs)](#17-catalogue-exhaustif-des-endpoints-mobile-specs)
18. [Matrice rôles système → permissions](#18-matrice-rôles-système--permissions)
19. [Roadmap UI & mapping écrans → API](#19-roadmap-ui--mapping-écrans--api)
20. [Glossaire](#20-glossaire)
21. [Référence interactive OpenAPI / Swagger (schémas code)](#21-référence-interactive-openapi--swagger-schémas-code)

---

## 1. Vue d’ensemble du projet

**Platform Core** est un backend SaaS multi-tenant (monolithe modulaire NestJS) destiné à une plateforme pharmaceutique / commerce / CRM / ERP, avec :

| Couche | Technologie | Rôle |
|--------|-------------|------|
| API | NestJS + Express | `/api/v1/*` |
| Identité | Keycloak (realm partagé `platform`) | OIDC / JWT / Organisations |
| Données | PostgreSQL (control-plane + **1 DB par tenant**) | Isolation forte |
| Cache / révocation | Redis | Denylist JWT, sessions |
| Messaging | RabbitMQ + outbox transactionnel | Événements d’intégration |
| Frontend staff | Next.js 16 + React 19 + TypeScript (`edge-frontend/`) | **Wave 0 Shell** livré (PKCE + platform boot) |
| App membre (cible) | Specs dans `docs/backend/*` (mock-first) | Majorité **non implémentée** dans Nest |

### Ce que ce dépôt contient réellement côté UI

| Application | Chemin | État (2026-09-04) |
|-------------|--------|-------------------|
| Edge Frontend | `edge-frontend/` | **Wave 0** : Shell + PKCE + platform boot + customers list |
| App mobile patient | *hors repo / mock* | Contrats décrits dans `docs/backend/*.md` |
| Ancien `frontend/platform-web` | *supprimé* | Ne plus référencer comme interim |
| Admin UI complet | *absent* | Swagger `/docs` ou clients futurs |

### Modules backend (bounded contexts)

```text
src/modules/
├── platform/     # context, capabilities, org list/switch, bootstrap session
├── identity/     # tenants, orgs, users, memberships, roles, settings, security
├── customer/     # CRM staff + B2C portal/auth
├── commerce/     # products, carts, orders, loyalty (POS)
└── pharmacy/     # patients cliniques
```

Modules ERP futurs (Inventory, Accounting, HR, …) : **vision** dans le master prompt — pas d’API Nest aujourd’hui. UX = `NOT_SUBSCRIBED` / adapter typé, jamais de fake data sécurisée.

---

## 2. Architecture globale

```text
Browser (edge-frontend :3001)
        │
        │  Wave 0 (interim) : SPA PKCE → Bearer JWT
        │  Cible prod      : BFF session HttpOnly → API
        ▼
┌───────────────────┐     ┌────────────────────┐
│ Keycloak realm    │◄────│ Platform Core Nest │
│ platform          │     │ /api/v1/*          │
└───────────────────┘     └─────────┬──────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              Control-plane DB  Tenant DB(s)     Redis
```

### Règles non négociables

1. **Un tenant par session** — résolu Host + JWT/membership. Pas de Tenant Switcher end-user (v1).  
2. **Plusieurs organisations** du même tenant — switch via API + refresh JWT.  
3. **Permissions / rôles par organisation** active.  
4. Jamais de `tenantId` client pour autoriser.  
5. Backend = autorité finale ; UI permission-aware (contrat UX §120).  
6. Enveloppes : `{ data }` / `{ data, pagination }` / `{ error }`.

### Auth — décision d’architecture (alignée master prompt)

| Phase | Mécanisme | Statut |
|-------|-----------|--------|
| **Cible production** | BFF Next.js Route Handlers + cookie session HttpOnly + code flow Keycloak ; bootstrap BFF `GET /api/bootstrap` orchestre Nest | À implémenter |
| **Wave 0 (interim)** | SPA PKCE **dans** `edge-frontend` (pas `platform-web`) ; access token en mémoire ; appels `Authorization: Bearer` vers Nest | **Livré** |
| **Interdit** | Mode démo / fixtures qui simulent permissions ; refresh token en `localStorage` ; fake 200 sur APIs protégées |

Mapping bootstrap BFF ↔ Nest actuel :

| Besoin Shell | Nest aujourd’hui | BFF cible |
|--------------|------------------|-----------|
| Contexte session | `GET /api/v1/platform/context` | agrégé dans `/api/bootstrap` |
| Capabilities | `GET /api/v1/platform/me/capabilities` | idem |
| Orgs | `GET /api/v1/platform/organizations` | idem |
| Switch org | `POST /api/v1/platform/organizations/switch` | BFF valide + refresh session |

---

## 3. Frontend `edge-frontend` — état actuel et cible

### 3.1 Identité du package (as-is Wave 0)

| Champ | Valeur |
|-------|--------|
| Chemin | `edge-frontend/` |
| Nom | `edge-frontend@0.1.0` |
| Stack | Next.js 16.3, React 19.2, TypeScript 5, Tailwind CSS 4, TanStack Query, keycloak-js, Radix, Motion, Lucide |
| Architecture | App Router + Global Shell (`components/shell`, `shell/`, `applications/`) |
| Port FE | **3001** (`pnpm dev`) |
| Auth | Wave 0 SPA PKCE (`keycloak-js`, token mémoire) — **pas** de mode démo |
| API | Client envelope `lib/api` → Nest `/api/v1` (Bearer) |
| OpenAPI types | `types/openapi.d.ts` généré + `types/platform.ts` Wave 0 helpers |

### 3.2 Arborescence réelle (as-is)

```text
edge-frontend/
├── app/(shell)/          # AuthGate + ShellChrome + pages
├── applications/         # manifests Wave 1 + futurs
├── components/ui|shell/
├── lib/api|auth|access/
├── providers/
├── shell/
├── types/platform.ts
├── docs/
├── .env.example
└── package.json
```

### 3.3 Scripts

| Script | Commande | État |
|--------|----------|------|
| `dev` | `next dev -p 3001` | OK |
| `build` / `lint` | | OK |
| `openapi:types` | `openapi-typescript …` | OK (après fix `TenantStatus`) |

### 3.4 Configuration

Voir `.env.example`. CORS Nest : `http://localhost:3001` dans `CORS_ORIGINS`.

### 3.5 Auth & API Wave 0 livré

- PKCE S256 + boot context / capabilities / organizations
- Org switch + refresh JWT + invalidation TanStack Query
- PermissionGate / sidebar filtrée ; pas de Tenant Switcher
- Sans Keycloak env → « Configuration required » (zéro fake permissions)

### 3.6 Couverture API

| Domaine | Consommé |
|---------|----------|
| Context / orgs / switch | Oui |
| Capabilities | Oui |
| Customers list | Oui (DataTable) |
| Commerce products | Oui (DataTable) |
| Pharmacy patients | Oui (DataTable) |
| CmdK / Search | Oui (navigation, apps, orgs, density/theme) |
| Inventory / Accounting / HR | NOT_SUBSCRIBED manifests |

### 3.7 Suite

BFF HttpOnly, saved views / bulk actions, écrans détail, POS mobile.

---

## 4. Contrats HTTP globaux

### 4.1 Enveloppe succès

**Objet unique :**

```json
{ "data": { /* payload */ } }
```

**Liste paginée :**

```json
{
  "data": [ /* ... */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3,
    "hasNext": true,
    "hasPrevious": false,
    "nextCursor": null
  }
}
```

### 4.2 Query pagination (`PaginationQueryDto`)

| Param | Type | Contraintes | Défaut typique |
|-------|------|-------------|----------------|
| `page` | number | ≥ 1 | 1 |
| `limit` | number | 1–100 | 20 |
| `cursor` | string | optionnel | — |

Autres helpers : `sort` / `order` (`SortQueryDto`), `search` / `filter` (`SearchQueryDto`) — utilisés selon endpoint.

### 4.3 Enveloppe erreur

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied",
    "details": [],
    "requestId": "req-...",
    "correlationId": "corr-..."
  }
}
```

| Code domaine | HTTP |
|--------------|------|
| `VALIDATION_ERROR` | 400 |
| `UNAUTHORIZED` | 401 |
| `FORBIDDEN` | 403 |
| `TENANT_NOT_FOUND` | **403** (anti-énumération, message générique) |
| `ORGANIZATION_NOT_FOUND` | **403** (idem) |
| `RESOURCE_NOT_FOUND` | 404 |
| `CONFLICT` / `IDEMPOTENCY_CONFLICT` | 409 |
| `RATE_LIMITED` | 429 |
| `DEPENDENCY_UNAVAILABLE` | 503 |
| `INTERNAL_ERROR` | 500 |

Validation Nest (`ValidationPipe`) : `whitelist`, `forbidNonWhitelisted`, `transform`.

### 4.4 Headers standards

| Header | Obligatoire | Usage |
|--------|-------------|-------|
| `Authorization: Bearer <JWT>` | Oui (sauf `@Public`) | Auth |
| `Content-Type: application/json` | Sur body JSON | |
| `X-Request-Id` | Optionnel | Tracing |
| `X-Correlation-Id` | Optionnel | Tracing |
| `Idempotency-Key` | **Oui** sur `POST /admin/tenants` | Provisioning |
| `x-csrf-token` | Si `CSRF_ENABLED=true` | Doit matcher cookie `csrf-token` |
| `Host` / `X-Forwarded-Host` | Implicite | Binding domaine tenant |

### 4.5 CORS

- `credentials: true`
- Origins : URL publique résolue + `CORS_ORIGINS`
- Headers autorisés : `Content-Type`, `Authorization`, `X-Request-Id`, `X-Correlation-Id`, `Idempotency-Key`

### 4.6 Rate limiting

- Global : `RATE_LIMIT_TTL` (60s) × `RATE_LIMIT_LIMIT` (100)
- `CustomerAuthController` : **15 req / 60s**

---

## 5. Authentification & sécurité

### 5.1 Clients Keycloak

| Client | Usage |
|--------|-------|
| `edge-frontend` | Application Next.js staff en cours d’intégration |
| `platform-api` | Audience API staff |
| `platform-b2c` | Customers B2C |
| `platform-admin` | Admin API Keycloak + rôle `platform-admin` |

Realm unique partagé : **`platform`** (pas de realm-per-tenant).

### 5.2 Staff JWT (AuthGuard)

Claims attendus (simplifié) :

- `sub` — identité Keycloak
- `tenant_id` — **obligatoire**
- claims organisation (id / alias KC)
- `realm_access` / client roles
- optionnel : `permissions`, `acr` / `amr`, `jti`, `azp`

Validation : JWKS (`jose`) ; introspection optionnelle ; denylist Redis sur logout / revoke.

### 5.3 B2C (`@CustomerRoute` + CustomerAuthGuard)

JWT client `platform-b2c`. Pas de `@RequirePermissions` sur le portail client — isolation via identité customer liée au tenant.

### 5.4 Public (`@Public`)

Health, metrics, `POST /api/v1/customer-auth/*`.

### 5.5 CSRF

- Désactivé par défaut (`CSRF_ENABLED=false`)
- Si activé : cookie `csrf-token` (non httpOnly) + header `x-csrf-token` sur méthodes non-safe ; comparaison `timingSafeEqual`

### 5.6 Helmet / compression / cookies

- Helmet hors `development`
- Compression on
- `cookie-parser` on

### 5.7 Step-up MFA

`@RequireStepUp('1')` exige un niveau `acr`/`amr` suffisant dans le JWT. Utilisé notamment pour :

- Transfert d’ownership tenant
- Grant emergency access

---

## 6. Autorisation (RBAC, modules, step-up)

### 6.1 Fusion des permissions (`AuthorizationService`)

1. Permissions membership org active  
2. Permissions des rôles (catalogue DB)  
3. Délégations actives (grantee)  
4. Emergency access (operator, `scope.permissions`)  
5. Claim JWT `permissions` **uniquement si** déjà dérivable du catalogue / sources 1–4 (claims forgés ignorés)

### 6.2 Modules plan (`@RequireModule`)

| Module key | Contrôleurs |
|------------|-------------|
| `customer` | Customers staff + Customer portal |
| `commerce` | CommerceController |
| `pharmacy` | PharmacyPatientsController |

Capabilities effectives : `GET /api/v1/platform/me/capabilities` → `modules`, `features`, `navigationHints`, `plan`, `organizations`.

### 6.3 Platform admin

Rôle realm `platform-admin` → APIs `/api/v1/admin/tenants*`.

### 6.4 Last-admin protection

Révoquer le dernier admin tenant est refusé tant que l’ownership n’est pas transféré.

---

## 7. Catalogue complet des endpoints

Convention : chemins complets. Sauf mention, auth **Bearer staff**, succès **200** (`@ApiOkDataResponse`) ou **201** (`@ApiCreatedDataResponse`).

---

### 7.1 Health & Metrics (public, non versionnés)

#### `GET /liveness`

| | |
|--|--|
| Auth | Public |
| Response | `{ "status": "ok" }` |

#### `GET /readiness`

| | |
|--|--|
| Auth | Public |
| 200 / 503 | `{ status, checks: { controlPlaneDb, redis, rabbitmq } }` |

#### `GET /health`

| | |
|--|--|
| Auth | Public |
| Response | `{ status, service: "platform-core", version: "0.0.1" }` |

#### `GET /metrics`

| | |
|--|--|
| Auth | Public ; si `METRICS_AUTH_TOKEN` → Bearer token dédié |
| Format | Prometheus text |
| 401 | Token incorrect |

---

### 7.2 Platform

#### `GET /api/v1/platform/context`

| | |
|--|--|
| Permission | `platform:read` |
| Response `data` | `PlatformContextResponseDto` (voir §3.7) |

#### `GET /api/v1/platform/organizations`

| | |
|--|--|
| Permission | `platform:organizations:read` |
| Query | Pagination |
| Response `data[]` | `{ id, name, slug, status, keycloakOrganizationId? }` |

#### `GET /api/v1/platform/me/capabilities`

| | |
|--|--|
| Auth | Bearer (pas de permission dédiée au-delà de l’auth) |
| Response `data` | |

```ts
{
  plan: { code, name, maxOrganizations, maxUsers } | null;
  modules: Record<string, boolean>;      // ex. { identity: true, commerce: false }
  permissions: string[];
  features: Record<string, boolean>;
  organizations: { id, name, slug, type, status }[];
  defaultOrganizationId: string | null;
  navigationHints: string[];             // modules enabled ∩ permissions user
}
```

#### `POST /api/v1/platform/organizations/switch`

| | |
|--|--|
| Permission | `platform:organizations:read` |
| Audit | oui |
| Status | **201** |
| Body | |

```json
{ "organizationId": "<uuid>" }
```

| Response `data` | `{ "organizationId": "<uuid>", "refreshRequired": true }` |

**Contrat frontend :** après succès, **toujours** rafraîchir le JWT Keycloak.

---

### 7.3 Admin — Tenants

Classe : `@RequireRoles('platform-admin')`.

#### `POST /api/v1/admin/tenants`

| | |
|--|--|
| Header | **`Idempotency-Key` requis** |
| Status | 201 |
| Body `ProvisionTenantDto` | |

| Champ | Requis | Validation |
|-------|--------|------------|
| `slug` | oui | 2–100, `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` |
| `region` | non | string |
| `environment` | non | string |
| `databaseName` | non | max 63 |
| `databaseHost` | non | string |
| `databasePort` | non | int ≥ 1 |
| `credentialsReference` | non | string |
| `ownerIdentityId` | non | Keycloak sub |
| `bootstrapOrganization` | non | bool (défaut true) |
| `defaultOrganizationName` | non | max 255 |
| `defaultOrganizationSlug` | non | slug pattern |

**Response `data` (`TenantProvisioningResultResponseDto`) :**

```ts
{
  tenantId, slug, databaseName, databaseUsername, status,
  provisioningStep?, defaultOrganizationId?,
  failureReason?, failureStep?, lastAttemptAt?, retryCount?
}
```

Saga steps : `REQUESTED → DB_CREATED → MIGRATED → IDENTITY_CONFIGURED → ORG_CONFIGURED → ADMIN_CONFIGURED → READY`.

#### `POST /api/v1/admin/tenants/:tenantId/provisioning/retry`

| | |
|--|--|
| Path | `tenantId` UUID |
| Status | 201 |
| Response | même provisioning result |

#### `DELETE /api/v1/admin/tenants/:tenantId`

| | |
|--|--|
| Query | `hard` = `true` \| `1` → DROP DB/ROLE ; sinon soft `DELETED` |
| Response | `{ tenantId, hard }` |

#### `POST /api/v1/admin/tenants/:tenantId/status`

| Body | `{ "status": TenantStatus }` |
| Response | `TenantResponseDto` |

#### `GET /api/v1/admin/tenants/:tenantId/health`

```ts
{
  tenantId, status, provisioningStep,
  database: { reachable, latencyMs?, schemaVersions? },
  keycloak: { organizationsExpected, organizationsPresent, missing: string[] },
  domains: { primary, total },
  healthy: boolean
}
```

---

### 7.4 Admin — Domaines tenant

Préfixe : `/api/v1/admin/tenants/:tenantId/domains` — rôle `platform-admin`.

#### `GET .../domains`

Response `data[]` :

```ts
{
  id, tenantId, hostname,
  type: "SUBDOMAIN" | "CUSTOM",
  isPrimary, status,
  verificationToken?, verificationMethod,
  verifiedAt?, createdAt, updatedAt
}
```

#### `POST .../domains` (201)

Body :

```json
{ "hostname": "acme.example.com", "type": "CUSTOM" }
```

#### `POST .../domains/:domainId/verify/start` (201)

Response :

```json
{
  "txtName": "...",
  "token": "...",
  "instructions": "..."
}
```

#### `POST .../domains/:domainId/verify/check`

Body : `{ "token": "<string min 1>" }` → domaine mis à jour.

---

### 7.5 Tenants (tenant-scoped)

#### `GET /api/v1/tenants/:tenantId`

| Permission | `tenant:read` |
| Response | `TenantResponseDto` |

```ts
{
  id, slug, status,
  database: { host, port, name, username?, credentialsReference },
  region, environment,
  legalName?, displayName?, description?, logoUrl?, country?,
  timezone, locale, defaultCurrency, defaultLanguage, dateFormat, numberFormat,
  planReference?,
  keycloakRealm?, // DEPRECATED
  createdAt, updatedAt
}
```

#### `PATCH /api/v1/tenants/:tenantId`

| Permission | `tenant:update` |
| Body | `UpdateTenantDto` (tous optionnels) : `legalName`, `displayName`, `description`, `logoUrl`, `country` (max 2), `timezone`, `locale`, `defaultCurrency`, `defaultLanguage`, `dateFormat`, `numberFormat`, `planReference` |

#### `POST /api/v1/tenants/:tenantId/status`

| Permission | `tenant:update` |
| Body | `{ "status": TenantStatus }` |

#### `POST /api/v1/tenants/:tenantId/ownership/transfer`

| Permission | `tenant:ownership_transfer` |
| Step-up | `@RequireStepUp('1')` |
| Body | `{ "newOwnerIdentityId": "<keycloak-sub>" }` |
| Response | `{ tenantId, ownerIdentityId }` |

---

### 7.6 Organizations

#### `GET /api/v1/organizations`

| Permission | `organizations:read` |
| Query | Pagination |
| Item | `{ id, name, slug, status, description? }` |

#### `GET /api/v1/organizations/:organizationId`

| Permission | `organizations:read` |
| Full | + `tenantId`, `timezone`, `locale`, `address`, `contact`, `metadata`, timestamps |

#### `POST /api/v1/organizations` (201)

Body `CreateOrganizationDto` :

| Champ | Requis | Rules |
|-------|--------|-------|
| `name` | oui | max 255 |
| `slug` | oui | slug regex, max 100 |
| `description` | non | |
| `timezone` | non | |
| `locale` | non | |

> Pas de champ `type` sur le DTO create (contrairement à certaines docs anciennes).

#### `PATCH /api/v1/organizations/:organizationId`

| Permission | `organizations:update` |
| Body | champs Create optionnels |

#### `POST /api/v1/organizations/:organizationId/suspend`

| Permission | `organizations:suspend` |

---

### 7.7 Users

#### `GET /api/v1/users`

| Permission | `users:read` |
| Query | Pagination + `status?: ApplicationUserStatus` |

#### `GET /api/v1/users/me` / `PATCH /api/v1/users/me`

| GET perm | `users:read` |
| PATCH perm | `users:update` |
| PATCH body | `{ "profile": { firstName?, lastName?, displayName?, avatarUrl?, email? } }` |

#### `GET /api/v1/users/:identityId`

| Path | Keycloak `sub` |
| Perm | `users:read` |

#### `POST .../suspend` | `.../disable`

| Perm | `users:suspend` |

#### `POST .../reactivate`

| Perm | `users:update` |

**Response user :**

```ts
{
  id, identityId, tenantId, status,
  profile: { firstName?, lastName?, displayName?, avatarUrl?, email? },
  lastSeenAt, createdAt, updatedAt
}
```

Statuses : `INVITED | PENDING_ACTIVATION | ACTIVE | SUSPENDED | LOCKED | DISABLED | DELETED`.

---

### 7.8 Memberships

#### `GET /api/v1/memberships`

| Perm | `memberships:read` |
| Query | Pagination + `organizationId?: uuid` |

#### `POST /api/v1/memberships` (201)

```json
{
  "userId": "<keycloak-sub>",
  "organizationId": "<uuid>",
  "roles": ["viewer"],
  "permissions": ["organizations:read"]
}
```

#### `PATCH /api/v1/memberships/:membershipId`

```json
{ "roles": ["manager"], "permissions": ["organizations:read", "memberships:read"] }
```

#### `DELETE /api/v1/memberships/:membershipId`

| Perm | `memberships:revoke` |
| 403 | last-admin |

Response membership :

```ts
{
  id, userId, organizationId, tenantId, status,
  roles, permissions, joinedAt, expiresAt, createdAt, updatedAt
}
```

---

### 7.9 Invitations

#### `GET /api/v1/invitations`

| Perm | `users:invite` |
| Query | Pagination + `organizationId?` |

#### `POST /api/v1/invitations` (201)

```json
{
  "organizationId": "<uuid>",
  "email": "new.user@company.com",
  "roles": ["viewer"],
  "permissions": [],
  "expiresInHours": 72
}
```

`expiresInHours` : 1–720.

**Response créée :** `{ id, email, organizationId, status, expiresAt, token }`  
⚠️ `token` plain-text **one-shot**, non stocké — à livrer out-of-band.

#### `POST /api/v1/invitations/accept`

| Perm | `users:read` |
| Body | `{ "token": "<plain>" }` |
| Response | `{ membershipId, organizationId }` |

#### `POST /api/v1/invitations/:invitationId/revoke`

| Perm | `users:invite` |

---

### 7.10 Roles & Permissions

#### `GET /api/v1/roles` — `roles:read` + pagination  
#### `POST /api/v1/roles` (201) — `roles:create`

```json
{
  "name": "branch-manager",
  "scope": "tenant" | "organization",
  "description": "...",
  "permissions": ["organizations:read"]
}
```

#### `PATCH /api/v1/roles/:roleId` — `roles:update`  
Body : `{ description?, permissions? }`

#### `DELETE /api/v1/roles/:roleId` — **`roles:delete`**  
Response : `{ deleted: true, roleId }`

#### `GET /api/v1/permissions` — `permissions:read`  
Item : `{ id, resource, action, description? }`

---

### 7.11 Settings

#### `GET|PATCH /api/v1/settings/tenant/:namespace`

| GET | `settings:read` |
| PATCH | `settings:update` |
| PATCH body | `{ "values": { ... } }` |
| Response | `{ namespace, values }` |

#### `GET|PATCH /api/v1/settings/organizations/:organizationId/:namespace`

Idem + `organizationId` dans la réponse.

Valeurs sensibles : références `secret://`, masquées en lecture.

---

### 7.12 Security & Sessions

#### Policies

| Method | Path | Perm |
|--------|------|------|
| GET | `/api/v1/security/policies` | `security:read` |
| PATCH | `/api/v1/security/policies` | `security:update` |

PATCH body :

```json
{
  "mfaPolicy": "required_for_admins",
  "sessionLifetimeMinutes": 480,
  "idleTimeoutMinutes": 30,
  "extra": {}
}
```

Response GET : `{ policies: Record<string, unknown>, keycloakAvailable }`.

#### MFA status

`GET /api/v1/security/mfa/status` → `{ enabled, methods[], keycloakAvailable }`.

#### Sessions

| Method | Path | Perm | Body / notes |
|--------|------|------|--------------|
| GET | `/api/v1/sessions` | `security:read` | Pagination ; peut 503 |
| POST | `/api/v1/sessions/revoke` | `security:update` | `{ sessionId, denylistCallerToken? }` |
| POST | `/api/v1/sessions/logout` | `security:update` | denylist JWT courant |
| POST | `/api/v1/sessions/revoke-all` | `security:update` | |

Session object : `{ id, createdAt?, lastAccessedAt?, ipAddress?, userAgent? }`.

---

### 7.13 Delegations & Emergency access

#### Delegations

| Method | Path | Perm |
|--------|------|------|
| GET | `/api/v1/delegations` | `delegation:read` |
| POST | `/api/v1/delegations` | `delegation:grant` (201) |
| POST | `/api/v1/delegations/:delegationId/revoke` | `delegation:grant` |

Grant body :

```json
{
  "organizationId": "<uuid>",
  "granteeIdentityId": "<sub>",
  "permissions": ["orders:read"],
  "expiresInHours": 24
}
```

`expiresInHours` 1–720. **Pas** de step-up sur delegation grant (contrairement à emergency).

#### Emergency

| Method | Path | Perm | Extra |
|--------|------|------|-------|
| GET | `/api/v1/emergency-access` | `emergency_access:read` | |
| POST | `/api/v1/emergency-access` | `emergency_access:grant` | **StepUp('1')**, 201 |
| POST | `/api/v1/emergency-access/:grantId/revoke` | `emergency_access:grant` | |

Grant body :

```json
{
  "operatorIdentityId": "<sub>",
  "reason": "at least 10 chars",
  "organizationId": "<uuid?>",
  "scope": {},
  "expiresInHours": 4
}
```

`expiresInHours` 1–24.

---

### 7.14 Reconciliation (admin tenant)

Permissions **tenant** (pas forcément realm platform-admin) :

| Method | Path | Perm | Body |
|--------|------|------|------|
| POST | `/api/v1/admin/reconciliation/run` | `tenant:update` | `{ "repair": false }` |
| GET | `/api/v1/admin/reconciliation/report` | `tenant:read` | dernier rapport |
| GET | `/api/v1/admin/reconciliation/reports` | `tenant:read` | liste paginée |

Résultat run :

```ts
{
  tenantId, ranAt, keycloakAvailable,
  drifts: [{ type, resourceId, message, severity, repairable }],
  repairs: [{ type, resourceId, status }],
  summary: { total, critical, warning, repaired }
}
```

---

### 7.15 Feature flags

#### `GET /api/v1/feature-flags`

| Perm | `platform:read` |
| Query | Pagination |
| Item (runtime) | `{ key, enabled, namespace, defaultValue, overrideable }` |

---

### 7.16 Customers — CRM staff

Classe : `@RequireModule('customer')`.

| Method | Path | Perm | Body / notes |
|--------|------|------|--------------|
| GET | `/api/v1/customers` | `customers:read` | Pagination + `search?` |
| POST | `/api/v1/customers` | `customers:create` | `CreateCustomerDto` 201 |
| POST | `/api/v1/customers/guest` | `customers:create` | `{ organizationId? }` 201 |
| POST | `/api/v1/customers/check-duplicates` | `customers:read` | email/phone/customerNumber |
| POST | `/api/v1/customers/identify` | `customers:read` | → aggregate ou null |
| GET | `/api/v1/customers/:tenantCustomerId` | `customers:read` | |
| GET | `.../360` | `customers:read` | aggregate+consents+addresses+interactions+timeline |
| GET | `.../export` | `customers:export` | Audit |
| POST | `.../promote` | `customers:update` | promote guest |
| POST | `.../merge` | `customers:merge` | `{ sourceTenantCustomerId }` |
| POST | `.../anonymize` | `customers:delete` | `{ anonymized: true }` |
| GET | `.../consents` | `customers:read` | |
| POST | `.../consents/grant` | `customers:manage_consent` | 201 |
| POST | `.../consents/withdraw` | `customers:manage_consent` | 201 |
| GET | `.../addresses` | `customers:read` | |
| GET | `.../interactions` | `customers:crm_read` | Pagination |
| POST | `.../interactions` | `customers:crm_write` | 201 |
| POST | `.../organizations` | `customers:update` | link org 201 |

**CreateCustomerDto :**

```json
{
  "email": "client@example.com",
  "phone": "+25779123456",
  "profile": {},
  "organizationId": "<uuid>",
  "type": "INDIVIDUAL"
}
```

**PromoteGuestCustomerDto :** `email?`, `phone?`, `firstName?`, `lastName?`

**CreateCustomerInteractionDto :**

```json
{
  "type": "CALL",
  "organizationId": "<uuid?>",
  "subject": "...",
  "description": "...",
  "channel": "PHONE",
  "occurredAt": "2026-08-01T09:00:00.000Z"
}
```

**GrantConsent / WithdrawConsent :**

```json
{ "purpose": "MARKETING", "policyVersion": "2026-01", "channel": "WEB" }
```

(`channel` optionnel sur grant ; withdraw sans channel.)

**Aggregate / 360 — structures clés :**  
voir `GlobalCustomerResponseDto`, `TenantCustomerResponseDto`, `OrganizationCustomerResponseDto`, `CustomerConsentResponseDto`, `CustomerAddressResponseDto`, `CustomerInteractionResponseDto`, `Customer360ResponseDto` dans `customer-response.dto.ts`.

Purposes consent : `ACCOUNT | ORDER_PROCESSING | MARKETING | ANALYTICS | PERSONALIZATION | LOYALTY | NOTIFICATIONS | SENSITIVE_DATA_PROCESSING`.

Address types : `HOME | WORK | BILLING | SHIPPING | OTHER`.

---

### 7.17 Customer Auth (public B2C)

Throttle **15/min**. Toutes `@Public()`.

#### `POST /api/v1/customer-auth/register` (201)

```json
{
  "tenantSlug": "tenant-a",
  "email": "customer@example.com",
  "password": "min8chars",
  "firstName": "...",
  "lastName": "..."
}
```

Password 8–128. Response : `{ message }`.

#### `POST /api/v1/customer-auth/login`

```json
{ "tenantSlug": "tenant-a", "email": "...", "password": "..." }
```

Response :

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "expiresIn": 300,
  "tokenType": "Bearer"
}
```

#### `POST /api/v1/customer-auth/password-reset`

```json
{ "tenantSlug": "tenant-a", "email": "..." }
```

→ `{ message }` (anti-énumération côté message générique typique).

---

### 7.18 Customer Portal (B2C JWT)

`@CustomerRoute()` + `@RequireModule('customer')`.

| Method | Path | Body |
|--------|------|------|
| GET | `/api/v1/customer/me` | — |
| GET | `/api/v1/customer/consents` | — |
| POST | `/api/v1/customer/consents/grant` | GrantConsentDto 201 |
| POST | `/api/v1/customer/consents/withdraw` | WithdrawConsentDto 201 |
| GET | `/api/v1/customer/addresses` | — |
| POST | `/api/v1/customer/addresses` | CreateAddressDto 201 |
| PATCH | `/api/v1/customer/addresses/:addressId` | CreateAddressDto |
| DELETE | `/api/v1/customer/addresses/:addressId` | → `{ removed: true }` |

**CreateAddressDto :**

```json
{
  "type": "HOME",
  "country": "BI",
  "province": "...",
  "city": "...",
  "district": "...",
  "commune": "...",
  "street": "...",
  "postalCode": "...",
  "deliveryInstructions": "...",
  "isDefault": true
}
```

---

### 7.19 Commerce

`@RequireModule('commerce')`.

| Method | Path | Perm (code) | Body |
|--------|------|-------------|------|
| GET | `/api/v1/commerce/products` | `commerce:read` | Pagination |
| POST | `/api/v1/commerce/products` | `commerce:create` | CreateProductDto 201 |
| POST | `/api/v1/commerce/carts` | `commerce:create` | CreateCartDto 201 |
| GET | `/api/v1/commerce/carts/:cartId` | `commerce:read` | |
| POST | `/api/v1/commerce/carts/:cartId/lines` | `commerce:create` | AddCartLineDto |
| POST | `/api/v1/commerce/carts/:cartId/checkout` | `commerce:pos_checkout` | PosCheckoutDto 201 |
| GET | `/api/v1/commerce/orders` | `commerce:read` | Pagination |
| GET | `/api/v1/commerce/orders/:orderId` | `commerce:read` | |
| GET | `/api/v1/commerce/loyalty/:tenantCustomerId` | `commerce:read` | |
| POST | `/api/v1/commerce/orders/:orderId/cancel` | `orders:cancel` | `{ reason? }` |
| POST | `/api/v1/commerce/orders/:orderId/refund` | `orders:refund` | `{ reason? }` |

**CreateProductDto :** `{ sku (≤100), name (≤255), description?, unitPrice (≥0), currency? }`  
**CreateCartDto :** `{ tenantCustomerId?, organizationId?, channel? }`  
**AddCartLineDto :** `{ productId: uuid, quantity ≥ 1 }`  
**PosCheckoutDto :** `{ tenantCustomerId?, createGuest?, organizationId? }`  
**OrderTransitionDto :** `{ reason?: string ≤500 }`

**Responses :**

- Product : `{ id, sku, name, description?, unitPrice, currency, status }`
- Cart : `{ id, tenantCustomerId?, status, lines?: [{ id, productId, quantity, unitPrice, lineTotal }] }`
- Order : `{ id, tenantCustomerId, status, totalAmount, lines?: [{ sku, productName, quantity, lineTotal }] }`
- Loyalty : `{ tenantCustomerId, pointsBalance }`

Statuses métier typiques : Product `ACTIVE|INACTIVE|ARCHIVED` ; Order `PENDING|COMPLETED|CANCELLED|REFUNDED` ; Cart `OPEN`…

---

### 7.20 Pharmacy patients

`@RequireModule('pharmacy')`. **Patient ≠ Customer.**

| Method | Path | Perm |
|--------|------|------|
| GET | `/api/v1/pharmacy/patients` | `pharmacy:read` |
| POST | `/api/v1/pharmacy/patients` | `pharmacy:create` 201 |
| GET | `/api/v1/pharmacy/patients/:patientId` | `pharmacy:read` |
| POST | `.../link-customer` | `pharmacy:link_customer` |
| POST | `.../unlink-customer` | `pharmacy:link_customer` |

Create body : `{ firstName?, lastName?, dateOfBirth? }` (names max 100).  
Link body : `{ "tenantCustomerId": "<uuid>" }`.  
Response : `{ id, firstName?, lastName?, dateOfBirth?, tenantCustomerId? }`.

---

## 8. Catalogue des permissions

Format : `resource:action`.

| Zone | Permissions |
|------|-------------|
| Platform | `platform:read`, `platform:organizations:read` |
| Tenant | `tenant:read`, `tenant:update`, `tenant:ownership_transfer` |
| Tenants (admin) | `tenants:create`, `tenants:admin` |
| Organizations | `organizations:read\|create\|update\|suspend` |
| Users | `users:read\|invite\|update\|suspend` |
| Memberships | `memberships:read\|create\|update\|revoke` |
| RBAC | `roles:read\|create\|update\|delete`, `permissions:read` |
| Settings | `settings:read\|update` |
| Security | `security:read\|update` |
| Delegation | `delegation:read\|grant` |
| Emergency | `emergency_access:read\|grant` |
| Customers | `customers:read\|create\|update\|delete\|export\|merge\|view_sensitive\|manage_consent\|view_financial\|crm_read\|crm_write` |
| Commerce | `commerce:read\|create\|update\|pos_checkout` |
| Orders | `orders:read\|create\|cancel\|refund` |
| Loyalty | `loyalty:read\|manage` |
| Pharmacy | `pharmacy:read\|create\|update\|link_customer` |

Seeds : migrations `008`, `010`, `011`, `013`, `016`, `019`, `022`, `023`.

Rôles système seed : `tenant-owner`, `tenant-administrator`, `organization-administrator`, `manager`, `viewer`.

---

## 9. Modèles de domaine & enums

### TenantStatus

`PROVISIONING | ACTIVE | SUSPENDED | READ_ONLY | DEACTIVATING | ARCHIVED | DELETED | FAILED | LOCKED`

### TenantProvisioningStep

`REQUESTED | DB_CREATED | MIGRATED | IDENTITY_CONFIGURED | ORG_CONFIGURED | ADMIN_CONFIGURED | READY`

### OrganizationStatus / Type

- Status : `ACTIVE | SUSPENDED | ARCHIVED`
- Type : `BRANCH | STORE | OFFICE | WAREHOUSE | PHARMACY | RESTAURANT | CLINIC | OTHER`

### DomainType / DomainStatus

- Type : `SUBDOMAIN | CUSTOM`
- Status : `ACTIVE | PENDING | DISABLED`

### ApplicationUserStatus

`INVITED | PENDING_ACTIVATION | ACTIVE | SUSPENDED | LOCKED | DISABLED | DELETED`

### Customer (global)

- Status : `GUEST | IDENTIFIED | REGISTERED | ACTIVE | SUSPENDED | ANONYMIZED | DELETED`
- Type : `INDIVIDUAL | BUSINESS | GUEST | WALK_IN | VIP | WHOLESALE | ONLINE`

### TenantCustomer status

`ACTIVE | INACTIVE | BLOCKED | ARCHIVED`

---

## 10. Multi-tenancy pour le frontend

### Règles d’implémentation client

1. **Ne jamais** envoyer `tenantId` / `X-Tenant-Id` pour autoriser l’accès.
2. Stocker / afficher le contexte via `GET /platform/context` ou claims JWT.
3. Switch org :
   - `POST /platform/organizations/switch`
   - `keycloak.updateToken` / refresh forcé
   - recharger context (+ capabilities si UI dynamique)
4. Sur 403 générique : ne pas tenter d’énumérer tenants/orgs.
5. Respecter `TenantWritableGuard` : sur tenant `READ_ONLY` / `SUSPENDED`, les mutations échouent.
6. Modules : avant d’afficher commerce/pharmacy/CRM, lire `me/capabilities.modules` + `navigationHints`.

### Binding Host

En prod, le frontend est souvent servi sous un hostname tenant. Le backend croise Host ↔ `tenant_domains` avec le JWT.

---

## 11. Spécifications produit mobile (`docs/backend/`)

Ces fichiers décrivent l’**app membre pharmacie** (mock-first, envelope `{ data, message, success }`). **La majorité n’existe pas encore** comme contrôleurs Nest.

| Spec | Sujet | Implémenté Nest ? |
|------|-------|-------------------|
| `01-system-boot` | `/app/config`, session | ❌ |
| `02-onboarding` | onboarding | ❌ |
| `03–06` auth login/signup/OTP/forgot | auth member | Partiel via `customer-auth` (contrat différent) |
| `07-permissions` | push token | ❌ |
| `08-home` | dashboard agrégé | ❌ |
| `09–10` meds / reminders | ❌ |
| `11–13` catalog / pharmacy / cart | Partiel commerce POS (≠ UX membre) |
| `14–18` prescription / order / payment / insurance | ❌ |
| `19-chat` | ❌ |
| `24–29` profile / health / dependents / settings / insurance / payment methods | Partiel portal addresses/consents |
| `30–34` notifications / appointments / meds / product / pharmacy detail | ❌ |

**À ne pas confondre** avec l’API Platform Core documentée en §7.

Catalogue méthode/chemin exhaustif + mapping Nest : **§17**. Mapping écrans UI → API : **§19**.

---

## 12. Environnement, CORS, Swagger, local

### Démarrage typique

```bash
# Infra
docker compose up -d

# Backend
pnpm install
pnpm migrate:control
pnpm start:dev
# API http://localhost:3000 — Swagger http://localhost:3000/docs

# Frontend
cd edge-frontend
pnpm install
pnpm dev -- -p 3001
# http://localhost:3001 — aucune intégration API n’est encore configurée
```

### Swagger

- Activé si `NODE_ENV !== 'production'` **ou** `SWAGGER_ENABLED=true`
- UI `/docs`, JSON `/docs-json`
- Redirects : `/docs/`, `/api/docs`, `/swagger`
- Scheme Bearer name : `bearer`
- **Référence complète offline :** [`OPENAPI-SCHEMAS-REFERENCE.md`](./OPENAPI-SCHEMAS-REFERENCE.md) + [`openapi.json`](./openapi.json)
- Régénération : `pnpm docs:openapi` (voir **§21**)

### Variables backend critiques (extrait `.env.example`)

| Var | Rôle |
|-----|------|
| `KEYCLOAK_*` | Issuer, JWKS, audience `platform-api` |
| `CONTROL_PLANE_DB_*` | Postgres control |
| `REDIS_*` / `RABBITMQ_*` | Infra |
| `CORS_ORIGINS` | Origines SPA additionnelles |
| `RATE_LIMIT_*` / `MAX_PAYLOAD_SIZE` | Abuse |
| `CSRF_ENABLED` | CSRF cookie |
| `OPA_ENABLED` | Policy engine externe |
| `SECRET_PROVIDER` | `env` \| `local` \| `vault` |

---

## 13. Guide d’intégration frontend (checklist)

### Prérequis contrats

- [ ] Lu [`MASTER-PROMPT-EDGE-FRONTEND.md`](./MASTER-PROMPT-EDGE-FRONTEND.md) (Shell + Identity §I)  
- [ ] Lu [`MASTER-UX-UI-SPECIFICATION.md`](./MASTER-UX-UI-SPECIFICATION.md) (au minimum §1–§16, §19–§24, §44–§47, §120)  
- [ ] Types générés depuis [`openapi.json`](./openapi.json)  
- [ ] Décision auth documentée : **BFF-first** ou **Wave 0 SPA PKCE** (pas de mode démo)

### Pour construire la console staff depuis le scaffold

1. **Auth** : BFF HttpOnly (cible) ou PKCE Wave 0 ; jamais refresh en `localStorage` ; pas de fixtures permissions.  
2. **API client** : parser envelope `{ data }` / `{ error }` ; mapper status → UI ; sur 401 → re-login.  
3. **Headers** : propager `X-Correlation-Id` (uuid).  
4. **Capabilities** : `GET /api/v1/platform/me/capabilities` au boot pour menus (UX permission-aware).  
5. **Org switcher** : `POST .../organizations/switch` + refresh JWT/session ; invalider caches org-scoped.  
6. **Permissions** : cacher / disable actions selon capabilities (contrat UX §120–§121) ; serveur = vérité.  
7. **Modules** : ne pas appeler commerce/pharmacy/customer si module off.  
8. **Idempotency** : `Idempotency-Key` pour provisioning admin.  
9. **Step-up** : MFA Keycloak avant opérations sensibles.  
10. **B2C** : client séparé (`platform-b2c`) ; ne pas mélanger tokens staff / customer.  
11. **UX** : Shell Top Bar, Context Indicator, empty/error states, density — pas de CRUD cards génériques.  
12. **Tests** : contrat des appels platform + parcours org switch + a11y de base.

### Pattern fetch recommandé (Wave 0 SPA — cible BFF différente)

```ts
type ApiSuccess<T> = { data: T; pagination?: PaginationMeta };
type ApiFailure = { error: { code: string; message: string; details: unknown[]; requestId: string; correlationId: string } };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  await refreshToken();
  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken()}`,
      'X-Correlation-Id': crypto.randomUUID(),
      ...init?.headers,
    },
  });
  const json = await res.json();
  if (!res.ok) throw Object.assign(new Error(json?.error?.message ?? res.statusText), { status: res.status, body: json });
  return json.data as T;
}
```

> En mode BFF : `credentials: 'include'`, pas de Bearer côté navigateur ; le BFF injecte le token vers Nest.

---

## 14. Écarts docs / code & dettes

| Sujet | Ancienne doc / attente | Code actuel |
|-------|------------------------|-------------|
| Swagger path | parfois `/api/docs` | UI **`/docs`** |
| Delete role perm | parfois `roles:update` | **`roles:delete`** |
| Users disable | parfois `users:update` | **`users:suspend`** |
| Commerce add line | parfois `commerce:update` | **`commerce:create`** |
| Orders list/get | parfois `orders:read` | **`commerce:read`** |
| Loyalty get | parfois `loyalty:read` | **`commerce:read`** |
| Org create `type` | documenté ailleurs | **absent** du DTO |
| Delegation step-up | parfois mentionné | step-up **emergency only** |
| Envelope mobile specs | `{ data, message, success }` | Platform Core : `{ data }` / `{ error }` |
| FeatureFlagResponse DTO Swagger | champs réduits | runtime : + `namespace`, `defaultValue`, `overrideable` |
| README root liens ARCHITECTURE | parfois racine | fichiers sous **`docs/`** |
| Keycloak port SPA défaut | `:8080` | compose souvent **`:8181`** — aligner |

### Dettes frontend connues (as-is Wave 0 — 2026-09-04)

- BFF HttpOnly non livré (SPA PKCE interim)  
- Saved views / column pinning / bulk actions absents  
- Écrans détail customer/product/patient absents  
- POS mobile / scanner absents  
- CSRF non applicable tant que Bearer (requis dès BFF cookies)

---

## Annexes

### A. Fichiers sources prioritaires

| Sujet | Chemin |
|-------|--------|
| Bootstrap API | `src/main.ts` |
| Guards / decorators | `src/shared/auth/` |
| Erreurs | `src/shared/errors/global-exception.filter.ts` |
| DTOs platform | `src/modules/platform/presentation/dto/` |
| DTOs identity | `src/modules/identity/presentation/dto/` |
| DTOs customer | `src/modules/customer/presentation/dto/` |
| DTOs commerce / pharmacy | `src/modules/*/presentation/dto/` |
| Frontend | `edge-frontend/app/**` |
| Authz narrative | `docs/AUTHORIZATION.md` |
| Catalogue API court | `API-REFERENCE.md` |
| Sécurité | `SECURITY.md` |

### B. Tags Swagger

`Health`, `Platform`, `Tenants`, `Organizations`, `Users`, `Memberships`, `Invitations`, `Roles & Permissions`, `Settings`, `Security`, `Admin`, `Customers`, `Commerce`, `Pharmacy`.

### C. Compteurs (snapshot OpenAPI `edge-frontend/docs/openapi.json`)

- Paths : **90**  
- Operations : **110**  
- Schemas : **120**  
- OpenAPI : **3.0.3**  
- Routes consommées Wave 0 : platform context / capabilities / organizations / switch + customers list  
- Endpoints specs mobile (`docs/backend`) : ~50+ (majorité non implémentés Nest)

---

## 15. Flux séquentiels (auth, switch org, B2C)

### 15.1 Login staff (`edge-frontend` + Keycloak, cible non implémentée)

```
Browser                  Keycloak                 Platform API
   |                         |                          |
  |-- open edge-frontend -->|                          |
   |-- keycloak.init(login-required, PKCE S256) ------->|
   |<-------- redirect login / callback + tokens -------|
   |-- GET /api/v1/platform/context -------------------->|
   |   Authorization: Bearer <access>                   |
   |   (AuthGuard→…→PermissionGuard platform:read)      |
   |<-------- { data: context } ------------------------|
   |-- GET /api/v1/platform/organizations -------------->|
   |<-------- { data: [...], pagination } --------------|
   |-- render UI (tenant, org, roles, org list) --------|
```

### 15.2 Switch d’organisation (contrat critique frontend)

```
SPA                         API                         Keycloak
 |                           |                              |
 |-- POST /organizations/switch { organizationId } -------->|
 |                           |-- validate membership ------|
 |                           |-- set active org in KC ----->|
 |<-- 201 { organizationId, refreshRequired: true } -------|
 |-- keycloak.updateToken(30) / refresh ------------------>|
 |<-- new JWT with org claims ----------------------------|
 |-- GET /platform/context ------------------------------->|
 |<-- context.organizationId mis à jour ------------------|
```

**Règle d’or :** ignorer `refreshRequired` côté client = JWT périmé / org incorrecte sur les appels suivants → 403.

### 15.3 B2C register → login → portal

```
Client                POST /customer-auth/register (public, throttle 15/min)
  |                   { tenantSlug, email, password, firstName?, lastName? }
  |-----------------> 201 { data: { message } }
  |
  |                   POST /customer-auth/login
  |-----------------> 200 { data: { accessToken, refreshToken?, expiresIn, tokenType } }
  |
  |                   GET /customer/me
  |                   Authorization: Bearer <b2c JWT>
  |-----------------> CustomerAuthGuard + RequireModule('customer')
```

### 15.4 Provisioning tenant (admin console future)

```
Admin SPA -- POST /admin/tenants
  Headers: Authorization, Idempotency-Key
  Body: ProvisionTenantDto
       → saga DB → migrations → KC org → READY
       ← TenantProvisioningResultResponseDto
```

### 15.5 Gestion d’erreurs côté UI (recommandé)

| HTTP | `error.code` | Action UI recommandée |
|------|--------------|------------------------|
| 400 | `VALIDATION_ERROR` | Afficher `details[]` par champ |
| 401 | `UNAUTHORIZED` | Refresh token ; si échec → logout KC |
| 403 | `FORBIDDEN` | Toast « Accès refusé » (pas d’énumération) |
| 404 | `RESOURCE_NOT_FOUND` | Empty state |
| 409 | `CONFLICT` / `IDEMPOTENCY_CONFLICT` | Message métier / rejouer avec même clé |
| 429 | `RATE_LIMITED` | Backoff + retry |
| 503 | `DEPENDENCY_UNAVAILABLE` | Banner maintenance / retry |

Toujours logger / afficher support : `requestId` + `correlationId`.

---

## 16. Exemples JSON complets (Platform Core)

### 16.1 Context (succès)

```http
GET /api/v1/platform/context
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

```json
{
  "data": {
    "tenantId": "11111111-1111-4111-8111-111111111111",
    "organizationId": "22222222-2222-4222-8222-222222222222",
    "userId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001",
    "username": "jane.doe",
    "roles": ["organization-administrator"],
    "permissions": [
      "platform:read",
      "platform:organizations:read",
      "organizations:read",
      "users:read",
      "customers:read"
    ],
    "locale": "fr-FR",
    "timezone": "Europe/Paris"
  }
}
```

### 16.2 Liste organisations (paginée)

```http
GET /api/v1/platform/organizations?page=1&limit=20
```

```json
{
  "data": [
    {
      "id": "22222222-2222-4222-8222-222222222222",
      "name": "Pharmacie du Centre",
      "slug": "pharmacie-centre",
      "status": "ACTIVE",
      "keycloakOrganizationId": "kc-org-uuid-1"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false,
    "nextCursor": null
  }
}
```

### 16.3 Switch organisation

```http
POST /api/v1/platform/organizations/switch
Content-Type: application/json

{ "organizationId": "33333333-3333-4333-8333-333333333333" }
```

```json
{
  "data": {
    "organizationId": "33333333-3333-4333-8333-333333333333",
    "refreshRequired": true
  }
}
```

### 16.4 Capabilities

```http
GET /api/v1/platform/me/capabilities
```

```json
{
  "data": {
    "plan": {
      "code": "STANDARD",
      "name": "Standard",
      "maxOrganizations": 25,
      "maxUsers": 100
    },
    "modules": {
      "identity": true,
      "customer": true,
      "commerce": true,
      "pharmacy": false
    },
    "permissions": ["platform:read", "commerce:read", "customers:read"],
    "features": {
      "invitations": true,
      "keycloakSync": true
    },
    "organizations": [
      {
        "id": "22222222-2222-4222-8222-222222222222",
        "name": "Pharmacie du Centre",
        "slug": "pharmacie-centre",
        "type": "PHARMACY",
        "status": "ACTIVE"
      }
    ],
    "defaultOrganizationId": "22222222-2222-4222-8222-222222222222",
    "navigationHints": ["identity", "customer", "commerce"]
  }
}
```

### 16.5 Erreur validation

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "message": "organizationId must be a UUID" }
    ],
    "requestId": "req-abc123",
    "correlationId": "corr-xyz789"
  }
}
```

### 16.6 Erreur accès (anti-énumération)

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied",
    "details": [],
    "requestId": "req-abc123",
    "correlationId": "corr-xyz789"
  }
}
```

### 16.7 Login B2C

```http
POST /api/v1/customer-auth/login
Content-Type: application/json

{
  "tenantSlug": "pharma-group",
  "email": "camille@example.com",
  "password": "SecurePass1"
}
```

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 300,
    "tokenType": "Bearer"
  }
}
```

### 16.8 Création produit commerce

```http
POST /api/v1/commerce/products
Authorization: Bearer ...
Content-Type: application/json

{
  "sku": "DOL-1000-8",
  "name": "Doliprane 1000mg",
  "description": "Boîte de 8 comprimés",
  "unitPrice": 2.18,
  "currency": "EUR"
}
```

```json
{
  "data": {
    "id": "44444444-4444-4444-8444-444444444444",
    "sku": "DOL-1000-8",
    "name": "Doliprane 1000mg",
    "description": "Boîte de 8 comprimés",
    "unitPrice": 2.18,
    "currency": "EUR",
    "status": "ACTIVE"
  }
}
```

### 16.9 POS checkout

```http
POST /api/v1/commerce/carts/{cartId}/checkout
Content-Type: application/json

{
  "tenantCustomerId": "55555555-5555-4555-8555-555555555555",
  "createGuest": false,
  "organizationId": "22222222-2222-4222-8222-222222222222"
}
```

```json
{
  "data": {
    "id": "66666666-6666-4666-8666-666666666666",
    "tenantCustomerId": "55555555-5555-4555-8555-555555555555",
    "status": "COMPLETED",
    "totalAmount": 15.62,
    "lines": [
      {
        "sku": "DOL-1000-8",
        "productName": "Doliprane 1000mg",
        "quantity": 2,
        "lineTotal": 4.36
      }
    ]
  }
}
```

### 16.10 Invitation créée (token one-shot)

```json
{
  "data": {
    "id": "77777777-7777-4777-8777-777777777777",
    "email": "new.user@company.com",
    "organizationId": "22222222-2222-4222-8222-222222222222",
    "status": "PENDING",
    "expiresAt": "2026-09-07T10:00:00.000Z",
    "token": "plain-one-time-token-deliver-out-of-band"
  }
}
```

⚠️ Ne jamais logger le `token` côté frontend analytics ; l’afficher une seule fois à l’admin.

---

## 17. Catalogue exhaustif des endpoints mobile (specs)

> **Envelope specs mobile :** `{ "data": ..., "message": "...", "success": true }`  
> **≠** envelope Platform Core `{ "data" }` / `{ "error" }`.  
> Client prévu : mock-first (`USE_MOCK = true`). Chemins **sans** préfixe `/api/v1` dans les specs.

| Spec | Method | Path | Auth | Nest aujourd’hui |
|------|--------|------|------|------------------|
| Boot | GET | `/app/config` | Public | ❌ |
| Boot | GET | `/auth/me` | Bearer | ❌ (proche: context / users/me / customer/me) |
| Onboarding | GET | `/content/onboarding` | Opt. | ❌ |
| Onboarding | POST | `/analytics/events` | Opt. | ❌ |
| Login | POST | `/auth/login` | Public | Partiel → `/customer-auth/login` (body différent : +`tenantSlug`) |
| Login | POST | `/auth/refresh` | Public | ❌ (Keycloak token endpoint) |
| Signup | POST | `/auth/register` | Public | Partiel → `/customer-auth/register` |
| OTP | POST | `/auth/verify-otp` | Public | ❌ |
| OTP | POST | `/auth/resend-otp` | Public | ❌ |
| OTP | POST | `/auth/otp/channel` | Public | ❌ |
| Forgot | POST | `/auth/forgot-password` | Public | Partiel → `/customer-auth/password-reset` |
| Forgot | POST | `/auth/reset-password` | Public | ❌ |
| Permissions OS | POST | `/notifications/register-token` | Bearer | ❌ |
| Home | GET | `/me/home` | Bearer | ❌ |
| Home | POST | `/reminders/{id}/taken` | Bearer | ❌ |
| Meds | GET | `/me/treatments` | Bearer | ❌ |
| Meds | GET | `/me/treatments/{id}` | Bearer | ❌ |
| Reminders | GET | `/me/reminders?date=` | Bearer | ❌ |
| Reminders | POST | `/me/reminders/{id}/taken` | Bearer | ❌ |
| Reminders | POST | `/me/reminders/{id}/snooze` | Bearer | ❌ |
| Catalog | GET | `/catalog` | Bearer | Partiel POS → `/commerce/products` |
| Choose pharmacy | GET | `/catalog/{productId}/pharmacies` | Bearer | ❌ |
| Cart | GET | `/cart` | Bearer | Partiel → `/commerce/carts/:id` |
| Cart | PATCH | `/cart/lines/{lineId}` | Bearer | Partiel add line only |
| Cart | POST | `/cart/checkout` | Bearer | Partiel POS checkout |
| Rx | GET | `/prescriptions/send-context` | Bearer | ❌ |
| Rx | POST | `/prescriptions` | Bearer multipart | ❌ |
| Order confirm | GET | `/orders/{orderId}/confirmation` | Bearer | ❌ |
| Tracking | GET | `/orders/{orderId}/tracking` | Bearer | ❌ |
| Payment | GET/POST | `/orders/{orderId}/payment` | Bearer | ❌ |
| Insurance | GET | `/orders/{orderId}/insurance` | Bearer | ❌ |
| Chat | GET | `/chat/threads/{threadId}` | Bearer | ❌ |
| Chat | POST | `/chat/threads/{threadId}/messages` | Bearer | ❌ |
| Profile | GET/PATCH | `/me/profile` | Bearer | Partiel portal / users/me |
| Health | GET | `/me/health-record` | Bearer | ❌ |
| Dependents | GET/POST | `/me/dependents` | Bearer | ❌ |
| Insurance profile | GET/PATCH | `/me/insurance` | Bearer | ❌ |
| Payment methods | GET/PATCH | `/me/payment-methods` | Bearer | ❌ |
| Notifications | GET | `/me/notifications` | Bearer | ❌ |
| Notifications | POST | `/me/notifications/read` | Bearer | ❌ |
| Appointments | GET | `/appointments/availability` | Bearer | ❌ |
| Appointments | POST | `/appointments` | Bearer | ❌ |
| Add med | GET | `/drugs?q=` | Bearer | ❌ |
| Add med | POST | `/me/treatments` | Bearer | ❌ |
| Product detail | GET | `/catalog/{id}` | Bearer | Partiel product get via list |
| Pharmacy detail | GET | `/pharmacies/{id}` | Bearer | ❌ |

### 17.1 Envelope mobile (référence)

```json
{
  "success": true,
  "message": "OK",
  "data": { }
}
```

### 17.2 Exemple home (spec)

`GET /me/home` → widgets greeting, reminders du jour, activeOrder, pharmacists — voir `docs/backend/08-home.md`.

### 17.3 Exemple cart (spec)

`GET /cart` → pharmacy + lines + insurance + fees — voir `docs/backend/13-cart.md`.  
**Différent** du cart POS Platform Core (pas d’assurance mutuelle / honoraires dans Nest commerce actuel).

---

## 18. Matrice rôles système → permissions

Rôles seedés (`tenant_id IS NULL`, `is_system = true`). Attribution fine via `role_permissions` (migrations 010, 016, 019, 022, 023).

| Rôle | Portée typique | Intention |
|------|----------------|-----------|
| `tenant-owner` | tenant | Plein contrôle + ownership |
| `tenant-administrator` | tenant | Admin sans certains droits sensibles (ex. merge customers, certains cancel/manage) |
| `organization-administrator` | organization | Admin de branche / pharmacie |
| `manager` | organization | Opérations quotidiennes (POS, CRM lecture/écriture limitée) |
| `viewer` | organization | Lecture seule |

**Exemples d’écarts seed (customers) :**

| Permission | owner | tenant-admin | org-admin | manager |
|------------|:-----:|:------------:|:---------:|:-------:|
| `customers:read` | ✅ | ✅ | ✅ | ✅ |
| `customers:create` | ✅ | ✅ | ✅ | ✅ |
| `customers:merge` | ✅ | ❌ | ❌ | ❌ |
| `customers:delete` | ✅ | ✅ | ❌ | ❌ |
| `customers:crm_write` | ✅ | ✅ | ✅ | ❌ |

**Commerce / pharmacy (ordre de grandeur) :**

| Permission | owner | tenant-admin | org-admin | manager |
|------------|:-----:|:------------:|:---------:|:-------:|
| `commerce:read/create` | ✅ | ✅ | ✅ | ✅ |
| `commerce:pos_checkout` | ✅ | ❌* | ✅ | ✅ |
| `orders:cancel` | ✅ | ❌* | ❌ | ❌ |
| `orders:refund` | ✅ | ❌ | ❌ | ❌ |
| `pharmacy:link_customer` | ✅ | ❌* | ✅ | ❌ |

\*Selon clauses SQL `NOT IN (...)` de la migration 022 — toujours vérifier le seed en base.

**Platform-admin (realm role)** : hors membership org ; APIs `/admin/tenants*`.

Pour l’UI : ne pas hardcoder cette matrice — s’appuyer sur `context.permissions` + `me/capabilities`.

---

## 19. Roadmap UI & mapping écrans → API

> Toute ligne de cette roadmap doit aussi respecter [`MASTER-UX-UI-SPECIFICATION.md`](./MASTER-UX-UI-SPECIFICATION.md).  
> Wave 1 API = platform + identity + customers + commerce + pharmacy. Le reste = manifests futurs.

### 19.1 Console staff (évolution de `edge-frontend`)

| Écran UI cible | Endpoints Platform Core |
|----------------|-------------------------|
| Login | Keycloak OIDC (pas d’API login staff) |
| Shell / header context | `GET /platform/context`, `GET /platform/me/capabilities` |
| Org switcher | `GET /platform/organizations`, `POST .../switch` + refresh |
| Tenants (super-admin) | `/admin/tenants*` |
| Domaines | `/admin/tenants/:id/domains*` |
| Organisations | `/organizations*` |
| Utilisateurs | `/users*` |
| Memberships | `/memberships*` |
| Invitations | `/invitations*` |
| Rôles | `/roles`, `/permissions` |
| Settings | `/settings/tenant/:ns`, `/settings/organizations/...` |
| Sécurité / sessions | `/security/*`, `/sessions*` |
| Délégations / break-glass | `/delegations*`, `/emergency-access*` |
| Feature flags | `/feature-flags` |
| CRM customers | `/customers*` |
| Commerce POS | `/commerce/*` |
| Patients | `/pharmacy/patients*` |
| Reconciliation | `/admin/reconciliation*` |

### 19.2 App membre (specs `docs/backend`)

| Parcours | Specs | Backend Nest actuel |
|----------|-------|---------------------|
| Splash / force update | 01 | ❌ `/app/config` |
| Auth email | 03–06 | Partiel `customer-auth` |
| Home | 08 | ❌ |
| Commander (catalog→pharmacy→cart→pay) | 11–18 | Commerce POS seulement |
| Ordonnance | 14 | ❌ |
| Chat pharmacien | 19 | ❌ |
| Profil / santé / ayants droit | 24–26 | Portal addresses/consents |
| RDV | 31 | ❌ |
| Notifs | 30 | ❌ |

### 19.3 Deux clients OAuth à ne pas mélanger

| Client | Token | APIs |
|--------|-------|------|
| `edge-frontend` / `platform-api` | Staff JWT + `tenant_id` | Cible : tout sauf `@CustomerRoute` / `@Public` |
| `platform-b2c` | Customer JWT | `/customer/*` + login public |

Stocker les tokens dans des stores séparés ; un 401 sur l’un ne doit pas invalider l’autre sans raison.

---

## 20. Glossaire

| Terme | Définition |
|-------|------------|
| **Control plane** | DB `platform_control` : registry tenants, identity, RBAC, customers core |
| **Tenant DB** | PostgreSQL dédié par tenant : commerce, pharmacy, CRM timeline, outbox |
| **ApplicationUser** | Staff lié à Keycloak `sub` |
| **GlobalCustomer** | Identité client cross-tenant (B2C) |
| **TenantCustomer** | Projection client dans un tenant (`CUS-…`) |
| **PharmacyPatient** | Dossier patient pharmacie, optionnellement lié à TenantCustomer |
| **Organization** | Branche / magasin / pharmacie ; miroir Keycloak Organization |
| **Outbox** | Publication événementielle transactionnelle (pas d’appel direct Rabbit depuis le métier) |
| **Step-up** | Ré-auth MFA (`acr`) pour opérations sensibles |
| **Capabilities** | Snapshot plan + modules + flags + hints navigation pour l’UI |
| **Idempotency-Key** | Clé client pour rejouer un POST provisioning sans double effet |
| **Denylist** | Redis : JWT révoqués (logout / revoke session) |
| **Mock-first** | Client mobile qui simule l’API tant que `USE_MOCK` |

---

### D. Index rapide des chemins Nest (`/api/v1`)

```
platform/context|organizations|organizations/switch|me/capabilities
admin/tenants|admin/tenants/:id/...|admin/tenants/:id/domains|admin/reconciliation/...
tenants/:tenantId|.../status|.../ownership/transfer
organizations|organizations/:id|.../suspend
users|users/me|users/:identityId|.../suspend|disable|reactivate
memberships|memberships/:id
invitations|invitations/accept|invitations/:id/revoke
roles|roles/:id|permissions
settings/tenant/:namespace|settings/organizations/:orgId/:namespace
security/policies|security/mfa/status
sessions|sessions/revoke|logout|revoke-all
delegations|delegations/:id/revoke
emergency-access|emergency-access/:id/revoke
feature-flags
customers|customers/guest|check-duplicates|identify|.../360|export|promote|merge|anonymize|consents|addresses|interactions|organizations
customer-auth/register|login|password-reset
customer/me|consents|addresses
commerce/products|carts|orders|loyalty/:tenantCustomerId
pharmacy/patients|.../link-customer|unlink-customer
```

Hors `/api` : `/liveness` `/readiness` `/health` `/metrics` `/docs`

---

## 21. Référence interactive OpenAPI / Swagger (schémas code)

Cette section documente **la même source** que Swagger UI : décorateurs Nest sur contrôleurs + DTOs (`@ApiProperty`, `@ApiOkDataResponse`, `@ApiJsonBody`, …).

### 21.1 Où trouver quoi

| Besoin | Aller ici |
|--------|-----------|
| Essayer un endpoint dans le navigateur | `http://localhost:3000/docs` |
| JSON OpenAPI runtime (100 % Nest) | `http://localhost:3000/docs-json` |
| Snapshot versionné + tables lisibles | [`OPENAPI-SCHEMAS-REFERENCE.md`](./OPENAPI-SCHEMAS-REFERENCE.md) (**~7200 lignes**) |
| Import outils / codegen | [`openapi.json`](./openapi.json) |
| Régénérer le snapshot | `pnpm docs:openapi` |

### 21.2 Swagger UI — mode d’emploi frontend

1. `pnpm start:dev` (API sur `:3000`, Swagger activé hors prod ou avec `SWAGGER_ENABLED=true`).
2. Ouvrir `/docs`.
3. **Authorize** → coller l’access token Keycloak (client staff ou B2C selon la route). Cette étape teste l’API, pas encore `edge-frontend`.
4. Filtrer par tag : `Platform`, `Customers`, `Commerce`, `Pharmacy`, `Admin`, …
5. Déplier une opération → schéma **Request body** / **Responses** → liens vers `components.schemas.*`.
6. **Try it out** → Execute → inspecter status + body.
7. En bas de page Swagger : section **Schemas** = tous les DTO.

Redirects : `/docs/`, `/api/docs`, `/swagger` → `/docs`.

### 21.3 Génération client TypeScript (prévue pour `edge-frontend`)

```bash
pnpm docs:openapi
npx openapi-typescript edge-frontend/docs/openapi.json -o edge-frontend/openapi-schema.d.ts
```

Puis typer les appels :

```ts
import type { components } from './schema';

type PlatformContext = components['schemas']['PlatformContextResponseDto'];
type SwitchBody = components['schemas']['SwitchOrganizationDto'];
```

### 21.4 Contenu du snapshot généré

Le script `scripts/export-openapi-from-source.ts` produit :

- **90 paths** / **112 operations** (method + path + operationId + permission + request/response DTO)
- **120 schemas** avec propriétés, `required`, `format`, `nullable`, `example`, `x-source-file`
- Enveloppes `{ data }` / `{ data, pagination }` alignées sur `ApiOkDataResponse` / `ApiCreatedDataResponse`
- Erreurs `ApiErrorResponseDto` documentées sur les routes sécurisées

### 21.5 Index des schémas (noms) — détail dans le compagnon

Ouvrir [`OPENAPI-SCHEMAS-REFERENCE.md` §4](./OPENAPI-SCHEMAS-REFERENCE.md) pour le JSON **complet** de chaque entrée. Noms principaux :

**Enveloppes / commun**

- `ApiErrorBodyDto`, `ApiErrorResponseDto`, `PaginationMetaDto`, `PaginationQueryDto`, `SortQueryDto`, `SearchQueryDto`

**Platform / Admin**

- `PlatformContextResponseDto`, `PlatformOrganizationListItemResponseDto`, `SwitchOrganizationDto`, `SwitchOrganizationResultResponseDto`, `CapabilitiesSnapshotDto`, `CapabilitiesPlanDto`, `CapabilitiesOrganizationDto`
- `ProvisionTenantDto`, `PlatformTransitionTenantStatusDto`, `TenantProvisioningResultResponseDto`, `TenantDeprovisionResultResponseDto`, `TenantHealthResponseDto`, …
- `CreateTenantDomainDto`, `VerifyDomainTokenDto`, `TenantDomainResponseDto`, `VerifyStartResponseDto`

**Identity**

- `TenantResponseDto`, `UpdateTenantDto`, `TransitionTenantStatusDto`, `TransferOwnershipDto`, `OwnershipTransferResponseDto`
- `CreateOrganizationDto`, `UpdateOrganizationDto`, `OrganizationResponseDto`, `OrganizationListItemResponseDto`
- `ApplicationUserResponseDto`, `UpdateUserProfileDto`
- `GrantMembershipDto`, `UpdateMembershipDto`, `OrganizationMembershipResponseDto`
- `CreateInvitationDto`, `AcceptInvitationDto`, `InvitationCreatedResponseDto`, `InvitationResponseDto`, …
- `CreateRoleDto`, `UpdateRoleDto`, `RoleResponseDto`, `PermissionResponseDto`, `RoleDeletedResponseDto`
- `UpdateSettingsNamespaceDto`, `SettingsNamespaceResponseDto`, `OrganizationSettingsResponseDto`
- `UpdateSecurityPoliciesDto`, `SecurityPoliciesResponseDto`, `MfaStatusResponseDto`, `RevokeSessionDto`, `SessionObjectDto`, …
- `GrantDelegationDto`, `DelegationResponseDto`, `GrantEmergencyAccessDto`, `EmergencyAccessGrantResponseDto`
- `RunReconciliationDto`, `ReconcileKeycloakResultResponseDto`, `FeatureFlagEntryResponseDto`, …

**Customer**

- `CreateCustomerDto`, `CreateGuestCustomerDto`, `IdentifyCustomerDto`, `MergeCustomersDto`, `PromoteGuestCustomerDto`, …
- `CustomerAggregateResponseDto`, `Customer360ResponseDto`, `TenantCustomerResponseDto`, `GlobalCustomerResponseDto`, …
- `GrantConsentDto`, `WithdrawConsentDto`, `CustomerConsentResponseDto`
- `CreateAddressDto`, `CustomerAddressResponseDto`, `RemoveAddressResponseDto`
- `RegisterCustomerDto`, `CustomerLoginDto`, `CustomerPasswordResetDto`, `CustomerLoginTokensResponseDto`

**Commerce / Pharmacy**

- `CreateProductDto`, `ProductResponseDto`, `CreateCartDto`, `AddCartLineDto`, `CartResponseDto`, `PosCheckoutDto`, `OrderResponseDto`, `OrderTransitionDto`, `LoyaltyAccountResponseDto`
- `CreatePharmacyPatientDto`, `LinkPharmacyPatientCustomerDto`, `PharmacyPatientResponseDto`

### 21.6 Correspondance décorateurs Nest → OpenAPI

| Décorateur code | Effet OpenAPI |
|-----------------|---------------|
| `@ApiTags` / `SwaggerTags.*` | `tags[]` |
| `@ApiBearerAuth` + guards | `security: [{ bearer }]` |
| `@ApiOperation({ summary })` | `summary` |
| `@ApiJsonBody(Dto)` / `@Body() x: Dto` | `requestBody` → `#/components/schemas/Dto` |
| `@ApiOkDataResponse(Dto)` | 200 `{ data: Dto }` |
| `@ApiOkDataResponse(Dto, true)` | 200 `{ data: Dto[], pagination }` |
| `@ApiCreatedDataResponse(Dto)` | 201 `{ data: Dto }` |
| `@ApiProperty` / `Optional` | champs schema + example/format |
| `@RequirePermissions('x:y')` | extension `x-permission` (snapshot) |
| `@Public()` | pas de security bearer |

### 21.7 Différence snapshot vs `/docs-json` live

| | Snapshot `edge-frontend/docs/openapi.json` | Runtime `/docs-json` |
|--|------------------------------|----------------------|
| Quand | `pnpm docs:openapi` sans DB | API démarrée |
| Source | Parse statique décorateurs | `SwaggerModule.createDocument(AppModule)` |
| Fidélité | Très élevée pour DTO/routes | **Source de vérité absolue** si l’app boot |
| Usage CI / lecture offline | ✅ | nécessite process Nest |

En cas d’écart : **préférer `/docs-json` live**, puis re-run `pnpm docs:openapi`.

### 21.8 Lien depuis le catalogue §7

Pour chaque endpoint de la §7, le schéma body/response détaillé (JSON OpenAPI + table de champs) est dans :

**[`edge-frontend/docs/OPENAPI-SCHEMAS-REFERENCE.md`](./OPENAPI-SCHEMAS-REFERENCE.md)**

sections :

1. Référence interactive  
2. Index des opérations (tableau method/path/DTO)  
3. Détail opération par opération  
4. **Catalogue complet des 120 schémas**

---

*Document v1.4.0 — Wave 0 Shell livré. Schémas : [`OPENAPI-SCHEMAS-REFERENCE.md`](./OPENAPI-SCHEMAS-REFERENCE.md) + [`openapi.json`](./openapi.json). Architecture/UX : [`MASTER-PROMPT-EDGE-FRONTEND.md`](./MASTER-PROMPT-EDGE-FRONTEND.md) · [`MASTER-UX-UI-SPECIFICATION.md`](./MASTER-UX-UI-SPECIFICATION.md).*
