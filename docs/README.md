# Documentation Edge Frontend

> **Revue :** 2026-09-04 · **Statut pack :** contrats production-ready (cible) · code `edge-frontend` = scaffold as-is

## Ordre de lecture (obligatoire)

1. **[`MASTER-PROMPT-EDGE-FRONTEND.md`](./MASTER-PROMPT-EDGE-FRONTEND.md)** — architecture Shell, Identity/BFF, apps, DoD  
2. **[`MASTER-UX-UI-SPECIFICATION.md`](./MASTER-UX-UI-SPECIFICATION.md)** — contrat UX/UI (§1–§153)  
3. **[`DOCUMENTATION-COMPLETE-FRONTEND-API.md`](./DOCUMENTATION-COMPLETE-FRONTEND-API.md)** — HTTP, authz, catalogue endpoints (**as-is API**)  
4. **[`OPENAPI-SCHEMAS-REFERENCE.md`](./OPENAPI-SCHEMAS-REFERENCE.md)** + **[`openapi.json`](./openapi.json)** — schémas machine / lisibles  

## As-is vs to-be

| | As-is (Wave 0.5) | To-be |
|--|-------|-------|
| `edge-frontend` code | Shell + PKCE + CmdK + DataTables CRM/Commerce/Pharmacy | BFF HttpOnly + detail/workflows |
| Auth | SPA PKCE | BFF session cookie |
| API consommé | context, capabilities, orgs/switch, customers, products, patients | + identity admin, POS, details |
| Tenant Switcher | **FORBIDDEN** | — |

## Règles non négociables

- Pas de mode démo / fixtures qui simulent permissions  
- Pas de `tenantId` client pour autoriser  
- Backend = autorité finale ; UI permission-aware  
- Apps sans API = `NOT_SUBSCRIBED` / adapter — pas de fake data  
- UX hors [`MASTER-UX-UI-SPECIFICATION.md`](./MASTER-UX-UI-SPECIFICATION.md) = hors contrat  

## Régénérer OpenAPI

Depuis la racine du monorepo (canonical) :

```bash
pnpm docs:openapi
```

Écrit `openapi.json` + `OPENAPI-SCHEMAS-REFERENCE.md` ici.  
Alternative runtime (API démarrée) : `scripts/export-openapi.ts` — même chemins de sortie.

Snapshot actuel : OpenAPI **3.0.3** · **90** paths · **110** operations · **120** schemas.

## Client TypeScript

```bash
npx openapi-typescript edge-frontend/docs/openapi.json -o edge-frontend/openapi-schema.d.ts
```

## Ports locaux

| Service | Port |
|---------|------|
| Nest Platform Core + Swagger `/docs` | **3000** |
| edge-frontend | **3001** (`pnpm dev -- -p 3001`) |
