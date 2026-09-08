# Crosstown web apps: agent guide

pnpm workspace. `apps/portal` (merchant and ops web) and `apps/courier`
(courier app, Capacitor) are both Vite + React SPAs. No SSR, no server code
here; everything talks to the Rails API in `crosstown-api`.

## Portal layout (`apps/portal/src`)

| Concern | Where |
| --- | --- |
| Routes | `routes/`, file-based via `@tanstack/router-plugin`. `routeTree.gen.ts` is generated; never edit it. `merchant.tsx` and `admin.tsx` are the signed-in layouts and role guards; their children live in `routes/merchant/` and `routes/admin/`. `homeFor(session)` in `lib/session.ts` decides where a role lands. Sign-in pages are `merchant_.login.tsx` at `/merchant/login` and `admin_.login.tsx` at `/admin/login`; each trailing underscore keeps the page outside its guarded layout. Both render `components/login-form.tsx`. |
| Data | `lib/api.ts` (typed fetch wrapper, `ApiError`), `lib/queries.ts` (TanStack Query options used by loaders and components). |
| Session | `lib/session.ts`. Token and user in localStorage under `crosstown.session`; `useSession()` for components, `getSession()` in `beforeLoad`. A 401 clears the session and sends the user to the sign-in page for the area they were in. |
| UI | `components/ui/` is shadcn (radix-nova preset). App components sit in `components/`: `portal-header` (shared chrome), `batch-detail` (used by both the merchant and admin batch pages), `batch-status-badge`, `day-picker`, `batch-map` (MapLibre GL on OpenFreeMap Positron, numbered DOM-marker pins, route line layer). Brand tokens override the shadcn variables at the bottom of `index.css`; route colours live in `lib/colors.ts`. |
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
- **Maps are MapLibre GL rendering OpenFreeMap's Positron vector style** (`tiles.openfreemap.org`, OpenStreetMap data). No key, no limits, nothing server-side; keep the attribution. `components/batch-map.tsx` owns the map: pins are DOM markers using the `.stop-pin` and `.pickup-pin` classes, routes are one GeoJSON line layer coloured per feature, `preserveDrawingBuffer` stays on so screenshots capture the canvas. Tried and rejected: Leaflet raster tiles from CARTO and Thunderforest (both watermark without a key) and the MapLibre-in-Leaflet plugin (style never loaded). Pins are `L.divIcon` HTML, not image markers, so no asset path setup is needed.
- **Ports:** the portal runs on 5200 and expects the API on 3200 locally. Those are set in `vite.config.ts` and `lib/api.ts`.
- Run `pnpm typecheck` and `pnpm lint` before calling a change done.

## Courier app (`apps/courier/src`)

| Concern | Where |
| --- | --- |
| Routes | `routes/`, file-based. `_app.tsx` is the signed-in shell with the bottom tab bar; its children live in `routes/_app/`. Only `role: courier` sessions get in. |
| Data | `lib/api.ts` (courier endpoints under `/api/v1/courier`), `lib/queries.ts` (offers and routes poll every 10 to 15 s). Session key is `crosstown.courier.session`, separate from the portal's. |
| Device | `lib/photo.ts` wraps `@capacitor/camera` and re-encodes to a small JPEG data URL; `lib/location.ts` wraps `@capacitor/geolocation` and has `simulateDrive` for demos. In a browser the camera falls back to a hidden file input (`data-testid="photo-input"`), which mobile browsers open as the camera. |
| Map | `components/route-map.tsx`: same MapLibre + OpenFreeMap setup as the portal, pins coloured by stop status, the next stop ringed, a courier dot. |
| Base path | `VITE_BASE_PATH` (default `/`) sets both Vite's `base` and the router `basepath`, so the sandbox can serve it at `/courier/`. Native builds use `/`. |
| Native | `capacitor.config.ts` plus the generated `ios/` (Swift Package Manager) and `android/` projects, committed. `pnpm build && pnpm cap:sync` copies `dist/` into them; `pnpm cap:ios` / `pnpm cap:android` open Xcode or Android Studio. |

Rules for the courier app: keep screens one-handed (max width 28 rem, big
buttons, bottom tabs), never show recipient contact details before a route is
accepted (the API already withholds them), and keep photos under 1.5 MB.
