import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession, homeFor } from "@/lib/session";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: homeFor(getSession()) });
  },
});
