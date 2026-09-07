import type { QueryClient } from "@tanstack/react-query";
import { Link, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/phone-frame";
import { Button } from "@/components/ui/button";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: () => (
    <PhoneFrame>
      <Outlet />
    </PhoneFrame>
  ),
  notFoundComponent: () => (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">That screen does not exist.</h1>
      <Button asChild>
        <Link to="/offers">Back to offers</Link>
      </Button>
    </main>
  ),
});
