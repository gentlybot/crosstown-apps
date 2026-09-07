import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { clearSession, useSession } from "@/lib/session";

export const Route = createFileRoute("/_app/me")({ component: MePage });

function MePage() {
  const session = useSession();
  const navigate = useNavigate();
  const courier = session?.courier;

  async function signOut() {
    try {
      await api.signOut();
    } finally {
      clearSession();
      await navigate({ to: "/login" });
    }
  }

  return (
    <div className="space-y-4 p-4">
      <header className="pt-2">
        <h1 className="text-2xl font-semibold tracking-tight">{courier?.name}</h1>
        <p className="text-sm text-muted-foreground">{courier?.email}</p>
      </header>
      <Card>
        <CardContent className="py-5">
          <dl className="divide-y text-sm">
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">Vehicle</dt>
              <dd className="capitalize">{courier?.vehicle_type}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">Home area</dt>
              <dd>{courier?.home_fsa ?? "Not set"}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{courier?.phone ?? "Not set"}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="capitalize">{courier?.status}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <Button variant="outline" className="w-full" onClick={signOut}>
        Sign out
      </Button>
    </div>
  );
}
