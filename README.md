# Handoff web apps

The browser apps for **Handoff**, a fictional same-day delivery company for
local shops in Toronto. This is a pnpm workspace:

- `apps/portal`: the merchant portal and the Handoff ops (admin) portal in one
  SPA, split by role after sign-in. Vite, React 19, TanStack Router and Query,
  shadcn/ui on Tailwind CSS v4.
- `apps/courier`: coming next, the courier app in Capacitor.
- `packages/`: shared code once two apps need it.

The API lives in the `handoff-api` repo. Merchants sign in at `/login`
(`maya@bloomandstem.example`), Handoff staff at `/admin/login`
(`ops@handoff.delivery`), password `handoff-demo`. Each sign-in page has a
one-click demo link.

## Develop

```sh
pnpm install
pnpm dev            # portal on http://localhost:5200, talks to the API on :3200
```

Set `VITE_API_URL` to point the portal at a different API origin. In a Gently
sandbox the API is served on the same origin under `/api`, so the variable is
the environment's own URL.

## Check

```sh
pnpm typecheck
pnpm lint
pnpm build
```
