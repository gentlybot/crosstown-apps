import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand-mark";

export const Route = createFileRoute("/customer")({
  component: CustomerLayout,
});

function CustomerLayout() {
  return (
    <div className="min-h-dvh">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-4xl items-center px-4 sm:px-6">
          <Link to="/customer" className="flex items-center gap-2 font-semibold tracking-tight">
            <BrandMark className="h-6 w-auto" />
            <span>Crosstown</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto flex max-w-4xl justify-center px-4 py-16 sm:px-6 sm:py-24">
        <Outlet />
      </main>
    </div>
  );
}
