# Implementation Roadmap — Edge Frontend ERP

> Source de vérité d’exécution. Aligné sur le plan complet (P0–P10) et [`MASTER-PROMPT-EDGE-FRONTEND.md`](./MASTER-PROMPT-EDGE-FRONTEND.md).

## État

| Phase | Contenu | Statut |
|-------|---------|--------|
| P0 | Gouvernance, matrice API, DS primitives, query keys | Done |
| P1 | Shell DoD (protected routes, saved views, bulk, offline, activity) | Done |
| P2 | Identity (47 endpoints) | Done |
| P3 | CRM staff (18 endpoints) | Done |
| P4 | Commerce/POS (11 endpoints) | Done |
| P5 | Pharmacy (5 endpoints) | Done |
| P6 | Admin + reconciliation (15 endpoints) | Done |
| P7 | Search providers + deep links + capability refresh | Done |
| P8 | Data UX enterprise | Done |
| P9 | i18n, Playwright, a11y, perf, observability | Done |
| P10 | Future manifests NOT_SUBSCRIBED | Done |

## Hors scope staff shell

- B2C `customer-auth` + `customer/*` portal (11) → app membre
- Health/metrics (4) → ops

## Conventions

- API client : `lib/api/*.ts` via BFF `/api/backend/*` ou Bearer SPA
- Query keys : `lib/query/keys.ts` — toujours scopées `orgId` quand pertinent
- Apps : `applications/{core,crm,commerce,pharmacy,identity,admin,future}/`
- Pages : `app/(shell)/...`
- Permissions : jamais de rôles hardcodés (sauf gate `platform-admin` pour Admin app)

## Matrice

Voir [`API-COVERAGE-MATRIX.md`](./API-COVERAGE-MATRIX.md).

## Critère « complete »

1. Matrice staff endpoints = UI + PermissionGate / ProtectedRoute
2. `pnpm lint && pnpm test && pnpm build`
3. Playwright smoke : `pnpm test:e2e`
4. Apps sans backend = NOT_SUBSCRIBED only
