# MASTER PROMPT — FRONTEND ENTERPRISE COMPLET

# GLOBAL ERP APPLICATION PLATFORM + DYNAMIC APPLICATION SHELL

## NEXT.JS + TYPESCRIPT + TAILWIND CSS + SHADCN/UI + RADIX UI + MOTION + RECHARTS + TANSTACK QUERY

> **Fichier :** `edge-frontend/docs/MASTER-PROMPT-EDGE-FRONTEND.md`  
> **Version / revue :** 1.1.0 — 2026-09-04  
> **Cible d’implémentation :** `edge-frontend/` (aujourd’hui = scaffold Next.js ; ce document = cible production)  
> **Contrats API :** [`DOCUMENTATION-COMPLETE-FRONTEND-API.md`](./DOCUMENTATION-COMPLETE-FRONTEND-API.md) · [`OPENAPI-SCHEMAS-REFERENCE.md`](./OPENAPI-SCHEMAS-REFERENCE.md) · [`openapi.json`](./openapi.json)  
> **Contrat UX/UI obligatoire :** [`MASTER-UX-UI-SPECIFICATION.md`](./MASTER-UX-UI-SPECIFICATION.md)  
> **Interdit v1 :** Tenant Switcher end-user · mode démo authz · hardcode de rôles

---

# ALIGNEMENT DÉPÔT (lire avant §0)

Ce document est le **master prompt ERP complet** (vision cible).  
Il ne doit **pas** être réduit à « pharmacie uniquement ».

### Contrats obligatoires (non optionnels)

| Contrat | Fichier | Portée |
|---------|---------|--------|
| Architecture / Shell / Authz / Apps | **ce fichier** | OS ERP + Identity/BFF + apps |
| **UX/UI Design System & patterns** | [`MASTER-UX-UI-SPECIFICATION.md`](./MASTER-UX-UI-SPECIFICATION.md) | Shell, tables, forms, mobile, a11y, density, feedback |
| API / OpenAPI | `DOCUMENTATION-COMPLETE-FRONTEND-API.md` + `openapi.json` | Bodies, responses, permissions |

> Toute implémentation UI qui ignore `MASTER-UX-UI-SPECIFICATION.md` est **hors contrat**, même si « ça marche ».

### Comment l’appliquer sur ce repository

| Élément | Alignement réel |
|---------|-----------------|
| Racine frontend | `edge-frontend/` (scaffold App Router → étendre vers Shell ERP) |
| Backend actuel | Platform Core NestJS (`/api/v1/*`) — Identity, Customers, Commerce, Pharmacy |
| Auth cible | **BFF + session HttpOnly** (Keycloak code flow) — **implémenter si absent** |
| Auth Wave 0 (interim) | SPA PKCE **dans** `edge-frontend` (access token mémoire) — **pas** l’ancien `platform-web` (supprimé) ; **interdit** : demo fixtures / refresh en localStorage |
| Portée utilisateur | **Un tenant** (Host + JWT / membership) · **plusieurs organisations du même tenant** · orgs dans JWT · **rôles/permissions différents par organisation** |
| Capabilities / bootstrap | Nest actuel : `GET /api/v1/platform/context` + `me/capabilities` + orgs/switch ; cible BFF `GET /api/bootstrap` qui **orchestre** ces endpoints — **implémenter le BFF manquant** |
| Gaps backend | **Si quelque chose manque** pour Identity/BFF/bootstrap/org selection → **l’implémenter** (Nest/BFF/Keycloak) — ne pas simuler la sécurité |
| Première vague d’apps | `core` / `crm` (customers) / `pos`+`sales` (commerce) / domaine clinique `pharmacy` |
| Apps futures (Inventory, Accounting, HR, …) | **Rester dans l’architecture** (manifests + états `NOT_SUBSCRIBED` / adapters typés) — ne pas les supprimer du Shell |
| Permissions actuelles (colon) | Catalogue Platform Core : `customers:*`, `commerce:*`, `orders:*`, `pharmacy:*`, `platform:*`, … — **ne jamais** hardcoder des rôles |
| Permissions vision (dot) | Exemples `inventory.read` dans ce prompt = **apps futures** — ne pas les câbler tant que l’API n’existe pas |
| OpenAPI | Générer les types depuis `edge-frontend/docs/openapi.json` ; UI live `http://localhost:3000/docs` |
| Tenant Switcher end-user | **FORBIDDEN v1** (Platform Core) — uniquement Organization Switcher |

### Règle d’alignement

1. **Garder** la vision ERP globale (§1–§210) intacte.  
2. **Implémenter d’abord** sur les domaines / endpoints réellement disponibles.  
3. Pour tout domaine sans API : adapter typé + contrat documenté + UX `NOT_SUBSCRIBED` / unavailable — **jamais** de fake security.  
4. Mapper sans confondre :

```text
Core (vision)     → platform + identity + organizations + settings
CRM (vision)      → /api/v1/customers*
POS / Sales       → /api/v1/commerce* (products, carts, orders, loyalty)
Pharmacy (extra)  → /api/v1/pharmacy/patients*
Inventory / Accounting / HR / Payroll / … → future apps (registry-ready)
```

5. Ne jamais envoyer un `tenantId` client pour autoriser.  
6. Après changement d’organisation → BFF valide membership + refresh session/JWT ; invalider caches org-scoped.  
7. Le switch UX principal est **Organization** uniquement. **Tenant Switcher end-user = FORBIDDEN v1.**  
8. Parcours Identity/BFF (§I.*) est **obligatoire** avant le Backoffice ; backend manquant = à développer, pas à mocker.  
9. **UX/UI :** appliquer concrètement [`MASTER-UX-UI-SPECIFICATION.md`](./MASTER-UX-UI-SPECIFICATION.md) à chaque écran Shell et app (density, tables, CmdK, empty/error states, mobile ≠ desktop shrink, permission-aware actions, context indicator Tenant/Org/App).

---

# CONTRAT UX/UI — PRISE EN COMPTE OBLIGATOIRE

Le document [`MASTER-UX-UI-SPECIFICATION.md`](./MASTER-UX-UI-SPECIFICATION.md) est le **contrat design & interaction** du produit.

### Règles de binding (agent / équipe)

1. Avant d’implémenter un écran : lire les sections UX pertinentes (Shell, tables, forms, mobile, access, empty/error).  
2. Ne pas livrer de pages « CRUD générique / cards partout / sidebar template » — hors vision §1–§3 du contrat UX.  
3. Le Shell (§6–§16 UX) et Identity (§I.*) doivent produire la même expérience : Top Bar, App Launcher, Org Switcher, Search, CmdK, Context Indicator.  
4. Toute action visible respecte permission-aware UX (§120–§121 UX) **et** authorization technique (§33–§36 / §I.30).  
5. Density Compact/Comfortable/Spacious, tokens, Motion, WCAG 2.2 AA, i18n (fr/en/rn…) sont des exigences d’implémentation, pas des nice-to-have.  
6. Les apps métier (Core, Inventory, Sales, …) réutilisent primitives + business components du design system — pas de CSS ad hoc page par page.  
7. Critère d’acceptation UI = questions §151 du contrat UX (temps expert, erreurs, clavier, mobile, recoverability, exceptions), pas seulement « build passe ».

### Mapping prompt ↔ UX spec (exemples)

| Master prompt | UX spec à appliquer |
|---------------|---------------------|
| Global Shell / Header / Sidebar | UX §6–§16 |
| Organization switcher | UX §9–§10 (+ Identity §I.17–I.19) |
| Search / Command Palette | UX §11–§13, §56–§57 |
| DataTable / Filters / Saved views | UX §19–§24 |
| Dashboard / Widgets / Recharts | UX §41–§43, §101–§104 |
| Forms / Drawers / Modals | UX §27–§33 |
| Empty / Loading / Error / Offline | UX §44–§47, §82–§83 |
| Mobile / POS / Scanner | UX §16, §48–§55 |
| Permission / No access / Locked app | UX §77–§81, §120–§121 |
| Design tokens / Theme / Density | UX §4, §63–§69, §152 |
| Approvals / Audit / Workflows | UX §138–§142 |

---

# 0. MISSION

Tu es un **Principal Frontend Architect, Staff React/Next.js Engineer, Enterprise UX Architect, Design System Engineer et Frontend Security Engineer**.

Tu dois concevoir, implémenter, refactoriser et finaliser le frontend complet de cette plateforme ERP SaaS.

**Contrat UX/UI :** appliquer intégralement [`MASTER-UX-UI-SPECIFICATION.md`](./MASTER-UX-UI-SPECIFICATION.md) (Business Operating System — densité, shell, tables, mobile, access, feedback, exceptions). Ce n’est pas une annexe optionnelle.

Le résultat attendu n'est PAS :

* une simple interface CRUD ;
* un dashboard template ;
* une sidebar avec quelques pages ;
* une collection de composants ;
* un frontend monolithique ;
* un système de rôles hardcodés.

Le résultat attendu est :

> **une plateforme frontend enterprise-grade, production-ready, multi-tenant, multi-organization, capability-driven, permission-aware, application-driven, microservice-ready et microfrontend-ready.**

Le frontend doit donner l'impression à l'utilisateur d'utiliser :

> **UN SEUL ERP MODERNE**

même si techniquement les différents domaines métier sont des applications/microservices indépendants.

---

# 1. VISION PRODUIT

L'architecture globale doit être comprise ainsi :

```text
                         GLOBAL ERP PLATFORM
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │ GLOBAL APPLICATION SHELL│
                    │                         │
                    │ Identity                │
                    │ Tenant Context          │
                    │ Organization Context    │
                    │ Capabilities             │
                    │ Authorization            │
                    │ Applications             │
                    │ Navigation               │
                    │ Search                  │
                    │ Commands                │
                    │ Notifications            │
                    │ Tasks                   │
                    │ Dashboard               │
                    │ Theme                   │
                    │ Preferences             │
                    │ Telemetry               │
                    └────────────┬────────────┘
                                 │
             ┌───────────────────┼───────────────────┐
             │                   │                   │
             ▼                   ▼                   ▼
           CORE              INVENTORY          ACCOUNTING
             │                   │                   │
             ▼                   ▼                   ▼
       Customers             Stock              Invoices
       Products              Counts             Treasury
       CRM                   Transfers          Reports
       Organizations         Adjustments        GL
```

Le Shell est la plateforme UX commune.

Les applications sont des business domains autonomes.

---

# 2. PRINCIPLE FONDAMENTAL

Le Shell doit être capable de fonctionner avec :

```text
Core uniquement
Core + Inventory
Core + Accounting
Core + Inventory + Accounting
Core + HR
Core + HR + Payroll
Core + POS
Core + CRM + Inventory
etc.
```

sans modifier le code principal du Shell.

Ajouter une nouvelle application doit idéalement consister à :

```text
register application
+
provide manifest
+
provide contracts
+
provide permissions/capabilities
```

et non à modifier 40 composants du Shell.

---

# 3. STACK

Utiliser prioritairement :

```text
Next.js
React
TypeScript strict
Tailwind CSS
shadcn/ui
Radix UI
Lucide Icons
Motion
Recharts
TanStack Query
Zod
React Hook Form
Playwright
Vitest/Jest
```

Respecter les versions déjà présentes dans le repository.

Ne pas mettre à jour massivement les dépendances sans nécessité.

---

# 4. IMPORTANT — ANIMATIONS

Pour le frontend Next.js Web :

```text
Motion
```

est le moteur d'animation principal.

Ne pas utiliser React Native Reanimated dans l'application Web.

Si une future application React Native native existe :

```text
React Native + Reanimated
```

pourra être utilisée indépendamment.

---

# 5. ARCHITECTURE FRONTEND

Le frontend doit être organisé autour de plusieurs couches :

```text
Presentation
↓
Shell
↓
Application Platform
↓
Capability / Authorization
↓
Application Contracts
↓
API / BFF
```

---

# 6. SEPARATION ENTRE SHELL ET APPLICATIONS

Le Shell possède :

```text
global UX
global context
global authorization UX
global navigation
global search
global commands
global notifications
global dashboard orchestration
global theme
global preferences
global telemetry
```

Les applications possèdent :

```text
business pages
business components
business state
business queries
business workflows
business forms
business-specific UI
```

Le Shell ne doit pas connaître les détails internes d'Inventory, Accounting ou HR.

---

# 7. APPLICATIONS = BOUNDED FRONTEND DOMAINS

Exemple :

```text
applications/
├── core/
├── inventory/
├── accounting/
├── sales/
├── purchasing/
├── crm/
├── hr/
├── payroll/
├── pos/
└── analytics/
```

Chaque application doit rester isolée.

Interdit :

```typescript
import AccountingInternalComponent from "../accounting/...";
```

depuis Core.

Interdit :

```typescript
import InventoryStore from "../inventory/...";
```

depuis Accounting.

Les communications passent par des contrats.

---

# 8. GLOBAL SHELL

Créer un véritable :

```text
GlobalApplicationShell
```

responsable de :

```text
identity
tenant
organization
application
capabilities
authorization
navigation
workspace
search
commands
notifications
tasks
dashboard
theme
preferences
```

---

# 9. TENANT MODEL

Le frontend doit comprendre le modèle suivant (Platform Core) :

