# edge-frontend

Console staff ERP — exécution du [`docs/MASTER-PROMPT-EDGE-FRONTEND.md`](./docs/MASTER-PROMPT-EDGE-FRONTEND.md).

## Quick start

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

- FE http://localhost:3001 · API http://localhost:3000  
- Auth défaut : **BFF HttpOnly** (`NEXT_PUBLIC_AUTH_MODE=bff`)  
- Fallback SPA : `NEXT_PUBLIC_AUTH_MODE=spa`

Keycloak client doit autoriser redirect `http://localhost:3001/api/auth/callback`.

## Livré (master prompt — incrément courant)

| Domaine | Statut |
|---------|--------|
| Global Shell + densités + thème | OK |
| Org Switcher (pas Tenant Switcher) | OK |
| Capabilities / PermissionGate / manifests | OK |
| CmdK + Search | OK |
| BFF `/api/auth/*` + `/api/bootstrap` + `/api/backend/*` | OK |
| Dashboard Recharts + exception-first | OK |
| Customers DataTable + filtres + drawer | OK |
| Commerce products/orders | OK |
| Pharmacy patients | OK |
| Notification / Task centers (shell) | OK |
| Quick Create | OK |
| Mobile bottom nav | OK |
| Error boundary + toasts | OK |
| i18n foundation (en/fr) | OK |
| Vitest permissions | OK |
| Apps Inventory/Accounting/HR | NOT_SUBSCRIBED |

## Docs

Voir [`docs/README.md`](./docs/README.md).
