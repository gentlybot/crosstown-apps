import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { PortalHeader } from "@/components/portal-header";
import { getSession, useSession } from "@/lib/session";

export const Route = createFileRoute("/merchant")({
  beforeLoad: () => {
    const session = getSession();
    if (!session) throw redirect({ to: "/login" });
    if (session.user.role === "admin") throw redirect({ to: "/admin/batches" });
    if (!session.merchant) throw redirect({ to: "/login" });
  },
  component: MerchantLayout,
});

function MerchantLayout() {
  const session = useSession();
  return (
    <div className="min-h-dvh">
      <PortalHeader
        context={session?.merchant?.business_name ?? ""}
        home="/merchant/batches"
        signInPath="/login"
        nav={[{ label: "Batches", to: "/merchant/batches" }]}
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
