# Handoff web apps: agent guide

pnpm workspace. `apps/portal` is a Vite + React SPA. No SSR, no server code
here; everything talks to the Rails API in `handoff-api`.

## Portal layout (`apps/portal/src`)

| Concern | Where |
| --- | --- |
| Routes | `routes/`, file-based via `@tanstack/router-plugin`. `routeTree.gen.ts` is generated; never edit it. `merchant.tsx` and `admin.tsx` are the signed-in layouts and role guards; their children live in `routes/merchant/` and `routes/admin/`. `homeFor(session)` in `lib/session.ts` decides where a role lands. Sign-in pages are `login.tsx` (merchants) and `admin_.login.tsx` (staff; the underscore keeps it outside the `/admin` layout guard), both rendering `components/login-form.tsx`. |
| Data | `lib/api.ts` (typed fetch wrapper, `ApiError`), `lib/queries.ts` (TanStack Query options used by loaders and components). |
| Session | `lib/session.ts`. Token and user in localStorage under `handoff.session`; `useSession()` for components, `getSession()` in `beforeLoad`. A 401 clears the session and sends the user to the sign-in page for the area they were in. |
| UI | `components/ui/` is shadcn (radix-nova preset). App components sit in `components/`: `portal-header` (shared chrome), `batch-detail` (used by both the merchant and admin batch pages), `batch-status-badge`. Brand tokens override the shadcn variables at the bottom of `index.css`. |
| Formatting | `lib/format.ts`. Dates from the API are `YYYY-MM-DD` calendar dates; build them locally, never `new Date("2026-09-09")`. |

## Commands

```sh
pnpm install
pnpm dev                 # :5200
pnpm typecheck           # tsc -b
pnpm lint                # oxlint
pnpm build               # vite build, then tsc -b
pnpm --filter portal dlx shadcn@latest add <component>
```

## Rules

- **Loaders prefetch, components `useSuspenseQuery`.** Every route that shows API data has a `loader` calling `queryClient.ensureQueryData(...)` and a `pendingComponent`. Search params go through `validateSearch` and are optional, so plain links keep working.
- **API shapes are snake_case** and typed in `lib/api.ts`. Add the type next to the endpoint; do not remap keys.
- **Use the shadcn primitives** in `components/ui/` and semantic tokens (`bg-card`, `text-muted-foreground`, `text-primary`). The only hard-coded colours are the marigold warning tones for problem rows.
- **Copy is plain and specific.** Buttons say what happens ("Upload and check orders"), errors say what to do.
- **Ports:** the portal runs on 5200 and expects the API on 3200 locally. Those are set in `vite.config.ts` and `lib/api.ts`.
- Run `pnpm typecheck` and `pnpm lint` before calling a change done.
