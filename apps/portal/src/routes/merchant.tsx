import { Link, Outlet, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { clearSession, getSession, useSession } from "@/lib/session";

export const Route = createFileRoute("/merchant")({
  beforeLoad: () => {
    const session = getSession();
    if (!session) throw redirect({ to: "/login" });
    if (!session.merchant) throw redirect({ to: "/login" });
  },
  component: MerchantLayout,
});

function MerchantLayout() {
  const session = useSession();
  const navigate = useNavigate();

  async function signOut() {
    try {
      await api.signOut();
    } finally {
      clearSession();
      await navigate({ to: "/login" });
    }
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/merchant/batches" className="flex items-center gap-2 font-semibold tracking-tight">
              <BrandMark className="h-6 w-auto" />
              <span>Handoff</span>
            </Link>
            <span className="hidden text-sm text-muted-foreground sm:inline">{session?.merchant?.business_name}</span>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                to="/merchant/batches"
                className="rounded-md px-3 py-1.5 font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                activeProps={{ className: "bg-accent text-foreground" }}
              >
                Batches
              </Link>
            </nav>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5">
                {session?.user.name}
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">{session?.user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{session?.user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={signOut}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