```text
Un utilisateur authentifié opère dans UN tenant
(celui porté par le JWT — claim tenant_id).

Ce tenant contient une ou plusieurs organisations.
L'utilisateur n'accède qu'aux organisations du MÊME tenant
pour lesquelles il a un membership actif.

Les organisations accessibles et l'organisation active
sont portées / résolues via le JWT (claims org Keycloak)
et validées côté backend — jamais choisies arbitrairement
comme un tenantId libre.
```

Le contexte doit être :

```text
User (Keycloak sub)
↓
Tenant          ← fixe pour la session JWT (isolation)
↓
Organization    ← selectable parmi les orgs autorisées du même tenant
↓
Roles / Permissions  ← peuvent différer PAR organisation
↓
Application
↓
Resource
```

### Règles absolues

* L’utilisateur **ne bascule pas** entre plusieurs tenants dans le Shell staff : le tenant vient de l’authentification / JWT.
* Le frontend ne doit **jamais** permettre de sélectionner arbitrairement un `tenantId` envoyé au backend.
* Le contexte de sécurité vient du backend / authentication / session (JWT).
* Après un changement d’organisation, le client doit **rafraîchir le JWT** pour que org active + droits effectifs correspondent à la nouvelle org.

---

# 10. ORGANIZATION MODEL

Un tenant peut posséder plusieurs organisations/établissements :

```text
Tenant (JWT tenant_id)
├── Organization A
├── Organization B
├── Organization C
```

Un utilisateur peut avoir un accès **par organisation** (memberships du même tenant) :

```text
Organization A ✓  → roles/permissions A  (ex. org-admin, customers:create)
Organization B ✓  → roles/permissions B  (ex. viewer, customers:read seulement)
Organization C ✗  → pas de membership → absente du switcher / du JWT
```

### Points critiques

* Le Shell affiche **uniquement** les organisations réellement accessibles (JWT + `GET /platform/organizations` / capabilities).
* Les **rôles et permissions sont scoped par organisation** : ne jamais réutiliser les droits de l’org A après un switch vers l’org B sans refresh capabilities / JWT.
* L’organisation active après login / switch est celle des claims JWT (post-picker ou post-`organizations/switch` + token refresh).

---

# 11. ORGANIZATION SWITCHER

Créer un composant enterprise :

```text
OrganizationSwitcher
```

alimenté uniquement par les organisations du **tenant courant** auxquelles l’utilisateur a accès (JWT / API), avec :

* recherche ;
* favoris ;
* organisations récentes ;
* statut ;
* éventuellement localisation ;
* éventuellement nombre d'activités ;
* indication claire de l’org **active** (JWT) ;
* keyboard navigation ;
* mobile support.

Ne pas proposer de « Tenant Switcher » utilisateur final pour changer de tenant dans ce modèle.

---

# 12. CONTEXT SWITCHING

Lors du changement d'organisation :

```text
organization.changed
↓
POST /platform/organizations/switch
↓
refresh JWT (org claims + droits)
↓
cancel obsolete requests
↓
invalidate scoped queries (organizationId)
↓
clear scoped client state
↓
refresh capabilities / permissions (org-specific)
↓
refresh navigation
↓
refresh dashboard
↓
refresh current application context
```

Une réponse provenant de l'ancienne organisation ne doit jamais écraser l'état de la nouvelle.

Les permissions affichées (boutons, menus, guards) doivent être celles de l’**organisation active**, pas un mélange multi-org.

---

# 13. AUTHORIZATION MODEL

Le frontend doit supporter :

```text
RBAC
+
ABAC
+
Capability Based Access
+
Resource Scope
+
Application Entitlements
+
Feature Flags
+
Policies
```

---

# 14. DISTINCTION OBLIGATOIRE

Ne jamais confondre :

```text
Tenant
Organization
Application
Module
Feature
Role
Permission
Capability
Policy
Scope
Entitlement
Feature Flag
Resource
Action
```

---

# 15. ROLE

Un rôle est une collection de permissions.

Exemple :

```text
INVENTORY_MANAGER
```

peut fournir :

```text
inventory.read
inventory.count.read
inventory.count.create
inventory.adjust.read
inventory.adjust.create
inventory.adjust.approve
```

Le frontend ne doit cependant jamais faire :

```typescript
if (role === "INVENTORY_MANAGER")
```

---

# 16. PERMISSIONS

Utiliser des permissions atomiques :

```text
inventory.read
inventory.count.read
inventory.count.create
inventory.transfer.read
inventory.transfer.create
inventory.adjust.read
inventory.adjust.create
inventory.adjust.approve
inventory.export
inventory.import
```

Même logique pour les autres applications :

```text
sales.read
sales.create
sales.update
sales.cancel
sales.refund
sales.refund.approve
```

---

# 17. CAPABILITIES

Le Shell doit consommer des **effective capabilities**.

Une capability représente ce que l'utilisateur peut réellement faire dans le contexte courant.

Exemple :

```text
inventory.adjust.create = true
```

avec :

```text
organizationScope
warehouseScope
resourceScope
policy
```

---

# 18. EFFECTIVE ACCESS

Utiliser ce modèle conceptuel :

```text
Effective Access
=
Tenant Entitlement
AND
Application Enabled
AND
Feature Enabled
AND
User Permission
AND
Organization Scope
AND
Resource Scope
AND
Policy
AND
Application Availability
```

---

# 19. CAPABILITY API

Prévoir une abstraction :

```typescript
interface AuthorizationService {
  can(permission: string): boolean;
  canAny(permissions: string[]): boolean;
  canAll(permissions: string[]): boolean;

  hasFeature(feature: string): boolean;

  hasApplication(applicationId: string): boolean;

  hasScope(resource: string, resourceId?: string): boolean;

  evaluate(input: AuthorizationInput): AuthorizationResult;
}
```

---

# 20. AUTHORIZATION RESULT

Ne pas retourner uniquement :

```text
true / false
```

Utiliser :

```typescript
interface AuthorizationResult {
  allowed: boolean;

  reason?:
    | "NOT_AUTHENTICATED"
    | "NOT_AUTHORIZED"
    | "NOT_SUBSCRIBED"
    | "FEATURE_DISABLED"
    | "APPLICATION_UNAVAILABLE"
    | "OUT_OF_SCOPE"
    | "POLICY_DENIED";

  permission?: string;
  applicationId?: string;
  feature?: string;
}
```

---

# 21. WHY ACCESS WAS DENIED

Cette capacité est essentielle.

Le système doit pouvoir déterminer :

```text
Why can't this user do this?
```

Exemple :

```text
Can approve inventory adjustment?

✓ Inventory enabled
✓ Feature enabled
✓ Permission present
✓ Organization allowed
✗ Warehouse not allowed

Result:
OUT_OF_SCOPE
```

---

# 22. `/ME/CAPABILITIES`

Le frontend doit être compatible avec un endpoint de type :

```http
GET /api/v1/me/capabilities
```

ou un endpoint bootstrap équivalent.

> **Alignement Platform Core :** aujourd’hui `GET /api/v1/platform/me/capabilities`.  
> Garder l’abstraction frontend compatible avec `/api/v1/me/capabilities` **et** l’endpoint réel via un adapter.

---

# 23. BOOTSTRAP

Préférer un bootstrap global :

```text
/me/bootstrap
```

contenant si possible :

```text
user
tenant
organization
applications
capabilities
permissions
features
theme
preferences
notifications summary
tasks summary
```

Éviter une cascade de 15 requêtes.

> **Gap actuel :** composer `context` + `capabilities` + `organizations` (+ flags) côté client ; documenter le contrat cible `/me/bootstrap`.

---

# 24. APPLICATION ENTITLEMENTS

Le tenant peut posséder :

```text
Core ✓
Inventory ✓
Accounting ✗
HR ✗
CRM ✓
```

Un utilisateur Admin ne peut pas utiliser Accounting si le tenant ne possède pas Accounting.

> **Alignement :** `capabilities.modules` / plan tenant (`customer`, `commerce`, `pharmacy`, …) = entitlements runtime actuels.

---

# 25. USER PERMISSION

Même si :

```text
Tenant → Inventory ✓
```

un utilisateur peut avoir :

```text
Inventory → ✗
```

Le Shell doit donc résoudre :

```text
Tenant entitlement
+
User permission
```

---

# 26. EXEMPLE

Utilisateur :

```text
Inventory ✓
Sales ✗
Accounting ✗
```

Le App Switcher doit afficher :

```text
Core
Inventory
```

et pas :

```text
Sales
Accounting
```

sauf mode "locked applications" explicitement activé.

---

# 27. FEATURE ACCESS

À l'intérieur d'Inventory :

```text
Stock ✓
Counts ✓
Transfers ✗
Adjustments ✗
Reports ✓
```

La navigation doit être générée dynamiquement.

---

# 28. ACTION ACCESS

Un utilisateur peut avoir :

```text
inventory.adjust.read ✓
inventory.adjust.create ✗
inventory.adjust.approve ✗
```

Donc :

```text
Adjustments
```

peut être accessible en lecture seule.

---

# 29. READ-ONLY MODE

Le frontend doit comprendre :

```text
READ
CREATE
UPDATE
DELETE
APPROVE
EXPORT
IMPORT
EXECUTE
```

indépendamment.

---

# 30. RESOURCE SCOPE

Exemple :

```text
inventory.read = true
```

mais :

```text
organizations:
  org-001
  org-002

warehouses:
  wh-001
```

Le frontend doit refléter ces scopes.

---

# 31. POLICY

Certaines actions nécessitent des règles supplémentaires :

```text
sales.refund
```

peut dépendre :

```text
amount
status
role
approval
```

Le Shell doit être capable de représenter :

```text
Allowed
Denied
Approval Required
```

---

# 32. FRONTEND SECURITY PRINCIPLE

Règle absolue :

> Le frontend ne constitue jamais la sécurité.

Le backend doit refaire toutes les vérifications.

Le frontend sert à :

```text
UX authorization
+
discoverability
+
preventing unnecessary requests
```

Le backend assure :

```text
real authorization
+
tenant isolation
+
organization isolation
+
resource authorization
```

---

# 33. PERMISSION-AWARE UI

Créer :

```tsx
<Can permission="inventory.adjust.create">
  <CreateAdjustmentButton />
</Can>
```

ainsi que :

```tsx
<CanAny />
<CanAll />
<CanFeature />
<CanApplication />
<CanScope />
```

---

# 34. PERMISSION-AWARE NAVIGATION

Les menus doivent être filtrés par :

```text
application
feature
permission
scope
availability
```

---

# 35. PERMISSION-AWARE ROUTING

Créer :

```text
ProtectedRoute
ApplicationGuard
FeatureGuard
PermissionGuard
CapabilityGuard
```

ou une architecture équivalente adaptée à Next.js.

---

# 36. ROUTE SECURITY UX

Si l'utilisateur accède directement à :

```text
/accounting/invoices
```

sans permission :

afficher un état :

```text
403 Unauthorized
```

et non une page vide.

---

# 37. APP MANIFEST

Chaque application doit déclarer :

```typescript
interface ApplicationManifest {
  id: string;
  key: string;
  name: string;
  version: string;

  icon: string;
  category?: string;

  entrypoint: {
    type: "internal" | "remote" | "external";
    route?: string;
    url?: string;
  };

  requiredModule?: string;
  requiredFeatures?: string[];
  requiredPermissions?: string[];

  navigation?: NavigationItem[];
  commands?: CommandDefinition[];
  searchProviders?: SearchProvider[];
  dashboardWidgets?: DashboardWidgetDefinition[];

  health?: ApplicationHealthConfig;
}
```

---

# 38. APPLICATION REGISTRY

Créer :

```text
ApplicationRegistry
```

permettant :

```text
register
unregister
get
getAll
getAvailable
getAuthorized
getByRoute
```

---

# 39. APPLICATION STATES

Supporter :

```text
AVAILABLE
DISABLED
NOT_SUBSCRIBED
NOT_AUTHORIZED
PROVISIONING
SUSPENDED
MAINTENANCE
DEGRADED
OFFLINE
ERROR
UPGRADING
UNKNOWN
```

---

# 40. APPLICATION SWITCHER

Créer une interface extrêmement moderne :

```text
Search applications

Favorites
────────────────

Core
Inventory
Accounting
CRM
HR
POS
```

Fonctions :

* recherche ;
* favoris ;
* récents ;
* catégories ;
* keyboard navigation ;
* responsive ;
* mobile ;
* états d'application.

---

# 41. APPLICATION PROVISIONING

Si une application vient d'être activée :

```text
Inventory
PROVISIONING
```

afficher :

```text
Preparing your workspace...
```

puis automatiquement :

```text
READY
```

sans reload complet si le backend fournit un événement ou un mécanisme de polling.

---

# 42. APPLICATION FAILURE ISOLATION

Si Accounting tombe :

```text
Accounting ❌
```

mais :

```text
Core ✓
Inventory ✓
CRM ✓
```

Le Shell doit continuer à fonctionner.

---

# 43. ERROR BOUNDARIES

Chaque application doit être isolée par un Error Boundary.

Prévoir :

```text
Retry
Reload
Go to Home
Report issue
```

---

# 44. APPLICATION LOADING

Utiliser :

```text
Suspense
lazy loading
dynamic import
streaming
skeleton
```

selon les besoins.

