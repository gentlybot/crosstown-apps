import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 5_000 } } });

// The sandbox serves this app under /courier/; native builds and local dev use /.
const base = import.meta.env.BASE_URL.replace(/\/$/, "");

const router = createRouter({
  routeTree,
  context: { queryClient },
  basepath: base || undefined,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
    </QueryClientProvider>
  </StrictMode>,
);
