import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/session";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: getSession() ? "/merchant/batches" : "/login" });
  },
});