Ne jamais bloquer le Shell entier pour une application secondaire.

---

# 45. APPLICATION CONTRACT

Chaque application peut fournir :

```text
Navigation
Commands
Search
Notifications
Dashboard Widgets
Deep Links
Health
Capabilities
```

---

# 46. APPLICATION SDK

Créer si pertinent :

```text
@platform/app-sdk
```

avec :

```text
manifest
navigation
commands
search
notifications
widgets
events
context
capabilities
```

---

# 47. SHELL SDK

Créer :

```text
@platform/shell-sdk
```

permettant aux applications d'interagir avec le Shell via des contrats stables.

---

# 48. MICROFRONTEND READINESS

Préparer l'architecture pour :

```text
Module Federation
Remote Applications
Independent Deployment
```

mais ne pas introduire Module Federation simplement pour dire qu'il existe.

Le premier objectif est :

```text
modular architecture
+
stable contracts
+
isolation
```

---

# 49. GLOBAL NAVIGATION

Créer :

```text
DynamicNavigationResolver
```

Pipeline :

```text
Application Manifest
↓
Tenant Entitlements
↓
Features
↓
Capabilities
↓
Organization Scope
↓
Application State
↓
User Preferences
↓
Effective Navigation
```

---

# 50. NAVIGATION CONTRACT

```typescript
interface NavigationItem {
  id: string;
  label: string;
  icon?: string;

  href?: string;

  permission?: string;
  permissions?: string[];

  feature?: string;
  requiredApplication?: string;

  children?: NavigationItem[];

  badge?: BadgeDefinition;

  external?: boolean;
}
```

---

# 51. GLOBAL HEADER

Le Header doit afficher intelligemment :

```text
Tenant
Organization
Application
Current page
Global search
Command palette
Notifications
Tasks
Help
User menu
```

---

# 52. DESKTOP SHELL

Structure :

```text
┌───────────────────────────────────────────────────────┐
│ Tenant / Organization | Search | Tasks | Bell | User │
├─────────────┬─────────────────────────────────────────┤
│             │                                         │
│ App         │                                         │
│ Navigation  │               Workspace                 │
│             │                                         │
│             │                                         │
│             │                                         │
└─────────────┴─────────────────────────────────────────┘
```

---

# 53. MOBILE SHELL

Structure adaptative :

```text
┌──────────────────────────┐
│ ☰ Inventory      🔔 👤 │
├──────────────────────────┤
│                          │
│        Workspace         │
│                          │
├──────────────────────────┤
│ Home Search + Tasks More │
└──────────────────────────┘
```

Le contenu doit dépendre des capabilities.

---

# 54. MOBILE-FIRST

Priorité :

```text
320px+
```

puis :

```text
tablet
desktop
large desktop
```

---

# 55. TOUCH UX

Minimum :

```text
44px touch targets
```

Prévoir :

```text
bottom sheets
drawers
sticky actions
swipe where useful
safe areas
```

---

# 56. SIDEBAR

Supporter :

```text
expanded
collapsed
mobile drawer
```

avec :

```text
favorite
recent
badges
permission-aware items
keyboard navigation
```

---

# 57. APP CONTEXT

Afficher clairement :

```text
Premium Pharma
/
Pharmacy Centre
/
Inventory
/
Stock
```

mais adapter la densité selon l'écran.

---

# 58. GLOBAL SEARCH

Créer :

```text
GlobalSearch
```

avec :

```text
Applications
Pages
Customers
Products
Invoices
Orders
Employees
Reports
Commands
```

---

# 59. SEARCH PROVIDERS

Chaque application peut enregistrer :

```typescript
interface SearchProvider {
  id: string;
  applicationId: string;

  search(
    query: string,
    context: SearchContext
  ): Promise<SearchResult[]>;
}
```

---

# 60. SEARCH AUTHORIZATION

Les résultats doivent respecter :

```text
tenant
organization
permission
scope
resource authorization
```

Le backend doit également appliquer ces restrictions.

---

# 61. SEARCH UX

Afficher les résultats par groupe :

```text
Applications
Pages
People
Customers
Products
Documents
Transactions
```

---

# 62. COMMAND PALETTE

Créer :

```text
Ctrl/Cmd + K
```

avec :

```text
Navigate
Search
Create
Switch Application
Switch Organization
Open Settings
Quick Actions
```

---

# 63. COMMAND REGISTRY

```typescript
interface CommandDefinition {
  id: string;
  title: string;
  description?: string;
  shortcut?: string[];

  permission?: string;
  feature?: string;

  execute(context: CommandContext): Promise<void>;
}
```

---

# 64. COMMAND AUTHORIZATION

Une commande sans permission ne doit pas apparaître.

---

# 65. QUICK ACTIONS

Exemples :

Inventory :

```text
New Count
New Transfer
New Adjustment
```

Sales :

```text
New Sale
New Customer
New Order
```

Les actions sont résolues dynamiquement.

---

# 66. GLOBAL NOTIFICATION CENTER

Créer :

```text
NotificationCenter
```

avec :

```text
All
Unread
Mentions
Tasks
Alerts
System
```

---

# 67. NOTIFICATION CONTRACT

```typescript
interface Notification {
  id: string;
  applicationId: string;

  type: string;
  title: string;
  description?: string;

  severity?: "info" | "success" | "warning" | "error";

  read: boolean;
  timestamp: string;

  href?: string;
}
```

---

# 68. TASK CENTER

Créer :

```text
TaskCenter
```

avec :

```text
Approvals
Pending Actions
Assigned Tasks
Deadlines
```

---

# 69. GLOBAL ACTIVITY

Prévoir une activité agrégée :

```text
Core
Inventory
Accounting
Sales
HR
CRM
```

avec isolation stricte.

---

# 70. DEEP LINKS

Les liens :

```text
/inventory/products/123
/accounting/invoices/INV-123
```

doivent vérifier :

```text
application
permission
tenant
organization
resource
scope
```

---

# 71. CROSS-APPLICATION NAVIGATION

Les applications ne doivent pas importer les internals d'autres applications.

Utiliser :

```text
deep links
events
commands
contracts
```

---

# 72. EVENT BUS

Créer :

```text
ShellEventBus
```

avec :

```text
tenant.changed
organization.changed
application.loaded
application.failed
application.ready
navigation.requested
notification.created
search.requested
command.executed
theme.changed
capabilities.changed
```

---

# 73. GLOBAL DASHBOARD

Le Dashboard doit être un agrégateur de widgets.

Chaque application peut déclarer :

```text
KPI
Chart
Table
Alert
Task
Activity
```

---

# 74. DASHBOARD WIDGET CONTRACT

```typescript
interface DashboardWidgetDefinition {
  id: string;
  applicationId: string;

  title: string;

  size:
    | "small"
    | "medium"
    | "large"
    | "full";

  permission?: string;
  feature?: string;

  refreshPolicy?: RefreshPolicy;
}
```

---

# 75. RECHARTS

Utiliser Recharts pour :

```text
Revenue
Sales trends
Inventory value
Stock movement
Financial KPIs
Operational metrics
```

Les graphiques doivent être :

```text
responsive
accessible
performant
dark-mode compatible
```

---

# 76. DASHBOARD PERSONALIZATION

Supporter :

```text
drag & drop
resize
hide
favorite
restore defaults
```

---

# 77. DASHBOARD AUTHORIZATION

Un widget doit être masqué ou remplacé selon :

```text
permission
feature
application
scope
```

---

# 78. WIDGET FAILURE ISOLATION

Un widget qui échoue ne doit pas casser le dashboard.

Afficher :

```text
Unable to load this widget
Retry
```

---

# 79. GLOBAL THEME

Supporter :

```text
System
Light
Dark
```

Préparer :

```text
High Contrast
```

---

# 80. ADVANCED COLOR SYSTEM

Créer des design tokens :

```text
background
foreground
surface
surface-elevated
primary
secondary
accent
muted
border
ring
success
warning
danger
info
```

---

# 81. TENANT BRANDING

Supporter :

```text
logo
favicon
brand name
primary color
secondary color
```

mais avec validation stricte.

Le tenant ne doit jamais injecter arbitrairement du JavaScript/CSS.

---

# 82. DENSITY

Supporter :

```text
Compact
Comfortable
Spacious
```

Le mode Compact doit être particulièrement adapté à l'ERP.

---

# 83. NEUMORPHISM

Utiliser un neumorphism **subtil** :

```text
soft surfaces
controlled elevation
subtle shadows
```

Ne pas transformer toute l'interface en neumorphism.

Le résultat doit rester :

```text
professional
dense
readable
enterprise
```

---

# 84. DESIGN LANGUAGE

Objectif :

```text
Premium
Modern
Dense
Fast
Clear
Professional
Fluid
Accessible
```

Ne pas produire une interface ressemblant à un template Bootstrap/Admin.

---

# 85. DESIGN INSPIRATION

S'inspirer des qualités UX de :

```text
Linear
Stripe
Notion
Vercel
Figma
Salesforce
SAP Fiori
Microsoft Dynamics
ServiceNow
GitHub
```

sans copier leur identité visuelle.

---

# 86. SHADCN/UI

Utiliser shadcn/ui comme fondation.

Créer des composants custom uniquement lorsque nécessaire.

Ne pas réinventer inutilement :

```text
Dialog
Dropdown
Popover
Tooltip
Tabs
Command
Sheet
```

---

# 87. RADIX UI

Utiliser Radix pour les primitives accessibles lorsque pertinent.

---

# 88. ICONOGRAPHY

Utiliser un seul langage d'icônes cohérent, idéalement Lucide.

---

# 89. TYPOGRAPHY

Créer une hiérarchie :

```text
Display
H1
H2
H3
Body
Label
Caption
Mono
```

---

# 90. INFORMATION DENSITY

Un ERP doit permettre :

```text
large datasets
tables
KPIs
filters
actions
```

sans devenir visuellement chaotique.

---

# 91. NO EXCESSIVE CARDS

Ne pas mettre chaque élément dans une Card.

Utiliser :

```text
sections
surfaces
tables
dividers
cards
```

selon le contexte.

---

# 92. GLOBAL DATA TABLE

Créer une abstraction enterprise :

```text
DataTable
```

avec :

```text
sorting
filtering
pagination
column visibility
column resizing
density
selection
bulk actions
saved views
export
```

---

# 93. MOBILE DATA TABLE

Sur mobile :

```text
priority columns
responsive cards
horizontal scrolling
contextual actions
```

---

# 94. FILTER SYSTEM

Créer :

```text
FilterBar
AdvancedFilters
SavedFilters
```

avec :

```text
AND
OR
groups
date ranges
status
search
```

---

# 95. SAVED VIEWS

L'utilisateur doit pouvoir enregistrer :

```text
filters
columns
sorting
grouping
density
```

Exemple :

```text
My expiring products
```

---

# 96. BULK ACTIONS

Les actions massives doivent être filtrées par permissions.

Exemple :

```text
Delete 40 products
```

ne doit apparaître que si :

```text
products.delete
```

est autorisé.

---

# 97. EXPORT / IMPORT

Créer des permissions indépendantes :

```text
inventory.export
inventory.import
```

Ne jamais supposer :

```text
read = export
```

---

# 98. PAGE SYSTEM

Créer :

```text
PageLayout
PageHeader
PageToolbar
PageContent
PageSection
SplitView
DetailPanel
```

---

# 99. PAGE HEADER

Supporter :

```text
breadcrumbs
title
description
status
primary action
secondary actions
tabs
```

Les actions sont capability-aware.

---

# 100. BREADCRUMBS

Dynamiques :

```text
Inventory
/
Stock
/
Warehouse A
/
Movement #123
```

---

# 101. LOADING SYSTEM

Créer :

```text
AppSkeleton
PageSkeleton
TableSkeleton
ChartSkeleton
CardSkeleton
```

---

# 102. EMPTY STATES

Créer des empty states contextualisés.

Exemple :

```text
No inventory counts yet.

Create your first count.
```

Le CTA n'apparaît que si autorisé.

---

# 103. ERROR STATES

Créer :

```text
ErrorState
UnauthorizedState
ForbiddenState
NotFoundState
MaintenanceState
OfflineState
ProvisioningState
```

---

# 104. OFFLINE UX

Si le backend/app supporte l'offline :

```text
offline
reconnecting
syncing
synced
```

Sinon ne pas prétendre que les données seront synchronisées.

---

# 105. GLOBAL PREFERENCES

Supporter :

```text
theme
density
language
timezone
date format
number format
currency display
sidebar state
keyboard shortcuts
notification preferences
dashboard layout
```

---

# 106. INTERNATIONALIZATION

Préparer i18n correctement.

Ne jamais hardcoder les textes dans les composants.

Utiliser des clés :

```text
shell.navigation.dashboard
shell.applications.inventory
```

---

# 107. RTL

Architecture compatible avec :

```text
LTR
RTL
```

---

# 108. ACCESSIBILITY

Objectif :

> WCAG 2.2 AA.

Vérifier :

```text
keyboard
screen readers
focus
contrast
semantic HTML
ARIA
dialogs
menus
tables
charts
```

---

# 109. TOUCH TARGETS

Minimum :

```text
44 × 44px
```

pour les interactions tactiles importantes.

---

# 110. REDUCED MOTION

Respecter :

```text
prefers-reduced-motion
```

---

