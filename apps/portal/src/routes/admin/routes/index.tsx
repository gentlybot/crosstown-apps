import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ChevronDown, ChevronRight, Loader2, Route as RouteIcon, Send } from "lucide-react";
import { toast } from "sonner";
import { BatchMap, type MapPickup, type MapRoute, type MapStop } from "@/components/batch-map";
import { DayPicker } from "@/components/day-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError, api, type MerchantRouting, type RouteDetail, type RouteStatus } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { routeColor } from "@/lib/colors";
import { formatDuration, formatLongDate, formatTime, todayIso } from "@/lib/format";
import { adminRoutesQuery } from "@/lib/queries";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const Route = createFileRoute("/admin/routes/")({
  validateSearch: (search: Record<string, unknown>): { date?: string } => ({
    date: typeof search.date === "string" && ISO_DATE.test(search.date) ? search.date : undefined,
  }),
  loaderDeps: ({ search }) => ({ date: search.date ?? todayIso() }),
  loader: ({ context: { queryClient }, deps }) => queryClient.ensureQueryData(adminRoutesQuery(deps.date)),
  pendingComponent: () => <Skeleton className="h-64 w-full" />,
  component: AdminRoutesPage,
});

function AdminRoutesPage() {
  const search = Route.useSearch();
  const date = search.date ?? todayIso();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data } = useSuspenseQuery(adminRoutesQuery(date));
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);

  // One colour per route across the whole day, in list order.
  const allRoutes = data.merchants.flatMap((m) => m.routes);
  const colorOf = new Map(allRoutes.map((r, i) => [r.id, routeColor(i)]));
  const selected = allRoutes.find((r) => r.id === selectedRouteId) ?? null;

  const pickups: MapPickup[] = data.merchants
    .filter((m) => m.merchant.pickup_lat !== null && m.merchant.pickup_lng !== null)
    .map((m) => ({ lat: m.merchant.pickup_lat as number, lng: m.merchant.pickup_lng as number, label: `${m.merchant.business_name}, ${m.merchant.pickup_address}` }));
  const mapStops: MapStop[] = allRoutes.flatMap((r) =>
    r.stops.map((s) => ({
      id: `${r.id}-${s.position}`,
      lat: s.lat,
      lng: s.lng,
      label: String(s.position),
      title: `${r.display_name}, stop ${s.position}`,
      subtitle: `${s.recipient_name ?? "No name"}, ${s.address}. ETA ${formatTime(s.eta)}`,
      color: colorOf.get(r.id) ?? "#2f6b4a",
    })),
  );
  const mapRoutes: MapRoute[] = allRoutes.map((r) => ({
    id: r.id,
    color: colorOf.get(r.id) ?? "#2f6b4a",
    points: [[r.start_lat, r.start_lng], ...r.stops.map((s) => [s.lat, s.lng] as [number, number])],
    label: `${r.display_name}: ${r.stop_count} stops, ${r.distance_km} km, ${formatDuration(r.duration_minutes)}`,
  }));
  const focus = selected ? [[selected.start_lat, selected.start_lng] as [number, number], ...selected.stops.map((s) => [s.lat, s.lng] as [number, number])] : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Routes</h1>
          <p className="text-sm text-muted-foreground">
            Build routes per merchant once their orders are in. Solver: {data.engine === "vrp_cli" ? "vrp-cli" : "savings heuristic"}.
          </p>
        </div>
        <DayPicker date={date} onChange={(next) => void navigate({ search: { date: next } })} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Merchants" value={data.totals.merchants} />
        <Stat label="Routes" value={data.totals.routes} />
        <Stat label="Stops routed" value={data.totals.stops} tone="good" />
        <Stat label="Waiting for a route" value={data.totals.unrouted} tone={data.totals.unrouted > 0 ? "warn" : undefined} />
      </div>

      {data.merchants.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <h2 className="font-semibold">Nothing to route for {formatLongDate(date)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">No merchant has a batch for this day yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            {data.merchants.map((m) => (
              <MerchantCard
                key={m.merchant.id}
                entry={m}
                date={date}
                colorOf={colorOf}
                selectedRouteId={selectedRouteId}
                onSelectRoute={(id) => setSelectedRouteId((cur) => (cur === id ? null : id))}
              />
            ))}
          </div>
          <div className="lg:sticky lg:top-20 lg:self-start">
            <Card className="overflow-hidden py-0">
              {pickups.length > 0 || mapStops.length > 0 ? (
                <BatchMap pickup={pickups[0] ?? null} stops={mapStops} routes={mapRoutes} focus={focus} className="h-[560px] w-full" />
              ) : (
                <div className="grid h-[560px] place-items-center text-sm text-muted-foreground">No pickup locations to show.</div>
              )}
              <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 text-xs text-muted-foreground">
                {allRoutes.length === 0 && <span>Routes appear here once they are built.</span>}
                {allRoutes.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRouteId((cur) => (cur === r.id ? null : r.id))}
                    className={`inline-flex items-center gap-1.5 rounded px-1 ${selectedRouteId === r.id ? "bg-accent text-foreground" : ""}`}
                  >
                    <span className="size-2.5 rounded-full" style={{ background: colorOf.get(r.id) }} /> {r.display_name}
                  </button>
                ))}
                {selected && (
                  <button type="button" className="ml-auto underline-offset-4 hover:underline" onClick={() => setSelectedRouteId(null)}>
                    Show all
                  </button>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function MerchantCard({
  entry,
  date,
  colorOf,
  selectedRouteId,
  onSelectRoute,
}: {
  entry: MerchantRouting;
  date: string;
  colorOf: Map<number, string>;
  selectedRouteId: number | null;
  onSelectRoute: (id: number) => void;
}) {
  const queryClient = useQueryClient();
  const building = entry.plan?.status === "queued" || entry.plan?.status === "running";
  const canBuild = entry.ready_unrouted > 0 || entry.routed > 0;

  const build = useMutation({
    mutationFn: () => api.admin.buildRoutes(entry.merchant.id, date),
    onSuccess: async () => {
      toast.success(`Building routes for ${entry.merchant.business_name}.`);
      await queryClient.invalidateQueries({ queryKey: ["admin", "routes"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not start routing."),
  });

  return (
    <Card>
      <CardContent className="space-y-4 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">{entry.merchant.business_name}</h2>
            <p className="text-sm text-muted-foreground">
              Pickup {entry.merchant.pickup_address}, cutoff {entry.merchant.cutoff_time}
            </p>
          </div>
          <Button size="sm" disabled={!canBuild || building || build.isPending} onClick={() => build.mutate()}>
            {building ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Building
              </>
            ) : (
              <>
                <RouteIcon className="size-4" /> {entry.routed > 0 ? "Rebuild routes" : "Build routes"}
              </>
            )}
          </Button>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Count label="Waiting" value={entry.ready_unrouted} tone={entry.ready_unrouted > 0 ? "warn" : undefined} />
          <Count label="Routed" value={entry.routed} tone={entry.routed > 0 ? "good" : undefined} />
          <Count label="Flagged" value={entry.problems} />
          <Count label="Unplaced" value={entry.unplaced} />
        </dl>

        {entry.plan?.status === "failed" && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>Routing failed</AlertTitle>
            <AlertDescription>{entry.plan.error}</AlertDescription>
          </Alert>
        )}
        {entry.plan?.status === "done" && entry.plan.unassigned_count > 0 && (
          <Alert>
            <AlertTriangle className="size-4" />
            <AlertDescription>
              The solver could not place {entry.plan.unassigned_count} {entry.plan.unassigned_count === 1 ? "order" : "orders"}. They stay waiting.
            </AlertDescription>
          </Alert>
        )}

        {entry.routes.length > 0 && (
          <div className="divide-y rounded-lg border">
            {entry.routes.map((r) => (
              <RouteRow key={r.id} route={r} color={colorOf.get(r.id) ?? "#2f6b4a"} open={selectedRouteId === r.id} onToggle={() => onSelectRoute(r.id)} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const ROUTE_STATUS: Record<RouteStatus, { label: string; className: string }> = {
  planned: { label: "Planned", className: "bg-secondary text-secondary-foreground" },
  offered: { label: "Offered", className: "bg-[#f2b640] text-[#17271f]" },
  assigned: { label: "Assigned", className: "bg-[#1d4ed8] text-white" },
  in_progress: { label: "In progress", className: "bg-[#1d4ed8] text-white" },
  completed: { label: "Completed", className: "bg-[#17271f] text-white" },
  cancelled: { label: "Cancelled", className: "bg-destructive text-white" },
};

function RouteRow({ route, color, open, onToggle }: { route: RouteDetail; color: string; open: boolean; onToggle: () => void }) {
  const queryClient = useQueryClient();
  const offer = useMutation({
    mutationFn: () => api.admin.offerRoute(route.id),
    onSuccess: async (r) => {
      toast.success(`${r.display_name} offered to ${r.offers.length} ${r.offers.length === 1 ? "courier" : "couriers"}.`);
      await queryClient.invalidateQueries({ queryKey: ["admin", "routes"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not offer the route."),
  });
  const status = ROUTE_STATUS[route.status];
  const openOffers = route.offers.filter((o) => o.status === "offered").length;
  return (
    <div>
      <div className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-accent/60">
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={open}>
          <span className="size-3 shrink-0 rounded-full" style={{ background: color }} />
          <span className="font-medium">{route.display_name}</span>
          <Badge className={status.className}>{status.label}</Badge>
          <span className="truncate text-sm text-muted-foreground">
            {route.stop_count} stops, {route.distance_km} km, {formatDuration(route.duration_minutes)}. Leaves {formatTime(route.start_at)}.
            {route.courier ? ` ${route.courier.name}.` : route.status === "offered" ? ` ${openOffers} waiting to answer.` : ""}
            {route.status === "in_progress" || route.status === "completed" ? ` ${route.delivered_count} delivered, ${route.failed_count} failed.` : ""}
          </span>
        </button>
        {route.status === "planned" && (
          <Button size="sm" variant="outline" onClick={() => offer.mutate()} disabled={offer.isPending}>
            <Send className="size-3.5" /> Offer to couriers
          </Button>
        )}
        <button type="button" onClick={onToggle} aria-label={open ? "Hide stops" : "Show stops"}>
          {open ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
        </button>
      </div>
      {open && (
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Leg</TableHead>
              <TableHead className="text-right">ETA</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {route.stops.map((s) => (
              <TableRow key={s.position}>
                <TableCell className="tabular-nums text-muted-foreground">{s.position}</TableCell>
                <TableCell>
                  <Link to="/admin/batches/$batchId" params={{ batchId: String(s.batch_id) }} className="hover:underline">
                    {s.recipient_name ?? "No name"}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[16rem] truncate text-muted-foreground" title={s.address}>{s.address}</TableCell>
                <TableCell className="whitespace-nowrap text-right tabular-nums">{s.leg_km} km</TableCell>
                <TableCell className="whitespace-nowrap text-right tabular-nums">{formatTime(s.eta)}</TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {s.status === "delivered" ? <span className="text-primary">Delivered {s.completed_at ? formatTime(s.completed_at) : ""}</span> : s.status === "failed" ? <span className="text-[#9a5b00]">Not delivered</span> : <span className="text-muted-foreground">Pending</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      )}
    </div>
  );
}

function Count({ label, value, tone }: { label: string; value: number; tone?: "good" | "warn" }) {
  const color = tone === "good" ? "text-primary" : tone === "warn" ? "text-[#9a5b00]" : "";
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`text-lg font-semibold tabular-nums ${color}`}>{value}</dd>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "good" | "warn" }) {
  const color = tone === "good" ? "text-primary" : tone === "warn" ? "text-[#9a5b00]" : "";
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-1 text-3xl font-semibold tabular-nums ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
