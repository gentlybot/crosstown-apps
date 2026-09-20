# Crosstown web apps

The browser apps for **Crosstown**, a fictional same-day delivery company for
local shops in Toronto. This is a pnpm workspace:

- `apps/portal`: the merchant portal and the Crosstown ops (admin) portal in one
  SPA, split by role after sign-in. Vite, React 19, TanStack Router and Query,
  shadcn/ui on Tailwind CSS v4.
- `apps/courier`: the courier app. Same stack, wrapped in Capacitor for iOS
  and Android. Sign in as `jordan@courier.example`. Runs in a browser too,
  which is how it is tested in previews.
- `packages/`: shared code once two apps need it.

The API lives in the `crosstown-api` repo. Merchants sign in at `/merchant/login`
(`maya@bloomandstem.example`), Crosstown staff at `/admin/login`
(`ops@crosstown.delivery`), password `crosstown-demo`. These accounts require the
API's demo seed data.

## Develop

```sh
pnpm install
pnpm dev            # portal on :5200 and courier app on :5300, both talking to the API on :3200
pnpm dev:portal     # just one of them
pnpm dev:courier
```

Demo sign-in shortcuts are off by default. To enable them during development:

```sh
VITE_DEMO_MODE=true pnpm dev
```

Production builds omit the demo shortcuts, bundled demo credentials, and the
merchant page's staff-login prompt, even when `VITE_DEMO_MODE=true`.
Staff can still sign in directly at `/admin/login`.

Set `VITE_API_URL` to point either app at a different API origin. In a Gently
sandbox the API is served on the same origin under `/api`, so the variable is
the environment's own URL.

## Check

```sh
pnpm typecheck
pnpm lint
pnpm build
```

## Courier app on a phone

```sh
cd apps/courier
pnpm build                    # web assets into dist/
pnpm cap:sync                 # copy dist/ into ios/ and android/
pnpm cap:ios                  # open in Xcode (iOS uses Swift Package Manager, no CocoaPods)
pnpm cap:android              # open in Android Studio
```

Point the native build at a reachable API by setting `VITE_API_URL` before
`pnpm build`; the default is localhost, which a phone cannot see.

Camera and location use the Capacitor plugins. In a browser they fall back to
the webcam or a file picker, and to the browser's geolocation. The route screen
also has a "simulate driving" control for demos where there is no GPS.