# 111. MOTION SYSTEM

Créer une motion language cohérente :

```text
page transitions
drawer
modal
popover
hover
press
focus
loading
list
```

Animations :

```text
subtle
fast
predictable
purposeful
```

---

# 112. PERFORMANCE

Le Shell doit être extrêmement rapide.

Priorités :

```text
small initial bundle
lazy applications
code splitting
dynamic imports
streaming
prefetch intelligently
```

---

# 113. APPLICATION LAZY LOADING

Ne pas charger :

```text
Accounting
HR
Inventory
CRM
```

tous au démarrage.

Charger selon :

```text
current app
user behavior
priority
network/device conditions
```

---

# 114. SERVER COMPONENTS

Utiliser les Server Components Next.js lorsqu'ils apportent un bénéfice.

Client Components uniquement lorsque nécessaire.

---

# 115. STATE ARCHITECTURE

Séparer :

```text
Shell state
Application state
Server state
UI state
Form state
```

---

# 116. TANSTACK QUERY

Utiliser TanStack Query pour :

```text
server state
caching
refetch
mutation
invalidation
```

---

# 117. CACHE KEYS

Les données scoped doivent inclure :

```text
tenantId
organizationId
applicationId
resource
```

Exemple :

```typescript
[
  "inventory",
  tenantId,
  organizationId,
  "stock"
]
```

---

# 118. CACHE ISOLATION

Interdire :

```text
products
```

comme cache key globale lorsque les produits sont tenant-scoped.

---

# 119. CONTEXT SWITCH CACHE

Le switch utilisateur courant est **organisationnel** (même tenant JWT) :

```text
Organization A
→
Organization B
```

Aucune donnée / capability / permission de A ne doit rester visible dans B.

Le `tenantId` du JWT ne change pas lors d’un org switch ; en revanche `organizationId` + droits effectifs changent → invalider toutes les query keys scoped par `organizationId`.

*(Un changement de tenant n’est pas un flux Shell utilisateur : nouvelle session / autre identité. Si le JWT change de `tenant_id`, purger intégralement le cache comme une nouvelle session.)*

---

# 120. RACE CONDITION PROTECTION

Une réponse obsolète ne doit jamais écraser le contexte courant.

Utiliser :

```text
AbortController
request identity
query invalidation
context version
```

si nécessaire.

---

# 121. API CLIENT

Créer une abstraction :

```text
@platform/api-client
```

avec :

```text
authentication
requestId
correlationId
timeouts
retry
cancellation
error normalization
```

---

# 122. ERROR CONTRACT

Normaliser :

```text
401
403
404
409
422
429
500
503
```

vers des erreurs métier frontend compréhensibles.

> **Alignement :** envelope Platform Core `{ error: { code, message, details, requestId, correlationId } }`.

---

# 123. RETRY

Retry uniquement les erreurs appropriées.

Ne pas retry :

```text
400
401
403
validation
business conflict
```

---

# 124. SECURITY HEADERS COMPATIBILITY

Le frontend doit être compatible avec :

```text
CSP
HSTS
Referrer-Policy
Permissions-Policy
X-Content-Type-Options
```

---

# 125. XSS

Ne jamais utiliser `dangerouslySetInnerHTML` sans :

```text
strict justification
sanitization
trusted source
```

---

# 126. OPEN REDIRECT

Valider tous les redirects.

---

# 127. EXTERNAL APPLICATIONS

Si le Shell supporte une application externe :

```text
allowed origins
HTTPS
sandbox
CSP
trusted URLs
```

---

# 128. IFRAME

Iframe uniquement lorsque réellement nécessaire.

Créer :

```text
ExternalApplicationAdapter
```

---

# 129. APPLICATION VERSIONING

Supporter :

```text
applicationVersion
manifestVersion
apiVersion
designSystemVersion
```

---

# 130. COMPATIBILITY

Avant de charger une application :

```text
Shell version
Application version
Contract version
Design system version
```

doivent être compatibles.

---

# 131. APPLICATION HEALTH

Afficher les états métier :

```text
Operational
Degraded
Maintenance
Unavailable
Provisioning
```

sans exposer inutilement des détails techniques.

---

# 132. SYSTEM STATUS

Créer éventuellement :

```text
SystemStatus
```

exemple :

```text
All systems operational
```

ou :

```text
Accounting is experiencing degraded performance.
```

---

# 133. NOTIFICATION REALTIME

Préparer :

```text
SSE
WebSocket
Polling
```

selon les capacités backend.

---

# 134. REALTIME EVENTS

Supporter :

```text
permission.changed
application.ready
application.failed
notification.created
task.created
organization.updated
```

---

# 135. RUNTIME PERMISSION CHANGES

Si une permission est retirée pendant une session :

```text
refresh capabilities
invalidate authorization state
hide action
handle backend 403
```

---

# 136. SESSION

Gérer :

```text
authenticated
refreshing
expired
revoked
locked
logout
```

---

# 137. TOKEN SECURITY

Ne pas stocker inutilement des tokens sensibles dans localStorage.

Respecter l'architecture OIDC/Keycloak/BFF du backend existant.

---

# 138. TENANT SUSPENSION

Si tenant :

```text
SUSPENDED
```

le Shell doit afficher l'état correspondant.

---

# 139. APPLICATION MAINTENANCE

Une application en maintenance ne doit pas bloquer les autres.

---

# 140. FEATURE FLAGS

Séparer :

```text
feature flag
```

de :

```text
permission
```

et :

```text
subscription entitlement
```

---

# 141. PLAN / SUBSCRIPTION

Si tenant n'a pas une application :

```text
NOT_SUBSCRIBED
```

Si utilisateur n'a pas le droit :

```text
NOT_AUTHORIZED
```

Ne jamais mélanger les deux.

---

# 142. UPGRADE UX

Pour :

```text
NOT_SUBSCRIBED
```

le frontend peut proposer :

```text
Upgrade
Contact administrator
Learn more
```

selon la stratégie produit.

---

# 143. REQUEST ACCESS

Pour :

```text
NOT_AUTHORIZED
```

prévoir :

```text
Request access
```

si le produit le permet.

---

# 144. MY ACCESS

Créer une page :

```text
My Access
```

montrant :

```text
Applications
Roles
Permissions
Organizations
Scopes
Temporary access
```

---

# 145. ADMIN USER ACCESS

Les administrateurs autorisés doivent pouvoir voir :

```text
User
↓
Roles
↓
Permissions
↓
Applications
↓
Organizations
↓
Scopes
↓
Effective capabilities
```

---

# 146. ACCESS REQUEST

Préparer :

```text
AccessRequest
```

avec :

```text
user
application
permission
reason
status
reviewer
createdAt
```

---

# 147. TEMPORARY ACCESS

Supporter :

```text
temporaryRole
temporaryPermission
temporaryScope
```

avec :

```text
startAt
expiresAt
reason
grantedBy
```

---

# 148. HIGH-RISK ACTIONS

Marquer :

```text
inventory.adjust.approve
accounting.period.close
sales.refund.approve
user.manage
role.manage
permission.manage
```

avec UX de confirmation renforcée.

---

# 149. APPROVAL UX

Supporter :

```text
Approve
Reject
Request changes
Review
```

---

# 150. GLOBAL HELP

Créer :

```text
Help
Documentation
Keyboard Shortcuts
What's New
Support
Report Issue
```

---

# 151. GLOBAL USER MENU

Inclure :

```text
Profile
Preferences
Security
Sessions
Keyboard Shortcuts
Help
Documentation
Switch Organization
Logout
```

> Pas de « Switch Tenant » dans le menu utilisateur : le tenant est celui de la session JWT.

---

# 152. FAVORITES

Supporter :

```text
favorite applications
favorite pages
favorite reports
favorite resources
```

---

# 153. RECENTS

Supporter :

```text
recent applications
recent pages
recent resources
```

avec respect des règles de confidentialité.

---

# 154. PERSONALIZED WORKSPACE

L'utilisateur peut personnaliser :

```text
dashboard
favorites
density
theme
sidebar
shortcuts
widgets
```

sans contourner les permissions.

---

# 155. GLOBAL ACTIVITY

Afficher :

```text
Recent Activity
```

agrégée à partir des applications.

---

# 156. SEARCH RESULT DEEP LINK

Un résultat doit fournir :

```text
applicationId
resourceType
resourceId
route
```

---

# 157. DASHBOARD WIDGET SECURITY

Chaque widget doit être filtré avant affichage.

---

# 158. NOTIFICATION SECURITY

Une notification doit être accessible uniquement si l'utilisateur peut accéder à la ressource associée.

---

# 159. TASK SECURITY

Même principe pour les tâches.

---

# 160. APPLICATION ISOLATION

Si une application contient un bug :

```text
Application failure
```

ne doit jamais provoquer :

```text
Shell crash
```

---

# 161. ERROR REPORTING

Préparer une abstraction :

```text
ErrorReporter
```

compatible avec :

```text
Sentry
OpenTelemetry
ou système interne
```

---

# 162. TELEMETRY

Tracer :

```text
shell.load
application.load
application.error
application.switch
navigation.click
search.query
command.execute
organization.switch
session.tenant_bound
authorization.denied
notification.open
```

> Ne pas implémenter un événement UX `tenant.switch` comme action menu : le tenant est lié à la session JWT.

---

# 163. TELEMETRY CONTEXT

Si nécessaire :

```text
tenant context
organization context
applicationId
requestId
correlationId
```

mais jamais de données sensibles inutiles.

---

# 164. PERFORMANCE TELEMETRY

Mesurer :

```text
LCP
INP
CLS
TTFB
application load time
navigation latency
```

---

# 165. PRIVACY

Ne jamais envoyer inutilement :

```text
passwords
tokens
medical information
financial payloads
PII
full resource payloads
```

---

# 166. LOGGING

Logs structurés :

```json
{
  "event": "application.load",
  "applicationId": "inventory",
  "durationMs": 250,
  "requestId": "..."
}
```

---

# 167. FRONTEND FOLDER ARCHITECTURE

Adapter au repository existant (`edge-frontend/`).

Architecture cible :

```text
src/
├── app/
│
├── shell/
│   ├── core/
│   ├── context/
│   ├── authorization/
│   ├── capabilities/
│   ├── applications/
│   ├── navigation/
│   ├── commands/
│   ├── search/
│   ├── notifications/
│   ├── tasks/
│   ├── dashboard/
│   ├── theme/
│   ├── preferences/
│   ├── telemetry/
│   └── lifecycle/
│
├── applications/
│   ├── core/
│   ├── inventory/
│   ├── accounting/
│   ├── sales/
│   └── ...
│
├── components/
│   ├── ui/
│   ├── shell/
│   ├── data/
│   └── feedback/
│
├── lib/
│   ├── api/
│   ├── auth/
│   ├── validation/
│   └── utils/
│
├── providers/
│
└── types/
```

---

# 168. DOMAIN ISOLATION

Le code métier d'une application ne doit pas polluer le Shell.

---

# 169. NO GOD COMPONENT

Interdit :

```text
HugeLayout.tsx
```

ou :

```text
ERPLayout.tsx
```

de milliers de lignes.

Découper proprement.

---

# 170. NO GOD STORE

Ne pas créer un énorme store contenant :

```text
tenant
organization
inventory
accounting
sales
HR
```

---

# 171. TYPESCRIPT

Strict mode.

Interdire :

```text
any
```

sauf justification exceptionnelle.

Éviter :

```text
as unknown as ...
```

comme moyen de contourner le typage.

---

# 172. ZOD

Valider :

```text
API responses
application manifests
capabilities
preferences
configuration
```

lorsque nécessaire.

---

# 173. DESIGN SYSTEM PACKAGE

Si le projet le permet :

```text
@platform/ui
```

et :

```text
@platform/app-sdk
@platform/shell-sdk
@platform/api-client
```

---

# 174. DESIGN SYSTEM COMPONENTS

Minimum :

```text
Button
Input
Select
Combobox
Textarea
Checkbox
Switch
Radio
Dialog
Drawer
Sheet
Popover
Tooltip
Dropdown
Tabs
Table
Badge
Avatar
Breadcrumb
Pagination
Command
Calendar
DatePicker
Toast
Skeleton
EmptyState
ErrorState
```

---

# 175. ENTERPRISE COMPONENTS

Créer :

```text
ApplicationCard
ApplicationSwitcher
OrganizationSwitcher
PermissionGate
CapabilityGate
GlobalSearch
CommandPalette
NotificationCenter
TaskCenter
ActivityFeed
KPI
MetricCard
FilterBar
DataTable
BulkActionBar
SavedView
ResourceHeader
```

> Pas de `TenantSwitcher` end-user : le tenant est imposé par le JWT. L’org switcher est le contrôle de contexte principal.

---

# 176. TESTING

Tester :

```text
components
authorization
navigation
application registry
capabilities
context switching
cache isolation
routing
deep links
```

---

# 177. AUTHORIZATION TESTS

Tester obligatoirement :

```text
user has permission
user lacks permission
tenant lacks module
feature disabled
organization out of scope
warehouse out of scope
temporary permission expired
permission revoked
```

---

# 178. TENANT ISOLATION TESTS

Le tenant n’est **pas** switchable dans l’UI. Tester plutôt :

