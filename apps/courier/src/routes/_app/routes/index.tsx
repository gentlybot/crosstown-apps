import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { RouteStatus } from "@/lib/api";
import { formatDate, formatTime, money } from "@/lib/format";
import { routesQuery } from "@/lib/queries";

export const Route = createFileRoute("/_app/routes/")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(routesQuery),
  pendingComponent: () => <Skeleton className="m-4 h-40" />,
  component: RoutesPage,
});

const STATUS: Record<RouteStatus, { label: string; className: string }> = {
  planned: { label: "Planned", className: "bg-secondary text-secondary-foreground" },
  offered: { label: "Offered", className: "bg-secondary text-secondary-foreground" },
  assigned: { label: "Ready to start", className: "bg-[#f2b640] text-[#17271f]" },
  in_progress: { label: "In progress", className: "bg-[#1d4ed8] text-white" },
  completed: { label: "Completed", className: "bg-primary text-primary-foreground" },
  cancelled: { label: "Cancelled", className: "bg-destructive text-white" },
};

function RoutesPage() {
  const { data: routes } = useSuspenseQuery(routesQuery);
  return (
    <div className="space-y-4 p-4">
      <header className="pt-2">
        <h1 className="text-2xl font-semibold tracking-tight">My routes</h1>
        <p className="text-sm text-muted-foreground">Accepted routes, newest first.</p>
      </header>
      {routes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-medium">No routes yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Accept an offer and it shows up here.</p>
          </CardContent>
        </Card>
      ) : (
        routes.map((r) => {
          const done = r.delivered_count + r.failed_count;
          const s = STATUS[r.status];
          return (
            <Link key={r.id} to="/routes/$routeId" params={{ routeId: String(r.id) }} className="block">
              <Card>
                <CardContent className="flex items-center gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{r.display_name}</p>
                      <Badge className={s.className}>{s.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {r.merchant.business_name}. {formatDate(r.delivery_date)}, {formatTime(r.start_at)}
                    </p>
                    <p className="mt-1 text-sm">
                      {r.status === "completed" ? `${r.delivered_count} delivered, ${r.failed_count} not delivered` : `${done} of ${r.stop_count} stops done`}
                      <span className="text-muted-foreground"> · {money(r.pay_cents)}</span>
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })
      )}
    </div>
  );
}
