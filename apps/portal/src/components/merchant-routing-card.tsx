import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Route as RouteIcon } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError, api } from "@/lib/api";
import { formatDate, formatDuration } from "@/lib/format";
import { merchantRoutingQuery } from "@/lib/queries";

/**
 * Lets a merchant route everything they have ready for one delivery day.
 * Polls while the planner runs and refreshes the batch when it finishes.
 */
export function MerchantRoutingCard({ date, batchId }: { date: string; batchId: string }) {
  const queryClient = useQueryClient();
  const { data } = useQuery(merchantRoutingQuery(date));
  const building = data?.plan?.status === "queued" || data?.plan?.status === "running";
  const wasBuilding = useRef(false);

  // When a run finishes, pull the batch again so rows and the map pick up their routes.
  useEffect(() => {
    if (wasBuilding.current && !building) {
      void queryClient.invalidateQueries({ queryKey: ["batches", batchId] });
      void queryClient.invalidateQueries({ queryKey: ["batches"] });
    }
    wasBuilding.current = building;
  }, [building, batchId, queryClient]);

  const build = useMutation({
    mutationFn: () => api.merchant.buildRoutes(date),
    onSuccess: async () => {
      toast.success(`Building routes for ${formatDate(date)}.`);
      await queryClient.invalidateQueries({ queryKey: ["merchant", "routing"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not start routing."),
  });

  if (!data) return null;
  const canBuild = data.ready_unrouted > 0;
  const hasRoutes = data.routes.length > 0;
  if (!canBuild && !hasRoutes && !building && data.plan?.status !== "failed") return null;

  return (
    <Card>
      <CardContent className="space-y-3 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Routes for {formatDate(date)}</h2>
            <p className="text-sm text-muted-foreground">
              {data.ready_unrouted > 0
                ? `${data.ready_unrouted} ${data.ready_unrouted === 1 ? "order is" : "orders are"} ready and not yet on a route across your batches for this day.`
                : hasRoutes
                  ? `${data.routed} orders on ${data.routes.length} ${data.routes.length === 1 ? "route" : "routes"}. Routes already offered to couriers are kept.`
                  : "Nothing waiting for a route."}
              {data.unplaced > 0 ? ` ${data.unplaced} could not be placed on the map and will be skipped.` : ""}
            </p>
          </div>
          {(canBuild || hasRoutes) && (
            <Button onClick={() => build.mutate()} disabled={building || build.isPending}>
              {building ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Building
                </>
              ) : (
                <>
                  <RouteIcon className="size-4" /> {hasRoutes ? "Rebuild routes" : "Build routes"}
                </>
              )}
            </Button>
          )}
        </div>
        {data.plan?.status === "failed" && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>Routing did not finish</AlertTitle>
            <AlertDescription>{data.plan.error}</AlertDescription>
          </Alert>
        )}
        {hasRoutes && (
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {data.routes.map((r) => (
              <li key={r.id} className="rounded-lg border px-3 py-2">
                <span className="font-medium">{r.display_name}</span>
                <span className="text-muted-foreground">
                  {" "}
                  {r.stop_count} stops, {r.distance_km} km, {formatDuration(r.duration_minutes)}.
                  {r.courier ? ` ${r.courier.name}.` : r.status === "planned" ? " Waiting for a courier." : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