```text
JWT tenant_id = T1
→ aucune requête / UI ne peut cibler un autre tenant
→ absence de contrôle "switch tenant"
→ tenantId jamais envoyé comme paramètre d’authz client
```

et vérifier qu’un token / contexte périmé d’un autre tenant ne peut pas polluer le cache ni la navigation.

---

# 179. ORGANIZATION ISOLATION TESTS

Tester :

```text
Organization A (permissions A)
→
switch + refresh JWT
→
Organization B (permissions B)
```

et vérifier :

```text
no stale data
no stale navigation
no stale capabilities
no stale permissions (droits A ≠ droits B)
no stale cache
```

---

# 180. APPLICATION FAILURE TESTS

Simuler :

```text
Accounting unavailable
```

et vérifier :

```text
Core works
Inventory works
Shell works
```

---

# 181. PROVISIONING TESTS

Simuler :

```text
Inventory
PROVISIONING
↓
READY
```

et :

```text
PROVISIONING
↓
FAILED
↓
RETRY
```

---

# 182. RUNTIME PERMISSION TEST

Scénario :

```text
User currently has inventory.adjust.create
```

Puis backend retire :

```text
inventory.adjust.create
```

Le frontend doit :

```text
refresh
remove action
handle 403
```

---

# 183. E2E SCENARIO 1

User :

```text
inventory.read
```

mais pas :

```text
sales.read
```

Résultat :

```text
Inventory visible
Sales absent
```

---

# 184. E2E SCENARIO 2

User :

```text
inventory.read
inventory.count.read
```

Résultat :

```text
Stock visible
Counts visible
Transfers hidden
Adjustments hidden
```

---

# 185. E2E SCENARIO 3

User :

```text
inventory.adjust.read
```

mais pas :

```text
inventory.adjust.create
```

Résultat :

```text
Adjustment page accessible
Create button absent
```

---

# 186. E2E SCENARIO 4

Tenant :

```text
Accounting NOT SUBSCRIBED
```

Résultat :

```text
Accounting unavailable
```

---

# 187. E2E SCENARIO 5

Application :

```text
Accounting DOWN
```

Résultat :

```text
Shell functional
Core functional
Inventory functional
Accounting isolated
```

---

# 188. E2E SCENARIO 6

Organization switch :

```text
Org A
→
Org B
```

Résultat :

```text
navigation refreshed
capabilities refreshed
queries invalidated
data refreshed
```

---

# 189. E2E SCENARIO 7

Direct deep link :

```text
/accounting/invoices/123
```

sans accès.

Résultat :

```text
Forbidden / Unauthorized
```

---

# 190. E2E SCENARIO 8

User change :

```text
permission removed
```

pendant session.

Résultat :

```text
action removed
backend protected
UX correct
```

---

# 191. VISUAL REGRESSION

Tester :

```text
Mobile
Tablet
Desktop
Large Desktop
Light
Dark
Compact
Comfortable
```

---

# 192. STORYBOOK

Si compatible avec le repository :

```text
Storybook
```

pour :

```text
Shell
AppSwitcher
Sidebar
CommandPalette
GlobalSearch
PermissionGate
DataTable
NotificationCenter
OrganizationSwitcher
```

---

# 193. ACCESSIBILITY AUTOMATION

Utiliser :

```text
axe
Playwright
keyboard testing
```

---

# 194. RESPONSIVE QA

Tester au minimum :

```text
320
375
390
430
768
1024
1280
1440
1920
```

---

# 195. PERFORMANCE QA

Vérifier :

```text
initial bundle
route transitions
application loading
search latency
dashboard loading
hydration
```

---

# 196. SECURITY QA

Vérifier :

```text
XSS
open redirect
tenant switching
organization switching
stale cache
stale requests
unauthorized routes
unauthorized actions
external app security
```

---

# 197. CI

Le pipeline doit passer :

```text
lint
typecheck
unit tests
integration tests
E2E
build
```

---

# 198. BUILD

Le build production doit être propre :

```text
next build
```

sans :

```text
TypeScript errors
ESLint blocking errors
hydration mismatch
runtime critical errors
```

---

# 199. NO PLACEHOLDER IMPLEMENTATION

Interdit de livrer :

```text
TODO
fake API
fake permission
fake authorization
fake navigation
mock security
```

dans les chemins critiques.

Si une API backend manque :

```text
create typed adapter
document exact backend contract
```

mais ne pas simuler une sécurité inexistante.

---

# 200. BACKEND CONTRACT GAPS

Si le backend n'expose pas encore les capacités nécessaires, documenter précisément :

```text
Endpoint
Request
Response
Authentication
Authorization
Tenant context
Organization context
Error model
```

Exemple :

```text
GET /me/bootstrap
```

avec :

```text
user
tenant
organization
applications
permissions
features
scopes
```

Référencer aussi les docs locales : `DOCUMENTATION-COMPLETE-FRONTEND-API.md`, `OPENAPI-SCHEMAS-REFERENCE.md`, `openapi.json`.

---

# 201. IMPLEMENTATION PROCESS

Avant d'écrire du code :

### STEP 1 — AUDIT

Inspecter :

```text
package.json
Next.js
routing
layouts
auth
Keycloak
API client
state
Tailwind
shadcn
existing modules
existing permissions
existing design system
tests
edge-frontend/docs/*
```

---

### STEP 2 — GAP ANALYSIS

Identifier :

```text
existing
partial
missing
duplicated
legacy
unsafe
```

---

### STEP 3 — TARGET ARCHITECTURE

Produire :

```text
folder structure
component architecture
state architecture
authorization architecture
application architecture
API contracts
```

---

### STEP 4 — IMPLEMENT FOUNDATION

Commencer par :

```text
Shell foundation
Tenant context
Organization context
Bootstrap
Capabilities
Authorization
Application Registry
```

---

### STEP 5 — IMPLEMENT UX SHELL

Puis :

```text
Header
Sidebar
App Switcher
Organization Switcher
Responsive Shell
```

---

### STEP 6 — GLOBAL SERVICES

Puis :

```text
Search
Command Palette
Notifications
Tasks
Activity
Dashboard
```

---

### STEP 7 — DESIGN SYSTEM

Puis :

```text
Theme
Density
Motion
Accessibility
Responsive
Branding
```

---

### STEP 8 — HARDENING

Puis :

```text
Security
Performance
Telemetry
Error isolation
Cache isolation
```

---

### STEP 9 — TESTING

Enfin :

```text
Unit
Integration
E2E
Accessibility
Visual
Performance
```

---

# 202. ARCHITECTURAL RULE

Chaque nouvelle application doit pouvoir être ajoutée ainsi :

```text
Application Manifest
+
Capabilities
+
Navigation
+
Commands
+
Search
+
Widgets
+
Notifications
```

sans modifier le cœur du Shell.

---

# 203. EXEMPLE FINAL

Supposons :

```text
Tenant:
Premium Pharma

Applications:
Core ✓
Inventory ✓
Accounting ✓
Sales ✓
HR ✗
```

Utilisateur :

```text
Role:
Inventory Manager
```

Permissions :

```text
products.read
products.update

inventory.read
inventory.count.read
inventory.count.create
inventory.adjust.read

sales.read

accounting.report.read
```

Le Shell doit produire automatiquement :

```text
APPLICATIONS
──────────────────
Core
Inventory
Accounting
Sales
```

Navigation :

```text
Core
├── Products
└── Customers

Inventory
├── Dashboard
├── Stock
├── Counts
└── Adjustments

Accounting
└── Reports

Sales
└── Sales
```

mais :

```text
Create Adjustment
```

n'apparaît pas car :

```text
inventory.adjust.create
```

est absent.

---

# 204. EXEMPLE AVANCÉ DE SCOPE

Utilisateur :

```text
inventory.adjust.create
```

mais uniquement :

```text
Organization:
Pharmacy Centre

Warehouse:
WH-CENTRE
```

Alors :

```text
Pharmacy Centre
→ Create Adjustment ✓

Pharmacy Nord
→ Create Adjustment ✗
```

---

# 205. EXEMPLE DE POLICY

Utilisateur possède :

```text
sales.refund.create
```

mais :

```text
refund amount > approval threshold
```

Le Shell peut afficher :

```text
Refund
Approval required
```

plutôt que simplement :

```text
Refund unavailable
```

---

# 206. EXPERIENCE FINALE

L'utilisateur doit ressentir :

```text
Une seule plateforme
Une seule navigation
Une seule recherche
Une seule commande
Un seul système de notifications
Un seul espace de travail
Une seule identité visuelle
```

même lorsque :

```text
Core
Inventory
Accounting
HR
CRM
POS
```

sont techniquement des applications indépendantes.

---

# 207. GOLDEN RULE

Le Shell doit fonctionner comme :

> **l'Operating System UX de l'ERP.**

Les applications doivent fonctionner comme :

> **les Business Applications installées dans cet Operating System.**

Le Shell orchestre.

Les applications exécutent le métier.

Le backend sécurise.

Les contracts découplent.

Les capabilities déterminent l'accès.

Les permissions déterminent les actions.

Les scopes déterminent les données accessibles.

Les entitlements déterminent les applications disponibles.

Les feature flags déterminent les fonctionnalités activées.

---

# 208. DEFINITION OF DONE

Le frontend complet n'est terminé que lorsque :

```text
[ ] Global Shell
[ ] Tenant Context
[ ] Organization Context
[ ] Application Registry
[ ] Application Manifest
[ ] Application Lifecycle
[ ] Application States
[ ] Capability Engine
[ ] Permission Engine
[ ] Scope Engine
[ ] Authorization UX
[ ] Dynamic Navigation
[ ] Protected Routes
[ ] App Switcher
[ ] Organization Switcher
[ ] Global Search
[ ] Command Palette
[ ] Quick Actions
[ ] Notification Center
[ ] Task Center
[ ] Activity Center
[ ] Global Dashboard
[ ] Dashboard Widgets
[ ] Recharts
[ ] Theme System
[ ] Tenant Branding
[ ] Density System (Compact/Comfortable/Spacious)
[ ] Motion System
[ ] Responsive UI
[ ] Mobile-first UX (pas desktop shrink)
[ ] Accessibility WCAG 2.2 AA
[ ] Data Tables + Filters + Saved Views + Bulk Actions
[ ] Empty / Loading / Error / Offline states (contrat UX)
[ ] Context Indicator Tenant/Org/App
[ ] Exception-first dashboards
[ ] Design tokens + primitive + business component libraries
[ ] Conformité MASTER-UX-UI-SPECIFICATION.md
[ ] Deep Links
[ ] Cross-app Navigation
[ ] Error Boundaries
[ ] Cache Isolation
[ ] Context Switching
[ ] Runtime Capability Refresh
[ ] Security Hardening
[ ] Observability
[ ] Performance
[ ] Unit Tests
[ ] Integration Tests
[ ] E2E Tests
[ ] Accessibility Tests
[ ] Visual Tests
[ ] Production Build
```

---

# 209. FINAL INSTRUCTION TO THE CODING AGENT

Ne te contente jamais de produire quelque chose qui "fonctionne".

Tu dois rechercher :

```text
Correctness
Architecture
Security
UX
Performance
Accessibility
Maintainability
Scalability
Observability
Testability
```

à chaque étape.

Si quelque chose existe déjà dans le repository :

```text
inspect
evaluate
reuse
refactor
```

avant de recréer.

Si quelque chose est mal conçu :

```text
identify
explain
migrate
remove legacy
```

Si une dépendance ou une architecture existante est suffisante :

```text
reuse it
```

plutôt que d'ajouter une nouvelle dépendance inutile.

**UX/UI :** toute surface livrée doit être validée contre [`MASTER-UX-UI-SPECIFICATION.md`](./MASTER-UX-UI-SPECIFICATION.md) (Shell, densité, tables, mobile, access, feedback, exceptions). Une feature techniquement correcte mais UX hors contrat n’est **pas** Done.

---

# 210. FINAL QUALITY BAR

Le résultat final doit être suffisamment robuste pour supporter l'ajout futur de :

```text
Core
CRM
Inventory
Sales
Purchasing
Accounting
Treasury
HR
Payroll
POS
Supply Chain
Fleet
Projects
Manufacturing
Analytics
BI
AI Copilot
```

sans refactorisation fondamentale du Shell.

Le système doit être :

```text
ENTERPRISE-GRADE
PRODUCTION-READY
MULTI-TENANT
MULTI-ORGANIZATION
CAPABILITY-DRIVEN
PERMISSION-AWARE
RBAC + ABAC READY
MICROSERVICE-READY
MICROFRONTEND-READY
MOBILE-FIRST
RESPONSIVE
ACCESSIBLE
FAST
OBSERVABLE
SECURE
SCALABLE
MAINTAINABLE
EXTENSIBLE
```

Et le principe architectural final doit rester :

```text
                    TENANT
                       │
                 ENTITLEMENTS
                       │
                 APPLICATION
                       │
                    FEATURE
                       │
                     ROLE
                       │
                  PERMISSION
                       │
                    POLICY
                       │
                     SCOPE
                       │
                   RESOURCE
                       │
                    ACTION
                       │
             EFFECTIVE CAPABILITY
                       │
                       ▼
              GLOBAL APP SHELL
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
      CORE         INVENTORY      ACCOUNTING
```

