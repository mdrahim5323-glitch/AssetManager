# Estate Hub

A production-ready Real Estate ERP + CRM SaaS platform for real estate companies to manage leads, customers, properties, payments, installments, documents, and teams.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/estate-hub run dev` — run the frontend (Vite)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS (dark theme), wouter routing, Recharts
- API: Express 5, pino structured logging
- DB: PostgreSQL + Drizzle ORM (11 tables)
- Auth: Clerk (Replit-managed tenant)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — all 11 Drizzle schema files + index.ts
- `lib/api-client-react/src/generated/` — generated React Query hooks (from codegen)
- `lib/api-zod/src/generated/` — generated Zod schemas (from codegen)
- `artifacts/api-server/src/routes/` — all Express route handlers
- `artifacts/estate-hub/src/pages/` — all 15+ page components
- `artifacts/estate-hub/src/components/` — layout (Sidebar, AppLayout) + shared UI

## Architecture decisions

- Multi-tenant: all tables have `company_id` foreign key; defaults to 1 for dev
- Clerk auth gates all routes via `Show when="signed-in"` (not `SignedIn`/`SignedOut` — those don't exist in this Clerk version)
- API route paths follow `/api/<resource>` convention — handled by Express under `/api` prefix
- Numeric DB fields stored as Postgres `numeric` — must do `String(val)` on insert and `Number(r.field)` on output
- `users/me` auto-provisions a DB user from the Clerk `userId` if not yet seen

## Product

- **Dashboard**: KPI cards, lead pipeline bar chart, collection summary progress, property status breakdown, recent activity feed
- **Leads CRM**: Full pipeline (New→Sold), filter by status, search, create/delete, lead detail with stage update
- **Customers**: Directory with search, CRUD, customer detail with owned properties + payment summary
- **Properties**: Inventory with type/status filters, availability stats, CRUD, ownership history
- **Payments**: Collection records with progress bars showing paid vs due
- **Installments**: Schedule with mark-as-paid action, filter by status (Pending/Paid/Overdue)
- **Documents**: Upload metadata + file URL, filter by doc type, download link
- **Users**: User management with role assignment, activate/deactivate
- **Leave Management**: Submit/approve/reject leave requests
- **Activity Logs**: Full audit trail timeline
- **Settings**: Profile view with role display

## Gotchas

- Run `pnpm --filter @workspace/db run push` after any schema change before restarting the API server
- Run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml`
- Clerk exports `Show` not `SignedIn`/`SignedOut` in this package version
- `@workspace/api-client-react` hooks use `{ query: { queryKey: getGet...QueryKey(...) } }` for cache invalidation
- The proxy routes all traffic through port 80 — never call service ports directly in shell tests

## User preferences

_Populate as you build._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
