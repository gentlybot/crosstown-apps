import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Navigation, Play } from "lucide-react";
import { toast } from "sonner";
import { RouteMap } from "@/components/route-map";
import { StopStatusIcon } from "@/components/stop-status-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, api } from "@/lib/api";
import { formatDate, formatDuration, formatTime, mapsUrl, money } from "@/lib/format";
import { currentPosition, simulateDrive, type LatLng } from "@/lib/location";
import { routeQuery } from "@/lib/queries";

export const Route = createFileRoute("/_app/routes/$routeId/")({
  loader: ({ context: { queryClient }, params }) => queryClient.ensureQueryData(routeQuery(params.routeId)),
  pendingComponent: () => <Skeleton className="m-4 h-64" />,
  component: RoutePage,
});

function RoutePage() {
  const { routeId } = Route.useParams();
  const { data: route } = useSuspenseQuery(routeQuery(routeId));
  const queryClient = useQueryClient();
  const [position, setPosition] = useState<LatLng | null>(null);
  const [simulating, setSimulating] = useState(false);

  const pickup = route.merchant.pickup_lat !== null && route.merchant.pickup_lng !== null ? { lat: route.merchant.pickup_lat, lng: route.merchant.pickup_lng } : { lat: route.start_lat, lng: route.start_lng };
  const nextStop = useMemo(() => route.stops.find((s) => s.status === "pending") ?? null, [route.stops]);
  const done = route.delivered_count + route.failed_count;

  const start = useMutation({
    mutationFn: () => api.routes.start(route.id),
    onSuccess: async () => {
      toast.success("Route started. Head to the pickup.");
      await queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not start the route."),
  });

  useEffect(() => {
    if (!simulating) return;
    const path = [pickup, ...route.stops.filter((s) => s.status === "pending").map((s) => ({ lat: s.lat, lng: s.lng }))];
    return simulateDrive(path, setPosition);
    // Restart the walk only when the toggle flips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulating]);

  async function locate() {
    const p = await currentPosition();
    if (p) setPosition(p);
    else toast.message("Location unavailable here. Use Simulate driving for the demo.");
  }

  return (
    <div className="space-y-4 p-4">
      <header className="pt-2">
        <Link to="/routes" className="text-sm text-muted-foreground">
          ← My routes
        </Link>
        <div className="mt-1 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{route.display_name}</h1>
            <p className="text-sm text-muted-foreground">
              {route.merchant.business_name}. {formatDate(route.delivery_date)}. Leaves {formatTime(route.start_at)}
            </p>
          </div>
          <p className="text-xl font-semibold tabular-nums text-primary">{money(route.pay_cents)}</p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {route.stop_count} stops, {route.distance_km} km, about {formatDuration(route.duration_minutes)}.
        </p>
      </header>

      <Card className="overflow-hidden py-0">
        <RouteMap pickup={pickup} stops={route.stops} nextStopId={nextStop?.id ?? null} courier={position} className="h-60 w-full" />
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
          <button type="button" className="inline-flex items-center gap-1 underline-offset-4 hover:underline" onClick={locate}>
            <Navigation className="size-3.5" /> Locate me
          </button>
          {route.status === "in_progress" && (
            <button type="button" className="ml-auto underline-offset-4 hover:underline" onClick={() => setSimulating((v) => !v)}>
              {simulating ? "Stop simulating" : "Demo: simulate driving"}
            </button>
          )}
        </div>
      </Card>

      {route.status === "assigned" && (
        <Card>
          <CardContent className="space-y-3 py-5">
            <p className="font-medium">Pickup at {route.merchant.business_name}</p>
            <p className="text-sm text-muted-foreground">{route.merchant.pickup_address}. Scan every package against the batch before you leave.</p>
            <div className="flex gap-2">
              <Button size="lg" className="flex-1" onClick={() => start.mutate()} disabled={start.isPending}>
                <Play className="size-4" /> Start route
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={mapsUrl(pickup.lat, pickup.lng)} target="_blank" rel="noreferrer">
                  Directions
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {route.status === "in_progress" && nextStop && (
        <Link to="/routes/$routeId/stops/$stopId" params={{ routeId: String(route.id), stopId: String(nextStop.id) }} className="block">
          <Card className="border-[#f2b640] bg-[#fff8e6]">
            <CardContent className="flex items-center gap-3 py-4">
              <StopStatusIcon status="pending" position={nextStop.position} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[#9a5b00]">Next stop, ETA {formatTime(nextStop.eta)}</p>
                <p className="truncate font-semibold">{nextStop.recipient_name ?? "No name"}</p>
                <p className="truncate text-sm text-muted-foreground">{nextStop.address}</p>
              </div>
              <ChevronRight className="size-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      )}

      {route.status === "completed" && (
        <Card>
          <CardContent className="space-y-3 py-5">
            <p className="font-semibold">Route complete</p>
            <p className="text-sm text-muted-foreground">
              {route.delivered_count} delivered, {route.failed_count} not delivered. Pay is added to Friday's deposit.
            </p>
            <dl className="divide-y text-sm">
              {route.pay_breakdown.map((line) => (
                <div key={line.label} className="flex justify-between py-2">
                  <dt className="text-muted-foreground">{line.label}</dt>
                  <dd className="tabular-nums">{money(line.cents)}</dd>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-semibold">
                <dt>Route pay</dt>
                <dd className="tabular-nums">{money(route.pay_cents)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-semibold">Stops</h2>
          <p className="text-sm text-muted-foreground">
            {done} of {route.stop_count} done
          </p>
        </div>
        <Card className="divide-y py-0">
          {route.stops.map((s) => (
            <Link
              key={s.id}
              to="/routes/$routeId/stops/$stopId"
              params={{ routeId: String(route.id), stopId: String(s.id) }}
              className="flex items-center gap-3 px-4 py-3"
              disabled={route.status !== "in_progress" && route.status !== "completed"}
            >
              <StopStatusIcon status={s.status} position={s.position} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{s.recipient_name ?? "No name"}</p>
                <p className="truncate text-sm text-muted-foreground">{s.address}</p>
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">{s.completed_at ? formatTime(s.completed_at) : formatTime(s.eta)}</span>
            </Link>
          ))}
        </Card>
      </section>
    </div>
  );
}