**Implémente maintenant cette architecture sur le repository réel (`edge-frontend/`), sans créer une architecture parallèle artificielle, et considère la mission terminée uniquement lorsque l'ensemble des exigences critiques est réellement implémenté, testé et vérifié en conditions de production.**

---

# SPÉCIFICATION COMPLÈTE — IDENTITY, KEYCLOAK, BFF, TENANT RESOLUTION, ORGANIZATION SELECTION & AUTHORIZATION

> **Section I.** — Fondation Identity & Access du Global Application Shell.  
> **Règle :** si un élément de cette chaîne manque au backend (BFF, bootstrap, session cookies, domain→tenant, org selection server-side, etc.), **il faut l’implémenter** côté Nest/BFF/Keycloak — ne pas simuler la sécurité côté frontend.  
> **Alignement Platform Core (§9) :** un utilisateur staff opère dans **un tenant** (Host + identité + membership) et **une ou plusieurs organisations du même tenant**, avec **rôles/permissions différents par organisation**, portés/validés via JWT/session — pas de choix arbitraire de `tenantId` client.

## I.1. OBJECTIF GLOBAL

L'implémentation frontend ne doit pas commencer au moment où l'utilisateur arrive déjà dans le Backoffice.

Elle doit implémenter l'intégralité du parcours :

```text
Browser
   │
   ▼
Tenant Domain / Custom Domain
   │
   ▼
Frontend Application
   │
   ▼
BFF
   │
   ├── Tenant Resolution
   ├── Authentication State
   ├── Keycloak Integration
   ├── Session Validation
   ├── Organization Resolution
   ├── Entitlements Resolution
   ├── Roles Resolution
   ├── Permissions Resolution
   ├── Feature Flags Resolution
   ├── Scope Resolution
   └── Application Availability
   │
   ▼
Keycloak
   │
   ├── User Identity
   ├── Organization Membership
   ├── Groups / Roles
   └── Authentication
   │
   ▼
Bootstrap /Me Context
   │
   ▼
Global Application Shell
   │
   ├── Application Switcher
   ├── Navigation
   ├── Search
   ├── Command Palette
   ├── Notifications
   ├── Dashboard
   └── Current Application
   │
   ▼
Core / Inventory / Accounting / HR / POS / CRM / ...
```

L'objectif est que l'utilisateur n'ait jamais à gérer manuellement :

* le tenant ;
* la base de données du tenant ;
* l'organisation ;
* les modules ;
* les permissions ;
* les rôles ;
* les scopes ;
* les entitlements ;
* les fonctionnalités disponibles.

Tout doit être résolu automatiquement par la plateforme.

---

## I.2. ARCHITECTURE IDENTITY À IMPLÉMENTER

L'architecture doit distinguer clairement :

```text
Identity
   ↓
User
   ↓
Tenant Membership
   ↓
Organization Membership
   ↓
Role
   ↓
Permission
   ↓
Policy
   ↓
Scope
   ↓
Entitlement
   ↓
Feature
   ↓
Application
```

Ne jamais confondre :

* authentication ;
* tenant resolution ;
* organization resolution ;
* authorization ;
* subscription ;
* entitlement ;
* feature flag ;
* application availability.

Ce sont des responsabilités différentes.

---

## I.3. KEYCLOAK COMME IDENTITY PROVIDER

Keycloak doit être utilisé comme Identity Provider central.

Keycloak est responsable notamment de :

* login ;
* logout ;
* session ;
* token issuance ;
* token refresh ;
* MFA ;
* password policies ;
* identity federation ;
* organisation membership ;
* groupes ;
* rôles IAM ;
* claims nécessaires à l'application.

Cependant :

> Keycloak n'est PAS la source de vérité de toutes les règles métier SaaS.

L'application doit conserver ses propres données de :

* tenant ;
* abonnement ;
* entitlements ;
* modules ;
* features ;
* permissions métier ;
* policies ;
* scopes métier ;
* ressources ;
* quotas ;
* état du tenant ;
* état des applications.

---

## I.4. STRUCTURE KEYCLOAK

Prévoir une architecture Keycloak cohérente avec le modèle SaaS.

Exemple :

```text
Keycloak
│
├── Master / Administration Realm
│
└── SaaS Client Realm
     │
     ├── Client Application
     │
     ├── Organizations
     │
     ├── Groups
     │
     ├── Realm Roles
     │
     ├── Client Roles
     │
     └── Identity Providers
```

Le système doit éviter de créer inutilement :

```text
1 realm = 1 tenant
```

si l'architecture retenue est un realm client partagé (**Platform Core : realm `platform` partagé**).

Le tenant reste une entité applicative (`tenant_id` + control plane).

---

## I.5. KEYCLOAK ORGANIZATION

Une Organization Keycloak représente une organisation/établissement dans le modèle métier lorsque cette correspondance est retenue.

Exemple :

```text
Tenant:
Premium Pharma

Organizations:
├── Premium Pharma Bujumbura
├── Premium Pharma Gitega
└── Premium Pharma Ngozi
```

Un utilisateur peut avoir :

```text
User
│
├── Organization A
└── Organization B
```

**(du même tenant)** — avec rôles/permissions éventuellement différents par organisation.

Son accès doit toujours être contrôlé par :

```text
User
+
Tenant
+
Organization
+
Role
+
Permission
+
Scope
```

---

## I.6. AUTHENTIFICATION — PARCOURS COMPLET

Le frontend doit implémenter un véritable state machine d'authentification.

États minimum :

```text
UNKNOWN
INITIALIZING
AUTHENTICATING
AUTHENTICATED
SELECTING_ORGANIZATION
BOOTSTRAPPING
READY
SESSION_EXPIRED
LOGGING_OUT
ERROR
```

Ne jamais utiliser simplement :

```ts
isLoggedIn === true
```

pour décider que l'application est prête.

---

## I.7. ARRIVÉE SUR LE DOMAINE TENANT

Exemple :

```text
https://premium-pharma.example.com
```

Le frontend doit identifier le contexte du domaine.

```text
Host
 ↓
BFF
 ↓
Tenant Registry
 ↓
Tenant
```

Le client ne doit jamais pouvoir dire :

```http
GET /api/bootstrap?tenantId=another-tenant
```

pour choisir son tenant.

Le tenant doit être résolu à partir du contexte sécurisé :

```text
Host
+
Authenticated Identity
+
Tenant Membership
```

---

## I.8. TENANT RESOLUTION

Le BFF doit exposer un mécanisme du type :

```http
GET /api/context
```

ou :

```http
GET /api/bootstrap
```

Le BFF doit résoudre :

```text
hostname
 ↓
tenant registry
 ↓
tenantId
 ↓
tenant state
 ↓
tenant configuration
```

Puis vérifier :

```text
authenticated user
        ↓
is member of tenant?
```

Si non :

```text
403 TENANT_ACCESS_DENIED
```

> Si ces endpoints BFF n’existent pas encore : **les implémenter** (façade sur Platform Core `tenant_domains` / JWT `tenant_id` / memberships).

---

## I.9. DOMAIN RESOLUTION

Supporter :

```text
tenant.platform.com
```

et prévoir l'extensibilité pour :

```text
app.customer-domain.com
```

Le système doit normaliser :

* hostname ;
* protocol ;
* port ;
* trailing dot ;
* casing ;
* localhost ;
* development domains ;
* preview domains.

Ne jamais faire confiance à une valeur client arbitraire.

---

## I.10. KEYCLOAK LOGIN

Le frontend doit rediriger vers Keycloak lorsque nécessaire.

Flux :

```text
Browser
   │
   ▼
Tenant Frontend
   │
   ▼
BFF
   │
   ├── session?
   │
   └── no
   │
   ▼
Keycloak
   │
   ▼
Login UI
   │
   ├── username/password
   ├── SSO
   ├── MFA
   └── Identity Provider
   │
   ▼
Authorization Code
   │
   ▼
BFF Callback
   │
   ▼
Session Creation
   │
   ▼
Frontend
```

Privilégier une architecture BFF avec session serveur / cookies sécurisés lorsque possible plutôt que d'exposer inutilement les tokens à JavaScript.

> Gap actuel Platform Core (SPA Bearer `keycloak-js`) : migrer / ajouter le BFF session si absent — **à implémenter**.

---

## I.11. CALLBACK KEYCLOAK

Le callback doit être traité par le BFF :

```text
GET /auth/callback
```

Le BFF doit :

1. vérifier `state` ;
2. vérifier `code` ;
3. échanger le authorization code ;
4. valider les tokens ;
5. récupérer l'identité ;
6. résoudre le tenant ;
7. résoudre les organisations ;
8. créer la session applicative ;
9. définir les cookies sécurisés ;
10. rediriger vers l'application appropriée.

Ne jamais mettre des tokens sensibles dans :

```text
URL
localStorage
sessionStorage
query parameters
```

---

## I.12. SESSION BFF

Le BFF doit maintenir une session applicative sécurisée.

Cookie :

```text
HttpOnly
Secure
SameSite=Lax/Strict selon architecture
```

Prévoir :

* expiration ;
* rotation ;
* refresh ;
* révocation ;
* logout ;
* session inactivity ;
* absolute session lifetime ;
* concurrent sessions ;
* session invalidation.

Le frontend ne doit pas avoir besoin de connaître les secrets OAuth.

---

## I.13. BOOTSTRAP INITIAL

Après authentification :

```http
GET /api/bootstrap
```

Le BFF doit construire le contexte complet.

Exemple conceptuel :

```ts
interface BootstrapContext {
  user: UserContext;

  tenant: TenantContext;

  organizations: OrganizationContext[];

  currentOrganization: OrganizationContext | null;

  applications: ApplicationContext[];

  permissions: string[];

  roles: RoleContext[];

  capabilities: Capability[];

  features: FeatureContext[];

  entitlements: EntitlementContext[];

  scopes: ScopeContext[];

  policies: PolicyContext[];

  preferences: UserPreferences;

  theme: ThemeContext;

  notifications: NotificationSummary;

  tasks: TaskSummary;

  session: SessionContext;
}
```

> Implémenter `GET /api/bootstrap` (BFF) en orchestrant au minimum : context, capabilities, organizations, flags, session — si manquant aujourd’hui.

---

## I.14. USER CONTEXT

Le frontend doit recevoir un utilisateur normalisé.

Exemple :

```ts
interface UserContext {
  id: string;
  username?: string;
  email?: string;
  displayName: string;
  avatarUrl?: string;

  status: "ACTIVE" | "DISABLED" | "LOCKED";

  locale: string;
  timezone: string;

  mfaEnabled?: boolean;
}
```

Ne jamais exposer inutilement des claims sensibles.

---

## I.15. TENANT CONTEXT

```ts
interface TenantContext {
  id: string;
  key: string;
  name: string;
  slug: string;

  status:
    | "PROVISIONING"
    | "ACTIVE"
    | "SUSPENDED"
    | "LOCKED"
    | "DEACTIVATING"
    | "ARCHIVED";

  branding: TenantBranding;

  plan: TenantPlan;

  limits: TenantLimits;
}
```

---

## I.16. ORGANIZATION CONTEXT

```ts
interface OrganizationContext {
  id: string;
  key: string;
  name: string;

  tenantId: string;

  status: "ACTIVE" | "SUSPENDED" | "ARCHIVED";

  /** Roles/permissions for THIS organization membership (may differ from other orgs). */
  memberships: OrganizationMembership[];

  capabilities: Capability[];
}
```

---

## I.17. ORGANIZATION SELECTION

Si l'utilisateur possède plusieurs organisations **du même tenant** :

```text
User
│
├── Organization A
├── Organization B
└── Organization C
```

ne pas choisir arbitrairement.

Le système doit afficher une UI de sélection.

Exemple :

```text
┌─────────────────────────────────────┐
│ Select your organization            │
│                                     │
│ 🔵 Premium Pharma — Bujumbura      │
│    Main pharmacy                    │
│                                     │
│ 🔵 Premium Pharma — Gitega         │
│    Branch                           │
│                                     │
│ 🔵 Premium Pharma — Ngozi          │
│    Branch                           │
└─────────────────────────────────────┘
```

Cette page doit être :

* responsive ;
* accessible ;
* clavier-friendly ;
* mobile-first ;
* searchable si beaucoup d'organisations ;
* capable de gérer organisations suspendues ;
* capable d'afficher le contexte ;
* capable de mémoriser le dernier choix de manière sûre (préférence, **pas** source d’authz).

---

## I.18. ORGANIZATION SELECTION FLOW

Flux :

```text
Authenticated
      │
      ▼
Load organizations (same tenant, JWT/membership)
      │
      ├── 0 organizations
      │        ↓
      │     ERROR / CONTACT ADMIN
      │
      ├── 1 organization
      │        ↓
      │   Auto-select
      │
      └── N organizations
               ↓
       Organization Selector
               ↓
       User selection
               ↓
       BFF validates membership
               ↓
       Current Organization (+ session/JWT refresh)
               ↓
       Bootstrap refresh (permissions/roles for THAT org)
               ↓
       Backoffice
```

Le frontend ne doit jamais simplement stocker :

```text
currentOrganizationId
```

et considérer que cela suffit.

Le BFF doit revalider l'accès.

---

## I.19. ORGANIZATION SWITCH

Le changement d'organisation est une opération importante.

Flux :

