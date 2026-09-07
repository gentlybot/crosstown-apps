import { Link, Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { Inbox, Route as RouteIcon, UserRound } from "lucide-react";
import { getSession } from "@/lib/session";

export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    const session = getSession();
    if (!session || session.user.role !== "courier") throw redirect({ to: "/login" });
  },
  component: AppShell,
});

const TABS = [
  { to: "/offers", label: "Offers", icon: Inbox },
  { to: "/routes", label: "Routes", icon: RouteIcon },
  { to: "/me", label: "Me", icon: UserRound },
] as const;

function AppShell() {
  return (
    <div className="app-shell mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      <main className="flex-1 pb-6">
        <Outlet />
      </main>
      <nav className="app-tabs sticky bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)]" aria-label="Sections">
        <div className="mx-auto grid max-w-md grid-cols-3">
          {TABS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-1 py-2.5 text-xs font-medium text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
