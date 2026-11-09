# Edge Playwright authenticated fixture

## Purpose

Bootstrap an Edge BFF session (`okapi_edge_bff_session`) via Keycloak `edge-admin` so marketing/commercial A–F UI scenarios can run.

## One-time local/CI seed

1. Import Keycloak realm (includes local e2e user):

```bash
# from saas-templates-backend
pnpm keycloak:import
```

2. Seed Control Plane administrator + SUPER_ADMIN role (marketing permissions):

```bash
pnpm seed:edge-e2e
```

Seeded identity (local only):

| Field | Value |
|-------|-------|
| Keycloak username | `edge-e2e` |
| Password | `password` |
| Email | `edge-e2e@okapi.local` |
| Keycloak `sub` / `external_identity_id` | `eeeeeeee-eeee-4eee-8eee-eeeeeeee0001` |

## Enable authenticated Playwright

```bash
# from saas-template-frontend
EDGE_E2E_AUTH=1 \
EDGE_E2E_USERNAME=edge-e2e \
EDGE_E2E_PASSWORD=password \
pnpm test:e2e:marketing:auth
```

Or:

```bash
pnpm test:e2e:marketing:auth
```

Optional:

- `EDGE_E2E_STORAGE_STATE=e2e/.auth/edge-user.json` (default)
- `PLAYWRIGHT_SKIP_WEBSERVER=1` if the app is already running

## What runs

1. Project `edge-auth-setup` (`e2e/auth.setup.ts`) hits `/api/edge-auth/login`, completes Keycloak username/password, writes storage state.
2. Project `chromium-edge-auth` loads that storage state for marketing/commercial scenario UI describes.
3. CSRF contract tests always run without auth.

## CI honesty

- Without Keycloak + `seed:edge-e2e`, leave `EDGE_E2E_AUTH` unset — authenticated UI tests skip cleanly.
- Do not invent a fake session cookie.
- Live Resend/Meta sandbox e2e remains secret-gated and out of default CI.