```text
Current Organization A
        │
        ▼
User chooses Organization B
        │
        ▼
BFF
        │
        ├── authenticate session
        ├── verify tenant membership (same tenant)
        ├── verify organization membership
        └── resolve capabilities (roles/permissions for B)
        │
        ▼
New Context
        │
        ▼
Invalidate client state
        │
        ▼
Reload navigation
        │
        ▼
Reload applications
        │
        ▼
Reload dashboard
        │
        ▼
Reload current app
```

Lors d'un changement :

* annuler les requêtes précédentes ;
* invalider les caches ;
* supprimer les données spécifiques à l'ancienne organisation ;
* recalculer les permissions (**celles de l’org B**, pas un merge A+B) ;
* recalculer les scopes ;
* recalculer les applications disponibles ;
* recalculer les menus ;
* recalculer les widgets ;
* recalculer les notifications ;
* recalculer les tâches.

Alignement API existante : `POST /api/v1/platform/organizations/switch` + refresh token/session.

---

## I.20. TENANT SWITCH

> **FORBIDDEN — Platform Core v1 :** aucun Tenant Switcher end-user.  
> Le tenant est résolu par **Host + identité + membership** et porté par la session/JWT.  
> Le seul switcher produit est **Organization Switcher**.

Un modèle futur multi-tenant-membership (utilisateur membre de plusieurs tenants) n’est **pas** dans le scope v1. S’il est activé plus tard par décision produit explicite, alors seulement prévoir un Tenant Switcher validé côté BFF — jamais via `tenantId` dans `localStorage`.

Le tenant actif ne doit jamais être déterminé uniquement par :

```text
tenantId dans localStorage
```

Il doit être validé côté BFF / JWT.

---

## I.21. BACKOFFICE REDIRECTION

Après :

```text
Authentication
+
Tenant Resolution
+
Organization Resolution
+
Bootstrap
```

le système détermine l'application initiale.

Exemple :

```text
/user
   ↓
tenant
   ↓
organization
   ↓
capabilities
   ↓
default application
```

Puis :

```text
/backoffice
```

ou :

```text
/backoffice/core
```

ou :

```text
/backoffice/inventory
```

selon les capacités de l'utilisateur.

---

## I.22. NO DEFAULT APP HARDCODÉE

Ne pas faire :

```ts
router.push("/inventory");
```

par défaut.

Le système doit calculer :

```text
Accessible Applications
       ↓
Preferred Application
       ↓
Last Application
       ↓
Tenant Default
       ↓
Core fallback
```

Exemple :

```text
User has:
- Core
- Inventory

No Accounting

→ open Inventory if last used
→ otherwise Core
```

---

## I.23. APPLICATION RESOLUTION

Une application est disponible seulement si :

```text
Tenant subscribed
AND
Module enabled
AND
Feature enabled
AND
User authorized
AND
Organization scope valid
AND
Application healthy
```

Formule :

```text
EffectiveApplicationAccess =
TenantEntitlement
AND ApplicationEnabled
AND FeatureEnabled
AND UserPermission
AND OrganizationScope
AND ResourcePolicy
AND ApplicationAvailability
```

---

## I.24. ENTITLEMENTS

Les entitlements appartiennent au domaine SaaS.

Exemple :

```ts
interface EntitlementContext {
  applicationId: string;
  module: string;

  enabled: boolean;

  features: string[];

  limits: Record<string, number>;

  expiresAt?: string;
}
```

Exemple :

```text
Tenant Plan
│
├── Core       ENABLED
├── Inventory  ENABLED
├── Accounting DISABLED
├── HR         DISABLED
└── POS        ENABLED
```

(Platform Core : `capabilities.modules` / plan.)

---

## I.25. DISTINCTION PLAN / ENTITLEMENT / FEATURE

Ne jamais mélanger :

### Plan

Ce que le client a acheté.

### Entitlement

Ce que le tenant est autorisé à utiliser.

### Feature

Une capacité précise.

### Permission

Ce qu'un utilisateur peut faire **dans l’organisation active**.

### Role

Un regroupement de permissions (**par membership org**).

### Scope

Sur quelles ressources il peut agir.

### Feature Flag

Mécanisme de déploiement / expérimentation.

---

## I.26. RBAC

Les rôles doivent être des agrégats de permissions.

Exemple :

```text
INVENTORY_MANAGER
│
├── inventory.read
├── inventory.create
├── inventory.update
├── inventory.adjust.read
├── inventory.adjust.create
├── inventory.transfer.read
└── inventory.transfer.create
```

Mais l'application ne doit pas faire :

```ts
if (role === "INVENTORY_MANAGER")
```

Elle doit vérifier :

```ts
permission === "inventory.adjust.create"
```

---

## I.27. PERMISSIONS

Format recommandé :

```text
<resource>.<action>
```

Exemples :

```text
inventory.read
inventory.create
inventory.update
inventory.adjust.read
inventory.adjust.create
inventory.adjust.approve

sales.read
sales.create
sales.cancel

customers.read
customers.create

accounting.invoice.read
accounting.invoice.create
accounting.invoice.approve
```

(Catalogue actuel Platform Core : `customers:*`, `commerce:*`, `orders:*`, `pharmacy:*`, `platform:*`, etc. — voir OpenAPI / docs.)

---

## I.28. CAPABILITIES

Le backend / BFF doit idéalement calculer des capabilities effectives **pour l’organisation courante**.

Exemple :

```ts
{
  key: "inventory.adjust.create",
  allowed: true,
  applicationId: "inventory",
  scope: {
    organizations: ["org-a"],
    warehouses: ["wh-a"]
  }
}
```

Le frontend consomme le résultat.

Il ne doit pas reproduire toute la logique métier d'autorisation.

---

## I.29. AUTHORIZATION RESULT

Utiliser un résultat explicite :

```ts
interface AuthorizationResult {
  allowed: boolean;

  reason?:
    | "NOT_AUTHENTICATED"
    | "NOT_AUTHORIZED"
    | "NOT_SUBSCRIBED"
    | "FEATURE_DISABLED"
    | "APPLICATION_UNAVAILABLE"
    | "OUT_OF_SCOPE"
    | "POLICY_DENIED"
    | "TENANT_ACCESS_DENIED"
    | "ORGANIZATION_REQUIRED";

  permission?: string;

  applicationId?: string;

  feature?: string;
}
```

Cela permet au frontend d'afficher une UI correcte.

---

## I.30. PERMISSION GATES

Créer :

```tsx
<Can permission="inventory.adjust.create">
   <CreateAdjustmentButton />
</Can>
```

Et :

```tsx
<CanAny permissions={[...]} />
```

```tsx
<CanAll permissions={[...]} />
```

```tsx
<CanFeature feature="inventory.advanced-adjustments" />
```

```tsx
<CanApplication application="inventory" />
```

```tsx
<CanScope resource="warehouse" id={warehouseId} />
```

---

## I.31. ROUTE AUTHORIZATION

Chaque route doit pouvoir déclarer :

```ts
{
  path: "/inventory/adjustments",
  application: "inventory",
  requiredPermissions: [
    "inventory.adjust.read"
  ]
}
```

Une route de création :

```ts
{
  path: "/inventory/adjustments/new",
  application: "inventory",
  requiredPermissions: [
    "inventory.adjust.create"
  ]
}
```

---

## I.32. ROUTE GUARDS

Prévoir :

```text
AuthenticationGuard
TenantGuard
OrganizationGuard
ApplicationGuard
FeatureGuard
PermissionGuard
ScopeGuard
```

Pipeline :

```text
Request
 ↓
Authenticated?
 ↓
Tenant valid?
 ↓
Organization valid?
 ↓
Application enabled?
 ↓
Feature enabled?
 ↓
Permission granted? (for current org)
 ↓
Scope valid?
 ↓
Render
```

---

## I.33. 401 / 403 / 404

Ne jamais transformer tous les refus en 404.

### 401

Utilisateur non authentifié.

### 403

Utilisateur authentifié mais non autorisé.

### 404

Ressource réellement inexistante ou volontairement masquée selon politique de sécurité.

### NOT_SUBSCRIBED

Application non incluse dans le plan.

### FEATURE_DISABLED

Feature non activée.

### OUT_OF_SCOPE

Permission présente mais ressource hors périmètre.

---

## I.34. NAVIGATION DYNAMIQUE

Le menu ne doit pas être statique.

Il doit être calculé :

```text
Applications
+
Entitlements
+
Features
+
Permissions (org active)
+
Scopes
+
Organization
+
User Preferences
+
Application State
```

Exemple :

```text
Inventory
│
├── Overview
├── Products
├── Stock
├── Counts
└── Adjustments
      ├── View
      └── Create
```

Si :

```text
inventory.adjust.read = true
inventory.adjust.create = false
```

alors Adjustments est visible mais Create Adjustment est absent.

---

## I.35. APPLICATION SWITCHER

Le switcher doit afficher uniquement les applications réellement accessibles.

Exemple :

```text
Applications

Core
Inventory
POS
CRM

Accounting      🔒
HR              🔒
```

Selon UX, les applications verrouillées peuvent être masquées, visibles comme non souscrites, ou avec CTA "Upgrade" — jamais considérées comme accessibles.

---

## I.36. BFF RESPONSIBILITIES

Le BFF doit être la façade du frontend.

Il orchestre :

```text
Browser
 ↓
BFF
 ├── Keycloak
 ├── Tenant Registry
 ├── Authorization Service
 ├── Entitlement Service
 ├── Core API
 ├── Inventory API
 ├── Accounting API
 └── Notification Service
```

Le navigateur ne doit pas connaître toute la topologie interne.

> **À implémenter** si absent (Next.js Route Handlers / Nest BFF module / reverse-proxy session layer).

---

## I.37. BFF API

Prévoir au minimum :

```http
GET /auth/session
GET /auth/login
GET /auth/callback
POST /auth/logout

GET /api/bootstrap
GET /api/me
GET /api/me/capabilities

GET /api/organizations
POST /api/organizations/switch

GET /api/applications
GET /api/navigation

GET /api/notifications
GET /api/tasks
GET /api/activity
GET /api/search
```

Selon architecture :

```http
POST /api/session/refresh
```

ou mécanisme équivalent.

Mapper / encapsuler les endpoints Platform Core existants (`/api/v1/platform/*`, identity, etc.) derrière cette façade.

---

## I.38. BOOTSTRAP VS API MÉTIER

Ne pas mettre toutes les données métier dans `/bootstrap`.

Le bootstrap doit rester léger.

Bootstrap :

```text
Identity
Tenant
Organization
Applications
Capabilities
Features
Permissions (current org)
Navigation metadata
Preferences
Global summaries
```

Les données métier restent dans les APIs domaine (Core, Inventory, Sales, Accounting, CRM, HR, …).

---

## I.39. RESOLUTION DU TENANT CÔTÉ BFF

Le BFF doit utiliser un composant :

```ts
TenantResolver
```

responsable de :

```text
Host
 ↓
Tenant Registry
 ↓
Tenant metadata
```

Puis :

```ts
TenantMembershipResolver
```

pour :

```text
User
+
Tenant
```

Puis :

```ts
OrganizationResolver
```

pour :

```text
Tenant
+
User
+
Organization
```

---

## I.40. REQUEST CONTEXT

Chaque requête backend doit disposer d'un contexte conceptuel :

```ts
interface RequestContext {
  requestId: string;

  userId: string;

  tenantId: string;

  organizationId?: string;

  sessionId?: string;

  roles: string[];

  permissions: string[];

  scopes: ScopeContext[];

  correlationId: string;
}
```

Ce contexte doit être propagé :

```text
HTTP
 ↓
BFF
 ↓
API
 ↓
Application Service
 ↓
Repository
 ↓
Event
 ↓
Job
```

---

## I.41. ORGANIZATION CONTEXT DANS LES URLS

Éviter de faire reposer toute la sécurité sur :

```text
/org/:organizationId
```

Le paramètre d'URL est une référence, pas une preuve d'autorisation.

Le backend doit toujours vérifier :

```text
organizationId belongs to tenant?
user belongs to organization?
user has permission (for that org)?
resource belongs to organization?
```

---

## I.42. RESOURCE-LEVEL AUTHORIZATION

Exemple :

Utilisateur :

```text
inventory.adjust.create
```

mais :

```text
Warehouse scope:
WH-A
```

Alors :

```text
POST adjustment WH-A → ALLOW
POST adjustment WH-B → DENY
```

Même permission ≠ accès global.

---

## I.43. FRONTEND CACHE ISOLATION

Toutes les queries doivent être scoped.

Mauvais :

```ts
["inventory"]
```

Bon :

```ts
["inventory", tenantId, organizationId]
```

Encore mieux lorsque nécessaire :

```ts
[
  "inventory",
  tenantId,
  organizationId,
  warehouseId
]
```

---

## I.44. ORGANIZATION SWITCH CACHE RESET

Lors du changement :

```text
Organization A
 ↓
Cancel queries
 ↓
Invalidate queries
 ↓
Clear scoped state
 ↓
Switch context (BFF + JWT/session)
 ↓
Bootstrap
 ↓
Organization B
```

Il est interdit qu'une donnée **ou permission** de A apparaisse brièvement dans B.

---

## I.45. TENANT SESSION BOUNDARY

Le tenant n’est pas switché dans l’UI par défaut.

Si le Host / la session change de tenant (nouvelle identité, autre domaine) :

```text
clear application state
clear scoped caches
invalidate bootstrap
invalidate navigation
invalidate permissions
invalidate notifications
invalidate dashboard
```

Puis recalcul complet.

---

## I.46. RUNTIME PERMISSION CHANGES

Le système doit gérer :

```text
User connected
      ↓
Admin removes permission (for current org)
      ↓
User session still active
      ↓
Next capability refresh
      ↓
Permission revoked
      ↓
UI updates
```

Il ne faut pas considérer les permissions du premier bootstrap comme éternelles.

Prévoir :

```text
capability TTL
session refresh
event-driven invalidation
periodic revalidation
```

selon les besoins.

---

## I.47. TENANT SUSPENSION

Si le tenant devient `SUSPENDED`, le Shell doit passer dans un état global contrôlé — ne pas laisser les applications continuer normalement.

---

## I.48. APPLICATION MAINTENANCE

Une application peut être `AVAILABLE | DEGRADED | MAINTENANCE | OFFLINE | UPGRADING | ERROR`.

Le Shell isole l’état : Inventory en maintenance n’empêche pas Core / CRM / etc.

---

## I.49. KEYCLOAK LOGOUT

Logout complet :

```text
Browser
 ↓
BFF logout
 ↓
Invalidate session
 ↓
Clear cookies
 ↓
Keycloak logout
 ↓
Identity Provider
 ↓
Login
```

Prévoir logout local, logout Keycloak, session revocation, redirect allowlist.

---

## I.50. SESSION EXPIRATION

Si API répond `401`, le frontend doit :

1. éviter les boucles ;
2. tenter refresh si autorisé ;
3. rejouer la requête idempotente si sûr ;
4. sinon invalider session ;
5. rediriger vers login ;
6. conserver la destination originale de façon sécurisée (`returnTo` allowlist — anti open redirect).

---

## I.51. AUTH LOADING UI

Pendant l'initialisation :

```text
Initializing authentication...
Resolving organization...
Loading workspace...
```

Ne jamais afficher brièvement Unauthorized puis Authorized à cause d'un mauvais state management.

Utiliser un véritable bootstrap state machine.

---

## I.52. NO FLASH OF UNAUTHORIZED CONTENT

Le frontend ne doit jamais afficher une application avant d'avoir déterminé si user + tenant + organization + entitlement + permission le permettent.

---

## I.53. SERVER / CLIENT BOUNDARY

Next.js doit séparer correctement :

### Server

* résolution session ;
* appels BFF sécurisés ;
* initial bootstrap ;
* protected route resolution ;
* SSR authorization-aware rendering.

### Client

* interactions ;
* navigation ;
* permission gates ;
* UI state ;
* cache ;
* command palette ;
* application / organization switching.

Ne jamais exposer de secrets côté client.

---

## I.54. MIDDLEWARE / PROXY

Le middleware Next.js : détection route publique/privée, présence de session, redirect — **pas** toute la logique métier d’autorisation.

La décision finale : BFF/backend.

---

## I.55. APPLICATION SDK

Chaque application doit pouvoir déclarer :

```ts
registerApplication({
  manifest,
  routes,
  navigation,
  commands,
  searchProviders,
  widgets,
  requiredPermissions
});
```

---

## I.56. APPLICATION RUNTIME CONTEXT

Une application reçoit :

```ts
interface ApplicationRuntimeContext {
  tenant: TenantContext;
  organization: OrganizationContext;
  user: UserContext;
  permissions: Permission[];
  capabilities: Capability[];
  features: FeatureContext[];
  scopes: ScopeContext[];
  apiClient: ApiClient;
  navigation: NavigationService;
  notifications: NotificationService;
  search: SearchService;
  commands: CommandService;
}
```

---

## I.57. APPLICATION ISOLATION

Pas d’imports internes cross-app. Communication via Shell contracts, API contracts, events, commands, deep links.

---

## I.58. DEEP LINK SECURITY

Le Shell peut transporter le contexte ; l’app cible revalide toujours accessibilité ressource + permission + organisation.

---

## I.59. USER PREFERENCES

`lastOrganization`, `lastApplication`, favorites, density, theme, etc. — **jamais** source d’autorisation.

---

## I.60. ORGANIZATION SELECTION UX

* Peu d’orgs → cartes ;
* Beaucoup → search + filters ;
* Suspendue → visible non sélectionnable ;
* Une seule → auto-select ;
* Aucune → erreur explicite ;
* Inaccessible session → ne pas afficher.

---

## I.61. GLOBAL SHELL BOOTSTRAP READY

Le Shell n’est READY que lorsque :

```text
Session = valid
AND
Tenant = resolved
AND
Organization = resolved
AND
Entitlements = loaded
AND
Capabilities = loaded
AND
Applications = resolved
AND
Navigation = resolved
```

---

## I.62. BOOTSTRAP STATE MACHINE

```text
START
 ↓
AUTH_CHECK
 ↓
 ├── UNAUTHENTICATED → LOGIN
 │
 └── AUTHENTICATED
          ↓
      TENANT_RESOLVE
          ↓
      ORGANIZATION_RESOLVE
          ↓
      CAPABILITY_RESOLVE
          ↓
      APPLICATION_RESOLVE
          ↓
      NAVIGATION_RESOLVE
          ↓
      SHELL_READY
```

Branches : `ERROR | SESSION_EXPIRED | TENANT_SUSPENDED | ORGANIZATION_SUSPENDED | NO_ORGANIZATION | NO_APPLICATION | MAINTENANCE`.

---

## I.63. OBSERVABILITY

Tracer : `auth.login`, `auth.callback`, `auth.logout`, `tenant.resolve`, `organization.resolve`, `organization.switch`, `bootstrap.load`, `capabilities.load`, `applications.resolve`, `navigation.resolve`, `permission.denied`, `session.expired`.

Chaque opération : `requestId`, `correlationId`, `tenantId`, `organizationId`, `userId` — sans données sensibles.

---

## I.64. AUDIT

Événements sensibles : `LOGIN`, `LOGOUT`, `ORGANIZATION_SWITCH`, `PERMISSION_DENIED`, `APPLICATION_ACCESS`, `PRIVILEGE_CHANGE`, `SESSION_REVOKED`, `MFA_CHANGE` (+ `TENANT_SWITCH` seulement si le modèle l’active).

---

## I.65. SECURITY TESTS

Tester explicitement :

### Cross tenant

```text
User Tenant A → request Tenant B → DENY
```

### Cross organization

```text
User Org A → request Org B (sans membership) → DENY
```

### Per-org permissions

```text
Org A: customers:create = true
Org B: customers:create = false
→ after switch to B, Create button absent
```

### Missing permission / NOT_SUBSCRIBED / FEATURE_DISABLED / OUT_OF_SCOPE / SUSPENDED tenant

---

## I.66. E2E AUTH FLOW

```text
Open tenant domain
 ↓
Redirect Keycloak
 ↓
Authenticate
 ↓
Callback (BFF)
 ↓
Session established
 ↓
Resolve tenant
 ↓
Load organizations
 ↓
Select organization (if N)
 ↓
Bootstrap
 ↓
Backoffice
 ↓
Application switcher
 ↓
Open app
 ↓
Permission-aware navigation
```

---

## I.67. E2E MULTI-ORGANIZATION

```text
User
├── Org A (permissions A)
└── Org B (permissions B)
```

Puis login → selector → A → data/permissions A → switch B → data/permissions B — **zéro fuite**.

---

## I.68. E2E PERMISSION

```text
inventory.adjust.read = true
inventory.adjust.create = false
→ Adjustments visible, Create absent, /new → 403
```

---

## I.69. E2E ENTITLEMENT

```text
Inventory enabled, Accounting disabled
→ Accounting inaccessible même si permission accounting.* présente
```

---

## I.70. FINAL ACCESS MATRIX

| Niveau | Question |
|--------|----------|
| Identity | Qui est l'utilisateur ? |
| Tenant | À quel tenant appartient-il (Host + membership) ? |
| Organization | Dans quelle organisation agit-il ? |
| Entitlement | Le tenant possède-t-il l'application ? |
| Feature | La fonctionnalité est-elle activée ? |
| Role | Quels rôles pour **cette** organisation ? |
| Permission | Quelle action peut-il effectuer **ici** ? |
| Policy | Quelles règles supplémentaires ? |
| Scope | Sur quelles ressources ? |
| Resource | La ressource est-elle dans le périmètre ? |
| Application State | L'application est-elle disponible ? |

```text
ALLOW =
Identity
AND TenantMembership
AND OrganizationMembership
AND TenantEntitlement
AND ApplicationEnabled
AND FeatureEnabled
AND Permission
AND Policy
AND Scope
AND ResourceAccess
AND ApplicationAvailable
```

---

## I.71. PRINCIPLE FONDAMENTAL

Le frontend ne doit jamais être considéré comme la frontière de sécurité.

```text
Frontend → explains, hides, guides, optimizes UX
BFF/backend → authenticates, resolves, authorizes, enforces, audits
Keycloak → authenticates identity, IAM primitives, org memberships
Tenant Control Plane → tenant lifecycle, subscriptions, entitlements
Application services → business authorization, resources, policies
```

---

## I.72. ARCHITECTURE FINALE

```text
                         ┌───────────────────┐
                         │     KEYCLOAK      │
                         │ Identity / MFA    │
                         │ Organizations     │
                         │ Roles / Groups    │
                         └─────────┬─────────┘
                                   │
                                   ▼
┌──────────────┐          ┌───────────────────┐
│   Browser    │─────────▶│       BFF         │
│ Next.js      │◀─────────│ Auth / Session    │
│ Shell + Apps │          │ Tenant / Org      │
└──────────────┘          │ Capabilities      │
                          │ API Gateway       │
                          └─────────┬─────────┘
                                    │
                 ┌──────────────────┼─────────────────┐
                 ▼                  ▼                 ▼
           Control Plane      Core API          App APIs
           Tenant Registry    Customers         Inventory…
           Plans/Entitlements Products          Accounting…
```

Puis côté frontend : Global App Shell → App Switcher / Navigation / CmdK → Current Context (Tenant + Organization + User) → Capabilities → Applications / Features / Permissions → Scope → Resources → Effective Access.

---

## I.73. DEFINITION OF DONE — IDENTITY & ACCESS FOUNDATION

L'implémentation ne sera considérée terminée que si un utilisateur peut réellement effectuer ce parcours sans intervention manuelle :

```text
1. Arriver sur tenant.example.com
2. Être redirigé vers Keycloak
3. Se connecter
4. Être rappelé par le BFF
5. Obtenir une session sécurisée
6. Résoudre automatiquement son tenant
7. Vérifier son appartenance au tenant
8. Charger ses organisations (même tenant)
9. Sélectionner son organisation si nécessaire
10. Résoudre son contexte organisationnel
11. Résoudre son abonnement
12. Résoudre les entitlements
13. Résoudre les applications
14. Résoudre les features
15. Résoudre les rôles (pour l’org active)
16. Résoudre les permissions (pour l’org active)
17. Résoudre les policies
18. Résoudre les scopes
19. Construire ses capabilities effectives
20. Construire sa navigation
21. Construire son Application Switcher
22. Charger son dashboard
23. Le rediriger vers son application par défaut
24. Autoriser uniquement les routes autorisées
25. Afficher uniquement les actions autorisées
26. Bloquer les accès directs non autorisés
27. Permettre le changement d'organisation
28. Recalculer complètement le contexte après changement (permissions org B ≠ org A)
29. Gérer expiration de session
30. Gérer logout
31. Gérer suspension tenant
32. Gérer suspension organisation
33. Gérer application en maintenance
34. Gérer changement dynamique de permissions
35. Garantir zéro fuite cross-tenant
36. Garantir zéro fuite cross-organization
37. Garantir isolation complète des caches
38. Tracer les opérations importantes
39. Auditer les événements sensibles
40. Être couvert par des tests unitaires, intégration, sécurité et E2E
41. Implémenter tout composant backend/BFF manquant pour cette chaîne
```

Cette chaîne complète constitue le **Identity & Access Foundation** du Global Application Shell.

Toutes les applications futures — Core, Inventory, Sales, Accounting, HR, POS, CRM, Analytics, etc. — doivent réutiliser cette infrastructure plutôt que réimplémenter leur propre système d'authentification, de tenant resolution, de sélection d'organisation ou d'autorisation.

**Si quelque chose manque au backend pour réaliser cette spécification : l’implémenter (BFF, bootstrap, session, domain resolution, org switch sécurisé, capabilities org-scoped, etc.).**

---

## I.74. LIEN UX/UI

L’Identity & Access Foundation (§I) **et** le Global Shell (§0–§210) doivent produire l’expérience définie dans [`MASTER-UX-UI-SPECIFICATION.md`](./MASTER-UX-UI-SPECIFICATION.md) :

* états auth visibles (loading / selecting organization / ready) sans flash unauthorized ;
* Organization Selector & Switcher (§ UX 9–10, 60) ;
* Context Indicator Tenant / Organization / Application ;
* App Launcher, Search, Command Palette ;
* capability explanations & no-access / not-subscribed UX ;
* aucune fuite visuelle cross-org après switch.

Le parcours Identity n’est Done que s’il est aussi **UX-conforme**.
